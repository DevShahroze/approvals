import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { runDiscovery } from "@/lib/jobs/discovery";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request) {
  try {
    const { user, profile } = await getRequestProfile(request);
    const rl = rateLimit(`discover:${user.uid}`, { limit: 10, windowMs: 600000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const results = await runDiscovery(profile._id, body.filters || {});
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
