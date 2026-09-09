# HobbyWorth App working rules

- Work only on `main`. Do not create or switch branches.
- This is a real React Native app. Do not add Capacitor, WebView, or a website wrapper.
- Keep HobbyWorth.com and the native app separate products.
- Never hard-code user-facing UI text in components. Add translation keys to all six locale files: `en`, `es`, `vi`, `fr`, `de`, `zh-Hans`.
- The in-app quiz may only match active sellable hobbies and must lead directly to one First Project.
- Free is one live project. Lifetime IAP unlocks history, compare, repeat, detailed costs, price scenarios, and export.
- Project data and photos stay on-device. Do not add accounts, Supabase, or HobbyWorth cloud sync without an explicit product decision.
- Use direct Apple StoreKit / Google Play Billing through `expo-iap`. Do not add RevenueCat.
- Use Nunito and the HobbyWorth coral, teal, cream visual system. Website art may be used as visual assets, but never embed website screens.
