import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Application } from "@/lib/db/models";
import { paginate } from "@/lib/utils";

export async function GET(request) {
  try {
    const { profile } = await getRequestProfile(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page") || 1);

    const filter = { userId: profile._id };
    if (status) filter.status = status;

    const query = Application.find(filter).populate("jobId").sort({ updatedAt: -1 });
    const [applications, total] = await Promise.all([
      paginate(query, { page, limit: 20 }),
      Application.countDocuments(filter),
    ]);

    return NextResponse.json({ applications, total });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
