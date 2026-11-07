import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { setSession } from "@/lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (e: string) => NextResponse.redirect(new URL(`/login?error=${e}`, url.origin));
  const jar = await cookies();
  const state = jar.get("sa_oauth_state")?.value;
  jar.delete("sa_oauth_state");
  if (!state || state !== url.searchParams.get("state")) return fail("state");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId, client_secret: config.clientSecret,
      code: url.searchParams.get("code"), redirect_uri: `${url.origin}/api/auth/callback`,
    }),
  });
  const token = ((await tokenRes.json()) as { access_token?: string }).access_token;
  if (!token) return fail("github");

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  const login = userRes.ok ? ((await userRes.json()) as { login?: string }).login : undefined;
  if (!login) return fail("github");
  if (!config.allowedUsers.includes(login.toLowerCase())) return fail("denied");

  await setSession(login, token);
  return NextResponse.redirect(new URL("/", url.origin));
}
