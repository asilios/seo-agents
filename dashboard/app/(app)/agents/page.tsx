import Link from "next/link";
import { DayBars, KIND_LIGHT, LightBadge } from "@/components/monitor";
import { Card, PageHead, Pill, Tabs } from "@/components/ui";
import { STAGES, nextWeeklyRun, type AgentStats } from "@/lib/activity";
import { loadAgentsMonitor } from "@/lib/monitor";
import { requireSession } from "@/lib/session";
import { t } from "@/lib/texts";

const FEED_LIMIT = 40;

function AgentRow({ s, active, client }: { s: AgentStats; active: boolean; client?: string }) {
  const light = s.last ? KIND_LIGHT[s.last.kind] : "grey";
  const q = new URLSearchParams({ agent: s.role.id, ...(client ? { client } : {}) }).toString();
  return (
    <li>
      <Link href={`/agents?${q}#feed`} title={s.role.what}
            className={`block rounded-lg border p-2 text-sm ${active
              ? "border-stone-900 dark:border-stone-100"
              : "border-stone-200 hover:border-stone-400 dark:border-stone-800 dark:hover:border-stone-600"}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{s.role.label}</span>
          <LightBadge light={light} label={s.last ? t.monitor.kind[s.last.kind] : t.monitor.agents.never} />
        </div>
        <p className="mt-1 text-xs text-stone-500">
          {s.last && `${t.monitor.agents.lastRun}: ${s.last.date} · `}{s.runsRecent} {t.monitor.agents.runs30}
          {s.problems > 0 && <span className="text-red-700 dark:text-red-400"> · {s.problems} {t.monitor.agents.problems}</span>}
        </p>
      </Link>
    </li>
  );
}

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ agent?: string; client?: string }> }) {
  const s = await requireSession();
  const { agent, client } = await searchParams;
  const m = await loadAgentsMonitor(s);
  const tx = t.monitor.agents;

  const byStage = (stage: string) => m.stats.filter((x) => x.role.stage === stage);
  const feedAll = m.feed.filter((e) => (!agent || e.agent === agent) && (!client || e.client === client));
  const feed = feedAll.slice(0, FEED_LIMIT);
  const next = nextWeeklyRun(m.now);
  const clientTabs = [
    { key: "", label: t.tasks.all, href: agent ? `/agents?agent=${agent}#feed` : "/agents#feed" },
    ...m.clients.map((c) => ({
      key: c.name, label: c.title, href: `/agents?client=${c.name}${agent ? `&agent=${agent}` : ""}#feed`,
    })),
  ];

  return (
    <>
      <PageHead title={tx.title} lead={tx.lead} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-medium">{tx.schedule}</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{tx.scheduleText}</p>
          <p className="mt-1 text-sm">{tx.next}: <span className="font-medium">{next.toISOString().slice(0, 10)}</span></p>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-medium">{tx.activity}</h2>
          <DayBars days={m.daily} />
        </Card>
      </div>

      <h2 className="mb-2 mt-6 font-medium">{tx.cycle}</h2>
      <ol className="grid gap-3 md:grid-cols-5">
        {STAGES.map((st, idx) => (
          <li key={st.id} className="relative">
            <Card className="h-full">
              <p className="text-xs text-stone-500">{idx + 1}</p>
              <h3 className="font-medium">{st.label}</h3>
              <p className="mb-2 text-xs text-stone-500">{st.hint}</p>
              <ul className="space-y-2">
                {byStage(st.id).map((x) => <AgentRow key={x.role.id} s={x} active={agent === x.role.id} client={client} />)}
              </ul>
            </Card>
            {idx < STAGES.length - 1 && (
              <span aria-hidden className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-stone-400 md:block">→</span>
            )}
          </li>
        ))}
      </ol>

      <h2 className="mb-2 mt-6 font-medium">{tx.pipeline}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {m.clients.map((c) => (
          <Card key={c.name}>
            <h3 className="mb-2 text-sm font-medium">{c.title}</h3>
            <div className="flex items-center gap-2 text-center">
              {[
                { n: c.changes.pending, l: tx.pending }, { n: c.changes.approved, l: tx.approved }, { n: c.changes.applied, l: tx.applied },
              ].map((x, i) => (
                <div key={x.l} className="flex flex-1 items-center gap-2">
                  <div className="flex-1 rounded-lg bg-stone-100 p-2 dark:bg-stone-800">
                    <div className="text-xl font-semibold">{x.n}</div>
                    <div className="text-xs text-stone-600 dark:text-stone-400">{x.l}</div>
                  </div>
                  {i < 2 && <span aria-hidden className="text-stone-400">→</span>}
                </div>
              ))}
            </div>
            {c.recentApplied.length > 0 && (
              <>
                <p className="mb-1 mt-3 text-xs font-medium text-stone-500">{tx.recentApplied}</p>
                <ul className="space-y-0.5 text-xs text-stone-700 dark:text-stone-300">
                  {c.recentApplied.slice(0, 5).map((a) => (
                    <li key={a.id} className="truncate"><span className="text-stone-500">{a.date}</span> {a.id.slice(11)}</li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        ))}
      </div>

      <h2 id="feed" className="mb-2 mt-6 scroll-mt-28 font-medium">{tx.feed}</h2>
      <Tabs items={clientTabs} active={client ?? ""} />
      {(agent || client) && (
        <p className="mb-2 flex flex-wrap items-center gap-2 text-sm">
          {agent && <Pill tone="blue">{tx.filterAgent}: {agent}</Pill>}
          {client && <Pill tone="blue">{tx.filterClient}: {client}</Pill>}
          <Link href="/agents#feed" className="text-sky-700 hover:underline dark:text-sky-400">{tx.reset}</Link>
        </p>
      )}
      <Card>
        {feed.length ? (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {feed.map((e, i) => (
              <li key={`${e.client}-${e.module}-${e.date}-${i}`} className="py-2 text-sm">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs text-stone-500">{e.date}</span>
                  <LightBadge light={KIND_LIGHT[e.kind]} label={t.monitor.kind[e.kind]} />
                  <span className="font-medium">{e.agent}</span>
                  <Pill>{e.client}</Pill><Pill>{e.module}</Pill>
                </div>
                <p className="mt-1 text-stone-700 dark:text-stone-300">{e.text.length > 320 ? e.text.slice(0, 320) + "…" : e.text}</p>
                {e.files && e.files !== "—" && <p className="mt-0.5 truncate text-xs text-stone-500">{e.files}</p>}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm">{tx.feedEmpty}</p>}
        <p className="mt-3 text-xs text-stone-500">{tx.shown(feed.length, feedAll.length)}. {tx.note}</p>
      </Card>
    </>
  );
}
