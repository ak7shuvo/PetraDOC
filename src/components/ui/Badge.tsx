const T = {
  neutral: "bg-surface-2 text-muted", success: "bg-green-50 text-success-fg",
  warning: "bg-amber-50 text-warning-fg", danger: "bg-red-50 text-danger-fg", primary: "bg-teal-50 text-primary-dark",
};
export function Badge({ tone = "neutral", children }: { tone?: keyof typeof T; children: React.ReactNode }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${T[tone]}`}>{children}</span>;
}
