# LANBOX

Language-learning app where learners practise **their own word collections**, and the app doubles as a branded space for a sponsor (corporate image and advertising).

Built with Expo (SDK 57) and React Native, so the same code runs on iOS and Android.

## Run it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. In this folder run `npx expo start`.
3. Scan the QR code with the iPhone camera (or from inside Expo Go on Android). Phone and computer must be on the same Wi-Fi.

`npx expo start --web` opens it in the browser instead.

## What phase 1 includes

- **Collections**: paste a word list (`word = translation`, also tab, ` - `, `:`, `;`, or comma-separated words without translation).
- **Sessions** of 5 exercises mixing four kinds: pick the meaning, pick the word, listen and pick (text-to-speech), and type the word. A missed word comes back at the end of the session, so it only finishes when every word has been answered right.
- **Spaced repetition** (Leitner boxes): words you know come back less often.
- **Sponsor branding**: header, buttons, home hero, end-of-session message and a sponsored slot all take the sponsor's brand. Switch between demo sponsors from *Sponsor preview* on the home screen.
- Data is stored on the device for now.

## Structure

- `src/app/` – screens (Expo Router): home, new collection, collection detail, practice, sponsor preview
- `src/lib/` – pure logic: list parsing, spaced repetition, exercise building and answer checking
- `src/state/` – library (collections and progress) and sponsor providers
- `src/constants/sponsors.ts` – demo sponsors (fictional brands)

## Next phases

1. **AI**: generate translations, example sentences and exercises from free text (Claude, called from a backend so the API key never ships in the app); Supabase for accounts and sync.
2. **Lock mode**: iOS Screen Time shield over apps the learner picks (requires Apple's Family Controls entitlement); overlay on Android. Needs a development build, not Expo Go.
3. **Monetisation**: AdMob plus direct sponsor campaigns served from the backend.
4. **Store release** via EAS Build and Submit.
