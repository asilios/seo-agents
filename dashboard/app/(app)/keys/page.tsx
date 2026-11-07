import { SecretForm } from "@/components/forms";
import { Card, PageHead, Pill, StatusBadge } from "@/components/ui";
import { loadOverview } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { t } from "@/lib/texts";

export default async function KeysPage() {
  const s = await requireSession();
  const o = await loadOverview(s);
  const keys = o.system.filter((r) => r.check.startsWith("secret:") && r.module !== "dashboard");

  return (
    <>
      <PageHead title={t.keys.title} lead={t.keys.lead} />
      <div className="grid gap-3 md:grid-cols-2">
        {keys.map((r) => {
          const name = r.check.slice(7);
          const names = name === "DATAFORSEO_LOGIN" ? [name, "DATAFORSEO_PASSWORD"] : [name];
          return (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium leading-snug">{r.title}</h3>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Pill>{o.secretsVisible ? (r.status === "done" && r.source === "auto" ? t.keys.set : t.keys.unset) : t.keys.unknown}</Pill>
                {r.cost && <Pill>{r.cost}</Pill>}
              </div>
              <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">{r.unlocks}</p>
              {r.note && <p className="mt-2 rounded-lg bg-stone-100 p-2 text-sm dark:bg-stone-800">{r.note}</p>}
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer">{t.setup.how}</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-5">{r.how.map((h, i) => <li key={i}>{h}</li>)}</ol>
              </details>
              <div className="mt-3 space-y-4">
                {names.map((n) => <SecretForm key={n} name={n} hint={n === "GSC_CREDENTIALS" ? t.keys.gsc : undefined} />)}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
