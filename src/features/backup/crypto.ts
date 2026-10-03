import { BackupError } from "./service";

/** Passphrase-encrypted backup envelope: PBKDF2-SHA256 -> AES-256-GCM (WebCrypto). */
const ITERATIONS = 310_000;
const AAD = new TextEncoder().encode("petradoc-backup-v1");
const MAGIC = "petradoc-encrypted";

const toB64 = (u: Uint8Array) => {
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(pass: string, salt: Uint8Array, iterations: number) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations }, base,
    { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export const MIN_PASSPHRASE = 8;

export async function encryptBackup(plain: Uint8Array, pass: string): Promise<Uint8Array> {
  if (pass.length < MIN_PASSPHRASE) throw new BackupError(`Passphrase must be at least ${MIN_PASSPHRASE} characters.`);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt, ITERATIONS);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: AAD }, key, plain as BufferSource));
  return new TextEncoder().encode(JSON.stringify({
    app: MAGIC, formatVersion: 1, kdf: "PBKDF2-SHA256", iterations: ITERATIONS, cipher: "AES-256-GCM",
    salt: toB64(salt), iv: toB64(iv), data: toB64(ct),
  }));
}

/** Cheap check on the file prefix; does not parse the whole file. */
export const isEncryptedBackup = (bytes: Uint8Array) =>
  new TextDecoder().decode(bytes.subarray(0, 120)).includes(`"app":"${MAGIC}"`);

export async function decryptBackup(bytes: Uint8Array, pass: string): Promise<Uint8Array> {
  let env: { iterations: number; salt: string; iv: string; data: string };
  try {
    env = JSON.parse(new TextDecoder().decode(bytes));
    if (!env.salt || !env.iv || !env.data || !(env.iterations >= 100_000 && env.iterations <= 5_000_000)) throw new Error();
  } catch { throw new BackupError("This encrypted backup is damaged and cannot be read."); }
  try {
    const key = await deriveKey(pass, fromB64(env.salt), env.iterations);
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(env.iv) as BufferSource, additionalData: AAD }, key, fromB64(env.data) as BufferSource));
  } catch { throw new BackupError("Wrong passphrase, or the backup file is damaged."); }
}
