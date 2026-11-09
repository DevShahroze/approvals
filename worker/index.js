import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { chromium } from "playwright";
import { connectWorkerDB } from "./db.js";
import { resolveAdapter, prepareWithAdapter, submitWithAdapter } from "./adapters/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const workerJobSchema = new mongoose.Schema(
  {
    type: String,
    status: String,
    userId: mongoose.Schema.Types.ObjectId,
    applicationId: mongoose.Schema.Types.ObjectId,
    payload: mongoose.Schema.Types.Mixed,
    attempts: Number,
    maxAttempts: Number,
    lastError: String,
  },
  { collection: "workerjobs", timestamps: true }
);

const applicationSchema = new mongoose.Schema({}, { strict: false, collection: "applications" });
const approvalSchema = new mongoose.Schema({}, { strict: false, collection: "approvals" });
const jobSchema = new mongoose.Schema({}, { strict: false, collection: "jobs" });
const profileSchema = new mongoose.Schema({}, { strict: false, collection: "userprofiles" });
const browserSessionSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    applicationId: mongoose.Schema.Types.ObjectId,
    jobId: mongoose.Schema.Types.ObjectId,
    status: String,
    adapter: String,
    lastUrl: String,
    screenshots: [String],
    error: String,
    startedAt: Date,
    endedAt: Date,
  },
  { collection: "browsersessions", timestamps: true }
);

const WorkerJob = mongoose.models.WorkerJobWorker || mongoose.model("WorkerJobWorker", workerJobSchema);
const Application = mongoose.models.ApplicationWorker || mongoose.model("ApplicationWorker", applicationSchema);
const Approval = mongoose.models.ApprovalWorker || mongoose.model("ApprovalWorker", approvalSchema);
const Job = mongoose.models.JobWorker || mongoose.model("JobWorker", jobSchema);
const UserProfile = mongoose.models.UserProfileWorker || mongoose.model("UserProfileWorker", profileSchema);
const BrowserSession =
  mongoose.models.BrowserSessionWorker || mongoose.model("BrowserSessionWorker", browserSessionSchema);

async function processPrepareApplication(workerJob) {
  const application = await Application.findById(workerJob.applicationId);
  if (!application) throw new Error("Application not found");
  const [job, profile] = await Promise.all([
    Job.findById(application.jobId),
    UserProfile.findById(application.userId),
  ]);
  if (!job || !profile) throw new Error("Missing job or profile");

  const adapter = resolveAdapter(job);
  const session = await BrowserSession.create({
    userId: profile._id,
    applicationId: application._id,
    jobId: job._id,
    status: "active",
    adapter,
    startedAt: new Date(),
  });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const result = await prepareWithAdapter(adapter, page, application, profile, job);
    const screenshot = await page.screenshot({ fullPage: true });
    const screenshotPath = `screenshots/${session._id}.png`;
    session.lastUrl = page.url();
    session.screenshots = [screenshotPath];

    if (result.needs_human) {
      session.status = "needs_human";
      session.error = result.reason;
      application.status = "needs_human";
      application.lastError = result.reason;
      application.timeline = application.timeline || [];
      application.timeline.push({
        at: new Date(),
        status: "needs_human",
        message: result.reason,
      });
    } else {
      application.status = "prepared";
      application.timeline = application.timeline || [];
      application.timeline.push({
        at: new Date(),
        status: "prepared",
        message: `Browser form prepared via ${adapter}`,
      });
    }

    await session.save();
    await application.save();
  } finally {
    await browser.close();
    session.endedAt = new Date();
    if (session.status === "active") session.status = "closed";
    await session.save();
  }
}

async function processSubmitApplication(workerJob) {
  const application = await Application.findById(workerJob.applicationId);
  const approval = await Approval.findOne({ applicationId: application._id });

  if (!approval || approval.status !== "approved") {
    throw new Error("Submit blocked: no approved approval");
  }
  if (approval.boundPayloadHash !== application.payloadHash) {
    approval.status = "invalidated";
    approval.invalidationReason = "Payload changed";
    await approval.save();
    throw new Error("Submit blocked: approval invalidated");
  }

  const submitted = await Application.findOne({
    userId: application.userId,
    jobId: application.jobId,
    status: "submitted",
    _id: { $ne: application._id },
  });
  if (submitted) {
    throw new Error("Duplicate submission prevented");
  }

  const [job, profile] = await Promise.all([
    Job.findById(application.jobId),
    UserProfile.findById(application.userId),
  ]);

  const adapter = resolveAdapter(job);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await prepareWithAdapter(adapter, page, application, profile, job);
    const submitState = await submitWithAdapter(adapter, page);

    if (submitState.needs_human) {
      application.status = "needs_human";
      application.lastError = submitState.reason;
    } else if (submitState.readyToClick) {
      await page.locator('button[type="submit"], input[type="submit"]').first().click();
      await page.waitForTimeout(3000);
      application.status = "submitted";
      application.submittedAt = new Date();
      application.submissionVerifiedAt = new Date();
      application.timeline = application.timeline || [];
      application.timeline.push({
        at: new Date(),
        status: "submitted",
        message: "Submitted after explicit approval",
      });
    }
    await application.save();
  } finally {
    await browser.close();
  }
}

async function pollJobs() {
  const job = await WorkerJob.findOneAndUpdate(
    { status: "pending" },
    { status: "processing", startedAt: new Date(), $inc: { attempts: 1 } },
    { sort: { createdAt: 1 }, new: true }
  );

  if (!job) return;

  try {
    if (job.type === "prepare_application") await processPrepareApplication(job);
    else if (job.type === "submit_application") await processSubmitApplication(job);
    else {
      throw new Error(`Worker does not process job type: ${job.type}. Use /api/cron/* for scheduled tasks.`);
    }

    job.status = "completed";
    job.completedAt = new Date();
    await job.save();
  } catch (err) {
    job.lastError = err.message;
    if (job.attempts < (job.maxAttempts || 3)) {
      job.status = "pending";
    } else {
      job.status = "failed";
    }
    await job.save();
    console.error("Worker job failed", job._id, err.message);
  }
}

async function main() {
  await connectWorkerDB();
  console.log("Worker started");

  setInterval(() => {
    pollJobs().catch((e) => console.error(e));
  }, 5000);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
