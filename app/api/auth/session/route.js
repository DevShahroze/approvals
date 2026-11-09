import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getEnv } from "@/lib/env";

const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const env = getEnv();

  if (body.dev && env.DEV_BYPASS_AUTH === "true" && env.NODE_ENV === "development") {
    const response = NextResponse.json({ ok: true, dev: true });
    response.cookies.set("session", "dev-session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return response;
  }

  const auth = getAdminAuth();
  if (!auth || !body.idToken) {
    return NextResponse.json({ error: "Invalid session request" }, { status: 400 });
  }

  const expiresIn = SESSION_MAX_AGE * 1000;
  const sessionCookie = await auth.createSessionCookie(body.idToken, { expiresIn });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", "", { maxAge: 0, path: "/" });
  return response;
}
