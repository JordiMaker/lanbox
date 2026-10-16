import { z } from 'zod';

// The exercises JSON is the contract between the Claude generator, the server
// and the app. Keys stay in Spanish exactly as SPEC.md defines them.
// Keep this schema free of refinements and transforms so it converts cleanly
// to the JSON Schema given to Claude as the tool's input_schema (Phase 2);
// cross-field rules live in validate.ts.

export const MAX_TEXT_LENGTH = 612;

export const DistractorSchema = z.object({
  silaba: z.string().min(1),
  motivo: z.string().min(1),
});

export const PalabraSchema = z.object({
  posicion: z.number().int().min(1),
  original: z.string().min(1),
  traduccion: z.string().min(1),
  traduccion_en_frase: z.string().min(1),
  posicion_en_traduccion: z.number().int().min(1),
  palabra_silabeada: z.string().min(1),
  silabas_correctas: z.array(z.string().min(1)).min(1),
  distractores: z.array(DistractorSchema),
});

export const FraseSchema = z.object({
  id: z.number().int().min(1),
  original: z.string().min(1),
  traduccion: z.string().min(1),
  fonetica: z.string().min(1),
  palabras: z.array(PalabraSchema),
});

export const ExercisesSchema = z.object({
  idioma_original: z.string().min(2),
  idioma_estudiante: z.string().min(2),
  sistema_fonetico: z.string().min(1),
  texto_original: z.string().min(1).max(MAX_TEXT_LENGTH),
  frases: z.array(FraseSchema).min(1),
});

export type Distractor = z.infer<typeof DistractorSchema>;
export type Palabra = z.infer<typeof PalabraSchema>;
export type Frase = z.infer<typeof FraseSchema>;
export type Exercises = z.infer<typeof ExercisesSchema>;
