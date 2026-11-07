import { test } from "node:test";
import assert from "node:assert/strict";
import {
  auditIndicator, gscIndicator, indexIndicator, overall, parseGsc, parseInspect, parsePositions,
  positionsIndicator, releasesIndicator, speedIndicator, summarizePositions, tasksIndicator,
} from "./metrics.ts";

const NOW = new Date("2026-11-08T10:00:00Z");
const CSV = `date,query,position,url,is_brand
2026-11-06,запчасти bambu,17,/,0
2026-11-06,pla пластик,29,/ru/catalog,0
2026-11-06,сопло,,,0
2026-11-06,forma-3d.uz,1,/ru/contacts,1
2026-11-07,запчасти bambu,9,/,0
2026-11-07,pla пластик,,,0
2026-11-07,сопло,15,/ru,0
2026-11-07,hotend toshkent,2,/uz/product/h,0
2026-11-07,forma-3d.uz,2,/ru/contacts,1
`;

test("позиции: рост, падение, появление, новый запрос", () => {
  const s = summarizePositions(parsePositions(CSV))!;
  const by = (q: string) => s.trends.find((t) => t.query === q)!;
  assert.equal(by("запчасти bambu").change, "up");
  assert.equal(by("запчасти bambu").delta, 8);
  assert.equal(by("pla пластик").change, "lost");
  assert.equal(by("сопло").change, "appeared");
  assert.equal(by("hotend toshkent").change, "new");
  assert.equal(by("forma-3d.uz").isBrand, true);
  assert.deepEqual([s.up, s.down, s.appeared, s.lost], [1, 0, 1, 1]);
  const last = s.byDate[1];
  assert.deepEqual([last.tracked, last.top30, last.top10], [4, 3, 2]); // бренд не в счёте
  assert.equal(by("запчасти bambu").lang, "ru");
  assert.equal(by("hotend toshkent").lang, "uz");
});

test("светофор позиций: улучшение — зелёный; устаревший срез не зелёный", () => {
  const s = summarizePositions(parsePositions(CSV))!;
  assert.equal(positionsIndicator(s, NOW).light, "green");
  assert.equal(positionsIndicator(s, new Date("2026-12-01T00:00:00Z")).light, "yellow");
  assert.equal(positionsIndicator(null, NOW).light, "grey");
});

test("аудит: высокая открытая проблема — красный, только низкие — зелёный", () => {
  const mk = (sev: "high" | "medium" | "low", st = "open") => ({ id: sev, severity: sev, status: st });
  assert.equal(auditIndicator([mk("high")], "2026-11-07", NOW).light, "red");
  assert.equal(auditIndicator([mk("medium"), mk("low")], "2026-11-07", NOW).light, "yellow");
  assert.equal(auditIndicator([mk("low"), mk("high", "fixed")], "2026-11-07", NOW).light, "green");
  assert.equal(auditIndicator([mk("low")], "2026-10-01", NOW).light, "yellow"); // устарел
  assert.equal(auditIndicator(null, null, NOW).light, "grey");
});

test("индексация: считает PASS, давность режет зелёный", () => {
  const json = JSON.stringify({ a: { verdict: "PASS" }, b: { verdict: "PASS" }, c: { verdict: "NEUTRAL" } });
  const i = parseInspect(json, "2026-11-07")!;
  assert.deepEqual([i.indexed, i.total], [2, 3]);
  assert.equal(indexIndicator(i, NOW).light, "yellow"); // 67%
  const all = parseInspect(JSON.stringify({ a: { verdict: "PASS" } }), "2026-11-07")!;
  assert.equal(indexIndicator(all, NOW).light, "green");
  assert.equal(indexIndicator({ ...all, date: "2026-10-01" }, NOW).light, "yellow");
});

test("Search Console: ноль показов — красный; пустого файла нет — серый", () => {
  const empty = parseGsc("query,page,clicks,impressions,ctr,position,period_start,period_end\n", "2026-11-07");
  assert.equal(gscIndicator(empty, NOW).light, "red");
  const some = parseGsc("query,page,clicks,impressions\nq,p,2,100\nq2,p,0,50\n", "2026-11-07")!;
  assert.deepEqual([some.clicks, some.impressions], [2, 150]);
  assert.equal(gscIndicator(some, NOW).light, "green");
  assert.equal(gscIndicator(null, NOW).light, "grey");
});

test("скорость: нет оценки — серый", () => {
  assert.equal(speedIndicator({ score: null, measured: 0, failed: 8, date: "2026-10-30" }).light, "grey");
  assert.equal(speedIndicator({ score: 95, measured: 8, failed: 0, date: "2026-11-07" }).light, "green");
  assert.equal(speedIndicator({ score: 40, measured: 8, failed: 0, date: "2026-11-07" }).light, "red");
});

test("выкладки и дела", () => {
  const rel = releasesIndicator({ pending: 1, approved: 0, applied: 3, appliedDates: ["2026-11-07", "2026-10-20"] }, NOW);
  assert.equal(rel.light, "green");
  assert.equal(releasesIndicator({ pending: 0, approved: 0, applied: 1, appliedDates: ["2026-09-01"] }, NOW).light, "red");
  assert.equal(tasksIndicator([{ who: "admin", priority: 1, status: "open", blocks: ["geo"] }]).light, "red");
  assert.equal(tasksIndicator([{ who: "owner", priority: 2, status: "open" }]).light, "yellow");
  assert.equal(tasksIndicator([{ who: "owner", priority: 1, status: "done", blocks: ["x"] }]).light, "green");
});

test("общий светофор: худший из тех, где есть данные", () => {
  const i = (light: "green" | "yellow" | "red" | "grey") => ({ id: "x", title: "x", light, value: "", note: "" });
  assert.equal(overall([i("green"), i("grey"), i("yellow")]), "yellow");
  assert.equal(overall([i("green"), i("red")]), "red");
  assert.equal(overall([i("grey")]), "grey");
});
