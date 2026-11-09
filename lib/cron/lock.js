import { CronExecution } from "@/lib/db/models";

const DEFAULT_LOCK_MS = 20 * 60 * 1000;

export async function beginCronTask(task, { idempotencyKey, trigger = "external", lockMs = DEFAULT_LOCK_MS } = {}) {
  if (idempotencyKey) {
    const prior = await CronExecution.findOne({
      idempotencyKey,
      status: { $in: ["completed", "running"] },
    });
    if (prior) {
      return {
        ok: false,
        skipped: true,
        reason: "duplicate_idempotency_key",
        execution: prior,
      };
    }
  }

  const staleBefore = new Date(Date.now() - lockMs);
  const running = await CronExecution.findOne({
    task,
    status: "running",
    startedAt: { $gt: staleBefore },
  });

  if (running) {
    const skipped = await CronExecution.create({
      task,
      status: "skipped",
      trigger,
      idempotencyKey,
      skippedReason: "overlap",
      result: { overlappingExecutionId: String(running._id) },
      completedAt: new Date(),
      durationMs: 0,
    });
    return { ok: false, skipped: true, reason: "overlap", execution: skipped };
  }

  await CronExecution.updateMany(
    { task, status: "running", startedAt: { $lte: staleBefore } },
    {
      status: "failed",
      error: "Stale run marked failed (lock expired)",
      completedAt: new Date(),
    }
  );

  const execution = await CronExecution.create({
    task,
    status: "running",
    trigger,
    idempotencyKey,
    startedAt: new Date(),
    lockExpiresAt: new Date(Date.now() + lockMs),
  });

  return { ok: true, execution };
}

export async function finishCronTask(execution, { status, result, error }) {
  const completedAt = new Date();
  execution.status = status;
  execution.result = result;
  execution.error = error;
  execution.completedAt = completedAt;
  execution.durationMs = completedAt - new Date(execution.startedAt);
  await execution.save();
  return execution;
}
