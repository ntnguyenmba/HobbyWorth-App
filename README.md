# HobbyWorth App

Native React Native app built with Expo native projects. It does not embed HobbyWorth.com and does not use Capacitor or a WebView.

## Product

Free: one live First Project, photos, cost + minutes + yield + price, sell-worthiness math.

Lifetime IAP: history, compare, repeat, materials + packaging + fees, price scenarios, PDF/JSON export.

No HobbyWorth account. Project data stays on-device.

## Store setup

Create a non-consumable / one-time product with the exact product ID `com.everittventures.hobbyworth.lifetime` in App Store Connect and Google Play Console. Set the storefront price around 7.99. The app reads the localized store price. Purchases use Apple StoreKit and Google Play Billing directly through `expo-iap`; there is no RevenueCat.

## Artwork

The native app uses the checked-in `play_store_512.png` for its app icon and splash screen. Brand panels and hobby markers are drawn by the app, so installation never clones another repository and hobby rows never show unrelated repeated photos.

## Locales

Launch locales: `en`, `es`, `vi`, `fr`, `de`, `zh-Hans`. The language picker uses English, Español, Tiếng Việt, Français, Deutsch, 简体中文. Device language is used when supported; otherwise English.

## Local builds only

HobbyWorth does not require EAS cloud builds. Build Android and iOS locally on a Mac. Expo remains the native framework, but no paid Expo build service is required.

### First-time setup

Install Node.js, Android Studio with the Android SDK, Xcode, CocoaPods, and Java 17. Then:

```bash
npm install
npm run typecheck
```

### Android Google Play AAB

Generate the native Android project and release bundle locally:

```bash
npm run build:android:local
```

The unsigned or locally configured release bundle is created at:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

A Google Play production upload must be signed with the app's release/upload keystore. Keep keystore files and passwords outside Git and never commit them.

The Android package is `com.everittventures.hobbyworth`. Increase `android.versionCode` in `app.json` for every Google Play update.

### iOS App Store build

Generate the native iOS project locally:

```bash
npm run prepare:ios:local
cd ios
pod install
cd ..
npm run open:ios
```

In Xcode select the HobbyWorth target, choose the Everitt Ventures Apple Developer team under Signing & Capabilities, select Any iOS Device (arm64), then use Product > Archive. In Organizer choose Distribute App > App Store Connect > Upload.

The iOS bundle identifier is `com.everittventures.hobbyworth`. Increase `ios.buildNumber` in `app.json` for every App Store upload.

### Native dependency changes

When native dependencies or Expo plugins change, regenerate native projects before building:

```bash
npm run prebuild:clean
cd ios && pod install && cd ..
```

Do not use Expo Go for IAP or AdMob testing. These features require a native build.

## AdMob

Android and iOS are configured with the production HobbyWorth AdMob app IDs and banner unit IDs. Development builds use Google's test banner unit. Production ads are not requested until Google UMP has refreshed consent status and reports that ads may be requested. On iOS, ATT is requested only when the current consent state permits that request. Paid lifetime users do not load ads.

## Privacy and consent

Google UMP consent is refreshed before ads are requested. Settings includes an Ad privacy choices action for free users. iOS includes ATT usage text and privacy-manifest aggregation.

In AdMob, publish the GDPR/EEA privacy message and iOS IDFA message under Privacy & messaging before store release.

## Validation

`npm run typecheck` checks locale parity, store IDs, Hermes configuration, the asset pipeline, TypeScript, calculator behavior, and quiz result behavior. Store release still requires local native builds plus real-device purchase, restore, consent, and ad tests.

## URLs

Privacy: https://hobbyworth.everittventures.com/privacy

Terms: https://hobbyworth.everittventures.com/terms

Support: https://hobbyworth.everittventures.com/support

Support email: team@everittventures.com

## Git workflow

Cursor and Codex: work only on `main`; do not create or switch branches.
