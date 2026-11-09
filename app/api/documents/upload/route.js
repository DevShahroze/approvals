import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Document, ActivityLog } from "@/lib/db/models";
import { parseDocumentBuffer } from "@/lib/documents/parse";
import { uploadUserFile } from "@/lib/firebase/storage";
import { getEnv } from "@/lib/env";

export async function POST(request) {
  try {
    const { user, profile } = await getRequestProfile(request);
    const formData = await request.formData();
    const file = formData.get("file");
    const docType = formData.get("type") || "cv";
    const isMaster = formData.get("isMaster") === "true";

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    let storagePath = null;
    const env = getEnv();

    if (env.FIREBASE_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
      storagePath = await uploadUserFile(
        user.uid,
        `documents/${Date.now()}-${file.name}`,
        buffer,
        mimeType
      );
    }

    const parsedText = await parseDocumentBuffer(buffer, mimeType);
    const last = await Document.findOne({ userId: profile._id, type: docType }).sort({ version: -1 });
    const version = (last?.version || 0) + 1;

    if (isMaster) {
      await Document.updateMany({ userId: profile._id, type: "cv", isMaster: true }, { isMaster: false });
    }

    const document = await Document.create({
      userId: profile._id,
      type: docType,
      title: file.name,
      storagePath,
      mimeType,
      sizeBytes: buffer.length,
      parsedText,
      version,
      isMaster,
      verified: false,
    });

    if (isMaster) {
      profile.masterCvDocumentId = document._id;
      await profile.save();
    }

    await ActivityLog.create({
      userId: profile._id,
      type: "document",
      message: `Uploaded ${docType}: ${file.name}`,
      metadata: { documentId: document._id },
    });

    return NextResponse.json({ document });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
