export type PersistStatus = "granted" | "not-granted" | "unsupported";

/** Asks the browser to protect this site's storage from automatic eviction. The browser may refuse. */
export async function requestPersistence(): Promise<PersistStatus> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return "unsupported";
  try {
    if (await navigator.storage.persisted()) return "granted";
    return (await navigator.storage.persist()) ? "granted" : "not-granted";
  } catch { return "not-granted"; }
}

export async function getPersistStatus(): Promise<PersistStatus> {
  if (typeof navigator === "undefined" || !navigator.storage?.persisted) return "unsupported";
  try { return (await navigator.storage.persisted()) ? "granted" : "not-granted"; } catch { return "not-granted"; }
}

export async function storageUsage(): Promise<{ usage: number; quota: number } | null> {
  try { const e = await navigator.storage.estimate(); return e.usage != null && e.quota != null ? { usage: e.usage, quota: e.quota } : null; } catch { return null; }
}
