import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { claudeClient } from "@/lib/claude/client";
import { cvGenerateSystem, coverLetterSystem, PROMPT_VERSIONS } from "@/lib/claude/prompts";

export function profileSnapshotForDocuments(profile) {
  return {
    personal: profile.personal,
    contact: profile.contact,
    education: profile.education,
    experience: profile.experience,
    skills: profile.skills,
    projects: profile.projects,
    achievements: profile.achievements,
    publications: profile.publications,
    certifications: profile.certifications,
  };
}

export async function generateCvContent(profile, job, userId) {
  const snapshot = profileSnapshotForDocuments(profile);
  const prompt = `Profile JSON:\n${JSON.stringify(snapshot)}\n\nJob:\n${job.title} at ${job.company}\n${job.descriptionText?.slice(0, 4000)}`;

  if (!claudeClient.isConfigured()) {
    return {
      content: buildCvFallback(snapshot, job),
      source: "template",
    };
  }

  const result = await claudeClient.messages({
    userId,
    system: cvGenerateSystem(),
    messages: [{ role: "user", content: prompt }],
    promptVersion: PROMPT_VERSIONS.CV_GENERATE,
  });

  return { content: result.text, source: "ai" };
}

export async function generateCoverLetterContent(profile, job, userId) {
  const snapshot = profileSnapshotForDocuments(profile);
  const tone = profile.preferences?.coverLetterTone || "professional";
  const prompt = `Tone: ${tone}\nProfile:\n${JSON.stringify(snapshot)}\n\nJob:\n${job.title} — ${job.company}\n${job.descriptionText?.slice(0, 3000)}`;

  if (!claudeClient.isConfigured()) {
    return {
      content: buildCoverLetterFallback(snapshot, job),
      source: "template",
    };
  }

  const result = await claudeClient.messages({
    userId,
    system: coverLetterSystem(),
    messages: [{ role: "user", content: prompt }],
    promptVersion: PROMPT_VERSIONS.COVER_LETTER,
  });

  return { content: result.text, source: "ai" };
}

function buildCvFallback(snapshot, job) {
  const name = [snapshot.personal?.firstName, snapshot.personal?.lastName].filter(Boolean).join(" ");
  const skills = (snapshot.skills || []).map((s) => s.name).join(", ");
  return `${name}\n${snapshot.personal?.headline || ""}\n\nSummary\n${snapshot.personal?.summary || ""}\n\nSkills\n${skills}\n\nTailored for: ${job.title} at ${job.company}`;
}

function buildCoverLetterFallback(snapshot, job) {
  const name = [snapshot.personal?.firstName, snapshot.personal?.lastName].filter(Boolean).join(" ");
  return `Dear Hiring Team,\n\nI am writing to apply for the ${job.title} role at ${job.company}. My background as ${snapshot.personal?.headline || "a software engineer"} aligns with the requirements described in your posting.\n\nSincerely,\n${name}`;
}

export async function buildDocxFromText(title, content) {
  const lines = content.split("\n");
  const children = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
    }),
    ...lines.map(
      (line) =>
        new Paragraph({
          children: [new TextRun(line)],
        })
    ),
  ];

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
