"use client";
import { RequirePermission } from "@/features/auth/RoleProvider";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, EmptyState, Input, Modal, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { CATEGORY_SUGGESTIONS, type Panel, type TestDef } from "@/features/investigations/types";
import { newId } from "@/lib/repository";
import { panelRepo, testRepo } from "@/lib/repositories";

function InvestigationsPage() {
  const [tests, setTests] = useState<TestDef[] | null>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [q, setQ] = useState("");
  const [editTest, setEditTest] = useState<TestDef | null>(null);
  const [editPanel, setEditPanel] = useState<Panel | null>(null);
  const [err, setErr] = useState("");
  const canWrite = useCan("investigation:write");
  const toast = useToast();

  const load = useCallback(async () => {
    const [t, p] = await Promise.all([testRepo.list(), panelRepo.list()]);
    setTests(t.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
    setPanels(p);
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = tests?.filter((t) => `${t.name} ${t.category}`.toLowerCase().includes(q.toLowerCase())) ?? [];
  const grouped = shown.reduce<Record<string, TestDef[]>>((g, t) => ((g[t.category || "Uncategorised"] ??= []).push(t), g), {});

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Investigations</h1>
      <p className="text-xs text-muted">Your own test list and panels. Nothing is pre-loaded; you can also type a test manually inside a consultation.</p>
      <Card title="Tests" action={canWrite && <Button onClick={() => { setErr(""); setEditTest({ id: newId(), name: "", category: "" }); }}>Add test</Button>}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tests" placeholder="Search tests or categories"
          className="mb-3 block min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-sm" />
        {tests === null ? <p className="text-sm text-muted">Loading…</p> : shown.length === 0 ? (
          <EmptyState title={q ? "No matching tests" : "No tests yet"} />
        ) : Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="mb-3">
            <h3 className="text-xs font-semibold uppercase text-primary-dark">{cat}</h3>
            <ul className="divide-y divide-border">
              {list.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 py-1 text-sm">
                  <span>{t.name}</span>
                  {canWrite && <span className="flex">
                    <Button variant="ghost" onClick={() => { setErr(""); setEditTest(t); }}>Edit</Button>
                    <Button variant="ghost" className="text-danger" onClick={async () => { if (confirm(`Delete ${t.name}?`)) { await testRepo.remove(t.id); load(); } }}>Delete</Button>
                  </span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Card>
      <Card title="Custom panels" action={canWrite && <Button onClick={() => { setErr(""); setEditPanel({ id: newId(), name: "", tests: [] }); }}>Add panel</Button>}>
        {panels.length === 0 ? <EmptyState title="No panels yet" hint="A panel groups tests you often order together." /> : (
          <ul className="divide-y divide-border">
            {panels.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div><div className="font-medium">{p.name}</div><div className="text-xs text-muted">{p.tests.join(", ")}</div></div>
                {canWrite && <span className="flex shrink-0">
                  <Button variant="ghost" onClick={() => { setErr(""); setEditPanel(p); }}>Edit</Button>
                  <Button variant="ghost" className="text-danger" onClick={async () => { if (confirm(`Delete panel ${p.name}?`)) { await panelRepo.remove(p.id); load(); } }}>Delete</Button>
                </span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Modal open={!!editTest} onClose={() => setEditTest(null)} title="Test">
        {editTest && (
          <div className="space-y-3">
            <Input label="Test name *" value={editTest.name} error={err} onChange={(e) => setEditTest({ ...editTest, name: e.target.value })} />
            <Input label="Category" list="cats" value={editTest.category} onChange={(e) => setEditTest({ ...editTest, category: e.target.value })} />
            <datalist id="cats">{CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditTest(null)}>Cancel</Button>
              <Button onClick={async () => { if (!editTest.name.trim()) return setErr("Test name is required"); await testRepo.save(editTest); setEditTest(null); load(); toast("Test saved"); }}>Save test</Button></div>
          </div>
        )}
      </Modal>
      <Modal open={!!editPanel} onClose={() => setEditPanel(null)} title="Panel">
        {editPanel && (
          <div className="space-y-3">
            <Input label="Panel name *" value={editPanel.name} error={err} onChange={(e) => setEditPanel({ ...editPanel, name: e.target.value })} />
            <fieldset className="max-h-56 overflow-auto rounded-lg border border-border p-2">
              <legend className="px-1 text-sm font-medium">Tests in panel</legend>
              {(tests ?? []).length === 0 && <p className="text-sm text-muted">Add tests first.</p>}
              {(tests ?? []).map((t) => (
                <label key={t.id} className="flex min-h-[44px] items-center gap-2 text-sm">
                  <input type="checkbox" className="h-5 w-5" checked={editPanel.tests.includes(t.name)}
                    onChange={(e) => setEditPanel({ ...editPanel, tests: e.target.checked ? [...editPanel.tests, t.name] : editPanel.tests.filter((n) => n !== t.name) })} />
                  {t.name}
                </label>
              ))}
            </fieldset>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditPanel(null)}>Cancel</Button>
              <Button onClick={async () => {
                if (!editPanel.name.trim()) return setErr("Panel name is required");
                if (editPanel.tests.length === 0) return setErr("Select at least one test");
                await panelRepo.save(editPanel); setEditPanel(null); load(); toast("Panel saved");
              }}>Save panel</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function GuardedInvestigationsPage() {
  return <RequirePermission permission="clinical:read"><InvestigationsPage /></RequirePermission>;
}
