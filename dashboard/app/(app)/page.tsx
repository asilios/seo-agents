import Link from "next/link";
import { Card, PageHead, Pill, Progress } from "@/components/ui";
import { loadOverview } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { t } from "@/lib/texts";

export default async function OverviewPage() {
  const s = await requireSession();
  const o = await loadOverview(s);
  const top = o.clients
    .flatMap((c) => c.tasks.filter((x) => x.status === "open" && x.priority === 1).map((x) => ({ ...x, client: c.name })))
    .slice(0, 6);

  return (
    <>
      <PageHead title={t.nav.overview} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-medium">{t.overview.system}</h2>
            <Link href="/setup" className="text-sm text-sky-700 hover:underline dark:text-sky-400">{t.nav.setup} →</Link>
          </div>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {t.overview.ready(o.systemReadiness.ready, o.systemReadiness.total)} · {t.overview.blockers(o.systemReadiness.blockers)}
          </p>
          <div className="mt-3"><Progress ready={o.systemReadiness.ready} total={o.systemReadiness.total} /></div>
        </Card>

        {o.clients.map((c) => (
          <Card key={c.name}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-medium">{c.title}</h2>
              <span className="truncate text-xs text-stone-500">{c.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
            </div>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {t.overview.ready(c.readiness.ready, c.readiness.total)} · {t.overview.blockers(c.readiness.blockers)}
            </p>
            <div className="mt-3"><Progress ready={c.readiness.ready} total={c.readiness.total} /></div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link href={`/setup?client=${c.name}`} className="text-sky-700 hover:underline dark:text-sky-400">{t.nav.setup}</Link>
              <span className="text-stone-400">·</span>
              <Link href={`/tasks?client=${c.name}`} className="text-sky-700 hover:underline dark:text-sky-400">
                {t.overview.openTasks}: {t.who.admin} {c.openTasks.admin}, {t.who.owner} {c.openTasks.owner}
              </Link>
            </div>
          </Card>
        ))}
        {!o.clients.length && <Card><p className="text-sm">{t.overview.noClients}</p></Card>}
      </div>

      {top.length > 0 && (
        <Card className="mt-4">
          <h2 className="font-medium">{t.overview.top}</h2>
          <ul className="mt-2 divide-y divide-stone-200 dark:divide-stone-800">
            {top.map((x) => (
              <li key={x.client + x.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link href={`/tasks?client=${x.client}#${x.id}`} className="hover:underline">{x.title}</Link>
                <span className="flex gap-1"><Pill>{x.client}</Pill><Pill tone="blue">{t.who[x.who]}</Pill></span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
