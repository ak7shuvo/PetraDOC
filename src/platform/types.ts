/** Native capability seam for Capacitor (Android) / Tauri (Windows). Web fallback first. */
export interface PlatformCapabilities {
  readonly kind: "web" | "capacitor" | "tauri";
  saveFile(name: string, data: Uint8Array): Promise<void>;
  share?(name: string, data: Uint8Array): Promise<void>;
}
