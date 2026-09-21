# HobbyWorth native apps

HobbyWorth now has native projects for iOS and Android on the main branch.

## iOS
Open:
```bash
open ios-native/HobbyWorth.xcodeproj
```
The iOS app uses SwiftUI, bundle ID `com.everittventures.hobbyworth`, version 1.0, build 1, and includes an Xcode preview in `ContentView.swift`.

## Android
Open the `android-native` folder in Android Studio. It uses Kotlin and Jetpack Compose and includes a Compose preview. Package ID is `com.everittventures.hobbyworth`, version 1.0, version code 1.

## Native foundation included
Home, quiz, hobby browser, calculator, and native previews are included. iOS also has a Settings screen.

The old Expo source remains temporarily as a migration reference. Do not use Expo for new native builds.

The app has not been submitted to either store. Store signing, icons, purchases, ads, localization, persistence, photos, history/export, complete hobby data, and final store testing still need to be migrated before submission.

Work directly on `main`. Do not create feature branches.
