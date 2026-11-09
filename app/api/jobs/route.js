import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Job } from "@/lib/db/models";
import { paginate } from "@/lib/utils";

export async function GET(request) {
  try {
    await getRequestProfile(request);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const q = searchParams.get("q");
    const status = searchParams.get("status") || "active";

    const filter = { status };
    if (q) {
      filter.$text = { $search: q };
    }

    const query = Job.find(filter).sort({ createdAt: -1 });
    const [jobs, total] = await Promise.all([paginate(query, { page, limit }), Job.countDocuments(filter)]);

    return NextResponse.json({ jobs, total, page, limit });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.message === "Unauthorized" ? 401 : 400 });
  }
}
