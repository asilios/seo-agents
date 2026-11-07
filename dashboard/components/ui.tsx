import Link from "next/link";
import { t } from "@/lib/texts";
import type { Status } from "@/lib/status";

const STATUS_CLS: Record<Status, string> = {
  done: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  partial: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  missing: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  not_needed: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};
const ICON: Record<Status, string> = { done: "✓", partial: "!", missing: "✕", not_needed: "–" };

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[status]}`}>
      <span aria-hidden>{ICON[status]}</span>{t.status[status]}
    </span>
  );
}

export function Pill({ children, tone = "stone" }: { children: React.ReactNode; tone?: "stone" | "red" | "blue" }) {
  const cls = {
    stone: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
    red: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    blue: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  }[tone];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${cls}`}>{children}</span>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 ${className}`}>
      {children}
    </section>
  );
}

export function Progress({ ready, total }: { ready: number; total: number }) {
  const pct = total ? Math.round((ready / total) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" role="progressbar"
         aria-valuenow={ready} aria-valuemin={0} aria-valuemax={total}>
      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageHead({ title, lead }: { title: string; lead?: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
      {lead && <p className="mt-1 max-w-2xl text-sm text-stone-600 dark:text-stone-400">{lead}</p>}
    </header>
  );
}

export function Tabs({ items, active }: { items: { href: string; label: string; key: string }[]; active: string }) {
  return (
    <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {items.map((i) => (
        <Link key={i.key} href={i.href}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${i.key === active
                ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                : "border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"}`}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
