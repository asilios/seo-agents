// Визуальные элементы экранов «Агенты» и «Клиенты». Серверные компоненты, без библиотек графиков (SVG и div).
import Link from "next/link";
import type { Indicator, Light, QueryTrend } from "@/lib/metrics";
import type { RunKind } from "@/lib/activity";
import { t } from "@/lib/texts";

const DOT: Record<Light, string> = {
  green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-red-500", grey: "bg-stone-400 dark:bg-stone-600",
};
const TEXT: Record<Light, string> = {
  green: "text-emerald-800 dark:text-emerald-300", yellow: "text-amber-800 dark:text-amber-300",
  red: "text-red-800 dark:text-red-300", grey: "text-stone-600 dark:text-stone-400",
};
const ICON: Record<Light, string> = { green: "✓", yellow: "!", red: "✕", grey: "–" };

/** Цвет + знак + подпись: статус понятен и без различения цветов. */
export function LightBadge({ light, label }: { light: Light; label?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${TEXT[light]}`}>
      <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${DOT[light]}`} aria-hidden>
        {ICON[light]}
      </span>
      {label ?? t.monitor.light[light]}
    </span>
  );
}

export function IndicatorCard({ i }: { i: Indicator }) {
  const body = (
    <div className="h-full rounded-xl border border-stone-200 bg-white p-3 transition-colors hover:border-stone-400 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-600">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium">{i.title}</h3>
        <LightBadge light={i.light} />
      </div>
      <p className="mt-2 text-sm leading-snug">{i.value}</p>
      <p className="mt-1 text-xs leading-snug text-stone-500 dark:text-stone-400">{i.note}</p>
    </div>
  );
  return i.href ? <Link href={i.href} className="block h-full">{body}</Link> : body;
}

/** Компактная строка показателя для карточки клиента в списке. */
export function IndicatorRow({ i }: { i: Indicator }) {
  return (
    <li className="flex items-start gap-2 py-1.5">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[i.light]}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{i.title}</span>
        <span className="block truncate text-xs text-stone-500 dark:text-stone-400">{i.value}</span>
      </span>
      <span className="sr-only">{t.monitor.light[i.light]}</span>
    </li>
  );
}

/** Мини-график позиции по датам. Позиция 1 — вверху; пропуск (нет в топ-30) — разрыв линии и значок снизу. */
export function Sparkline({ series, measured }: { series: (number | null)[]; measured: boolean[] }) {
  const W = 96, H = 28, PAD = 3, MAX = 30;
  const n = series.length;
  const x = (i: number) => (n === 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (n - 1));
  const y = (p: number) => PAD + ((p - 1) / (MAX - 1)) * (H - 2 * PAD);
  let d = "";
  series.forEach((p, i) => {
    if (p === null) return;
    const prev = series[i - 1];
    d += `${prev === null || prev === undefined || i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p).toFixed(1)} `;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
         aria-label={series.map((p, i) => (measured[i] ? (p === null ? "нет в топ-30" : `#${p}`) : "не замерялся")).join(", ")}
         className="overflow-visible text-sky-600 dark:text-sky-400">
      <line x1={PAD} x2={W - PAD} y1={y(10)} y2={y(10)} stroke="currentColor" strokeOpacity="0.18" strokeDasharray="2 2" />
      {d && <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />}
      {series.map((p, i) =>
        p === null ? (
          measured[i] ? <text key={i} x={x(i)} y={H - 1} textAnchor="middle" fontSize="8" fill="#a8a29e">×</text> : null
        ) : (
          <circle key={i} cx={x(i)} cy={y(p)} r={i === n - 1 ? 2.5 : 1.8} fill="currentColor" />
        ),
      )}
    </svg>
  );
}

export function ChangeBadge({ trend }: { trend: QueryTrend }) {
  const m = t.monitor.change;
  const cls = {
    up: "text-emerald-700 dark:text-emerald-400", down: "text-red-700 dark:text-red-400",
    same: "text-stone-500", appeared: "text-emerald-700 dark:text-emerald-400", lost: "text-red-700 dark:text-red-400",
    new: "text-sky-700 dark:text-sky-400", none: "text-stone-400",
  }[trend.change];
  const text = trend.change === "up" ? `▲ ${trend.delta}` : trend.change === "down" ? `▼ ${-trend.delta}` : m[trend.change];
  return <span className={`whitespace-nowrap text-xs font-medium ${cls}`}>{text}</span>;
}

/** Столбики «в топ-30» и «в топ-10» по датам срезов. */
export function PositionsBars({ rows }: { rows: { date: string; tracked: number; top30: number; top10: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.tracked));
  return (
    <div className="flex items-end gap-4 overflow-x-auto pb-1" role="img"
         aria-label={rows.map((r) => `${r.date}: в топ-30 ${r.top30} из ${r.tracked}, в топ-10 ${r.top10}`).join("; ")}>
      {rows.map((r) => (
        <div key={r.date} className="flex min-w-14 flex-col items-center gap-1">
          <div className="flex h-24 items-end gap-1">
            <Bar value={r.top30} max={max} cls="bg-sky-400 dark:bg-sky-600" />
            <Bar value={r.top10} max={max} cls="bg-emerald-500" />
          </div>
          <span className="text-[11px] text-stone-500">{r.date.slice(5)}</span>
          <span className="text-[11px] text-stone-600 dark:text-stone-400">{r.top30}/{r.tracked}</span>
        </div>
      ))}
    </div>
  );
}
function Bar({ value, max, cls }: { value: number; max: number; cls: string }) {
  return (
    <div className="flex h-full w-5 flex-col items-center justify-end">
      <span className="mb-0.5 text-[10px] leading-none text-stone-600 dark:text-stone-400">{value}</span>
      <div className={`w-full rounded-t ${cls}`} style={{ height: `${Math.max(2, (value / max) * 80)}%` }} />
    </div>
  );
}

/** Активность по дням: высота — число записей в журнале, красная часть — сбои и пропуски. */
export function DayBars({ days }: { days: { date: string; count: number; problems: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="flex items-end gap-1" role="img"
         aria-label={days.map((d) => `${d.date}: записей ${d.count}, сбоев ${d.problems}`).join("; ")}>
      {days.map((d) => {
        const h = d.count ? Math.max(8, (d.count / max) * 56) : 3;
        const okH = ((d.count - d.problems) / Math.max(1, d.count)) * h;
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
            <div className="flex w-full max-w-6 flex-col justify-end" style={{ height: 56 }}>
              {d.problems > 0 && <div className="w-full rounded-t bg-red-400" style={{ height: h - okH }} />}
              <div className={`w-full ${d.problems ? "" : "rounded-t"} ${d.count ? "bg-sky-500" : "bg-stone-200 dark:bg-stone-800"}`} style={{ height: d.problems ? okH : h }} />
            </div>
            <span className="text-[10px] text-stone-500">{d.date.slice(8)}</span>
          </div>
        );
      })}
    </div>
  );
}

export const KIND_LIGHT: Record<RunKind, Light> = { ok: "green", skip: "yellow", error: "red", dry: "grey" };
