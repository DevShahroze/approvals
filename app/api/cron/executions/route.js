import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { CronExecution } from "@/lib/db/models";
import { paginate } from "@/lib/utils";

export async function GET(request) {
  try {
    await getRequestProfile(request);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const task = searchParams.get("task");

    const filter = {};
    if (task) filter.task = task;

    const query = CronExecution.find(filter).sort({ createdAt: -1 });
    const [executions, total] = await Promise.all([
      paginate(query, { page, limit: 50 }),
      CronExecution.countDocuments(filter),
    ]);

    return NextResponse.json({ executions, total, page });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
