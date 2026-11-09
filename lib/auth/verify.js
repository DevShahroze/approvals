import { getAdminAuth } from "@/lib/firebase/admin";
import { getEnv } from "@/lib/env";
import { cookies } from "next/headers";

export async function verifyBearerToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return null;
  }
  return verifyIdToken(token);
}

export async function verifyIdToken(idToken) {
  const env = getEnv();
  if (env.DEV_BYPASS_AUTH === "true" && env.NODE_ENV === "development") {
    return {
      uid: "dev-user",
      email: "dev@local.test",
    };
  }

  const auth = getAdminAuth();
  if (!auth) {
    throw new Error("Firebase Admin is not configured");
  }

  const decoded = await auth.verifyIdToken(idToken);

  const allowed = env.ALLOWED_FIREBASE_UIDS;
  if (allowed) {
    const list = allowed.split(",").map((s) => s.trim());
    if (!list.includes(decoded.uid)) {
      throw new Error("Unauthorized user");
    }
  }

  return decoded;
}

export async function verifySessionCookie() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) {
    return null;
  }

  const env = getEnv();
  if (
    env.DEV_BYPASS_AUTH === "true" &&
    env.NODE_ENV === "development" &&
    session === "dev-session"
  ) {
    return { uid: "dev-user", email: "dev@local.test" };
  }

  const auth = getAdminAuth();
  if (!auth) {
    return null;
  }

  try {
    return await auth.verifySessionCookie(session, true);
  } catch {
    return null;
  }
}

export async function requireUser(request) {
  const fromBearer = await verifyBearerToken(request);
  if (fromBearer) {
    return fromBearer;
  }
  const fromCookie = await verifySessionCookie();
  if (fromCookie) {
    return fromCookie;
  }
  throw new Error("Unauthorized");
}
