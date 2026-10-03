export function PagePlaceholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted">Not implemented yet — planned in {phase}.</p>
    </div>
  );
}
