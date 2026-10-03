"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import { RoleProvider, RoleSelector } from "@/features/auth/RoleProvider";
import { Modal, ToastProvider } from "@/components/ui";

const active = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const primary = NAV_ITEMS.filter((i) => i.primary);
  const secondary = NAV_ITEMS.filter((i) => !i.primary);
  const link = (cur: boolean) =>
    `flex min-h-[44px] items-center rounded-lg px-3 text-sm ${cur ? "bg-teal-50 font-medium text-primary-dark" : "text-ink hover:bg-surface-2"}`;

  return (
    <RoleProvider>
      <ToastProvider>
        <div className="min-h-screen md:flex">
          <aside className="hidden print:!hidden w-60 shrink-0 flex-col gap-4 border-r border-border bg-surface p-4 md:flex">
            <div className="font-display text-xl font-bold text-primary">PetraDOC</div>
            <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
              {NAV_ITEMS.map((i) => (
                <Link key={i.href} href={i.href} aria-current={active(path, i.href) ? "page" : undefined} className={link(active(path, i.href))}>
                  {i.label}
                </Link>
              ))}
            </nav>
            <RoleSelector />
          </aside>
          <div className="min-w-0 flex-1">
            <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 md:hidden print:hidden">
              <span className="font-display text-lg font-bold text-primary">PetraDOC</span>
              <button onClick={() => setMore(true)} className="min-h-[44px] rounded-lg px-3 text-sm text-primary">
                More
              </button>
            </header>
            <main className="mx-auto max-w-5xl p-4 pb-24 md:p-8 md:pb-8 print:max-w-none print:p-0">{children}</main>
          </div>
          <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface md:hidden print:hidden">
            {primary.map((i) => (
              <Link key={i.href} href={i.href} aria-current={active(path, i.href) ? "page" : undefined}
                className={`flex min-h-[56px] flex-1 items-center justify-center text-xs ${active(path, i.href) ? "font-semibold text-primary" : "text-muted"}`}>
                {i.short}
              </Link>
            ))}
          </nav>
          <Modal open={more} onClose={() => setMore(false)} title="More">
            <div className="flex flex-col gap-1">
              {secondary.map((i) => (
                <Link key={i.href} href={i.href} onClick={() => setMore(false)} className={link(active(path, i.href))}>
                  {i.label}
                </Link>
              ))}
              <div className="mt-3"><RoleSelector /></div>
            </div>
          </Modal>
        </div>
      </ToastProvider>
    </RoleProvider>
  );
}
