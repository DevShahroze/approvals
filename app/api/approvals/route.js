import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Approval } from "@/lib/db/models";
import { paginate } from "@/lib/utils";

export async function GET(request) {
  try {
    const { profile } = await getRequestProfile(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const page = Number(searchParams.get("page") || 1);

    const query = Approval.find({ userId: profile._id, status })
      .populate("jobId")
      .populate("applicationId")
      .sort({ createdAt: -1 });

    const [approvals, total] = await Promise.all([
      paginate(query, { page, limit: 20 }),
      Approval.countDocuments({ userId: profile._id, status }),
    ]);

    return NextResponse.json({ approvals, total });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
