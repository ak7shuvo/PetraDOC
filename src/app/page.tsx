export default function Dashboard() {
  const cards = ["Today's appointments", "Patients", "Recent consultations", "Follow-ups"];
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Foundation scaffold. Data wiring comes in later phases.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c} className="rounded-xl border border-border bg-surface p-4">
            <div className="text-sm text-muted">{c}</div>
            <div className="mt-2 text-2xl font-bold">—</div>
          </div>
        ))}
      </div>
    </div>
  );
}
