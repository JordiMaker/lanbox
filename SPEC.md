# Lanbox · Instrucciones para Claude Code

Oct 16, 2026 · @Jordi Carrasco

## Objetivo y cómo usar este documento

Construir **Lanbox**: una app móvil que convierte un texto corto (canción, artículo o cualquier texto, máx. 612 caracteres) en minijuegos de traducción y pronunciación, y que se abre al desbloquear el móvil para practicar las palabras más flojas. Incluye un servidor que genera el JSON de ejercicios con un LLM.

Cómo usarlo con Claude Code:

1. Guarda este documento como `SPEC.md` en la raíz del repositorio (expórtalo a Markdown).
2. Crea un `CLAUDE.md` que diga: «Lee SPEC.md antes de cada tarea. Trabaja fase a fase según la sección Plan de trabajo. No avances de fase sin que pasen sus tests y criterios de aceptación».
3. Pide a Claude Code una fase cada vez, por ejemplo: «Implementa la Fase 1 de SPEC.md».
4. El diseño visual de referencia es el lienzo «Plantilla minijuegos»: cada pantalla de este documento cita el nombre de su artboard. Los colores, tipografías y medidas salen de ahí.

Reglas generales para Claude Code:

- TypeScript estricto en todo el código. Sin `any` salvo justificación en comentario.
- La lógica de negocio (selección de sesión, estadísticas, validación del JSON) va en funciones puras con tests.
- Ningún secreto en el repositorio: claves en variables de entorno, con un `.env.example` documentado.
- Cuando algo de este documento sea ambiguo, elige la opción más simple, déjala anotada en `DECISIONS.md` y sigue.

## Stack y estructura del repositorio

Un monorepo con pnpm workspaces: app móvil, servidor y un paquete compartido con tipos, esquemas y la lógica pura.

| Parte | Tecnología | Por qué |
| --- | --- | --- |
| App móvil | Expo (React Native) + TypeScript, expo-router, Zustand, TanStack Query | Una base para iOS y Android; módulos nativos donde haga falta (desbloqueo) |
| Pagos en la app | RevenueCat (o react-native-iap) con compras consumibles | Valida recibos de App Store y Google Play sin escribirlo a mano |
| Servidor | Node.js 20+, TypeScript, Fastify, zod | API ligera y validación de entrada/salida |
| Base de datos | PostgreSQL + Prisma | Relacional: usuarios, artículos, intentos, créditos |
| Generador de ejercicios | SDK de Anthropic (Claude API), modelo `claude-sonnet-5-5` | Traducción, fonética silábica y distractores en JSON |
| Tests | Vitest (lógica y servidor), Jest + Testing Library (app) | La lógica de sesión y la validación deben estar cubiertas |

&#91;embedded content: arquitectura · 6 piezas\]

La app nunca llama a Claude ni suma créditos: todo pasa por el servidor, que es la única fuente de verdad.

```
lanbox/
├── apps/
│   ├── mobile/          # Expo: pantallas, navegación, módulos nativos
│   └── server/          # Fastify: API, generador, créditos, webhooks de pago
├── packages/
│   └── shared/          # tipos, esquemas zod, selección de sesión, estadísticas
├── SPEC.md
├── CLAUDE.md
└── DECISIONS.md
```

Variables de entorno mínimas del servidor: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `REVENUECAT_WEBHOOK_SECRET`, `JWT_SECRET`.

## Modelo de datos

El corazón es el JSON de ejercicios de cada artículo; todo lo demás (intentos, estadísticas, sesiones) se apoya en él. Define su esquema con zod en `packages/shared` y úsalo en servidor y app.

JSON de ejercicios (formato de referencia, ampliado con dos campos para resaltar la traducción sin suponer el mismo orden de palabras):

```json
{
  "idioma_original": "en",
  "idioma_estudiante": "es",
  "sistema_fonetico": "AFI simplificado (fonémico)",
  "texto_original": "This ship is very cheap.",
  "frases": [
    {
      "id": 1,
      "original": "This ship is very cheap.",
      "traduccion": "Este barco es muy barato.",
      "fonetica": "/ðɪs ʃɪp ɪz ˈvɛ.ɹi tʃiːp/",
      "palabras": [
        {
          "posicion": 4,
          "original": "very",
          "traduccion": "muy",
          "traduccion_en_frase": "muy",
          "posicion_en_traduccion": 4,
          "palabra_silabeada": "ˈvɛ.ɹi",
          "silabas_correctas": ["vɛ", "ɹi"],
          "distractores": [
            { "silaba": "bɛ", "motivo": "v → b (en español b y v suenan igual)" }
          ]
        }
      ]
    }
  ]
}
```

Reglas del JSON (el validador del servidor las comprueba todas):

- `palabras[].posicion` empieza en 1 y apunta a la palabra de `original` separada por espacios, sin puntuación.
- `fonetica` tiene una palabra fonética por cada palabra de `original`, en el mismo orden; las sílabas van separadas por punto y el acento `ˈ` va al inicio de la sílaba tónica.
- `silabas_correctas` unidas con punto, sin `ˈ`, son iguales a `palabra_silabeada` sin `ˈ`.
- `traduccion` puede tener alternativas separadas por `/` («este / esta»); todas se aceptan como respuesta.
- Hay al menos `9 − silabas_correctas.length` distractores, todos distintos entre sí y de las sílabas correctas. Así siempre se llena la cuadrícula 3×3.

Entidades de la base de datos:

| Entidad | Campos clave | Notas |
| --- | --- | --- |
| User | id, email, idioma\_ui, aciertos\_desbloqueo (1–20, por defecto 3), saldo\_creditos | Cuenta necesaria para sincronizar compras y estadísticas |
| Article | id, userId, titulo, texto (≤ 612), idioma\_original, idioma\_estudiante, estado (borrador / publicado), ejercicios\_json, palabras\_objetivo\[\], modos\_activos\[\] | `ejercicios_json` = el JSON de arriba |
| Attempt | id, userId, articleId, frase\_id, posicion, modo, resultado (ok / ko / skip), silaba\_elegida?, respuesta\_texto?, ms, creado\_en, origen (desbloqueo / icono) | Una fila por intento; de aquí salen todas las estadísticas |
| CreditLedger | id, userId, delta, motivo (compra / publicacion / ajuste), referencia, creado\_en | El saldo es la suma; nunca se edita una fila |
| Purchase | id, userId, tienda, producto, creditos, importe, moneda, estado, transaccion\_tienda | Escrita por el webhook de pagos |

Modos de ejercicio (enum compartido): `TRAD_ORIG` (triángulo), `ORIG_TRAD` (cuadrado), `ORIG_PRON` (pentágono), `TRAD_PRON` (círculo). La forma se usa en estadísticas.

## Servidor generador de ejercicios

El servidor recibe el texto, pide a Claude el JSON de ejercicios con un esquema forzado, lo valida con reglas propias y solo lo guarda si pasa. Los créditos se cobran al publicar, no al generar.

Pipeline de `POST /articles/:id/generate`:

1. Comprobar que el texto tiene entre 1 y 612 caracteres y que el usuario es dueño del artículo.
2. Separar frases por `.`, `!` o `?` seguidos de espacio o fin de texto.
3. Llamar a Claude con *tool use*: una herramienta `guardar_ejercicios` cuyo `input_schema` es el JSON Schema generado desde el esquema zod. Forzar su uso con `tool_choice`.
4. Validar la respuesta con zod y con las reglas de la sección Modelo de datos.
5. Si falla, reintentar una vez enviando a Claude la lista exacta de errores. Si vuelve a fallar, responder `422` con los errores.
6. Guardar `ejercicios_json` en el artículo (estado borrador) y devolverlo a la app para la vista previa del editor.

Prompt de sistema (guárdalo en `apps/server/src/generator/prompt.ts` y mantenlo en español):

```
Eres un lingüista y profesor de idiomas. Recibes un texto en {idioma_original}
para alumnos cuya lengua es {idioma_estudiante}.
Para cada frase devuelve: traducción natural, transcripción fonética AFI
fonémica separada por sílabas con punto y acento ˈ al inicio de la sílaba
tónica, y para cada palabra: traducción (alternativas con «/»), la palabra tal
como aparece en la frase traducida y su posición, la palabra silabeada, sus
sílabas correctas y al menos 8 distractores.
Los distractores deben ser errores reales de un hablante de
{idioma_estudiante}: transferencias fonéticas de su lengua, vocales largas y
cortas confundidas, consonantes omitidas, sobrecorrecciones. Cada uno con un
motivo breve en {idioma_estudiante} con el formato «x → y (explicación)».
No inventes palabras que no estén en el texto. Usa solo la herramienta
guardar_ejercicios.
```

Endpoints de la API (todas con JWT salvo auth y webhooks):

| Método y ruta | Qué hace |
| --- | --- |
| `POST /auth/login` · `POST /auth/register` | Email + contraseña o «Sign in with Apple / Google»; devuelve JWT |
| `GET /articles` | Lista con título, frases, palabras, ejercicios, % aciertos, partidas de los últimos 7 días |
| `POST /articles` · `PATCH /articles/:id` | Crear o editar título, texto, palabras objetivo y modos activos |
| `POST /articles/:id/generate` | Pipeline de arriba |
| `POST /articles/:id/publish` | Cobra los créditos y cambia el estado a publicado; `402` si no hay saldo |
| `GET /articles/:id/stats` | Estadísticas por palabra y modo (sección Estadísticas) |
| `POST /attempts` | Guarda intentos en lote (la app los envía al terminar o al recuperar conexión) |
| `GET /session?origen=desbloqueo` | Cola de la sesión calculada en servidor con la misma función compartida |
| `GET /me` · `PATCH /me/settings` | Saldo, idioma y aciertos de desbloqueo |
| `POST /webhooks/revenuecat` | Acredita créditos tras una compra validada |

Tests obligatorios del generador: el validador rechaza cada regla rota con un JSON de ejemplo, y el pipeline funciona con la respuesta de Claude simulada (sin llamar a la API en los tests).

## Pantallas de la app

Once pantallas. Cada fila cita su artboard en el lienzo de diseño; reprodúcelo fielmente (Lexend para texto, Noto Sans para fonética, objetivos táctiles de 44 px como mínimo).

| Pantalla | Artboard | Contenido y comportamiento |
| --- | --- | --- |
| Lista de artículos | Lista de artículos | Cabecera fija con engranaje (Configuración) y «+ Nuevo»; buscador por título; tarjeta por artículo con idiomas, título, frases · palabras · ejercicios, anillo de % aciertos, línea de partidas de 7 días, botón de estadísticas y «Editar» |
| Edición de artículo | Edición de artículo | Título, idioma original y del alumno, texto con contador «n/612» que bloquea al llegar al límite, resumen vivo (frases, palabras objetivo, ejercicios = palabras × modos), palabras como botones para activarlas, 4 casillas de modos, barra fija «Guardar borrador» / «Publicar» |
| Publicar | Publicar · créditos | Saldo, coste, saldo después; «Usar N créditos y publicar»; si falta saldo, paquetes de 10/30/80 créditos y pago de la tienda; pantalla «¡Publicado!» |
| Estadísticas de la unidad | Estadísticas de la unidad | Resumen, aciertos por modo, leyenda de formas, filas por palabra desplegables (sección Estadísticas) |
| Configuración | Configuración | Aciertos para desbloquear (1–20, presets 1/3/5/10) e idioma del usuario |
| Traducción → Original | Traducción → Original | Ver sección Reglas de los ejercicios |
| Original → Traducción | Original → Traducción | Ídem |
| Original → Pronunciación | Original → Pronunciación | Ídem |
| Traducción → Pronunciación | Traducción → Pronunciación | Ídem |
| Sesión | Sesión · lógica | Contenedor que encadena ejercicios y muestra el progreso (sección Sesiones); el artboard es un simulador de su lógica, no la UI final |
| Login | — (sin diseño) | Email o Sign in with Apple / Google; diseño sencillo con el mismo estilo |

Navegación: pila con la Lista como inicio. Desde una notificación o un desbloqueo se entra directo a Sesión. El botón Cerrar (✕) de los ejercicios abandona la sesión sin contarla.

## Reglas de los ejercicios

No hay botón «Comprobar»: cada ejercicio se comprueba solo, en cuanto el alumno completa la respuesta o comete el primer error.

Elementos comunes a los cuatro:

- Arriba: cerrar, barra de progreso y contador «n/total».
- Banner de publicidad 320×50 de Camino Barcelona Language School. Usa un componente `AdBanner` con la imagen y el enlace en configuración remota; hasta tener sus recursos de marca, un marcador neutro.
- Etiqueta del modo y enunciado.
- Botón «Saltar», siempre visible mientras se juega: registra el intento como `skip` y pasa al siguiente.

| Modo | Se muestra | Se responde con |
| --- | --- | --- |
| Traducción → Original | Frase traducida con la palabra resaltada | Teclado nativo abierto desde el inicio; un único campo dentro de la tarjeta de la palabra, con huecos «\_ \_ \_» según su longitud |
| Original → Traducción | Frase original con botón de audio y palabra resaltada | Teclado nativo; mismo campo único. Valen todas las alternativas de `traduccion` |
| Original → Pronunciación | Frase original con audio, frase fonética con hueco en la palabra, palabra y su traducción | Cuadrícula 3×3: sílabas correctas + distractores, barajados distinto en cada palabra; se eligen en orden |
| Traducción → Pronunciación | Frase traducida resaltada, frase fonética con hueco, palabra traducida | La misma cuadrícula 3×3 |

Comprobación automática:

- Teclado: normaliza la respuesta (minúsculas, sin tildes, sin espacios a los lados). En cuanto no es prefijo de ninguna respuesta válida, es error. Si coincide con una completa, es acierto.
- Sílabas: cada pulsación se compara con la sílaba que toca. Una equivocada es error inmediato. Completar todas en orden es acierto.

Respuesta visual:

- Error: cartel rojo «¡Error!» bajo el enunciado. Tras 1,1 s aparece la respuesta correcta justo encima del sistema de respuesta. En pronunciación, debajo, el `motivo` del distractor elegido. Abajo, botón «Siguiente»: no avanza solo.
- Acierto: cartel «¡Correcto!» bajo el enunciado y paso automático al siguiente a los 2 s.
- El audio se reproduce con TTS del sistema (`expo-speech`) en el idioma original. Más adelante podrá sustituirse por audio pregrabado.

## Sesiones y desbloqueo

Una sesión es una cola de ejercicios (palabra × modo) que se vacía con aciertos. Cómo se llena depende de cómo se abrió la app.

**Abierta al desbloquear el móvil**

1. Toma todas las palabras de los artículos publicados del usuario y ordénalas por % de aciertos, de peor a mejor. Una palabra sin intentos cuenta como 0 %.
2. Coge las N primeras, siendo N = `aciertos_desbloqueo` de Configuración.
3. Para cada palabra, elige el modo activo con peor % de aciertos. En caso de empate, el que lleve más tiempo sin proponerse.
4. Presenta la cola en orden. Un acierto saca la palabra de la sesión. Un fallo la manda al final de la cola, con el mismo modo.
5. Cuando la cola está vacía, se muestra «Móvil desbloqueado» y la app se cierra y devuelve al usuario a donde estaba.

**Abierta desde el icono**

- La cola son todos los pares palabra × modo activo cuyas 4 últimas veces no son todas aciertos (contando «sin proponer» como no acierto), de peor a mejor %.
- La barra de progreso mide esa cola: despejados / total.
- Un acierto saca el par; un fallo lo manda al final. Al vaciarse, «Todo al día».

Implementación: una función pura `buildSession(words, attempts, settings, origen)` y un reductor `advance(session, resultado)` en `packages/shared`, con tests que reproduzcan los dos ejemplos del artboard «Sesión · lógica». Con 3 aciertos, al desbloquear salen very, ship y This, todas en Traducción → Pronunciación; desde el icono, 14 pares pendientes.

Límite de seguridad: tras 3 fallos seguidos de la misma palabra, «Saltar» pasa a contar como superada para no bloquear al usuario fuera de su móvil. Anótalo en `DECISIONS.md` si se cambia.

**Riesgo de plataforma: el lanzamiento al desbloquear**

- Android: un módulo nativo escucha `ACTION_USER_PRESENT` y abre la actividad de sesión. Abrir actividades en segundo plano está restringido desde Android 10, así que hay que investigar el permiso necesario (superposición sobre otras apps o notificación a pantalla completa) y pedirlo con una explicación clara.
- iOS: una app no puede abrirse sola al desbloquear. Alternativas a evaluar: una automatización de la app Atajos que el usuario configura, o las APIs de Tiempo de uso (FamilyControls / ManagedSettings) para bloquear apps hasta completar la sesión.
- Antes de la Fase 4, Claude Code debe hacer una prueba de concepto en ambos sistemas y documentar en `DECISIONS.md` qué es viable.

## Estadísticas

Todas salen de la tabla `Attempt`; se calculan con funciones puras de `packages/shared`, en el servidor para la API y en la app para el modo sin conexión.

| Métrica | Definición |
| --- | --- |
| % aciertos de una palabra | ok / (ok + ko) de todos sus intentos; los `skip` no cuentan |
| % aciertos por modo | Lo mismo filtrando por modo; en la ficha del artículo, media de sus palabras |
| Intentos, saltadas, tiempo medio | Recuentos y media de `ms` por palabra |
| Últimas 4 veces | Los 4 intentos más recientes (ok / ko); si hay menos de 4, el resto «sin proponer» |
| Dominado | Un par palabra × modo cuyas últimas 4 veces son todas ok |
| Errores más frecuentes | Las 3 `silaba_elegida` erróneas más repetidas, con su `motivo` del JSON |
| Partidas 7 días | Sesiones terminadas por día, para la línea de la tarjeta |

Código visual de las últimas 4 veces:

- La forma indica el modo: triángulo (Trad. → Orig.), cuadrado (Orig. → Trad.), pentágono (Orig. → Pron.), círculo (Trad. → Pron.).
- El relleno indica el resultado: tono de acierto con ✓, tono de error con ✕, claro con borde si no se ha propuesto. Los tonos son los del lienzo.
- La más reciente va a la derecha. Cada grupo lleva una etiqueta de accesibilidad con texto, por ejemplo «error (Orig. → Pron.)».
- En la fila de la palabra, las 4 últimas de cualquier modo + «✓ n ✕ n %». Al desplegar, por cada modo su barra de % y sus 4 últimas.

## Créditos y pagos

Publicar un artículo cuesta 1 crédito por cada 100 caracteres de texto (mínimo 1). Los créditos se compran dentro de la app con el sistema de pago de cada tienda.

- Productos consumibles en App Store Connect y Google Play Console: `credits_10`, `credits_30`, `credits_80`. Precios por decidir; no crear paquetes por debajo de 2,99 €, porque las comisiones fijas se comen los importes pequeños.
- La app compra con RevenueCat. Su webhook llama a `POST /webhooks/revenuecat`; el servidor verifica la firma, crea la fila `Purchase` y suma créditos en `CreditLedger`. La app nunca suma créditos por su cuenta.
- `POST /articles/:id/publish` resta el coste en una transacción de base de datos. Si el saldo no llega, responde `402` con los créditos que faltan, y la app abre la compra.
- Comisiones de referencia para un desarrollador pequeño en la UE (octubre de 2026): 15 % en Apple y 10 % + 5 % de cobro en Google. Confírmalas en cada consola antes de fijar precios.
- Fuera del alcance de la primera versión: pago en la web (solo UE). Exige declarar cada compra a la tienda con su token: External Purchase Server API en Apple y transacciones externas en Google.

## Configuración, idiomas y publicidad

Dos ajustes de usuario, guardados en el servidor y en caché local.

- **Aciertos para desbloquear:** entero de 1 a 20, por defecto 3. Es la N de la sesión al desbloquear.
- **Idioma del usuario:** es, ca, en, fr, de, it, pt. Cambia el idioma de la interfaz y es el `idioma_estudiante` por defecto de los artículos nuevos.

Interfaz multilingüe con `i18next`. Todos los textos de la app viven en `apps/mobile/src/i18n/<idioma>.json`, empezando por es; las demás lenguas pueden traducirse con Claude en una tarea aparte.

Publicidad: el componente `AdBanner` muestra un anuncio de Camino Barcelona Language School en los ejercicios. La imagen, el texto y el enlace se leen de `GET /config/ad` para cambiarlos sin publicar otra versión. Faltan sus recursos de marca: hasta entonces, un marcador neutro.

## Plan de trabajo y criterios de aceptación

Seis fases, cada una cerrada con sus tests en verde antes de pasar a la siguiente.

**Fase 1 — Base compartida**

- [ ] Monorepo, lint, TypeScript estricto y CI que ejecuta los tests.
- [ ] Esquema zod del JSON de ejercicios y validador de reglas; tests con el JSON de «This ship is very cheap» válido y una variante rota por cada regla.
- [ ] `buildSession`, `advance` y las funciones de estadísticas con tests que reproducen los números del artboard «Sesión · lógica».

**Fase 2 — Servidor**

- [ ] Prisma con las entidades, migraciones y datos de prueba.
- [ ] Auth, artículos, intentos, ajustes y estadísticas.
- [ ] Generador con Claude, reintento con errores y tests con la respuesta simulada.
- [ ] Criterio: con un texto real, `generate` devuelve un JSON que pasa el validador sin tocarlo.

**Fase 3 — Ejercicios en la app**

- [ ] Las cuatro pantallas de ejercicio idénticas a sus artboards, con teclado nativo abierto, cuadrícula 3×3, comprobación automática, error → respuesta → «Siguiente», acierto → 2 s, «Saltar» y audio TTS.
- [ ] Criterio: cada intento llega a `POST /attempts`, también tras perder y recuperar conexión.

**Fase 4 — Sesiones**

- [ ] Prueba de concepto del lanzamiento al desbloquear en Android e iOS; decisión en `DECISIONS.md`.
- [ ] Pantalla Sesión para los dos orígenes, con cierre de la app al desbloquear.

**Fase 5 — Gestión de artículos**

- [ ] Lista, edición con contador 612, estadísticas de la unidad y configuración.

**Fase 6 — Créditos y tiendas**

- [ ] Productos de compra, RevenueCat, webhook, publicación con cobro y la pantalla Publicar.
- [ ] Criterio: una compra en el sandbox de cada tienda suma los créditos y permite publicar.

Preguntas abiertas que el propietario debe responder (Claude Code no debe inventarlas):

- Precio de cada paquete de créditos.
- Recursos de marca de Camino Barcelona Language School.
- Si «Saltar» debe contar como superada antes de los 3 fallos.
