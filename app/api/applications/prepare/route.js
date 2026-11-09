import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Job, Application, Document, WorkerJob } from "@/lib/db/models";
import { requestApproval, syncApplicationPayloadHash } from "@/lib/approval/service";
import { claudeClient } from "@/lib/claude/client";
import { applicationAnswersSystem, PROMPT_VERSIONS } from "@/lib/claude/prompts";
import { profileSnapshotForDocuments } from "@/lib/documents/generate";

export async function POST(request) {
  try {
    const { profile } = await getRequestProfile(request);
    const body = await request.json();
    const job = await Job.findById(body.jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    let application = await Application.findOne({ userId: profile._id, jobId: job._id });
    if (!application) {
      application = await Application.create({
        userId: profile._id,
        jobId: job._id,
        status: "draft",
        timeline: [{ status: "draft", message: "Application created" }],
      });
    }

    if (body.cvDocumentId) application.cvDocumentId = body.cvDocumentId;
    if (body.coverLetterDocumentId) application.coverLetterDocumentId = body.coverLetterDocumentId;

    let answers = application.answers || [];
    if (body.generateAnswers !== false) {
      if (claudeClient.isConfigured()) {
        const schema =
          '{"answers":[{"questionKey":"string","questionText":"string","answerText":"string","requiresHumanInput":boolean}]}';
        const questions = body.questions || [
          { key: "why_role", text: "Why are you interested in this role?" },
          { key: "experience", text: "Describe your relevant experience." },
        ];
        const ai = await claudeClient.structuredJson({
          userId: profile._id,
          system: applicationAnswersSystem(),
          userPrompt: `Profile:\n${JSON.stringify(profileSnapshotForDocuments(profile))}\n\nJob:\n${job.title}\n\nQuestions:\n${JSON.stringify(questions)}`,
          schemaHint: schema,
          promptVersion: PROMPT_VERSIONS.APPLICATION_ANSWERS,
        });
        if (ai.data?.answers) {
          answers = ai.data.answers.map((a) => ({
            questionKey: a.questionKey,
            questionText: a.questionText,
            answerText: a.answerText,
            requiresHumanInput: Boolean(a.requiresHumanInput),
            source: "ai",
          }));
        }
      } else {
        answers = [
          {
            questionKey: "why_role",
            questionText: "Why are you interested in this role?",
            answerText: `I am interested in ${job.title} at ${job.company} based on my verified experience in software engineering.`,
            requiresHumanInput: false,
            source: "profile",
          },
        ];
      }
    }

    application.answers = answers;
    application.formPayload = {
      personal: profile.personal,
      contact: profile.contact,
      jobUrl: job.url,
      documents: {
        cv: application.cvDocumentId,
        coverLetter: application.coverLetterDocumentId,
      },
    };
    application.status = "prepared";
    application.timeline.push({ status: "prepared", message: "Application prepared for review" });
    await application.save();
    await syncApplicationPayloadHash(application, job);

    if (body.queueBrowserPrep) {
      await WorkerJob.create({
        type: "prepare_application",
        userId: profile._id,
        applicationId: application._id,
        payload: { jobId: job._id },
      });
    }

    const approval = await requestApproval(application, job);

    const docs = await Document.find({
      _id: { $in: [application.cvDocumentId, application.coverLetterDocumentId].filter(Boolean) },
    });

    return NextResponse.json({ application, approval, documents: docs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
