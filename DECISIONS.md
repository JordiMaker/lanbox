# Decisions

Choices made where SPEC.md is ambiguous or silent, following its rule: take the simplest option, write it down here and carry on. Open questions that only Jordi can answer are listed in SPEC.md and are not decided here.

## Phase 1 — shared foundation (2026-10-16)

### Tooling
1. **Expo SDK stays at 57 for now.** SDK 58 is the latest release, but the Expo Go app in the stores still runs SDK 57. The SDK 58 Expo Go, which will support only 58, arrives "within a few weeks" (Expo changelog, 15 Oct 2026). Upgrade when it ships, or when Phase 4 moves to development builds, whichever comes first.
2. **pnpm 12.14.0** is pinned in `packageManager` and run through corepack, with no global install. `allowBuilds: unrs-resolver: false`: its install script only re-checks a native binary that pnpm already installs.
3. **No `apps/server` yet.** It arrives with Phase 2.
4. **The mobile app keeps the 14 Oct prototype screens** until Phases 3 and 5 replace them. Until then, `noUncheckedIndexedAccess` is off in `apps/mobile` only (`strict` stays on). `src/expo-types.d.ts` references Expo's ambient types, so `tsc` works where `expo start` never ran, such as CI.
5. **The mobile app has no `test` script** until Phase 3 brings Jest + Testing Library with the exercise screens. `pnpm test` runs the shared tests.
6. **CI is GitHub Actions** (`.github/workflows/ci.yml`), on every push and pull request to github.com/JordiMaker/lanbox (public repository, Jordi's choice).

### Data contract
7. **Field names stay as SPEC defines them.** The exercises JSON keys and the `Attempt` fields keep their Spanish names (snake_case where SPEC uses it), because they are the contract between Claude, the server and the app. Code identifiers are in English. `creado_en` is an ISO 8601 string.
8. **The zod schema has no refinements or transforms**, so it converts cleanly to the JSON Schema given to Claude's tool in Phase 2. Cross-field rules live in `validateExercises`.

### Validator rules not listed in SPEC but needed by the screens
9. **The fonetica word at `posicion` equals `palabra_silabeada`.** The pronunciation exercises show the phonetic sentence with a gap in that word.
10. **`posicion_en_traduccion` points to `traduccion_en_frase`** in the translated sentence, which is what the highlight needs. Multi-word translations are compared word by word from that position.
11. **Sentence ids are unique, and word positions are unique within a sentence.**
12. **A word has 1–9 correct syllables**, because the grid is 3×3.

### How the rules are applied
13. **Word comparisons ignore case and leading or trailing punctuation**: "This" matches "this", and "cheap." matches "cheap".
14. **Secondary stress `ˌ` is accepted.** It follows the same rule as `ˈ` (only at the start of a syllable) and is stripped when syllables are compared. A word has at most one primary `ˈ`. Reason: Claude may mark secondary stress in long words, and rejecting it would cost retries without helping the learner.
15. **Distractors must differ as exact strings.**

### Statistics
16. **Percentages are returned unrounded (0–100)**; rounding is the UI's job. A word or mode with no answers counts as 0 %: SPEC says so for the unlock session, and it applies everywhere for consistency.
17. **"Últimas 4 veces" ignores skips**, since SPEC lists only ok/ko.
18. **`gamesLast7Days` takes the timestamps of finished sessions**, because `Attempt` has no session id. Phase 2 decides how those are stored, for example a session id on attempts or a finished-session row. Days are UTC calendar days for now; Phase 5 may need the user's time zone.
19. **`topErrors` groups by word and syllable**; ties are sorted alphabetically so the output is stable.

### Sessions
20. **Words of articles with no active modes are left out.** When two words have the same %, they keep their input order (article, sentence, position, as passed in). When modes tie, the one proposed longest ago wins (a skip counts as proposed), then the order in `MODES`.
21. **Before 3 consecutive misses of a word, a skip sends the exercise to the end of the queue**, without counting as a miss. Whether a skip should count as passed earlier is still an open question in SPEC. Misses are counted per word across modes and reset after a hit.
22. **Two values on the "Sesión · lógica" artboard cannot be reproduced**: is in Traducción → Pronunciación at 73 %, and cheap in that mode at 50 %. Both show "not proposed" among their last 4, which means fewer than 4 answers ever, and so few answers cannot give those percentages. The test fixture uses the consistent values, 100 % and 67 %. The words and pairs both sessions pick are unchanged.

### Known issues
- `expo-doctor` flags `ios.icon` (`./assets/expo.icon`) because it checks the path as a file, but that path is an Icon Composer folder that comes with the Expo template. It is left as the template set it.
