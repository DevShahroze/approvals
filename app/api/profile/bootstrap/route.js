import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { DEFAULT_SEED_PROFILE, ActivityLog } from "@/lib/db/models";
import { getEnv } from "@/lib/env";

export async function POST(request) {
  try {
    const { user, profile } = await getRequestProfile(request);
    const env = getEnv();

    let updated = false;
    if (env.SEED_PROFILE === "true" && !profile.verifiedAt) {
      Object.assign(profile, DEFAULT_SEED_PROFILE);
      profile.verifiedAt = null;
      await profile.save();
      updated = true;
      await ActivityLog.create({
        userId: profile._id,
        type: "system",
        message: "Profile seeded from documented defaults (editable)",
      });
    }

    return NextResponse.json({ profile, seeded: updated, user: { uid: user.uid } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
