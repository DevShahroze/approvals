import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { verifyCronSecret } from "@/lib/cron/auth";
import { beginCronTask, finishCronTask } from "@/lib/cron/lock";
import { executeDiscoveryCron, shouldRunForSchedule } from "@/lib/cron/tasks";

export async function POST(request) {
  const auth = verifyCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(request.url);
  const schedule = searchParams.get("schedule") || "daily";
  if (!["hourly", "daily"].includes(schedule)) {
    return NextResponse.json({ error: "schedule must be hourly or daily" }, { status: 400 });
  }

  const idempotencyKey = request.headers.get("x-idempotency-key") || searchParams.get("idempotencyKey");

  const scheduleCheck = await shouldRunForSchedule("discovery", schedule);
  if (!scheduleCheck.run) {
    const { CronExecution } = await import("@/lib/db/models");
    await CronExecution.create({
      task: "discovery",
      status: "skipped",
      trigger: "external",
      scheduleHint: schedule,
      idempotencyKey: idempotencyKey || undefined,
      skippedReason: "no_profiles_for_schedule",
      completedAt: new Date(),
      durationMs: 0,
    });
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "no_profiles_for_schedule",
      schedule,
    });
  }

  const begun = await beginCronTask("discovery", { idempotencyKey, trigger: "external" });
  if (!begun.ok) {
    return NextResponse.json(
      {
        ok: false,
        skipped: true,
        reason: begun.reason,
        executionId: begun.execution?._id,
      },
      { status: begun.reason === "overlap" ? 409 : 200 }
    );
  }

  const { execution } = begun;
  execution.scheduleHint = schedule;
  await execution.save();

  try {
    const result = await executeDiscoveryCron(schedule);
    await finishCronTask(execution, { status: "completed", result: { ...result, schedule } });
    return NextResponse.json({ ok: true, executionId: execution._id, result });
  } catch (err) {
    await finishCronTask(execution, { status: "failed", error: err.message });
    return NextResponse.json({ ok: false, error: err.message, executionId: execution._id }, { status: 500 });
  }
}
