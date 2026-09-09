# HobbyWorth App

Native React Native app built with Expo development builds. It does not embed HobbyWorth.com and does not use Capacitor or a WebView.

## Product

Free: one live First Project, photos, cost + minutes + yield + price, sell-worthiness math.

Lifetime IAP: history, compare, repeat, materials + packaging + fees, price scenarios, export.

No HobbyWorth account. Project data stays on-device.

## Store setup

Create a non-consumable product named `hobbyworth_lifetime` in App Store Connect and Google Play Console. Set the storefront price around 7.99. The app reads the localized store price. Purchases use Apple StoreKit and Google Play Billing directly through `expo-iap`; there is no RevenueCat.

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
