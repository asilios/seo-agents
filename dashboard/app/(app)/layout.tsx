import Link from "next/link";
import { config } from "@/lib/config";
import { requireSession } from "@/lib/session";
import { t } from "@/lib/texts";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/", label: t.nav.overview },
  { href: "/clients", label: t.nav.clients },
  { href: "/agents", label: t.nav.agents },
  { href: "/setup", label: t.nav.setup },
  { href: "/tasks", label: t.nav.tasks },
  { href: "/keys", label: t.nav.keys },
  { href: "/clients/new", label: t.nav.newClient },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-stone-200 bg-stone-50/90 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="font-semibold">{t.app}</Link>
          <div className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
            <span className="hidden sm:inline">@{s.login}{config.localMode && " · локально"}</span>
            {!config.localMode && (
              <form action="/api/auth/logout" method="post">
                <button className="underline-offset-2 hover:underline">{t.logout}</button>
              </form>
            )}
          </div>
        </div>
        <nav className="-mx-4 mt-2 flex gap-1 overflow-x-auto px-4 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
                  className="whitespace-nowrap rounded-md px-2 py-1 text-stone-700 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
