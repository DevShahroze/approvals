import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Job, JobMatch, Application } from "@/lib/db/models";

export async function GET(request, { params }) {
  try {
    const { profile } = await getRequestProfile(request);
    const { id } = await params;
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const [match, application] = await Promise.all([
      JobMatch.findOne({ userId: profile._id, jobId: job._id }),
      Application.findOne({ userId: profile._id, jobId: job._id }),
    ]);
    return NextResponse.json({ job, match, application });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
