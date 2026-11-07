// Доступ к файлам репозитория: через GitHub API (production) или с диска (локальная разработка).
import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "./config";

export type FileChange = { path: string; content: string };
/** Получает текущее содержимое нужных файлов (null — файла нет) и возвращает изменения. */
export type Mutation = (current: Record<string, string | null>) => FileChange[] | Promise<FileChange[]>;

export interface RepoSource {
  read(p: string): Promise<string | null>;
  list(dir: string): Promise<{ name: string; type: "file" | "dir" }[]>;
  listTree(prefix: string): Promise<string[]>;
  /** Имена секретов GitHub Actions; null — нет прав или недоступно. */
  secretNames(): Promise<string[] | null>;
  /** Атомарно: прочитать paths, применить mutate, одним коммитом записать (повтор при гонке). */
  commit(paths: string[], mutate: Mutation, message: string): Promise<string>;
}

// ── GitHub ───────────────────────────────────────────────
const cache = new Map<string, { at: number; value: unknown }>();
const TTL_MS = 30_000;

class GitHubError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

export class GitHubSource implements RepoSource {
  constructor(private token: string) {}

  private async api<T>(url: string, init: RequestInit = {}, cacheable = false): Promise<T> {
    const key = `${this.token.slice(-6)}:${url}`;
    const hit = cacheable ? cache.get(key) : undefined;
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
    const r = await fetch(`https://api.github.com${url}`, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.headers || {}),
      },
    });
    if (!r.ok) throw new GitHubError(r.status, `GitHub ${r.status} ${url}: ${(await r.text()).slice(0, 200)}`);
    const value = r.status === 204 ? (null as T) : ((await r.json()) as T);
    if (cacheable) cache.set(key, { at: Date.now(), value });
    return value;
  }

  private repo = `/repos/${config.repo}`;

  async read(p: string, ref = config.branch): Promise<string | null> {
    try {
      const f = await this.api<{ content: string; encoding: string }>(
        `${this.repo}/contents/${encodeURI(p)}?ref=${ref}`, {}, ref === config.branch);
      return Buffer.from(f.content, "base64").toString("utf8");
    } catch (e) {
      if (e instanceof GitHubError && e.status === 404) return null;
      throw e;
    }
  }

  async list(dir: string) {
    try {
      const items = await this.api<{ name: string; type: string }[]>(
        `${this.repo}/contents/${encodeURI(dir)}?ref=${config.branch}`, {}, true);
      return items.map((i) => ({ name: i.name, type: i.type === "dir" ? "dir" as const : "file" as const }));
    } catch (e) {
      if (e instanceof GitHubError && e.status === 404) return [];
      throw e;
    }
  }

  async listTree(prefix: string) {
    const t = await this.api<{ tree: { path: string; type: string }[] }>(
      `${this.repo}/git/trees/${config.branch}?recursive=1`, {}, true);
    return t.tree.filter((e) => e.type === "blob" && e.path.startsWith(prefix)).map((e) => e.path);
  }

  async secretNames() {
    try {
      const r = await this.api<{ secrets: { name: string }[] }>(`${this.repo}/actions/secrets?per_page=100`, {}, true);
      return r.secrets.map((s) => s.name);
    } catch {
      return null; // нет прав администратора репозитория — статус берём из отметок
    }
  }

  async putSecret(name: string, value: string): Promise<void> {
    const sodium = (await import("libsodium-wrappers")).default;
    await sodium.ready;
    const pk = await this.api<{ key: string; key_id: string }>(`${this.repo}/actions/secrets/public-key`);
    const sealed = sodium.crypto_box_seal(
      sodium.from_string(value), sodium.from_base64(pk.key, sodium.base64_variants.ORIGINAL));
    await this.api(`${this.repo}/actions/secrets/${name}`, {
      method: "PUT",
      body: JSON.stringify({ encrypted_value: sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL), key_id: pk.key_id }),
    });
    cache.clear();
  }

  async commit(paths: string[], mutate: Mutation, message: string): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const ref = await this.api<{ object: { sha: string } }>(`${this.repo}/git/ref/heads/${config.branch}`);
      const head = ref.object.sha;
      const base = await this.api<{ tree: { sha: string } }>(`${this.repo}/git/commits/${head}`);
      const current: Record<string, string | null> = {};
      for (const p of paths) current[p] = await this.read(p, head);
      const changes = await mutate(current);
      if (!changes.length) return head;
      const tree = await this.api<{ sha: string }>(`${this.repo}/git/trees`, {
        method: "POST",
        body: JSON.stringify({
          base_tree: base.tree.sha,
          tree: changes.map((c) => ({ path: c.path, mode: "100644", type: "blob", content: c.content })),
        }),
      });
      const commit = await this.api<{ sha: string }>(`${this.repo}/git/commits`, {
        method: "POST", body: JSON.stringify({ message, tree: tree.sha, parents: [head] }),
      });
      try {
        await this.api(`${this.repo}/git/refs/heads/${config.branch}`, {
          method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }),
        });
        cache.clear();
        return commit.sha;
      } catch (e) {
        if (!(e instanceof GitHubError && e.status === 422)) throw e; // ветка ушла вперёд — повторить
      }
    }
    throw new Error("Не удалось записать: ветка меняется слишком часто, попробуйте ещё раз");
  }
}

// ── Локально (разработка) ────────────────────────────────
export class LocalSource implements RepoSource {
  private root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), config.localRepoPath);
  private abs(p: string) {
    const a = path.resolve(this.root, p);
    if (!a.startsWith(this.root)) throw new Error("путь вне репозитория");
    return a;
  }
  async read(p: string) {
    try { return await fs.readFile(this.abs(p), "utf8"); } catch { return null; }
  }
  async list(dir: string) {
    try {
      const items = await fs.readdir(this.abs(dir), { withFileTypes: true });
      return items.map((i) => ({ name: i.name, type: i.isDirectory() ? "dir" as const : "file" as const }));
    } catch { return []; }
  }
  async listTree(prefix: string) {
    const out: string[] = [];
    const walk = async (rel: string) => {
      for (const i of await this.list(rel)) {
        const p = `${rel}/${i.name}`;
        if (i.type === "dir") await walk(p); else out.push(p);
      }
    };
    await walk(prefix.replace(/\/$/, ""));
    return out;
  }
  async secretNames() { return null; }
  async commit(paths: string[], mutate: Mutation) {
    const current: Record<string, string | null> = {};
    for (const p of paths) current[p] = await this.read(p);
    for (const c of await mutate(current)) {
      await fs.mkdir(path.dirname(this.abs(c.path)), { recursive: true });
      await fs.writeFile(this.abs(c.path), c.content, "utf8");
    }
    return "local";
  }
}

export function sourceFor(token: string): RepoSource {
  return config.localMode ? new LocalSource() : new GitHubSource(token);
}
