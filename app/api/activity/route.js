import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { ActivityLog } from "@/lib/db/models";
import { paginate } from "@/lib/utils";

export async function GET(request) {
  try {
    const { profile } = await getRequestProfile(request);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const type = searchParams.get("type");

    const filter = { userId: profile._id };
    if (type) filter.type = type;

    const query = ActivityLog.find(filter).sort({ createdAt: -1 });
    const [logs, total] = await Promise.all([
      paginate(query, { page, limit: 50 }),
      ActivityLog.countDocuments(filter),
    ]);

    const usage = await ActivityLog.aggregate([
      { $match: { userId: profile._id, type: "ai" } },
      {
        $group: {
          _id: null,
          inputTokens: { $sum: "$tokenUsage.inputTokens" },
          outputTokens: { $sum: "$tokenUsage.outputTokens" },
          costUsd: { $sum: "$tokenUsage.estimatedCostUsd" },
        },
      },
    ]);

    return NextResponse.json({
      logs,
      total,
      aiUsage: usage[0] || { inputTokens: 0, outputTokens: 0, costUsd: 0 },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
