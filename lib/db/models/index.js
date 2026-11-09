import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    company: String,
    title: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: { type: Boolean, default: false },
    description: String,
    highlights: [String],
  },
  { _id: true }
);

const educationSchema = new mongoose.Schema(
  {
    institution: String,
    degree: String,
    field: String,
    startDate: Date,
    endDate: Date,
    description: String,
  },
  { _id: true }
);

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"], default: "advanced" },
    years: Number,
    verified: { type: Boolean, default: true },
  },
  { _id: true }
);

const userProfileSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: String,
    personal: {
      firstName: String,
      lastName: String,
      headline: String,
      summary: String,
    },
    contact: {
      phone: String,
      city: String,
      country: String,
      linkedIn: String,
      website: String,
    },
    education: [educationSchema],
    experience: [experienceSchema],
    skills: [skillSchema],
    projects: [
      {
        name: String,
        description: String,
        url: String,
        technologies: [String],
      },
    ],
    achievements: [String],
    publications: [
      {
        title: String,
        publisher: String,
        year: Number,
        url: String,
        description: String,
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        year: Number,
        url: String,
      },
    ],
    preferences: {
      coverLetterTone: { type: String, default: "professional" },
      salaryMin: Number,
      salaryCurrency: { type: String, default: "USD" },
      workAuthorization: String,
      relocationWilling: { type: Boolean, default: false },
      visaSponsorshipNeeded: { type: Boolean, default: false },
      remotePreference: {
        type: String,
        enum: ["remote", "hybrid", "onsite", "any"],
        default: "any",
      },
    },
    masterCvDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    verifiedAt: Date,
  },
  { timestamps: true }
);

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile", required: true, index: true },
    type: {
      type: String,
      enum: ["cv", "cover_letter", "other"],
      required: true,
    },
    title: String,
    storagePath: String,
    mimeType: String,
    sizeBytes: Number,
    parsedText: String,
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    version: { type: Number, default: 1 },
    parentDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    isMaster: { type: Boolean, default: false },
    generatedFromProfileSnapshot: mongoose.Schema.Types.Mixed,
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, type: 1, version: -1 });

const jobSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true },
    source: {
      type: String,
      enum: [
        "greenhouse",
        "lever",
        "ashby",
        "linkedin",
        "indeed",
        "glassdoor",
        "wellfound",
        "career_page",
        "manual",
      ],
      required: true,
    },
    url: { type: String, required: true },
    title: String,
    company: String,
    location: String,
    workArrangement: { type: String, enum: ["remote", "hybrid", "onsite", "unknown"], default: "unknown" },
    descriptionHtml: String,
    descriptionText: String,
    salaryMin: Number,
    salaryMax: Number,
    salaryCurrency: String,
    seniority: String,
    skillsExtracted: [String],
    relocationOffered: Boolean,
    visaSponsorship: Boolean,
    status: { type: String, enum: ["active", "expired", "duplicate"], default: "active", index: true },
    discoveredAt: { type: Date, default: Date.now },
    lastCheckedAt: Date,
    raw: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

jobSchema.index({ source: 1, externalId: 1 }, { unique: true });
jobSchema.index({ title: "text", company: "text", descriptionText: "text" });

const jobMatchSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    score: { type: Number, min: 0, max: 100, required: true },
    breakdown: {
      technicalSkills: Number,
      experience: Number,
      seniority: Number,
      responsibilities: Number,
      location: Number,
      education: Number,
    },
    matchingSkills: [String],
    missingSkills: [String],
    suitabilityExplanation: String,
    eligibilityIssues: [String],
    analyzedAt: { type: Date, default: Date.now },
    claudeAnalysisId: String,
    cachedDescriptionHash: String,
  },
  { timestamps: true }
);

jobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });
jobMatchSchema.index({ userId: 1, score: -1 });

const applicationAnswerSchema = new mongoose.Schema(
  {
    questionKey: String,
    questionText: String,
    answerText: String,
    requiresHumanInput: { type: Boolean, default: false },
    source: { type: String, enum: ["ai", "profile", "manual"], default: "manual" },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    status: {
      type: String,
      enum: [
        "draft",
        "prepared",
        "awaiting_approval",
        "approved",
        "submitting",
        "submitted",
        "failed",
        "needs_human",
        "interview",
        "rejected",
        "withdrawn",
      ],
      default: "draft",
      index: true,
    },
    cvDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    coverLetterDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    answers: [applicationAnswerSchema],
    formPayload: mongoose.Schema.Types.Mixed,
    payloadHash: String,
    screenshots: [String],
    submittedAt: Date,
    submissionVerifiedAt: Date,
    submissionReference: String,
    timeline: [
      {
        at: { type: Date, default: Date.now },
        status: String,
        message: String,
      },
    ],
    lastError: String,
  },
  { timestamps: true }
);

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const approvalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile", required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, unique: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "invalidated"],
      default: "pending",
      index: true,
    },
    boundDocumentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
    boundPayloadHash: { type: String, required: true },
    boundAnswersSnapshot: mongoose.Schema.Types.Mixed,
    approvedAt: Date,
    rejectedAt: Date,
    invalidatedAt: Date,
    invalidationReason: String,
    note: String,
  },
  { timestamps: true }
);

const browserSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile", index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    status: {
      type: String,
      enum: ["active", "paused", "closed", "failed", "needs_human"],
      default: "active",
    },
    adapter: String,
    storageStatePath: String,
    lastUrl: String,
    screenshots: [String],
    error: String,
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
  },
  { timestamps: true }
);

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile", index: true },
    type: {
      type: String,
      enum: [
        "auth",
        "discovery",
        "match",
        "ai",
        "document",
        "application",
        "approval",
        "worker",
        "cron",
        "security",
        "system",
      ],
      default: "system",
    },
    message: String,
    metadata: mongoose.Schema.Types.Mixed,
    tokenUsage: {
      inputTokens: Number,
      outputTokens: Number,
      model: String,
      estimatedCostUsd: Number,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

const automationSettingsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile", required: true, unique: true },
    minMatchScore: { type: Number, default: 60, min: 0, max: 100 },
    matchingWeights: {
      technicalSkills: { type: Number, default: 0.3 },
      experience: { type: Number, default: 0.25 },
      seniority: { type: Number, default: 0.15 },
      responsibilities: { type: Number, default: 0.15 },
      location: { type: Number, default: 0.1 },
      education: { type: Number, default: 0.05 },
    },
    discoverySchedule: {
      type: String,
      enum: ["off", "hourly", "daily"],
      default: "daily",
    },
    expireJobsSchedule: {
      type: String,
      enum: ["off", "hourly", "daily"],
      default: "daily",
    },
    enabledProviders: {
      greenhouse: { type: Boolean, default: false },
      lever: { type: Boolean, default: false },
      ashby: { type: Boolean, default: false },
      linkedin: { type: Boolean, default: false },
      indeed: { type: Boolean, default: false },
      glassdoor: { type: Boolean, default: false },
      wellfound: { type: Boolean, default: false },
      career_page: { type: Boolean, default: true },
    },
    providerCredentials: mongoose.Schema.Types.Mixed,
    aiDailyBudgetUsd: { type: Number, default: 5 },
  },
  { timestamps: true }
);

const workerJobSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["discovery", "prepare_application", "submit_application", "check_expired"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "needs_human"],
      default: "pending",
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile" },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    payload: mongoose.Schema.Types.Mixed,
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: String,
    scheduledFor: Date,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

workerJobSchema.index({ status: 1, type: 1, createdAt: 1 });

const cronExecutionSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      enum: ["discovery", "expire_jobs"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["running", "completed", "failed", "skipped"],
      required: true,
      index: true,
    },
    trigger: {
      type: String,
      enum: ["external", "manual"],
      default: "external",
    },
    scheduleHint: { type: String, enum: ["hourly", "daily", null], default: null },
    idempotencyKey: { type: String, index: true, sparse: true },
    skippedReason: String,
    result: mongoose.Schema.Types.Mixed,
    error: String,
    startedAt: { type: Date, default: Date.now, index: true },
    completedAt: Date,
    durationMs: Number,
    lockExpiresAt: Date,
  },
  { timestamps: true }
);

cronExecutionSchema.index({ task: 1, createdAt: -1 });

export const UserProfile =
  mongoose.models.UserProfile || mongoose.model("UserProfile", userProfileSchema);
export const Document = mongoose.models.Document || mongoose.model("Document", documentSchema);
export const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
export const JobMatch = mongoose.models.JobMatch || mongoose.model("JobMatch", jobMatchSchema);
export const Application =
  mongoose.models.Application || mongoose.model("Application", applicationSchema);
export const Approval = mongoose.models.Approval || mongoose.model("Approval", approvalSchema);
export const BrowserSession =
  mongoose.models.BrowserSession || mongoose.model("BrowserSession", browserSessionSchema);
export const ActivityLog =
  mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
export const AutomationSettings =
  mongoose.models.AutomationSettings || mongoose.model("AutomationSettings", automationSettingsSchema);
export const WorkerJob =
  mongoose.models.WorkerJob || mongoose.model("WorkerJob", workerJobSchema);
export const CronExecution =
  mongoose.models.CronExecution || mongoose.model("CronExecution", cronExecutionSchema);

export const DEFAULT_SEED_PROFILE = {
  personal: {
    firstName: "Shahroze",
    lastName: "Ali",
    headline: "Principal Software Engineer — Full-Stack & Architecture",
    summary:
      "Seven years of software engineering experience with healthcare SaaS, full-stack delivery, and software architecture.",
  },
  education: [
    {
      institution: "GCU Lahore",
      degree: "BSCS",
      field: "Computer Science",
    },
    {
      institution: "FAST Lahore",
      degree: "MCS",
      field: "Computer Science",
    },
  ],
  experience: [
    {
      company: "Ethizo",
      title: "Principal Software Engineer",
      current: true,
      description: "Healthcare SaaS engineering leadership and full-stack development.",
      highlights: [],
    },
  ],
  skills: [
    { name: "JavaScript", level: "expert", years: 7, verified: true },
    { name: "TypeScript", level: "advanced", years: 5, verified: true },
    { name: "React", level: "expert", years: 6, verified: true },
    { name: "Redux", level: "advanced", years: 5, verified: true },
    { name: "Angular", level: "advanced", years: 4, verified: true },
    { name: "PHP", level: "advanced", years: 5, verified: true },
    { name: "CakePHP", level: "intermediate", years: 3, verified: true },
  ],
  publications: [
    {
      title: "COVID-19 diagnosis research using chest X-ray and CT images",
      description: "Published research involving medical imaging and diagnosis.",
    },
  ],
};
