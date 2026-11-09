import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { BrowserSession } from "@/lib/db/models";
import { paginate } from "@/lib/utils";

export async function GET(request) {
  try {
    const { profile } = await getRequestProfile(request);
    const page = Number(new URL(request.url).searchParams.get("page") || 1);
    const query = BrowserSession.find({ userId: profile._id }).sort({ createdAt: -1 });
    const [sessions, total] = await Promise.all([
      paginate(query, { page, limit: 20 }),
      BrowserSession.countDocuments({ userId: profile._id }),
    ]);
    return NextResponse.json({ sessions, total });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
