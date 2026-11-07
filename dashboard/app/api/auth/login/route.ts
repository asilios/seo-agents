import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!config.clientId || !config.clientSecret || config.authSecret.length < 32) {
    return NextResponse.redirect(new URL("/login?error=config", origin));
  }
  const state = randomBytes(16).toString("hex");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", `${origin}/api/auth/callback`);
  // repo — читать и коммитить данные системы, менять секреты репозитория
  url.searchParams.set("scope", "repo read:user");
  url.searchParams.set("state", state);
  const res = NextResponse.redirect(url);
  res.cookies.set("sa_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
