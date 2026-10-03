"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Modal, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { downloadBlob } from "@/features/printing/pdf";
import { getSettings } from "@/features/settings/service";
import { BackupError, backupService, exportBackupFile, GOOGLE_DRIVE, parseBackup } from "./service";

export function BackupCard() {
  const [last, setLast] = useState<string | undefined>();
  const [pending, setPending] = useState<{ bytes: Uint8Array; counts: Record<string, number>; exportedAt: string } | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const canManage = useCan("backup:manage");
  const toast = useToast();
  useEffect(() => { getSettings().then((s) => setLast(s.lastBackupAt)); }, []);

  const exportNow = async () => {
    const { name, bytes } = await exportBackupFile();
    downloadBlob(new Blob([bytes as BlobPart], { type: "application/json" }), name);
    setLast(new Date().toISOString()); toast("Backup file downloaded");
  };
  const pick = async (f: File) => {
    setError("");
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const { file, counts } = parseBackup(bytes);
      setPending({ bytes, counts, exportedAt: file.exportedAt });
    } catch (e) { setError(e instanceof BackupError ? e.message : "Could not read that file."); }
  };

  return (
    <Card title="Backup & restore">
      <div className="space-y-3 text-sm">
        <p className="rounded-lg bg-amber-50 p-3 text-warning">
          All data is stored only in this browser on this device. Clearing browser data, or losing the device, deletes it.
          Export a backup regularly and keep the file somewhere safe. {last ? `Last backup: ${new Date(last).toLocaleString()}.` : "No backup has been made yet."}
        </p>
        <p className="text-xs text-muted">The backup file is not encrypted and contains patient data and photos. Store it securely.</p>
        <fieldset disabled={!canManage} className="flex flex-wrap gap-2">
          <Button onClick={exportNow}>Export backup file</Button>
          <Button variant="secondary" onClick={() => input.current?.click()}>Restore from file…</Button>
          <input ref={input} type="file" accept="application/json,.json" hidden aria-label="Backup file"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pick(f); }} />
        </fieldset>
        {error && <p role="alert" className="text-danger">{error}</p>}
        <p className="text-xs text-muted">{GOOGLE_DRIVE.name}: {GOOGLE_DRIVE.reason}. Drive will be a backup destination only, never the primary database.</p>
      </div>
      <Modal open={!!pending} onClose={() => setPending(null)} title="Restore backup?">
        {pending && (
          <div className="space-y-3 text-sm">
            <p>Backup made {new Date(pending.exportedAt).toLocaleString()}: {pending.counts.patients} patients, {pending.counts.consultations} consultations, {pending.counts.appointments} appointments.</p>
            <p className="font-medium text-danger">This replaces ALL data currently in this browser. Export a backup first if unsure.</p>
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
