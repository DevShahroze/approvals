import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET(request) {
  try {
    const { profile } = await getRequestProfile(request);
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function PUT(request) {
  try {
    const { user, profile } = await getRequestProfile(request);
    const rl = rateLimit(`profile:${user.uid}`, { limit: 30 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const allowed = [
      "personal",
      "contact",
      "education",
      "experience",
      "skills",
      "projects",
      "achievements",
      "publications",
      "certifications",
      "preferences",
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) profile[key] = body[key];
    }
    if (body.markVerified) {
      profile.verifiedAt = new Date();
    }
    await profile.save();
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
