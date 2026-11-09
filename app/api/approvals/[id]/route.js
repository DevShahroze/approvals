import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Approval, Application, WorkerJob, ActivityLog } from "@/lib/db/models";
import { approveApplication } from "@/lib/approval/service";

export async function POST(request, { params }) {
  try {
    const { profile } = await getRequestProfile(request);
    const { id } = await params;
    const body = await request.json();
    const action = body.action;

    const approval = await Approval.findOne({ _id: id, userId: profile._id });
    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    const application = await Application.findById(approval.applicationId);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (action === "approve") {
      await approveApplication(approval, application, body.note);
      await ActivityLog.create({
        userId: profile._id,
        type: "approval",
        message: "Application explicitly approved by owner",
        metadata: { approvalId: approval._id, applicationId: application._id },
      });

      if (body.queueSubmit) {
        const workerJob = await WorkerJob.create({
          type: "submit_application",
          userId: profile._id,
          applicationId: application._id,
          payload: { approvalId: approval._id },
        });
        return NextResponse.json({ approval, application, workerJobId: workerJob._id });
      }

      return NextResponse.json({ approval, application });
    }

    if (action === "reject") {
      approval.status = "rejected";
      approval.rejectedAt = new Date();
      approval.note = body.note || "";
      await approval.save();
      application.status = "draft";
      application.timeline.push({ status: "draft", message: "Approval rejected by owner" });
      await application.save();
      return NextResponse.json({ approval, application });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
