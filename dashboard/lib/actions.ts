"use server";
// Действия интерфейса. Каждое — один коммит в репозиторий и строка в журнале: кто, что, когда.
// Интерфейс не публикует и не пишет в applied/ — только меняет статусы и данные (правило docs/prompt-social-module.md).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parse, parseDocument, stringify } from "yaml";
import { config } from "./config";
import { listClients, loadRequirements, PATHS, validateWithSchema } from "./data";
import { requireSession } from "./session";
import { GitHubSource, sourceFor } from "./source";
import { CLIENT_NAME, loadYaml, updateTask, type Mark, type Task } from "./status";

export type ActionResult = { ok: boolean; message: string; status?: string };

const today = () => new Date().toISOString().slice(0, 10);
const yamlOut = (data: unknown) => stringify(data, { lineWidth: 0 });
const logLine = (who: string, what: string, file: string) =>
  `${today()} | интерфейс (@${who}) | ${what.replace(/\s*\n\s*/g, " ")} | ${file}\n`;

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

async function checkClient(src: ReturnType<typeof sourceFor>, client: string) {
  if (!CLIENT_NAME.test(client) || !(await listClients(src)).includes(client)) throw new Error("нет такого клиента");
}

// ── задача: сделано / пропустить / вернуть, ответ ───────
export async function setTaskStatus(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const s = await requireSession();
  const client = str(form, "client"), id = str(form, "id"), status = str(form, "status") as Task["status"];
  const answer = str(form, "answer") || null;
  if (!["open", "done", "skipped"].includes(status)) return { ok: false, message: "неверный статус" };
  const src = sourceFor(s.token);
  try {
    await checkClient(src, client);
    const tasksPath = PATHS.tasks(client), logPath = PATHS.log(client);
    let errors: string[] = [];
    await src.commit([tasksPath, logPath], async (cur) => {
      const tasks = updateTask(loadYaml<Task[]>(cur[tasksPath], []), id, status, answer, today());
      errors = await validateWithSchema(src, "admin-tasks.schema.json", tasks);
      if (errors.length) return [];
      const what = `задача ${id} → ${status}${answer ? ` — ${answer}` : ""}`;
      return [
        { path: tasksPath, content: yamlOut(tasks) },
        { path: logPath, content: (cur[logPath] || "") + logLine(s.login, what, "admin/tasks.yaml") },
      ];
    }, `${client}: задача ${id} → ${status} (интерфейс, @${s.login})`);
    if (errors.length) return { ok: false, message: `Данные не прошли проверку: ${errors.join("; ")}` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  // без revalidatePath: карточка остаётся на месте с подтверждением, список обновится при переходе
  return { ok: true, status, message: status === "open" ? "Задача снова открыта" : `Сохранено: ${status === "done" ? "сделано" : "пропущено"}` };
}

// ── отметка админа по требованию ────────────────────────
export async function setMark(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const s = await requireSession();
  const id = str(form, "id"), scope = str(form, "scope"), client = str(form, "client");
  const status = str(form, "status") as Mark["status"], note = str(form, "note");
  if (!["done", "partial", "missing", "not_needed"].includes(status)) return { ok: false, message: "неверный статус" };
  const reqs = await loadRequirements(s);
  const req = reqs.find((r) => r.id === id && r.scope === scope);
  if (!req) return { ok: false, message: "нет такого требования" };
  const src = sourceFor(s.token);
  try {
    if (scope === "client") await checkClient(src, client);
    const marksPath = scope === "system" ? PATHS.systemMarks : PATHS.clientMarks(client);
    const logPath = scope === "system" ? PATHS.systemLog : PATHS.log(client);
    let errors: string[] = [];
    await src.commit([marksPath, logPath], async (cur) => {
      const marks = loadYaml<Record<string, Mark>>(cur[marksPath], {});
      marks[id] = { status, ...(note ? { note } : {}), updated: today() };
      errors = await validateWithSchema(src, "setup-status.schema.json", marks);
      if (errors.length) return [];
      return [
        { path: marksPath, content: yamlOut(marks) },
        { path: logPath, content: (cur[logPath] || "") + logLine(s.login, `требование ${id} → ${status}${note ? ` — ${note}` : ""}`, marksPath) },
      ];
    }, `${scope === "system" ? "система" : client}: требование ${id} → ${status} (интерфейс, @${s.login})`);
    if (errors.length) return { ok: false, message: `Данные не прошли проверку: ${errors.join("; ")}` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Отметка сохранена" };
}

// ── ключ → секрет репозитория ───────────────────────────
export async function saveSecret(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const s = await requireSession();
  const name = str(form, "name"), value = String(form.get("value") ?? "");
  const allowed = new Set(
    (await loadRequirements(s)).filter((r) => r.check.startsWith("secret:")).map((r) => r.check.slice(7)),
  );
  allowed.add("DATAFORSEO_PASSWORD"); // пара к DATAFORSEO_LOGIN
  if (!allowed.has(name)) return { ok: false, message: "Этот ключ не из списка требований" };
  if (!value.trim()) return { ok: false, message: "Пустое значение" };
  if (config.localMode) return { ok: false, message: "В локальном режиме ключи не сохраняются" };
  try {
    await new GitHubSource(s.token).putSecret(name, value.trim());
    await sourceFor(s.token).commit([PATHS.systemLog], (cur) => [{
      path: PATHS.systemLog,
      content: (cur[PATHS.systemLog] || "") + logLine(s.login, `секрет ${name} задан (значение не записывается)`, "GitHub Actions secrets"),
    }], `система: секрет ${name} задан (интерфейс, @${s.login})`);
  } catch (e) {
    const msg = (e as Error).message;
    return { ok: false, message: msg.includes("403") || msg.includes("404")
      ? "Нет прав: секреты может менять только администратор репозитория" : msg };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: `${name} сохранён в секретах репозитория` };
}

// ── новый клиент: папка по шаблону + client.yaml из анкеты ─
export async function createClient(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const s = await requireSession();
  const name = str(form, "name").toLowerCase();
  const domain = str(form, "domain");
  const lines = (k: string) => str(form, k).split("\n").map((x) => x.trim()).filter(Boolean);
  if (!CLIENT_NAME.test(name)) return { ok: false, message: "Имя папки: латиница, цифры и дефис, 2–41 символ" };
  if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\/?$/.test(domain)) return { ok: false, message: "Домен вида https://example.uz/" };
  const languages = form.getAll("languages").map(String);
  if (!languages.length) return { ok: false, message: "Выберите хотя бы один язык" };
  const services = lines("services");
  if (!services.length) return { ok: false, message: "Перечислите услуги или товары — по одной в строке" };
  const src = sourceFor(s.token);
  try {
    if ((await src.list("clients")).some((i) => i.name === name)) return { ok: false, message: "Такая папка уже есть" };
    const template = await src.listTree("clients/_template/");
    await src.commit([...template, PATHS.log(name)], (cur) => {
      const out = template.map((p) => ({ path: p.replace("clients/_template/", `clients/${name}/`), content: cur[p] ?? "" }));
      const card = out.find((f) => f.path === PATHS.card(name));
      if (!card) throw new Error("в шаблоне нет client.yaml");
      const doc = parseDocument(card.content); // сохраняем комментарии шаблона
      const set = (k: string, v: unknown) => doc.set(k, v);
      set("name", str(form, "title") || name);
      set("domain", domain);
      set("cms", str(form, "cms") || "custom");
      set("region", str(form, "region") || "Tashkent, Uzbekistan");
      set("languages", languages);
      set("services", services);
      set("key_urls", lines("key_urls"));
      set("competitors", lines("competitors"));
      set("gsc_site", str(form, "gsc_site"));
      set("brand_tone", str(form, "brand_tone"));
      set("forbidden_claims", lines("forbidden_claims"));
      set("started", today());
      card.content = String(doc);
      parse(card.content); // проверка, что YAML читается
      out.push({ path: PATHS.log(name), content: logLine(s.login, "клиент создан из интерфейса; дальше — /new-client " + name, `clients/${name}/`) });
      return out;
    }, `${name}: новый клиент из интерфейса (@${s.login})`);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  revalidatePath("/", "layout");
  redirect(`/setup?client=${name}&created=1`);
}
