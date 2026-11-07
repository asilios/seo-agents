// Расчёт статусов требований — та же логика, что в core/scripts/admin_status.py.
// Чистые функции без доступа к сети — их проверяют тесты (lib/status.test.ts).
import { parse } from "yaml";

export type Requirement = {
  id: string; scope: "system" | "client"; module: string;
  kind: "secret" | "account" | "access" | "data" | "decision";
  title: string; unlocks: string; where?: string; how: string[]; cost?: string;
  who?: "admin" | "owner"; check: string; required: boolean; docs?: string;
};
export type Mark = { status: Status; note?: string; updated: string };
export type Status = "done" | "partial" | "missing" | "not_needed";
export type ResolvedRequirement = Requirement & {
  status: Status; source: "auto" | "admin"; note?: string; updated?: string; autoUnknown?: boolean;
};
export type Task = {
  id: string; who: "admin" | "owner"; kind?: "action" | "decision" | "external";
  title: string; why: string; blocks?: string[]; steps?: string[]; draft?: string | null;
  priority: 1 | 2 | 3; status: "open" | "done" | "skipped"; created: string; source: string;
  done_at?: string | null; answer?: string | null;
};

/** YAML с датами как строками (как в admin_status.py). */
export function loadYaml<T>(text: string | null, fallback: T): T {
  if (!text) return fallback;
  const data = parse(text, { schema: "core" }) as T | null; // core: 2026-11-07 остаётся строкой
  return data ?? fallback;
}

export type CheckContext = {
  secretNames: string[] | null;            // null — список секретов недоступен
  clientYaml?: Record<string, unknown>;
  fileExists?: (rel: string) => boolean;
  yamlFile?: (rel: string) => Record<string, unknown> | null;
  csv?: (rel: string) => Record<string, string>[] | null;
};

/** true/false — автопроверка дала ответ; null — автопроверки нет или она недоступна. */
export function autoCheck(check: string, ctx: CheckContext): boolean | null {
  const i = check.indexOf(":");
  const kind = i < 0 ? check : check.slice(0, i);
  const arg = i < 0 ? "" : check.slice(i + 1);
  switch (kind) {
    case "manual":
      return null;
    case "secret":
      return ctx.secretNames ? ctx.secretNames.includes(arg) : null;
    case "field":
    case "filefield": {
      const [file, key] = kind === "field" ? [null, arg] : [arg.slice(0, arg.indexOf(":")), arg.slice(arg.indexOf(":") + 1)];
      let node: unknown = file ? ctx.yamlFile?.(file) : ctx.clientYaml;
      for (const part of key.split(".")) {
        node = node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined;
      }
      if (Array.isArray(node)) return node.some((x) => x !== "" && x != null);
      return Boolean(node);
    }
    case "file":
      return ctx.fileExists ? ctx.fileExists(arg) : null;
    case "count": {
      const [p, cond] = arg.split(":");
      const [colVal, need] = cond.split(">=");
      const [col, val] = colVal.split("=");
      const rows = ctx.csv ? ctx.csv(p) : null;
      if (!rows) return false;
      return rows.filter((r) => r[col] === val).length >= Number(need);
    }
    default:
      throw new Error(`неизвестная проверка: ${check}`);
  }
}

export function resolveRequirement(req: Requirement, marks: Record<string, Mark>, ctx: CheckContext): ResolvedRequirement {
  const auto = autoCheck(req.check, ctx);
  const mark = marks[req.id];
  let status: Status, source: "auto" | "admin";
  if (auto === true) { status = "done"; source = "auto"; }
  else if (mark) { status = mark.status; source = "admin"; }
  else { status = "missing"; source = auto === false ? "auto" : "admin"; }
  return {
    ...req, status, source, note: mark?.note, updated: mark?.updated,
    autoUnknown: auto === null && req.check !== "manual",
  };
}

export function readiness(reqs: ResolvedRequirement[]) {
  const ready = reqs.filter((r) => r.status === "done" || r.status === "not_needed").length;
  const blockers = reqs.filter((r) => r.required && r.status !== "done" && r.status !== "not_needed").length;
  return { ready, total: reqs.length, blockers };
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) =>
    Number(a.status !== "open") - Number(b.status !== "open") ||
    a.priority - b.priority ||
    a.created.localeCompare(b.created));
}

/** Простой CSV с кавычками (queries.csv). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== "")) rows.push(row);
  const [head, ...body] = rows;
  return head ? body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""]))) : [];
}

/** Обновить задачу: статус, дата, ответ. Возвращает новый список (исходный не меняется). */
export function updateTask(tasks: Task[], id: string, status: Task["status"], answer: string | null, today: string): Task[] {
  let found = false;
  const out = tasks.map((t) => {
    if (t.id !== id) return t;
    found = true;
    return { ...t, status, done_at: status === "open" ? null : today, answer: answer ?? t.answer ?? null };
  });
  if (!found) throw new Error(`задачи ${id} нет`);
  return out;
}

export const CLIENT_NAME = /^[a-z0-9][a-z0-9-]{1,40}$/;
