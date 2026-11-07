import { MarkForm } from "@/components/forms";
import { Card, PageHead, Pill, Progress, StatusBadge, Tabs } from "@/components/ui";
import { loadOverview } from "@/lib/data";
import { requireSession } from "@/lib/session";
import type { ResolvedRequirement } from "@/lib/status";
import { t } from "@/lib/texts";

function RequirementCard({ r, scope, client }: { r: ResolvedRequirement; scope: "system" | "client"; client?: string }) {
  const open = r.status !== "done" && r.status !== "not_needed";
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium leading-snug">{r.title}</h3>
        <StatusBadge status={r.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {r.required && open && <Pill tone="red">{t.setup.required}</Pill>}
        {r.who === "owner" && <Pill tone="blue">{t.setup.byOwner}</Pill>}
        <Pill>{r.module}</Pill>
        <Pill>{r.status === "done" && r.source === "auto" ? t.setup.auto : r.source === "admin" && r.updated ? `${t.setup.admin} · ${r.updated}` : r.check === "manual" ? t.setup.admin : t.setup.auto}</Pill>
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        <div><dt className="inline text-stone-500">{t.setup.unlocks}: </dt><dd className="inline">{r.unlocks}</dd></div>
        {r.cost && <div><dt className="inline text-stone-500">{t.setup.cost}: </dt><dd className="inline">{r.cost}</dd></div>}
        {r.where && <div><dt className="inline text-stone-500">{t.setup.where}: </dt><dd className="inline break-words">{r.where}</dd></div>}
      </dl>
      {r.note && <p className="mt-2 rounded-lg bg-stone-100 p-2 text-sm dark:bg-stone-800">{r.note}</p>}
      {r.autoUnknown && r.check.startsWith("secret:") && <p className="mt-2 text-xs text-stone-500">{t.setup.autoUnknown}</p>}
      <details className="mt-3 text-sm" open={open && r.required}>
        <summary className="cursor-pointer text-stone-700 dark:text-stone-300">{t.setup.how}</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">{r.how.map((h, i) => <li key={i}>{h}</li>)}</ol>
      </details>
      {!(r.status === "done" && r.source === "auto") && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-stone-700 dark:text-stone-300">{t.setup.markTitle}</summary>
          <div className="mt-2"><MarkForm id={r.id} scope={scope} client={client} status={r.status} note={r.note} /></div>
        </details>
      )}
    </Card>
  );
}

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ client?: string; created?: string }> }) {
  const s = await requireSession();
  const { client, created } = await searchParams;
  const o = await loadOverview(s);
  const c = o.clients.find((x) => x.name === client);
  const reqs = c ? c.requirements : o.system;
  const r = c ? c.readiness : o.systemReadiness;
  const sorted = [...reqs].sort((a, b) =>
    Number(a.status === "done" || a.status === "not_needed") - Number(b.status === "done" || b.status === "not_needed") ||
    Number(b.required) - Number(a.required));

  return (
    <>
      <PageHead title={t.setup.title} lead={t.setup.lead} />
      <Tabs active={c ? c.name : "system"} items={[
        { key: "system", href: "/setup", label: t.setup.systemTab },
        ...o.clients.map((x) => ({ key: x.name, href: `/setup?client=${x.name}`, label: x.title })),
      ]} />
      {created && c && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{t.setup.created} {c.name}</p>}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1"><Progress ready={r.ready} total={r.total} /></div>
        <span className="whitespace-nowrap text-sm text-stone-600 dark:text-stone-400">{t.overview.ready(r.ready, r.total)}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {sorted.map((req) => <RequirementCard key={req.id} r={req} scope={c ? "client" : "system"} client={c?.name} />)}
      </div>
    </>
  );
}
