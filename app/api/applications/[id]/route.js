import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Application, Approval, Job } from "@/lib/db/models";

export async function GET(request, { params }) {
  try {
    const { profile } = await getRequestProfile(request);
    const { id } = await params;
    const application = await Application.findOne({ _id: id, userId: profile._id }).populate("jobId");
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const approval = await Approval.findOne({ applicationId: application._id });
    return NextResponse.json({ application, approval });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { profile } = await getRequestProfile(request);
    const { id } = await params;
    const body = await request.json();
    const application = await Application.findOne({ _id: id, userId: profile._id });
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const job = await Job.findById(application.jobId);
    if (body.answers) application.answers = body.answers;
    if (body.status && ["interview", "rejected", "withdrawn"].includes(body.status)) {
      application.status = body.status;
      application.timeline.push({ status: body.status, message: body.message || "Status updated" });
    }

    await application.save();

    const { invalidateApprovalIfStale, syncApplicationPayloadHash } = await import("@/lib/approval/service");
    const hash = await syncApplicationPayloadHash(application, job);
    const approval = await Approval.findOne({ applicationId: application._id });
    if (approval) await invalidateApprovalIfStale(approval, hash);

    return NextResponse.json({ application, approval });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
