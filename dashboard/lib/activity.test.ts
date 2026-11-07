import { test } from "node:test";
import assert from "node:assert/strict";
import { agentId, agentStats, classify, dailyCounts, nextWeeklyRun, parseLog, recent } from "./activity.ts";

const LOG = `# Журнал

дата | агент | что сделано | файлы
---|---|---|---
2026-11-02 | auditor | еженедельный аудит НЕ выполнен: forma-3d.uz недоступен из облачной сессии | —
2026-11-02 | оркестратор (/approve) | одобрены 5 статей | changes/approved/*.json
2026-11-02 | onpage-optimizer | СУХОЙ ПРОГОН после реорганизации: 1 правка | changes/pending/x.json
2026-11-07 | оркестратор | выложена страница | commit | a b
2026-11-07 | владелец | создана карточка GBP
`;

test("разбор журнала: пропускает шапку, читает агента, текст и файлы", () => {
  const e = parseLog(LOG, "forma-3d", "seo");
  assert.equal(e.length, 5);
  assert.deepEqual([e[0].date, e[0].agent, e[0].kind], ["2026-11-02", "auditor", "skip"]);
  assert.equal(e[1].agent, "оркестратор");
  assert.equal(e[1].files, "changes/approved/*.json");
  assert.equal(e[2].kind, "dry");
  assert.equal(e[3].text, "выложена страница | commit"); // разделитель внутри текста не теряется
  assert.equal(e[3].files, "a b");
  assert.equal(e[4].files, ""); // строка из трёх полей
});

test("классификация исхода", () => {
  assert.equal(classify("0 ответов — на счёте нет денег (credit_balance_exhausted)"), "error");
  assert.equal(classify("аудит пропущен: сайт недоступен"), "skip");
  assert.equal(classify("СУХОЙ ПРОГОН: ошибка в тесте"), "dry");
  assert.equal(classify("PageSpeed упал (429), остальное в порядке"), "ok");
  assert.equal(classify("еженедельный аудит: краул 265 стр. (0 ошибок); PSI и GSC пропущены (нет ключей)"), "ok");
  assert.equal(classify("аудит и выкладка пропущены: нет доступа"), "skip");
  assert.equal(classify("еженедельный аудит (auditor) НЕ запускался"), "skip");
});

test("идентификатор агента без скобок и регистра", () => {
  assert.equal(agentId("Оркестратор (/approve)"), "оркестратор");
});

test("статистика агентов: последний запуск, число за окно, проблемы", () => {
  const e = parseLog(LOG, "forma-3d", "seo");
  const now = new Date("2026-11-08T12:00:00Z");
  const stats = agentStats(e, now);
  const orch = stats.find((s) => s.role.id === "оркестратор")!;
  assert.equal(orch.runs, 2);
  assert.equal(orch.last?.date, "2026-11-07");
  const aud = stats.find((s) => s.role.id === "auditor")!;
  assert.equal(aud.problems, 1);
  assert.equal(stats.find((s) => s.role.id === "reporter")!.last, null);
  // неизвестный агент появляется отдельной строкой
  assert.ok(stats.some((s) => s.role.id === "владелец"));
});

test("полоса активности по дням", () => {
  const e = parseLog(LOG, "forma-3d", "seo");
  const days = dailyCounts(e, new Date("2026-11-08T12:00:00Z"), 7);
  assert.equal(days.length, 7);
  assert.equal(days[6].date, "2026-11-08");
  assert.equal(days.find((d) => d.date === "2026-11-07")!.count, 2);
  assert.equal(days.find((d) => d.date === "2026-11-02")!.problems, 1);
});

test("лента: свежие сверху, внутри дня — позднее в файле выше", () => {
  const e = parseLog(LOG, "forma-3d", "seo");
  const r = recent(e, 3);
  assert.equal(r[0].agent, "владелец");
  assert.equal(r[1].agent, "оркестратор");
  assert.equal(r.length, 3);
});

test("следующий запуск — ближайший понедельник 04:00 UTC", () => {
  // 2026-11-08 — воскресенье → 2026-11-09 (понедельник)
  assert.equal(nextWeeklyRun(new Date("2026-11-08T12:00:00Z")).toISOString(), "2026-11-09T04:00:00.000Z");
  // понедельник до 04:00 UTC — в тот же день, после — через неделю
  assert.equal(nextWeeklyRun(new Date("2026-11-09T03:00:00Z")).toISOString(), "2026-11-09T04:00:00.000Z");
  assert.equal(nextWeeklyRun(new Date("2026-11-09T05:00:00Z")).toISOString(), "2026-11-16T04:00:00.000Z");
});
