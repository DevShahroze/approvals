import { Approval, Application } from "@/lib/db/models";
import { canonicalJsonHash } from "@/lib/utils";

export function buildApplicationPayload(application, job) {
  return {
    jobId: String(job._id),
    cvDocumentId: application.cvDocumentId ? String(application.cvDocumentId) : null,
    coverLetterDocumentId: application.coverLetterDocumentId
      ? String(application.coverLetterDocumentId)
      : null,
    answers: application.answers || [],
    formPayload: application.formPayload || {},
  };
}

export function computePayloadHash(application, job) {
  const payload = buildApplicationPayload(application, job);
  return canonicalJsonHash(payload);
}

export async function syncApplicationPayloadHash(application, job) {
  const hash = computePayloadHash(application, job);
  application.payloadHash = hash;
  await application.save();
  return hash;
}

export async function invalidateApprovalIfStale(approval, currentHash) {
  if (approval.status !== "approved") return approval;
  if (approval.boundPayloadHash !== currentHash) {
    approval.status = "invalidated";
    approval.invalidatedAt = new Date();
    approval.invalidationReason = "Application payload changed after approval";
    await approval.save();
  }
  return approval;
}

export async function requestApproval(application, job) {
  const hash = await syncApplicationPayloadHash(application, job);
  application.status = "awaiting_approval";
  application.timeline.push({
    status: "awaiting_approval",
    message: "Ready for owner review",
  });
  await application.save();

  const docIds = [application.cvDocumentId, application.coverLetterDocumentId].filter(Boolean);

  let approval = await Approval.findOne({ applicationId: application._id });
  if (approval) {
    approval.status = "pending";
    approval.boundPayloadHash = hash;
    approval.boundDocumentIds = docIds;
    approval.boundAnswersSnapshot = application.answers;
    approval.invalidatedAt = undefined;
    approval.invalidationReason = undefined;
    await approval.save();
  } else {
    approval = await Approval.create({
      userId: application.userId,
      applicationId: application._id,
      jobId: job._id,
      status: "pending",
      boundPayloadHash: hash,
      boundDocumentIds: docIds,
      boundAnswersSnapshot: application.answers,
    });
  }

  return approval;
}

export async function approveApplication(approval, application, note) {
  const current = application.payloadHash;
  if (approval.boundPayloadHash !== current) {
    throw new Error("Approval is stale; review the updated application");
  }
  approval.status = "approved";
  approval.approvedAt = new Date();
  approval.note = note || "";
  await approval.save();

  application.status = "approved";
  application.timeline.push({ status: "approved", message: "Owner approved submission" });
  await application.save();

  return approval;
}

export function assertCanSubmit(approval, application) {
  if (!approval || approval.status !== "approved") {
    throw new Error("Submission blocked: explicit approval required");
  }
  if (approval.boundPayloadHash !== application.payloadHash) {
    throw new Error("Submission blocked: approval invalidated due to payload change");
  }
}
