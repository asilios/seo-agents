// Работа агентов: разбор журналов `log.md` (строки «дата | агент | что сделано | файлы»).
// Чистые функции без доступа к сети — их проверяют тесты (lib/activity.test.ts).

export type RunKind = "ok" | "skip" | "error" | "dry";
export type LogEntry = {
  date: string; agent: string; text: string; files: string;
  client: string; module: string; kind: RunKind;
};

// «PSI и GSC пропущены» внутри успешного запуска — не пропуск запуска: пропуск — это когда не выполнен сам шаг.
const SKIP = /НЕ (выполнен|запускал)|недоступен из облак|нет доступа к сайту|(аудит|выкладк|цикл|запуск)[^|.;:]{0,25}пропущен/i;
const ERROR = /ошибк[аиу]|не удалось|credit_balance_exhausted|0 ответов|вернул пустой/i;
const DRY = /СУХОЙ ПРОГОН/i;

/** Итог шага по тексту журнала. Порядок важен: сухой прогон и пропуск сильнее «ошибки» в тексте. */
export function classify(text: string): RunKind {
  if (DRY.test(text)) return "dry";
  if (SKIP.test(text)) return "skip";
  if (ERROR.test(text)) return "error";
  return "ok";
}

/** «оркестратор (/approve)» → «оркестратор»; регистр не важен. */
export function agentId(raw: string): string {
  return raw.replace(/\(.*?\)/g, "").trim().toLowerCase();
}

const LINE = /^(\d{4}-\d{2}-\d{2}) \| /;

export function parseLog(text: string | null, client: string, module: string): LogEntry[] {
  if (!text) return [];
  const out: LogEntry[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!LINE.test(line)) continue;
    const parts = line.split(" | ");
    if (parts.length < 3) continue;
    const [date, agent] = parts;
    const files = parts.length >= 4 ? parts[parts.length - 1].trim() : "";
    const body = (parts.length >= 4 ? parts.slice(2, -1) : parts.slice(2)).join(" | ").trim();
    out.push({ date, agent: agentId(agent), text: body, files, client, module, kind: classify(body) });
  }
  return out;
}

// ── Роли ─────────────────────────────────────────────────
export type Stage = "measure" | "analyze" | "act" | "publish" | "report" | "other";
/** Этапы недельного цикла для схемы; «other» (владелец, админ, неизвестные) в схему не входит — только в ленту. */
export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: "measure", label: "Замер", hint: "аудит сайта, срез выдачи, Search Console" },
  { id: "analyze", label: "Анализ", hint: "что сейчас сильнее всего тормозит рост" },
  { id: "act", label: "Правки и тексты", hint: "1–3 улучшения за запуск" },
  { id: "publish", label: "Выкладка", hint: "проверки, слияние, живой сайт" },
  { id: "report", label: "Отчёт", hint: "владельцу простым языком" },
];

export type Role = { id: string; label: string; stage: Stage; what: string };
/** Известные роли. Неизвестные агенты из журналов показываются в группе «Прочие». */
export const ROLES: Role[] = [
  { id: "auditor", label: "Аудитор", stage: "measure", what: "краул сайта, ошибки, регрессии" },
  { id: "keyword-strategist", label: "Стратег по семантике", stage: "analyze", what: "кластеры запросов, конкуренты" },
  { id: "оркестратор", label: "Оркестратор", stage: "publish", what: "замер, анализ, правки кода, проверки, слияние, отчёт" },
  { id: "onpage-optimizer", label: "On-page оптимизатор", stage: "act", what: "title, description, H1, разметка" },
  { id: "content-writer", label: "Автор текстов", stage: "act", what: "статьи и посадочные страницы" },
  { id: "geo-query-mapper", label: "GEO: вопросы к ИИ", stage: "act", what: "вопросы для замера видимости в ответах ИИ" },
  { id: "reporter", label: "Отчётчик", stage: "report", what: "ежемесячный отчёт против базовой точки" },
];

export type AgentStats = {
  role: Role; runs: number; runsRecent: number; last: LogEntry | null;
  problems: number; // сбои и пропуски за последние дни окна
};

const DAY = 86_400_000;
const daysBetween = (a: string, b: Date) => Math.floor((b.getTime() - new Date(a + "T00:00:00Z").getTime()) / DAY);

export function agentStats(entries: LogEntry[], now: Date, recentDays = 30): AgentStats[] {
  const byAgent = new Map<string, LogEntry[]>();
  for (const e of entries) byAgent.set(e.agent, [...(byAgent.get(e.agent) ?? []), e]);
  const known = new Set(ROLES.map((r) => r.id));
  const extra: Role[] = [...byAgent.keys()]
    .filter((id) => !known.has(id))
    .map((id) => ({ id, label: id, stage: "other" as Stage, what: "" }));
  return [...ROLES, ...extra].map((role) => {
    const mine = (byAgent.get(role.id) ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
    const recent = mine.filter((e) => daysBetween(e.date, now) <= recentDays);
    return {
      role,
      runs: mine.length,
      runsRecent: recent.length,
      last: mine[mine.length - 1] ?? null,
      problems: recent.filter((e) => e.kind === "error" || e.kind === "skip").length,
    };
  });
}

/** Записей по дням за последние `days` дней (включая сегодня), для полосы активности. */
export function dailyCounts(entries: LogEntry[], now: Date, days = 14): { date: string; count: number; problems: number }[] {
  const out: { date: string; count: number; problems: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY).toISOString().slice(0, 10);
    const day = entries.filter((e) => e.date === d);
    out.push({ date: d, count: day.length, problems: day.filter((e) => e.kind === "error" || e.kind === "skip").length });
  }
  return out;
}

/** Последние записи сверху; при равной дате сохраняется порядок из файла (поздние строки — ниже в файле, выше в ленте). */
export function recent(entries: LogEntry[], limit: number): LogEntry[] {
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => b.e.date.localeCompare(a.e.date) || b.i - a.i)
    .slice(0, limit)
    .map((x) => x.e);
}

/** Следующий плановый запуск облачной задачи: понедельник 09:00 по Ташкенту (UTC+5) = 04:00 UTC. */
export function nextWeeklyRun(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 4, 0, 0));
  let add = (1 - d.getUTCDay() + 7) % 7; // 1 — понедельник
  if (add === 0 && d.getTime() <= now.getTime()) add = 7;
  return new Date(d.getTime() + add * DAY);
}
