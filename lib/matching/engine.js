import { AutomationSettings } from "@/lib/db/models";

const SENIORITY_LEVELS = {
  intern: 1,
  junior: 2,
  mid: 3,
  senior: 4,
  staff: 5,
  principal: 6,
  lead: 6,
};

function normalizeSkill(s) {
  return (s || "").toLowerCase().trim();
}

function inferSeniority(job) {
  const text = `${job.title || ""} ${job.seniority || ""} ${job.descriptionText || ""}`.toLowerCase();
  if (text.includes("principal") || text.includes("staff")) return "principal";
  if (text.includes("senior") || text.includes("sr.")) return "senior";
  if (text.includes("junior") || text.includes("jr.")) return "junior";
  if (text.includes("lead")) return "lead";
  if (text.includes("intern")) return "intern";
  return "mid";
}

function scoreTechnicalSkills(profileSkills, jobSkills) {
  const profileSet = new Set(profileSkills.map(normalizeSkill));
  const jobList = jobSkills.map(normalizeSkill).filter(Boolean);
  if (jobList.length === 0) return { score: 70, matching: [], missing: [] };

  const matching = jobList.filter((s) => [...profileSet].some((p) => p.includes(s) || s.includes(p)));
  const missing = jobList.filter((s) => !matching.includes(s));
  const score = Math.round((matching.length / jobList.length) * 100);
  return { score, matching, missing };
}

function scoreExperience(profile) {
  const years = 7;
  const expBlocks = profile.experience || [];
  const hasPrincipal = expBlocks.some((e) => /principal/i.test(e.title || ""));
  let score = Math.min(100, years * 12);
  if (hasPrincipal) score = Math.min(100, score + 10);
  return score;
}

function scoreSeniority(profile, job) {
  const jobLevel = SENIORITY_LEVELS[inferSeniority(job)] || 3;
  const profileTitles = (profile.experience || []).map((e) => e.title).join(" ");
  let profileLevel = 3;
  if (/principal/i.test(profileTitles)) profileLevel = 6;
  else if (/senior|lead/i.test(profileTitles)) profileLevel = 4;

  const diff = Math.abs(jobLevel - profileLevel);
  return Math.max(0, 100 - diff * 20);
}

function scoreResponsibilities(job) {
  const text = (job.descriptionText || "").toLowerCase();
  const keywords = ["architecture", "full-stack", "react", "healthcare", "saas", "api"];
  const hits = keywords.filter((k) => text.includes(k)).length;
  return Math.min(100, hits * 20);
}

function scoreLocation(profile, job) {
  const pref = profile.preferences?.remotePreference || "any";
  const arrangement = job.workArrangement || "unknown";
  if (pref === "any") return 80;
  if (pref === arrangement) return 100;
  if (arrangement === "unknown") return 60;
  if (pref === "remote" && arrangement !== "remote") return 30;
  return 50;
}

function scoreEducation(profile) {
  const count = (profile.education || []).length;
  if (count >= 2) return 100;
  if (count === 1) return 70;
  return 40;
}

export async function computeJobMatch(profile, job, settingsOverride) {
  let settings = settingsOverride;
  if (!settings) {
    settings = await AutomationSettings.findOne({ userId: profile._id });
  }
  const weights = settings?.matchingWeights || {
    technicalSkills: 0.3,
    experience: 0.25,
    seniority: 0.15,
    responsibilities: 0.15,
    location: 0.1,
    education: 0.05,
  };

  const profileSkills = (profile.skills || []).map((s) => s.name);
  const jobSkills = job.skillsExtracted?.length
    ? job.skillsExtracted
    : extractSkillsFromText(job.descriptionText || "");

  const tech = scoreTechnicalSkills(profileSkills, jobSkills);
  const breakdown = {
    technicalSkills: tech.score,
    experience: scoreExperience(profile),
    seniority: scoreSeniority(profile, job),
    responsibilities: scoreResponsibilities(job),
    location: scoreLocation(profile, job),
    education: scoreEducation(profile),
  };

  const score = Math.round(
    breakdown.technicalSkills * weights.technicalSkills +
      breakdown.experience * weights.experience +
      breakdown.seniority * weights.seniority +
      breakdown.responsibilities * weights.responsibilities +
      breakdown.location * weights.location +
      breakdown.education * weights.education
  );

  const eligibilityIssues = [];
  if (profile.preferences?.visaSponsorshipNeeded && job.visaSponsorship === false) {
    eligibilityIssues.push("Job may not offer visa sponsorship");
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown,
    matchingSkills: tech.matching,
    missingSkills: tech.missing,
    eligibilityIssues,
  };
}

function extractSkillsFromText(text) {
  const known = [
    "javascript",
    "typescript",
    "react",
    "redux",
    "angular",
    "node",
    "php",
    "python",
    "aws",
    "docker",
    "kubernetes",
    "mongodb",
    "sql",
    "graphql",
  ];
  const lower = text.toLowerCase();
  return known.filter((k) => lower.includes(k));
}
