"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Input, Modal, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { downloadBlob } from "@/features/printing/pdf";
import { getSettings } from "@/features/settings/service";
import { decryptBackup, isEncryptedBackup, MIN_PASSPHRASE } from "./crypto";
import { getPersistStatus, requestPersistence, storageUsage, type PersistStatus } from "./persist";
import { BackupError, backupService, exportBackupFile, GOOGLE_DRIVE, parseBackup } from "./service";

interface Pending { bytes: Uint8Array; counts: Record<string, number>; exportedAt: string }
const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;
const PERSIST_TEXT: Record<PersistStatus, string> = {
  granted: "Protected: the browser has agreed not to delete this data automatically.",
  "not-granted": "Not guaranteed: the browser may delete this data if the device runs low on space. Back up regularly.",
  unsupported: "This browser does not support storage protection. Back up regularly.",
};

export function BackupCard() {
  const [last, setLast] = useState<string | undefined>();
  const [pending, setPending] = useState<Pending | null>(null);
  const [encrypted, setEncrypted] = useState<Uint8Array | null>(null);
  const [restorePass, setRestorePass] = useState("");
  const [restoreErr, setRestoreErr] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [passErr, setPassErr] = useState("");
  const [error, setError] = useState("");
  const [persist, setPersist] = useState<PersistStatus | null>(null);
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const canManage = useCan("backup:manage");
  const toast = useToast();
  useEffect(() => { getSettings().then((s) => setLast(s.lastBackupAt)); getPersistStatus().then(setPersist); storageUsage().then(setUsage); }, []);

  const save = async (passphrase?: string) => {
    const { name, bytes } = await exportBackupFile(passphrase);
    downloadBlob(new Blob([bytes as BlobPart], { type: "application/json" }), name);
    setLast(new Date().toISOString()); toast(passphrase ? "Encrypted backup downloaded" : "Backup file downloaded");
  };
  const exportEncrypted = async () => {
    if (pass.length < MIN_PASSPHRASE) return setPassErr(`Use at least ${MIN_PASSPHRASE} characters.`);
    if (pass !== pass2) return setPassErr("Passphrases do not match.");
    setPassErr(""); await save(pass); setPass(""); setPass2("");
  };
  const toPending = (bytes: Uint8Array) => {
    const { file, counts } = parseBackup(bytes);
    setPending({ bytes, counts, exportedAt: file.exportedAt });
  };
  const pick = async (f: File) => {
    setError("");
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (isEncryptedBackup(bytes)) { setRestorePass(""); setRestoreErr(""); setEncrypted(bytes); } else toPending(bytes);
    } catch (e) { setError(e instanceof BackupError ? e.message : "Could not read that file."); }
  };
  const decrypt = async () => {
    if (!encrypted) return;
    try { toPending(await decryptBackup(encrypted, restorePass)); setEncrypted(null); }
    catch (e) { setRestoreErr(e instanceof BackupError ? e.message : "Could not decrypt the file."); }
  };

  return (
    <Card title="Backup & restore">
      <div className="space-y-3 text-sm">
        <p className="rounded-lg bg-amber-50 p-3 text-warning-fg">
          All data is stored only in this browser on this device. Clearing browser data, or losing the device, deletes it.
          Export a backup regularly and keep the file somewhere safe. {last ? `Last backup: ${new Date(last).toLocaleString()}.` : "No backup has been made yet."}
        </p>
        <div data-testid="persist-status" className="rounded-lg bg-surface-2 p-3">
          <div className="font-medium">Storage protection</div>
          <p className="text-muted">{persist ? PERSIST_TEXT[persist] : "Checking…"}{usage && ` Using ${mb(usage.usage)} of ${mb(usage.quota)} available.`}</p>
          {persist !== "granted" && persist !== "unsupported" && (
            <Button variant="secondary" className="mt-2" onClick={async () => setPersist(await requestPersistence())}>Request protection</Button>
          )}
        </div>
        <fieldset disabled={!canManage} className="space-y-3">
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="font-medium">Encrypted backup (recommended)</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Passphrase" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} />
              <Input label="Repeat passphrase" type="password" autoComplete="new-password" value={pass2} error={passErr} onChange={(e) => setPass2(e.target.value)} />
            </div>
            <p className="text-xs text-muted">Encrypted on this device (AES-256-GCM). If you forget the passphrase the backup cannot be recovered; there is no reset.</p>
            <Button onClick={exportEncrypted}>Export encrypted backup</Button>
          </div>
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs text-warning-fg">Unencrypted backups contain all patient data and photos in readable form. Store them securely and never share them.</p>
            <Button variant="secondary" onClick={() => save()}>Export unencrypted backup</Button>
          </div>
          <Button variant="secondary" onClick={() => input.current?.click()}>Restore from file…</Button>
          <input ref={input} type="file" accept="application/json,.json" hidden aria-label="Backup file"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pick(f); }} />
        </fieldset>
        {error && <p role="alert" className="text-danger-fg">{error}</p>}
        <p className="text-xs text-muted">{GOOGLE_DRIVE.name}: {GOOGLE_DRIVE.reason}. Drive will be a backup destination only, never the primary database.</p>
      </div>
      <Modal open={!!encrypted} onClose={() => setEncrypted(null)} title="Encrypted backup">
        <form className="space-y-3 text-sm" onSubmit={(e) => { e.preventDefault(); decrypt(); }}>
          <Input label="Passphrase" type="password" autoComplete="off" value={restorePass} error={restoreErr} onChange={(e) => setRestorePass(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEncrypted(null)}>Cancel</Button>
            <Button type="submit">Decrypt</Button>
          </div>
        </form>
      </Modal>
      <Modal open={!!pending} onClose={() => setPending(null)} title="Restore backup?">
        {pending && (
          <div className="space-y-3 text-sm">
            <p>Backup made {new Date(pending.exportedAt).toLocaleString()}: {pending.counts.patients} patients, {pending.counts.consultations} consultations, {pending.counts.appointments} appointments.</p>
            <p className="font-medium text-danger-fg">This replaces ALL data currently in this browser. Export a backup first if unsure.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
              <Button variant="danger" onClick={async () => { await backupService.restore(pending.bytes); setPending(null); toast("Backup restored"); setTimeout(() => location.reload(), 600); }}>Replace data and restore</Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
