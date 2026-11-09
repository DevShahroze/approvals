import { NextResponse } from "next/server";
import { WorkerJob } from "@/lib/db/models";
import { connectDB } from "@/lib/db/connect";

function verifyWorker(request) {
  const secret = process.env.WORKER_API_SECRET;
  if (!secret) return false;
  return request.headers.get("x-worker-secret") === secret;
}

export async function GET(request) {
  if (!verifyWorker(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const job = await WorkerJob.findOneAndUpdate(
    { status: "pending", scheduledFor: { $lte: new Date() } },
    { status: "processing", startedAt: new Date(), $inc: { attempts: 1 } },
    { sort: { createdAt: 1 }, new: true }
  );

  return NextResponse.json({ job });
}

export async function PATCH(request) {
  if (!verifyWorker(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const body = await request.json();
  const job = await WorkerJob.findById(body.id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  job.status = body.status;
  job.lastError = body.lastError;
  if (body.status === "completed") job.completedAt = new Date();
  if (body.status === "failed" && job.attempts < job.maxAttempts) {
    job.status = "pending";
  }
  await job.save();

  return NextResponse.json({ job });
}
