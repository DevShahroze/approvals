import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Job, JobMatch, ActivityLog } from "@/lib/db/models";
import { computeJobMatch } from "@/lib/matching/engine";
import { claudeClient } from "@/lib/claude/client";
import { matchExplainSystem, PROMPT_VERSIONS } from "@/lib/claude/prompts";

export async function POST(request, { params }) {
  try {
    const { profile } = await getRequestProfile(request);
    const { id } = await params;
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const computed = await computeJobMatch(profile, job);
    let suitabilityExplanation = "";

    if (claudeClient.isConfigured()) {
      const prompt = `Score: ${computed.score}\nMatching: ${computed.matchingSkills.join(", ")}\nMissing: ${computed.missingSkills.join(", ")}\nProfile headline: ${profile.personal?.headline}\nJob: ${job.title}`;
      const ai = await claudeClient.messages({
        userId: profile._id,
        system: matchExplainSystem(),
        messages: [{ role: "user", content: prompt }],
        max_tokens: 512,
        promptVersion: PROMPT_VERSIONS.MATCH_EXPLAIN,
      });
      suitabilityExplanation = ai.text || "";
    } else {
      suitabilityExplanation = `Match score ${computed.score}/100 based on skills, experience, and preferences.`;
    }

    const match = await JobMatch.findOneAndUpdate(
      { userId: profile._id, jobId: job._id },
      {
        ...computed,
        suitabilityExplanation,
        analyzedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await ActivityLog.create({
      userId: profile._id,
      type: "match",
      message: `Matched job ${job.title} — score ${match.score}`,
      metadata: { jobId: job._id, score: match.score },
    });

    return NextResponse.json({ match });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
