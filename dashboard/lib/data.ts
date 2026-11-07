// Загрузка данных системы из репозитория для экранов.
import "server-only";
import { Ajv2020 } from "ajv/dist/2020.js";
import { config } from "./config";
import type { Session } from "./session";
import { sourceFor, type RepoSource } from "./source";
import {
  loadYaml, parseCsv, readiness, resolveRequirement, sortTasks,
  type Mark, type Requirement, type ResolvedRequirement, type Task,
} from "./status";

export const PATHS = {
  requirements: "core/setup/requirements.yaml",
  systemMarks: "core/setup/status.yaml",
  clientMarks: (c: string) => `clients/${c}/admin/setup.yaml`,
  tasks: (c: string) => `clients/${c}/admin/tasks.yaml`,
  log: (c: string) => `clients/${c}/admin/log.md`,
  systemLog: "core/setup/log.md",
  card: (c: string) => `clients/${c}/client.yaml`,
  schema: (name: string) => `core/schemas/${name}`,
};

export type ClientView = {
  name: string;
  title: string;
  domain: string;
  requirements: ResolvedRequirement[];
  tasks: Task[];
  readiness: ReturnType<typeof readiness>;
  openTasks: { admin: number; owner: number };
};

export type Overview = {
  system: ResolvedRequirement[];
  systemReadiness: ReturnType<typeof readiness>;
  clients: ClientView[];
  secretsVisible: boolean;
};

export async function listClients(src: RepoSource): Promise<string[]> {
  return (await src.list("clients"))
    .filter((i) => i.type === "dir" && !i.name.startsWith("_"))
    .map((i) => i.name)
    .sort();
}

async function loadClient(src: RepoSource, name: string, reqs: Requirement[], secretNames: string[] | null): Promise<ClientView> {
  const [cardText, marksText, tasksText, geoProfile, queries] = await Promise.all([
    src.read(PATHS.card(name)), src.read(PATHS.clientMarks(name)), src.read(PATHS.tasks(name)),
    src.read(`clients/${name}/geo/profile.yaml`), src.read(`clients/${name}/geo/queries.csv`),
  ]);
  const card = loadYaml<Record<string, unknown>>(cardText, {});
  const marks = loadYaml<Record<string, Mark>>(marksText, {});
  const files: Record<string, string | null> = { "geo/profile.yaml": geoProfile, "geo/queries.csv": queries };
  const ctx = {
    secretNames,
    clientYaml: card,
    fileExists: (rel: string) => files[rel] != null,
    yamlFile: (rel: string) => loadYaml<Record<string, unknown> | null>(files[rel] ?? null, null),
    csv: (rel: string) => (files[rel] ? parseCsv(files[rel]!) : null),
  };
  const requirements = reqs.filter((r) => r.scope === "client").map((r) => resolveRequirement(r, marks, ctx));
  const tasks = sortTasks(loadYaml<Task[]>(tasksText, []));
  const open = tasks.filter((t) => t.status === "open");
  return {
    name,
    title: String(card.name || name),
    domain: String(card.domain || ""),
    requirements,
    tasks,
    readiness: readiness(requirements),
    openTasks: { admin: open.filter((t) => t.who === "admin").length, owner: open.filter((t) => t.who === "owner").length },
  };
}

export async function loadOverview(session: Session): Promise<Overview> {
  const src = sourceFor(session.token);
  const [reqText, marksText, secretNames, names] = await Promise.all([
    src.read(PATHS.requirements), src.read(PATHS.systemMarks), src.secretNames(), listClients(src),
  ]);
  const reqs = loadYaml<Requirement[]>(reqText, []);
  const marks = loadYaml<Record<string, Mark>>(marksText, {});
  const system = reqs.filter((r) => r.scope === "system").map((r) => {
    const res = resolveRequirement(r, marks, { secretNames });
    // вход в интерфейс настроен, раз мы здесь и есть GITHUB_CLIENT_ID
    return r.id === "dashboard-oauth" && config.clientId ? { ...res, status: "done" as const, source: "auto" as const } : res;
  });
  const clients = await Promise.all(names.map((n) => loadClient(src, n, reqs, secretNames)));
  return { system, systemReadiness: readiness(system), clients, secretsVisible: secretNames !== null };
}

export async function loadRequirements(session: Session): Promise<Requirement[]> {
  return loadYaml<Requirement[]>(await sourceFor(session.token).read(PATHS.requirements), []);
}

/** Проверка по JSON-схеме из репозитория (те же схемы, что у admin_status.py). */
export async function validateWithSchema(src: RepoSource, schemaFile: string, data: unknown): Promise<string[]> {
  const text = await src.read(PATHS.schema(schemaFile));
  if (!text) return [`нет схемы ${schemaFile}`];
  const ajv = new Ajv2020({ strict: false, validateFormats: false, allErrors: true });
  const validate = ajv.compile(JSON.parse(text));
  if (validate(data)) return [];
  return (validate.errors || []).map((e) => `${e.instancePath || "(корень)"}: ${e.message}`);
}

export async function readDraft(session: Session, path: string): Promise<string | null> {
  if (!/^clients\/[a-z0-9-]+\/[^.][^]*\.(md|txt|csv|yaml)$/.test(path) || path.includes("..")) return null;
  return sourceFor(session.token).read(path);
}
