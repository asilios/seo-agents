import { test } from "node:test";
import assert from "node:assert/strict";
import { autoCheck, loadYaml, parseCsv, resolveRequirement, readiness, updateTask, type Requirement, type Task } from "./status.ts";

const req = (check: string, required = true): Requirement => ({
  id: "r", scope: "client", module: "core", kind: "data", title: "t", unlocks: "u", how: ["h"], check, required,
});

test("даты в YAML остаются строками", () => {
  const d = loadYaml<{ a: string }>("a: 2026-11-07\n", { a: "" });
  assert.equal(d.a, "2026-11-07");
});

test("secret: без списка секретов — неизвестно, со списком — по имени", () => {
  assert.equal(autoCheck("secret:OPENAI_API_KEY", { secretNames: null }), null);
  assert.equal(autoCheck("secret:OPENAI_API_KEY", { secretNames: ["OPENAI_API_KEY"] }), true);
  assert.equal(autoCheck("secret:OPENAI_API_KEY", { secretNames: [] }), false);
});

test("field: вложенные поля, пустые строки и списки", () => {
  const y = { domain: "https://x.uz/", services: [""], contacts: { phone: "1" }, yandex_webmaster: false };
  const c = { secretNames: null, clientYaml: y };
  assert.equal(autoCheck("field:domain", c), true);
  assert.equal(autoCheck("field:services", c), false);
  assert.equal(autoCheck("field:contacts.phone", c), true);
  assert.equal(autoCheck("field:yandex_webmaster", c), false);
  assert.equal(autoCheck("field:nope.deep", c), false);
});

test("filefield: поле в YAML-файле клиента", () => {
  const ctx = { secretNames: null, yamlFile: (f: string) => (f === "geo/profile.yaml" ? { niche: "", brand: { name: "X" } } : null) };
  assert.equal(autoCheck("filefield:geo/profile.yaml:niche", ctx), false);
  assert.equal(autoCheck("filefield:geo/profile.yaml:brand.name", ctx), true);
  assert.equal(autoCheck("filefield:nope.yaml:niche", ctx), false);
});

test("count: считает строки CSV с кавычками и запятыми", () => {
  const rows = parseCsv('id,text,status\nq1,"Где купить, в Ташкенте?",approved\nq2,"x",pending\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].text, "Где купить, в Ташкенте?");
  const ctx = { secretNames: null, csv: () => rows };
  assert.equal(autoCheck("count:geo/queries.csv:status=approved>=1", ctx), true);
  assert.equal(autoCheck("count:geo/queries.csv:status=approved>=2", ctx), false);
});

test("отметка админа работает, когда автопроверка не дала true", () => {
  const marks = { r: { status: "partial" as const, note: "баланс 0", updated: "2026-11-07" } };
  const r = resolveRequirement(req("secret:X"), marks, { secretNames: null });
  assert.equal(r.status, "partial");
  assert.equal(r.source, "admin");
  assert.equal(r.autoUnknown, true);
  const auto = resolveRequirement(req("secret:X"), marks, { secretNames: ["X"] });
  assert.equal(auto.status, "done");
  assert.equal(auto.source, "auto");
});

test("готовность и блокеры", () => {
  const a = resolveRequirement(req("manual"), {}, { secretNames: null });
  const b = resolveRequirement(req("manual", false), { r: { status: "not_needed", updated: "x" } }, { secretNames: null });
  assert.deepEqual(readiness([a, b]), { ready: 1, total: 2, blockers: 1 });
});

test("обновление задачи: дата, ответ, повторное открытие", () => {
  const t: Task = { id: "2026-11-07-a", who: "owner", title: "t", why: "w", priority: 1, status: "open",
    created: "2026-11-07", source: "s", done_at: null, answer: null };
  const [d] = updateTask([t], t.id, "done", "до 3 дней", "2026-11-08");
  assert.equal(d.status, "done");
  assert.equal(d.done_at, "2026-11-08");
  assert.equal(d.answer, "до 3 дней");
  const [o] = updateTask([d], t.id, "open", null, "2026-11-09");
  assert.equal(o.done_at, null);
  assert.equal(o.answer, "до 3 дней");
  assert.throws(() => updateTask([t], "nope", "done", null, "x"));
});
