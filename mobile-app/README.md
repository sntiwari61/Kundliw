# Mobile app: Maharshi Kanad Jyotish Kendra

React Native (Expo SDK 58, Expo Router) app for Android, and later iOS. It talks to the website's server
through the mobile API (`docs/MOBILE_API.md` in the repository root). `AGENTS.md` has the rules for working on it.

## What works today
- Sign in as User or Associate: mobile OTP, or e-mail / mobile number with password
- Saved sign-in in the phone's secure storage, renewed automatically; "Try again" screen when offline
- Home: the list of services with starting prices (a tap opens the service on the website)
- My account: details, Hindi / English, policies, log out
- Delete my account (a Google Play requirement)

Not built yet: booking and payment, orders, Vault, tickets, the associate dashboard, Google sign-in, push notifications.

## Run it
```bash
npm install
npx expo start
```
Open it in Expo Go or a development build. To use another server, create `.env.local` with
`EXPO_PUBLIC_API_URL=http://<your-computer-ip>:3000`. The server must have the mobile API deployed.

## Check it
```bash
npm run typecheck
npm test
```

## Build for the Play Store
Builds are made with EAS (`npx eas-cli@latest build --platform android`), signed in with the client's Expo account.
The Android package name is `org.maharshikanadjyotishkendra.app` (in `app.json`). It can never be changed after the first upload to Google Play.

## Layout
- `src/app` screens (file = route). `sign-in`, `offline`, and the signed-in group `(app)`
- `src/lib/api.ts` the only place that calls the server; `session.tsx` who is signed in; `i18n.tsx` every word, in both languages
- `src/components/ui.tsx` buttons, fields, cards; `src/theme.ts` the website's colours
