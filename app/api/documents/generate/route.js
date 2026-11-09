import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Job, Document } from "@/lib/db/models";
import {
  generateCvContent,
  generateCoverLetterContent,
  buildDocxFromText,
  profileSnapshotForDocuments,
} from "@/lib/documents/generate";
import { uploadUserFile } from "@/lib/firebase/storage";

export async function POST(request) {
  try {
    const { user, profile } = await getRequestProfile(request);
    const body = await request.json();
    const job = await Job.findById(body.jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const type = body.type || "cv";
    const generated =
      type === "cover_letter"
        ? await generateCoverLetterContent(profile, job, profile._id)
        : await generateCvContent(profile, job, profile._id);

    let storagePath = null;
    let mimeType = "text/plain";

    if (body.format === "docx") {
      const buffer = await buildDocxFromText(`${type} — ${job.title}`, generated.content);
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      try {
        storagePath = await uploadUserFile(
          user.uid,
          `generated/${job._id}-${type}.docx`,
          buffer,
          mimeType
        );
      } catch {
        storagePath = null;
      }
    }

    const last = await Document.findOne({
      userId: profile._id,
      type: type === "cover_letter" ? "cover_letter" : "cv",
      jobId: job._id,
    }).sort({ version: -1 });

    const document = await Document.create({
      userId: profile._id,
      type: type === "cover_letter" ? "cover_letter" : "cv",
      title: `${type} for ${job.title}`,
      storagePath,
      mimeType,
      parsedText: generated.content,
      jobId: job._id,
      version: (last?.version || 0) + 1,
      generatedFromProfileSnapshot: profileSnapshotForDocuments(profile),
      verified: false,
    });

    return NextResponse.json({ document, source: generated.source });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
