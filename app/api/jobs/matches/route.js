import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { JobMatch, AutomationSettings } from "@/lib/db/models";
import { paginate } from "@/lib/utils";

export async function GET(request) {
  try {
    const { profile } = await getRequestProfile(request);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const settings = await AutomationSettings.findOne({ userId: profile._id });
    const min = Number(searchParams.get("minScore") || settings?.minMatchScore || 0);

    const filter = { userId: profile._id, score: { $gte: min } };
    const query = JobMatch.find(filter).populate("jobId").sort({ score: -1 });
    const [matches, total] = await Promise.all([
      paginate(query, { page, limit }),
      JobMatch.countDocuments(filter),
    ]);

    return NextResponse.json({ matches, total, page, limit });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
