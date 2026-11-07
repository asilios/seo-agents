import Link from "next/link";
import { LightBadge, IndicatorRow } from "@/components/monitor";
import { Card, PageHead } from "@/components/ui";
import { loadClientsMonitor } from "@/lib/monitor";
import { requireSession } from "@/lib/session";
import { t } from "@/lib/texts";

export default async function ClientsPage() {
  const s = await requireSession();
  const clients = await loadClientsMonitor(s);
  return (
    <>
      <PageHead title={t.monitor.clients.title} lead={t.monitor.clients.lead} />
      <div className="grid gap-4 md:grid-cols-2">
        {clients.map((c) => (
          <Card key={c.name}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-medium">{c.title}</h2>
                <p className="truncate text-xs text-stone-500">{c.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
              </div>
              <LightBadge light={c.overall} label={`${t.monitor.clients.overall}: ${t.monitor.light[c.overall]}`} />
            </div>
            <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
              {c.indicators.map((i) => <IndicatorRow key={i.id} i={i} />)}
            </ul>
            <Link href={`/clients/${c.name}`} className="mt-3 inline-block text-sm text-sky-700 hover:underline dark:text-sky-400">
              {t.monitor.clients.details} →
            </Link>
          </Card>
        ))}
        {!clients.length && <Card><p className="text-sm">{t.monitor.clients.noClients}</p></Card>}
      </div>
    </>
  );
}
