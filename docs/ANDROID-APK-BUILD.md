# Android APK build (FUTURE: not built, not tested)

PetraDOC is a web app today. This is the plan for wrapping it with Capacitor. **No APK has been built and none of the steps below have been run.** Do them on a machine with Android Studio.

## 1. Prerequisites
Node 20+, JDK 17, Android Studio (SDK Platform 34+, Build-Tools, a device or emulator).

## 2. Make the web build static
The app is fully client-side (no API routes, no server actions, query-string routes such as `/patients/detail?id=`), so it can be exported:
1. In `next.config.mjs` add `output: "export"` and `images: { unoptimized: true }`.
2. `npm run build` produces `out/`.
Notes: fonts are fetched from Google Fonts at *build* time and bundled; `public/manifest.webmanifest` and icons are copied as-is; keep `distDir` default for this build.

## 3. Add Capacitor
```bash
npm i @capacitor/core @capacitor/android
npm i -D @capacitor/cli
npx cap init PetraDOC com.yourcompany.petradoc --web-dir=out
npx cap add android
npm run build && npx cap sync android     # repeat after every web build
npx cap open android
```

## 4. Debug and release APK
- Debug: Android Studio *Build > Build APK(s)*, or `cd android && ./gradlew assembleDebug` (output `android/app/build/outputs/apk/debug/`).
- Release: create a keystore once and **back it up** (losing it means you cannot update the app):
  `keytool -genkey -v -keystore petradoc.jks -alias petradoc -keyalg RSA -keysize 2048 -validity 10000`
  Reference it in `android/app/build.gradle` (`signingConfigs`), then `./gradlew assembleRelease` (APK) or `./gradlew bundleRelease` (AAB for Play Store).

## 5. Name and icons
App name: `android/app/src/main/res/values/strings.xml`. Icons: `npm i -D @capacitor/assets`, put `assets/icon-only.png` (use `public/icons/icon-512.png`) and run `npx capacitor-assets generate --android`. `scripts/make-icons.mjs` regenerates the source icons.

## 6. Things that must change for native (known gaps)
| Area | Today (web) | Needed on Android |
|---|---|---|
| File saving | `downloadBlob()` (`src/features/printing/pdf.ts`) uses `<a download>` | Blob downloads do not work in the Android WebView. Implement `PlatformCapabilities.saveFile/share` (`src/platform/types.ts`) with `@capacitor/filesystem` + `@capacitor/share` and route backup export and PDF through it. |
| Printing | `window.print()` via `BrowserPrinterAdapter` | `window.print()` is unavailable in the WebView. Share the PDF, and add a Bluetooth/USB ESC/POS `PrinterAdapter` (see NATIVE-INTEGRATION.md). |
| Storage | IndexedDB (Dexie) works in the WebView | Works, but is lost if the user clears app data. For SQLite implement `Repository<T>` with `@capacitor-community/sqlite` in a new `sqlite-repository.ts`, swap it in `src/lib/repositories.ts`, and migrate existing data through an exported backup file. |
| Photo | `<input type="file" accept="image/*">` | Works; add the `CAMERA` permission if capture is used. |
| Google Drive | not implemented | OAuth plugin + a `BackupDestination` implementation. |

## 7. Permissions
None required today. Add as needed: `BLUETOOTH_CONNECT`/`BLUETOOTH_SCAN` (Android 12+) for Bluetooth printers, `CAMERA`, notifications (`POST_NOTIFICATIONS`) for follow-up reminders.

## 8. Troubleshooting
- White screen: web assets missing; run `npm run build && npx cap sync android`.
- Gradle/JDK errors: Android Studio must use JDK 17 (Settings > Build Tools > Gradle).
- Routes 404 on reload: export uses real files; keep query-string routes.
- Data disappeared: app data was cleared or the app was reinstalled; restore from a backup file.
