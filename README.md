# LANBOX

Mobile app that turns a short text (a song, an article, any text up to 612 characters) into translation and pronunciation mini-games, and opens when the phone is unlocked so the learner practises their weakest words. **SPEC.md** is the full specification; **DECISIONS.md** records the choices made where it is silent.

## Structure

pnpm monorepo:

- `apps/mobile` – Expo app (SDK 57, Expo Router). It still holds the 14 Oct prototype screens until Phases 3 and 5 replace them.
- `packages/shared` – zod schema and validator for the exercises JSON, session logic (`buildSession`, `advance`) and statistics, all pure functions with Vitest tests.
- `apps/server` – arrives in Phase 2.
- `assets/Visual/Plantilla minijuegos.html` – export of the design canvas.

## Commands

pnpm comes through corepack (bundled with Node). Run `corepack enable` once, or prefix each command with `corepack`.

```sh
pnpm install          # from the repo root
pnpm test             # all tests (packages/shared today)
pnpm lint             # ESLint in every workspace
pnpm typecheck        # tsc --noEmit in every workspace

pnpm --filter @lanbox/shared exec vitest run test/session.test.ts   # one test file
pnpm --filter @lanbox/shared exec vitest -t "unlock"                # tests whose name matches

pnpm --filter @lanbox/mobile start   # Expo dev server: scan the QR with Expo Go, or press w for web
```

CI (`.github/workflows/ci.yml`) runs install, lint, typecheck and test on every push once the repository has a GitHub remote.
