# HobbyWorth App

Native React Native app built with Expo development builds. It does not embed HobbyWorth.com and does not use Capacitor or a WebView.

## Product

Free: one live First Project, photos, cost + minutes + yield + price, sell-worthiness math.

Lifetime IAP: history, compare, repeat, materials + packaging + fees, price scenarios, PDF/JSON export.

No HobbyWorth account. Project data stays on-device.

## Store setup

Create a non-consumable product named `hobbyworth_lifetime` in App Store Connect and Google Play Console. Set the storefront price around 7.99. The app reads the localized store price. Purchases use Apple StoreKit and Google Play Billing directly through `expo-iap`; there is no RevenueCat.

## Artwork

The native app uses the existing PNG artwork from `ntnguyenmba/HobbyWorth`. `npm install`, `npm run prepare-assets`, native run commands, and prebuild download the approved source PNGs into `assets/generated/`. The React Native UI loads those local files, and Expo packages them into the native build. Runtime screens do not fetch artwork from GitHub.

The existing square `423E1857-AA50-41D4-8265-B88EB2F4F3CD.png` is used for the store/app icon source. `hero.PNG` is used for the splash artwork. The app uses the existing logo and hobby artwork for its native screens.

## Locales

Launch locales: `en`, `es`, `vi`, `fr`, `de`, `zh-Hans`. The language picker uses English, Español, Tiếng Việt, Français, Deutsch, 简体中文. Device language is used when supported; otherwise English.

## Run

```bash
npm install
npx expo prebuild
npm run ios
```

For Android:

```bash
npm run android
```

IAP requires a native development build or store build, not Expo Go.

## URLs

Privacy: https://hobbyworth.everittventures.com/privacy

Terms: https://hobbyworth.everittventures.com/terms

Support: https://hobbyworth.everittventures.com/support

Support email: team@everittventures.com

## Git workflow

Cursor and Codex: work only on `main`; do not create or switch branches.
