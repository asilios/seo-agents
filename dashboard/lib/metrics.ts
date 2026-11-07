// Показатели клиента: позиции, индексация, поисковый трафик, аудит, скорость, видимость в ИИ, выкладки.
// Чистые функции без доступа к сети — их проверяют тесты (lib/metrics.test.ts).
import { parseCsv } from "./status.ts";

export type Light = "green" | "yellow" | "red" | "grey";
export type Indicator = {
  id: string; title: string; light: Light; value: string; note: string; href?: string;
};

const DAY = 86_400_000;
export function ageDays(date: string | null | undefined, now: Date): number | null {
  if (!date) return null;
  const t = new Date(date.slice(0, 10) + "T00:00:00Z").getTime();
  return Number.isNaN(t) ? null : Math.floor((now.getTime() - t) / DAY);
}
const worse = (a: Light, b: Light): Light => {
  const order: Light[] = ["green", "yellow", "red"];
  if (a === "grey" || b === "grey") return a === "grey" ? b : a;
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
};
/** Устаревшие данные не могут быть «зелёными». */
function staleCap(light: Light, date: string | null, maxDays: number, now: Date): { light: Light; stale: boolean } {
  const age = ageDays(date, now);
  if (age === null || age <= maxDays) return { light, stale: false };
  return { light: light === "grey" ? "grey" : worse(light, "yellow"), stale: true };
}

// ── Позиции ──────────────────────────────────────────────
export type PosRow = { date: string; query: string; position: number | null; url: string; isBrand: boolean };

export function parsePositions(csv: string | null): PosRow[] {
  if (!csv) return [];
  return parseCsv(csv).map((r) => ({
    date: r.date,
    query: r.query,
    position: r.position ? Number(r.position) : null,
    url: r.url || "",
    isBrand: r.is_brand === "1",
  })).filter((r) => r.date && r.query);
}

export type QueryTrend = {
  query: string; lang: "ru" | "uz"; isBrand: boolean;
  series: (number | null)[]; // по общим датам; null — нет в топ-30 или запрос в тот день не замерялся
  measured: boolean[];       // был ли запрос замерен в этот день
  latest: number | null; previous: number | null;
  change: "up" | "down" | "same" | "appeared" | "lost" | "new" | "none";
  delta: number; // >0 — позиция улучшилась (число мест)
  url: string;
};
export type PositionsSummary = {
  dates: string[];
  trends: QueryTrend[];
  byDate: { date: string; tracked: number; top30: number; top10: number }[];
  up: number; down: number; appeared: number; lost: number; same: number;
  latestDate: string | null;
};

export function summarizePositions(rows: PosRow[]): PositionsSummary | null {
  if (!rows.length) return null;
  const dates = [...new Set(rows.map((r) => r.date))].sort();
  const queries = [...new Set(rows.map((r) => r.query))];
  const at = (q: string, d: string) => rows.find((r) => r.query === q && r.date === d);
  const latestDate = dates[dates.length - 1];
  const prevDate = dates.length > 1 ? dates[dates.length - 2] : null;

  const trends: QueryTrend[] = queries.map((q) => {
    const series = dates.map((d) => at(q, d)?.position ?? null);
    const measured = dates.map((d) => !!at(q, d));
    const cur = at(q, latestDate);
    const prev = prevDate ? at(q, prevDate) : undefined;
    const latest = cur?.position ?? null;
    const previous = prev?.position ?? null;
    let change: QueryTrend["change"] = "none";
    let delta = 0;
    if (cur && !prev) change = "new";
    else if (cur && prev) {
      if (latest !== null && previous !== null) {
        delta = previous - latest;
        change = delta > 0 ? "up" : delta < 0 ? "down" : "same";
      } else if (latest !== null) { change = "appeared"; }
      else if (previous !== null) { change = "lost"; }
      else change = "same";
    }
    const withUrl = [...rows].reverse().find((r) => r.query === q && r.position !== null);
    return {
      query: q, lang: /[а-яё]/i.test(q) ? "ru" : "uz", isBrand: rows.some((r) => r.query === q && r.isBrand),
      series, measured, latest, previous, change, delta, url: cur?.position !== null && cur ? cur.url : withUrl?.url ?? "",
    };
  });

  const nonBrand = trends.filter((t) => !t.isBrand);
  const byDate = dates.map((d) => {
    const day = rows.filter((r) => r.date === d && !r.isBrand);
    return {
      date: d, tracked: day.length,
      top30: day.filter((r) => r.position !== null).length,
      top10: day.filter((r) => r.position !== null && r.position <= 10).length,
    };
  });
  const count = (c: QueryTrend["change"]) => nonBrand.filter((t) => t.change === c).length;
  return {
    dates, trends, byDate, latestDate,
    up: count("up"), down: count("down"), appeared: count("appeared"), lost: count("lost"), same: count("same"),
  };
}

export function positionsIndicator(s: PositionsSummary | null, now: Date): Indicator {
  const href = undefined;
  if (!s) return { id: "positions", title: "Позиции в Google", light: "grey", value: "нет данных", note: "срезов выдачи ещё нет", href };
  const last = s.byDate[s.byDate.length - 1];
  const better = s.up + s.appeared, worseN = s.down + s.lost;
  let light: Light = better > worseN ? "green" : worseN > better ? "red" : "yellow";
  if (last.top30 === 0) light = "red";
  const capped = staleCap(light, s.latestDate, 10, now);
  const move = s.dates.length > 1 ? `выросли ${better}, упали ${worseN}` : "первый срез, сравнить не с чем";
  return {
    id: "positions", title: "Позиции в Google", light: capped.light,
    value: `в топ-30: ${last.top30} из ${last.tracked} · в топ-10: ${last.top10}`,
    note: `${move} (срез ${s.latestDate}${capped.stale ? ", устарел" : ""})`,
    href,
  };
}

// ── Прочие показатели ────────────────────────────────────
export type Issue = { id: string; severity: "high" | "medium" | "low"; status: "open" | "fixed" | string };

export function auditIndicator(issues: Issue[] | null, auditDate: string | null, now: Date): Indicator {
  if (!issues) return { id: "audit", title: "Технический аудит", light: "grey", value: "нет данных", note: "аудита ещё не было" };
  const open = issues.filter((i) => i.status === "open");
  const n = (s: string) => open.filter((i) => i.severity === s).length;
  const light: Light = n("high") ? "red" : n("medium") ? "yellow" : "green";
  const capped = staleCap(light, auditDate, 10, now);
  return {
    id: "audit", title: "Технический аудит", light: capped.light,
    value: open.length ? `открыто — высоких: ${n("high")} · средних: ${n("medium")} · низких: ${n("low")}` : "открытых проблем нет",
    note: `закрыто ${issues.length - open.length} из ${issues.length}${auditDate ? ` · аудит ${auditDate}${capped.stale ? ", устарел" : ""}` : ""}`,
  };
}

export type InspectInfo = { indexed: number; total: number; date: string } | null;
export function parseInspect(json: string | null, date: string | null): InspectInfo {
  if (!json || !date) return null;
  try {
    const d = JSON.parse(json) as Record<string, { verdict?: string }>;
    const items = Object.values(d);
    return { indexed: items.filter((i) => i.verdict === "PASS").length, total: items.length, date };
  } catch { return null; }
}
export function indexIndicator(i: InspectInfo, now: Date): Indicator {
  if (!i || !i.total) return { id: "index", title: "Индексация", light: "grey", value: "нет данных", note: "проверка URL в Search Console не делалась" };
  const ratio = i.indexed / i.total;
  const light: Light = ratio >= 0.9 ? "green" : ratio >= 0.5 ? "yellow" : "red";
  const capped = staleCap(light, i.date, 14, now);
  return {
    id: "index", title: "Индексация", light: capped.light,
    value: `в индексе ${i.indexed} из ${i.total} проверенных страниц`,
    note: `проверялись только ключевые страницы, не все карточки · данные от ${i.date}${capped.stale ? ", устарели" : ""}`,
  };
}

export type GscInfo = { clicks: number; impressions: number; date: string } | null;
export function parseGsc(csv: string | null, date: string | null): GscInfo {
  if (!csv || !date) return null;
  const rows = parseCsv(csv);
  return {
    clicks: rows.reduce((a, r) => a + Number(r.clicks || 0), 0),
    impressions: rows.reduce((a, r) => a + Number(r.impressions || 0), 0),
    date,
  };
}
export function gscIndicator(g: GscInfo, now: Date): Indicator {
  if (!g) return { id: "gsc", title: "Показы и клики", light: "grey", value: "нет данных", note: "нет выгрузки Search Console (в облаке нет ключа)" };
  const light: Light = g.impressions === 0 ? "red" : g.clicks === 0 ? "yellow" : "green";
  const capped = staleCap(light, g.date, 14, now);
  return {
    id: "gsc", title: "Показы и клики", light: capped.light,
    value: `показов ${g.impressions} · кликов ${g.clicks} (28 дней)`,
    note: `выгрузка от ${g.date}${capped.stale ? ", устарела" : ""}`,
  };
}

export type PsiInfo = { score: number | null; measured: number; failed: number; date: string } | null;
export function parsePsi(json: string | null, date: string | null): PsiInfo {
  if (!json || !date) return null;
  try {
    const s = (JSON.parse(json) as { summary: { median_score: number | null; measured: number; failed: number } }).summary;
    return { score: s.median_score, measured: s.measured, failed: s.failed, date };
  } catch { return null; }
}
export function speedIndicator(p: PsiInfo): Indicator {
  if (!p || p.score === null) {
    return { id: "speed", title: "Скорость сайта", light: "grey", value: "не измеряется", note: p ? `замеры ${p.date} не удались — нужен PSI_API_KEY` : "замеров ещё не было" };
  }
  const light: Light = p.score >= 90 ? "green" : p.score >= 50 ? "yellow" : "red";
  return { id: "speed", title: "Скорость сайта", light, value: `оценка мобильной версии ${p.score} из 100`, note: `медиана по ${p.measured} страницам · ${p.date}` };
}

export function geoIndicator(observations: number): Indicator {
  if (!observations) {
    return { id: "geo", title: "Видимость в ответах ИИ", light: "grey", value: "замеров нет", note: "монитор ждёт ключей и баланса" };
  }
  return { id: "geo", title: "Видимость в ответах ИИ", light: "yellow", value: `получено ответов: ${observations}`, note: "доля упоминаний пока не считается" };
}

export type ChangesInfo = { pending: number; approved: number; applied: number; appliedDates: string[] };
export function releasesIndicator(c: ChangesInfo, now: Date): Indicator {
  const within = (d: number) => c.appliedDates.filter((x) => { const a = ageDays(x, now); return a !== null && a <= d; }).length;
  const w7 = within(7), w14 = within(14);
  const light: Light = w7 ? "green" : w14 ? "yellow" : c.applied ? "red" : "grey";
  return {
    id: "releases", title: "Выкладки на сайт", light,
    value: `правок на сайте за 7 дней: ${w7} · за 14 дней: ${w14}`,
    note: `ждут одобрения ${c.pending} · одобрено, не выложено ${c.approved} · всего внедрено правок ${c.applied} (дата — по имени файла)`,
  };
}

export type TaskLite = { who: "admin" | "owner"; priority: number; status: string; blocks?: string[] };
export function tasksIndicator(tasks: TaskLite[]): Indicator {
  const open = tasks.filter((t) => t.status === "open");
  const blockers = open.filter((t) => t.priority === 1 && t.blocks && t.blocks.length);
  const light: Light = blockers.length ? "red" : open.length ? "yellow" : "green";
  return {
    id: "tasks", title: "Дела людей", light,
    value: `админ ${open.filter((t) => t.who === "admin").length} · владелец ${open.filter((t) => t.who === "owner").length}`,
    note: blockers.length ? `блокируют работу: ${blockers.length}` : open.length ? "ничего не блокирует" : "открытых дел нет",
    href: "/tasks",
  };
}

export const LIGHT_ORDER: Light[] = ["red", "yellow", "green", "grey"];
/** Общий светофор клиента: худший из показателей с данными. */
export function overall(list: Indicator[]): Light {
  const have = list.filter((i) => i.light !== "grey");
  if (!have.length) return "grey";
  return have.reduce<Light>((acc, i) => worse(acc, i.light), "green");
}
