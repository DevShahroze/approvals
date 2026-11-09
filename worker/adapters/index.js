import { prepareGreenhouseApplication, submitGreenhouseApplication } from "./greenhouse.js";

export function resolveAdapter(job) {
  const url = job?.url || "";
  if (url.includes("greenhouse.io") || url.includes("boards.greenhouse.io")) {
    return "greenhouse";
  }
  if (url.includes("lever.co")) return "lever";
  if (url.includes("ashbyhq.com")) return "ashby";
  return "generic";
}

export async function prepareWithAdapter(adapter, page, application, profile, job) {
  if (adapter === "greenhouse") {
    return prepareGreenhouseApplication(page, application, profile);
  }
  await page.goto(job.url, { waitUntil: "domcontentloaded", timeout: 60000 });
  return { prepared: true, adapter: "generic" };
}

export async function submitWithAdapter(adapter, page) {
  if (adapter === "greenhouse") {
    return submitGreenhouseApplication(page);
  }
  return { needs_human: true, reason: "No automated submit adapter for this site" };
}
