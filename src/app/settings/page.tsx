"use client";
import { useEffect, useState } from "react";
import { Button, Card, Textarea, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { getSettings, updateSettings } from "@/features/settings/service";

export default function SettingsPage() {
  const [footer, setFooter] = useState("");
  const canEdit = useCan("profile:edit");
  const toast = useToast();
  useEffect(() => { getSettings().then((s) => setFooter(s.prescriptionFooter)); }, []);
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <Card title="Prescription footer">
        <fieldset disabled={!canEdit} className="space-y-3">
          <Textarea label="Footer / standing advice (printed on every prescription)" value={footer} onChange={(e) => setFooter(e.target.value)} />
          <Button onClick={async () => { await updateSettings({ prescriptionFooter: footer }); toast("Settings saved"); }}>Save</Button>
        </fieldset>
      </Card>
    </div>
  );
}
