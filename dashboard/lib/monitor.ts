// Загрузка данных для экранов «Агенты» и «Клиенты»: журналы, позиции, аудит, индексация, выкладки.
import "server-only";
import { loadOverview, type ClientView } from "./data";
import {
  agentStats, dailyCounts, parseLog, recent, type AgentStats, type LogEntry,
} from "./activity";
import {
  auditIndicator, geoIndicator, gscIndicator, indexIndicator, overall, parseGsc, parseInspect, parsePositions,
  parsePsi, positionsIndicator, releasesIndicator, speedIndicator, summarizePositions, tasksIndicator,
  type ChangesInfo, type Indicator, type Issue, type Light, type PositionsSummary,
} from "./metrics";
import type { Session } from "./session";
import { sourceFor, type RepoSource } from "./source";

const latestBy = (names: string[], re: RegExp): { name: string; date: string } | null => {
  const hits = names
    .map((n) => ({ name: n, m: re.exec(n) }))
    .filter((x): x is { name: string; m: RegExpExecArray } => !!x.m)
    .map((x) => ({ name: x.name, date: x.m[1] }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return hits.length ? hits[hits.length - 1] : null;
};

export type IssueFull = Issue & { type?: string; urls?: string[]; details?: string; first_seen?: string };
export type ClientMonitor = {
  name: string; title: string; domain: string;
  overall: Light; indicators: Indicator[];
  positions: PositionsSummary | null;
  issues: IssueFull[];
  changes: ChangesInfo;
  recentApplied: { id: string; date: string }[];
  log: LogEntry[];
  view: ClientView;
};

async function listNames(src: RepoSource, dir: string): Promise<string[]> {
  return (await src.list(dir)).filter((i) => i.type === "file").map((i) => i.name);
}

async function loadChanges(src: RepoSource, c: string) {
  const [pending, approved, applied] = await Promise.all(
    ["pending", "approved", "applied"].map((d) => listNames(src, `clients/${c}/seo/changes/${d}`)),
  );
  const json = (xs: string[]) => xs.filter((n) => n.endsWith(".json"));
  // Дата выкладки — по префиксу имени файла (в части файлов нет поля applied_at).
  const appliedFiles = json(applied)
    .map((n) => ({ id: n.replace(/\.json$/, ""), date: /^(\d{4}-\d{2}-\d{2})/.exec(n)?.[1] ?? "" }))
    .filter((x) => x.date)
    .sort((a, b) => b.date.localeCompare(a.date));
  const changes: ChangesInfo = {
    pending: json(pending).length, approved: json(approved).length, applied: json(applied).length,
    appliedDates: appliedFiles.map((x) => x.date),
  };
  return { changes, recentApplied: appliedFiles.slice(0, 8) };
}

export async function loadClientLogs(src: RepoSource, c: string): Promise<LogEntry[]> {
  const [seo, geo, admin] = await Promise.all([
    src.read(`clients/${c}/seo/log.md`), src.read(`clients/${c}/geo/log.md`), src.read(`clients/${c}/admin/log.md`),
  ]);
  return [...parseLog(seo, c, "seo"), ...parseLog(geo, c, "geo"), ...parseLog(admin, c, "admin")];
}

async function loadOne(src: RepoSource, view: ClientView, now: Date): Promise<ClientMonitor> {
  const c = view.name;
  const [dataNames, auditNames, posCsv, issuesText, geoObs, changes, log] = await Promise.all([
    listNames(src, `clients/${c}/seo/data`),
    listNames(src, `clients/${c}/seo/audits`),
    src.read(`clients/${c}/seo/data/positions.csv`),
    src.read(`clients/${c}/seo/audits/issues.json`),
    src.read(`clients/${c}/geo/observations.jsonl`),
    loadChanges(src, c),
    loadClientLogs(src, c),
  ]);
  const gscFile = latestBy(dataNames, /^gsc-(\d{4}-\d{2}-\d{2})\.csv$/);
  const inspFile = latestBy(dataNames, /^gsc-inspect-(\d{4}-\d{2}-\d{2})\.json$/);
  const psiFile = latestBy(dataNames, /^psi-(\d{4}-\d{2}-\d{2})\.json$/);
  const auditFile = latestBy(auditNames, /^(\d{4}-\d{2}-\d{2})\.md$/);
  const [gscText, inspText, psiText] = await Promise.all([
    gscFile ? src.read(`clients/${c}/seo/data/${gscFile.name}`) : null,
    inspFile ? src.read(`clients/${c}/seo/data/${inspFile.name}`) : null,
    psiFile ? src.read(`clients/${c}/seo/data/${psiFile.name}`) : null,
  ]);

  let issues: IssueFull[] | null = null;
  try { issues = issuesText ? (JSON.parse(issuesText) as IssueFull[]) : null; } catch { issues = null; }

  const positions = summarizePositions(parsePositions(posCsv));
  const obs = geoObs ? geoObs.split(/\r?\n/).filter((l) => l.trim()).length : 0;

  const ready = view.readiness;
  const readiness: Indicator = {
    id: "ready", title: "Готовность к работе",
    light: ready.blockers ? "red" : ready.ready < ready.total ? "yellow" : "green",
    value: `готово ${ready.ready} из ${ready.total}`,
    note: ready.blockers ? `обязательных не хватает: ${ready.blockers}` : "обязательное — всё есть",
    href: `/setup?client=${c}`,
  };
  const tasks = tasksIndicator(view.tasks);
  tasks.href = `/tasks?client=${c}`;

  const indicators: Indicator[] = [
    positionsIndicator(positions, now),
    gscIndicator(parseGsc(gscText, gscFile?.date ?? null), now),
    indexIndicator(parseInspect(inspText, inspFile?.date ?? null), now),
    auditIndicator(issues, auditFile?.date ?? null, now),
    speedIndicator(parsePsi(psiText, psiFile?.date ?? null)),
    geoIndicator(obs),
    releasesIndicator(changes.changes, now),
    tasks,
    readiness,
  ];
  return {
    name: c, title: view.title, domain: view.domain,
    overall: overall(indicators), indicators, positions,
    issues: issues ?? [], changes: changes.changes, recentApplied: changes.recentApplied, log, view,
  };
}

export async function loadClientsMonitor(session: Session, now = new Date()): Promise<ClientMonitor[]> {
  const src = sourceFor(session.token);
  const o = await loadOverview(session);
  return Promise.all(o.clients.map((v) => loadOne(src, v, now)));
}

export type AgentsMonitor = {
  now: Date;
  entries: LogEntry[];
  stats: AgentStats[];
  daily: ReturnType<typeof dailyCounts>;
  feed: LogEntry[];
  clients: { name: string; title: string; changes: ChangesInfo; recentApplied: { id: string; date: string }[] }[];
};

export async function loadAgentsMonitor(session: Session, now = new Date()): Promise<AgentsMonitor> {
  const src = sourceFor(session.token);
  const o = await loadOverview(session);
  const perClient = await Promise.all(o.clients.map(async (v) => ({
    v, logs: await loadClientLogs(src, v.name), ch: await loadChanges(src, v.name),
  })));
  // служебные записи владельца/админа в ленте нужны, но «агентом» не считаются в схеме цикла — это решает экран
  const entries = perClient.flatMap((x) => x.logs);
  return {
    now,
    entries,
    stats: agentStats(entries, now),
    daily: dailyCounts(entries, now, 14),
    feed: recent(entries, 400),
    clients: perClient.map((x) => ({ name: x.v.name, title: x.v.title, changes: x.ch.changes, recentApplied: x.ch.recentApplied })),
  };
}
