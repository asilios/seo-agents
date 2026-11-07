import { CopyButton, TaskActions } from "@/components/forms";
import { Card, PageHead, Pill, Tabs } from "@/components/ui";
import { repoUrl } from "@/lib/config";
import { loadOverview, readDraft } from "@/lib/data";
import { requireSession } from "@/lib/session";
import type { Task } from "@/lib/status";
import { t } from "@/lib/texts";

async function Draft({ path, token }: { path: string; token: string }) {
  const text = await readDraft({ login: "", token, exp: 0 }, path);
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-stone-700 dark:text-stone-300">{t.tasks.draft}</summary>
      {text ? (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-3">
            <CopyButton text={text} />
            <a href={repoUrl(path)} className="text-xs text-sky-700 hover:underline dark:text-sky-400" target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-stone-100 p-3 text-xs dark:bg-stone-800">{text}</pre>
        </div>
      ) : (
        <p className="mt-2 text-stone-500">{path}</p>
      )}
    </details>
  );
}

function TaskCard({ task, client, token }: { task: Task; client: string; token: string }) {
  return (
    <Card>
      <article id={task.id} className="scroll-mt-28">
        <div className="flex flex-wrap items-center gap-1">
          <Pill tone={task.priority === 1 ? "red" : "stone"}>{t.priority[task.priority]}</Pill>
          <Pill tone="blue">{t.who[task.who]}</Pill>
          <Pill>{t.kind[task.kind ?? "action"]}</Pill>
          <Pill>{client}</Pill>
        </div>
        <h3 className="mt-2 font-medium leading-snug">{task.title}</h3>
        <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{task.why}</p>
        {!!task.blocks?.length && (
          <p className="mt-2 text-xs text-stone-500">{t.tasks.blocks}: {task.blocks.join(", ")}</p>
        )}
        {!!task.steps?.length && (
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{task.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        )}
        {task.draft && <Draft path={task.draft} token={token} />}
        {task.answer && <p className="mt-2 rounded-lg bg-stone-100 p-2 text-sm dark:bg-stone-800">{task.answer}</p>}
        <p className="mt-2 text-xs text-stone-500">
          {task.created} · {t.tasks.from} {task.source}{task.done_at ? ` · ${t.taskStatus[task.status]} ${task.done_at}` : ""}
        </p>
        <div className="mt-3"><TaskActions client={client} id={task.id} status={task.status} kind={task.kind} /></div>
      </article>
    </Card>
  );
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ client?: string; who?: string }> }) {
  const s = await requireSession();
  const { client, who = "all" } = await searchParams;
  const o = await loadOverview(s);
  const clients = o.clients.filter((c) => !client || c.name === client);
  const all = clients.flatMap((c) => c.tasks.map((task) => ({ task, client: c.name })))
    .filter((x) => who === "all" || x.task.who === who);
  const open = all.filter((x) => x.task.status === "open")
    .sort((a, b) => a.task.priority - b.task.priority || a.task.created.localeCompare(b.task.created));
  const closed = all.filter((x) => x.task.status !== "open");
  const q = (w: string) => `/tasks?${new URLSearchParams({ ...(client ? { client } : {}), who: w })}`;

  return (
    <>
      <PageHead title={t.tasks.title} lead={t.tasks.lead} />
      <Tabs active={who} items={[
        { key: "all", href: q("all"), label: `${t.tasks.all} · ${all.filter((x) => x.task.status === "open").length}` },
        { key: "admin", href: q("admin"), label: t.who.admin },
        { key: "owner", href: q("owner"), label: t.who.owner },
      ]} />
      {o.clients.length > 1 && (
        <Tabs active={client ?? "*"} items={[
          { key: "*", href: `/tasks?who=${who}`, label: t.tasks.all },
          ...o.clients.map((c) => ({ key: c.name, href: `/tasks?client=${c.name}&who=${who}`, label: c.title })),
        ]} />
      )}
      {open.length === 0 && <Card><p className="text-sm">{t.tasks.empty}</p></Card>}
      <div className="grid gap-3 md:grid-cols-2">
        {open.map((x) => <TaskCard key={x.client + x.task.id} task={x.task} client={x.client} token={s.token} />)}
      </div>
      {closed.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium">{t.tasks.closed} · {closed.length}</summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {closed.map((x) => <TaskCard key={x.client + x.task.id} task={x.task} client={x.client} token={s.token} />)}
          </div>
        </details>
      )}
    </>
  );
}
