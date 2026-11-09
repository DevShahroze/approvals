import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Job, JobMatch, Approval, Application, AutomationSettings } from "@/lib/db/models";

export async function GET(request) {
  try {
    const { profile } = await getRequestProfile(request);
    const settings = await AutomationSettings.findOne({ userId: profile._id });
    const minScore = settings?.minMatchScore ?? 60;

    const [totalJobs, matchingJobs, pendingApprovals, submitted, interviews, rejections] = await Promise.all([
      Job.countDocuments({ status: "active" }),
      JobMatch.countDocuments({ userId: profile._id, score: { $gte: minScore } }),
      Approval.countDocuments({ userId: profile._id, status: "pending" }),
      Application.countDocuments({ userId: profile._id, status: "submitted" }),
      Application.countDocuments({ userId: profile._id, status: "interview" }),
      Application.countDocuments({ userId: profile._id, status: "rejected" }),
    ]);

    const successRate =
      submitted > 0 ? Math.round(((interviews + submitted) / Math.max(submitted + rejections, 1)) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalJobs,
        matchingJobs,
        pendingApprovals,
        submitted,
        interviews,
        rejections,
        successRate,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
