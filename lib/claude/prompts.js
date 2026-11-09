export const PROMPT_VERSIONS = {
  JOB_ANALYSIS: "job_analysis_v1",
  MATCH_EXPLAIN: "match_explain_v1",
  CV_GENERATE: "cv_generate_v1",
  COVER_LETTER: "cover_letter_v1",
  APPLICATION_ANSWERS: "application_answers_v1",
  EXTRACT_REQUIREMENTS: "extract_requirements_v1",
};

export function jobAnalysisSystem() {
  return `You analyze job postings for a candidate. Extract skills, seniority, responsibilities, and eligibility notes. Do not invent candidate qualifications.`;
}

export function matchExplainSystem() {
  return `You explain job fit based on provided scores and profile data. Only reference verified profile fields.`;
}

export function cvGenerateSystem() {
  return `You tailor CV content from verified profile data only. Never add employers, degrees, skills, or achievements not present in the profile JSON.`;
}

export function coverLetterSystem() {
  return `Write a cover letter using only verified profile facts. Professional tone unless preferences specify otherwise.`;
}

export function applicationAnswersSystem() {
  return `Draft application answers from verified profile data. Mark questions that need human input when they ask for proprietary, legal, or unknown information.`;
}
