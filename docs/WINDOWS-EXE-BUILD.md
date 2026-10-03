# Windows EXE build (FUTURE: not built, not tested)

Plan for wrapping the web app with Tauri v2. **No EXE has been built and none of the steps below have been run.**

## 1. Prerequisites
Node 20+, Rust (`rustup`), Microsoft C++ Build Tools ("Desktop development with C++"), WebView2 runtime (preinstalled on Windows 11).

## 2. Static web build
Same as Android: `output: "export"` + `images.unoptimized` in `next.config.mjs`, then `npm run build` creates `out/`.

## 3. Add Tauri
```bash
npm i -D @tauri-apps/cli
npx tauri init     # app name: PetraDOC; frontend dist: ../out; dev URL: http://localhost:3000
                   # before dev: npm run dev; before build: npm run build
npx tauri dev
```

## 4. Build the EXE / installer
`npx tauri build` writes the installer(s) to `src-tauri/target/release/bundle/` (`nsis/` .exe setup, `msi/`). Sign the installer with a code-signing certificate (`signtool` or the `bundle.windows` settings) to avoid SmartScreen warnings.

## 5. Name, identifier and icons
`src-tauri/tauri.conf.json`: `productName`, `identifier` (e.g. `com.yourcompany.petradoc`), version. Icons: `npx tauri icon public/icons/icon-512.png`.

## 6. Native gaps to close
| Area | Today (web) | Needed on Windows |
|---|---|---|
| Storage | IndexedDB inside WebView2 (kept in the app data folder) | Works. For a real database use `tauri-plugin-sql` (SQLite) with a new `Repository<T>` implementation swapped in `src/lib/repositories.ts`; migrate via backup file. |
| File saving | `downloadBlob()` (`<a download>`) | WebView2 shows a download prompt; for a clean flow implement `PlatformCapabilities.saveFile` with `tauri-plugin-dialog` + `tauri-plugin-fs`. |
| Printing | `BrowserPrinterAdapter` (`window.print()`) | Works with installed printer drivers (A4 and thermal paper sizes). Direct ESC/POS over USB/serial/LAN needs a Rust command behind a new `PrinterAdapter`. |
| Google Drive | not implemented | OAuth (loopback redirect) + a `BackupDestination`. |

## 7. Troubleshooting
- `link.exe not found`: install the C++ Build Tools.
- Blank window: run `npm run build` first; check `frontendDist` is `../out`.
- WebView2 missing on Windows 10: install the Evergreen runtime or enable the bootstrapper in the bundle settings.
