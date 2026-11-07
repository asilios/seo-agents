// Сессия — зашифрованная cookie (AES-256-GCM, ключ из AUTH_SECRET). Внутри: логин GitHub и токен.
import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "./config";

export type Session = { login: string; token: string; exp: number };

const COOKIE = "sa_session";
const MAX_AGE_S = 7 * 24 * 3600;

function key(): Buffer {
  if (config.authSecret.length < 32) throw new Error("AUTH_SECRET не задан или короче 32 символов");
  return createHash("sha256").update(config.authSecret).digest();
}

export function seal(data: object): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(JSON.stringify(data), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64url");
}

export function unseal<T>(value: string): T | null {
  try {
    const raw = Buffer.from(value, "base64url");
    const d = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  if (config.localMode) return { login: "local-dev", token: "", exp: Date.now() + 3600_000 };
  const v = (await cookies()).get(COOKIE)?.value;
  const s = v ? unseal<Session>(v) : null;
  if (!s || s.exp < Date.now() || !config.allowedUsers.includes(s.login.toLowerCase())) return null;
  return s;
}

/** Для страниц и server actions: без сессии — на вход. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function setSession(login: string, token: string): Promise<void> {
  (await cookies()).set(COOKIE, seal({ login, token, exp: Date.now() + MAX_AGE_S * 1000 }), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: MAX_AGE_S,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
