"use client";
import { useState } from "react";
import { Badge, Button, Card, Textarea, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { activateLicense, startTrial } from "./service";
import { useLicense } from "./LicenseProvider";

const TONE = { UNACTIVATED: "neutral", TRIAL: "primary", ACTIVE: "success", EXPIRED: "warning", REVOKED: "danger", INVALID: "danger" } as const;

export function LicenseCard() {
  const { status, refresh } = useLicense();
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const canManage = useCan("license:manage");
  const toast = useToast();
  if (!status) return null;
  return (
    <Card title="License">
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">Status: <Badge tone={TONE[status.state]}>{status.state}</Badge></div>
        {status.payload && <div className="text-muted">Holder: {status.payload.holder} · ID: {status.payload.licenseId} · Expires: {status.payload.expiresAt ?? "never"}</div>}
        {status.state === "TRIAL" && <div className="text-muted">{status.trialDaysLeft} day(s) left. This is a local trial and can be reset by clearing browser data; enforcement needs the future license server.</div>}
        {status.reason && status.state !== "TRIAL" && <div className="text-warning-fg">{status.reason}</div>}
        <fieldset disabled={!canManage} className="space-y-3">
          {status.state === "UNACTIVATED" && <Button variant="secondary" onClick={async () => { await startTrial(); await refresh(); toast("Trial started"); }}>Start 30-day trial</Button>}
          <Textarea label="License key" value={key} onChange={(e) => setKey(e.target.value)} hint="Paste the signed key you received. Keys are verified on this device against the vendor public key; no server is contacted." />
          <Button onClick={async () => { const r = await activateLicense(key); setMsg({ ok: r.ok, text: r.message }); if (r.ok) { setKey(""); await refresh(); } }}>Activate</Button>
        </fieldset>
        {msg && <p role="status" className={msg.ok ? "text-success-fg" : "text-danger-fg"}>{msg.text}</p>}
        <p className="text-xs text-muted">License activation is separate from the Doctor Profile.</p>
      </div>
    </Card>
  );
}
