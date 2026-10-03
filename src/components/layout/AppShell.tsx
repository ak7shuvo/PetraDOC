import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex md:w-60 flex-col border-r border-border bg-surface p-4">
        <div className="mb-6 font-display text-xl font-bold text-primary">PetraDOC</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((i) => (
            <Link key={i.href} href={i.href}
              className="rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface-2">
              {i.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-border bg-surface md:hidden">
        {NAV_ITEMS.slice(0, 5).map((i) => (
          <Link key={i.href} href={i.href} className="flex-1 py-3 text-center text-xs text-muted">
            {i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
