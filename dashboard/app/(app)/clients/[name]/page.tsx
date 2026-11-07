import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangeBadge, IndicatorCard, KIND_LIGHT, LightBadge, PositionsBars, Sparkline } from "@/components/monitor";
import { Card, PageHead, Pill } from "@/components/ui";
import { recent } from "@/lib/activity";
import { loadClientsMonitor } from "@/lib/monitor";
import { requireSession } from "@/lib/session";
import { t } from "@/lib/texts";

const SEV: Record<string, string> = { high: "высокая", medium: "средняя", low: "низкая" };

export default async function ClientPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const s = await requireSession();
  const all = await loadClientsMonitor(s);
  const c = all.find((x) => x.name === name);
  if (!c) notFound();
  const tx = t.monitor.client;
  const pos = c.positions;
  const queries = pos ? pos.trends.filter((q) => !q.isBrand) : [];
  const brand = pos ? pos.trends.find((q) => q.isBrand) : undefined;
  const openIssues = c.issues
    .filter((i) => i.status === "open")
    .sort((a, b) => ["high", "medium", "low"].indexOf(a.severity) - ["high", "medium", "low"].indexOf(b.severity));
  const log = recent(c.log, 8);

  return (
    <>
      <Link href="/clients" className="text-sm text-sky-700 hover:underline dark:text-sky-400">← {t.monitor.clients.title}</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <PageHead title={c.title} lead={c.domain.replace(/\/$/, "")} />
        <LightBadge light={c.overall} label={`${t.monitor.clients.overall}: ${t.monitor.light[c.overall]}`} />
      </div>

      <h2 className="mb-2 mt-2 font-medium">{tx.indicators}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {c.indicators.map((i) => <IndicatorCard key={i.id} i={i} />)}
      </div>

      <h2 className="mb-1 mt-6 font-medium">{tx.positions}</h2>
      <p className="mb-3 max-w-2xl text-sm text-stone-600 dark:text-stone-400">{tx.positionsLead}</p>
      {!pos ? (
        <Card><p className="text-sm">{tx.noPositions}</p></Card>
      ) : (
        <>
          <Card className="mb-3">
            <h3 className="mb-2 text-sm font-medium">{tx.chart}</h3>
            <PositionsBars rows={pos.byDate} />
            <p className="mt-2 flex gap-4 text-xs text-stone-500">
              <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-sky-400" />{tx.legend30}</span>
              <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500" />{tx.legend10}</span>
            </p>
          </Card>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs text-stone-500 dark:border-stone-800">
                  <th className="px-3 py-2 font-medium">{tx.query}</th>
                  <th className="px-3 py-2 font-medium">{tx.position}</th>
                  <th className="px-3 py-2 font-medium"> </th>
                  <th className="px-3 py-2 font-medium">{tx.dynamics}</th>
                  <th className="px-3 py-2 font-medium">{tx.page}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {[...queries, ...(brand ? [brand] : [])].map((q) => (
                  <tr key={q.query}>
                    <td className="px-3 py-2">
                      {q.query}{" "}
                      {q.isBrand ? <Pill tone="blue">{tx.brand}</Pill> : <Pill>{q.lang}</Pill>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">
                      {q.latest !== null ? `#${q.latest}` : <span className="font-normal text-stone-500">{tx.notInTop}</span>}
                    </td>
                    <td className="px-3 py-2"><ChangeBadge trend={q} /></td>
                    <td className="px-3 py-2"><Sparkline series={q.series} measured={q.measured} /></td>
                    <td className="max-w-40 truncate px-3 py-2 text-xs text-stone-500">{q.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <h2 className="mb-2 mt-6 font-medium">{tx.issues}</h2>
      <Card>
        {openIssues.length ? (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {openIssues.map((i) => (
              <li key={i.id} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={i.severity === "high" ? "red" : "stone"}>{SEV[i.severity] ?? i.severity}</Pill>
                  <span className="text-sm font-medium">{i.id}</span>
                </div>
                {i.details && <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{i.details}</p>}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm">{tx.noIssues}</p>}
      </Card>

      <h2 className="mb-2 mt-6 flex items-baseline justify-between gap-2 font-medium">
        <span>{tx.log}</span>
        <Link href={`/agents?client=${c.name}`} className="text-sm font-normal text-sky-700 hover:underline dark:text-sky-400">{tx.all} →</Link>
      </h2>
      <Card>
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {log.map((e, i) => (
            <li key={i} className="flex gap-2 py-2 text-sm">
              <span className="w-20 shrink-0 text-xs text-stone-500">{e.date}</span>
              <span className="min-w-0">
                <span className="mr-2 inline-flex items-center gap-1 align-middle"><LightBadge light={KIND_LIGHT[e.kind]} label={t.monitor.kind[e.kind]} /></span>
                <span className="font-medium">{e.agent}</span>: <span className="text-stone-700 dark:text-stone-300">{e.text.length > 220 ? e.text.slice(0, 220) + "…" : e.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <details className="mt-6 text-sm">
        <summary className="cursor-pointer font-medium">{tx.how}</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-700 dark:text-stone-300">
          {tx.howList.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </details>
    </>
  );
}
