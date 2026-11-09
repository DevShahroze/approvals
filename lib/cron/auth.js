import { createHash, timingSafeEqual } from "crypto";

export function verifyCronSecret(request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return { ok: false, error: "CRON_SECRET is not configured" };
  }

  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    request.headers.get("x-cron-secret");

  if (!header) {
    return { ok: false, error: "Missing cron secret" };
  }

  const a = createHash("sha256").update(header).digest();
  const b = createHash("sha256").update(expected).digest();
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "Invalid cron secret" };
  }

  return { ok: true };
}
