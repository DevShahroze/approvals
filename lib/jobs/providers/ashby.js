import { JobProvider } from "./base.js";

export class AshbyProvider extends JobProvider {
  constructor(organizationId, apiKey) {
    super("ashby");
    this.organizationId = organizationId;
    this.apiKey = apiKey;
  }

  isConfigured() {
    return Boolean(this.organizationId && this.apiKey);
  }

  async discover() {
    if (!this.isConfigured()) {
      return { not_configured: true, jobs: [] };
    }
    const res = await fetch("https://api.ashbyhq.com/posting.list", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      throw new Error(`Ashby API error: ${res.status}`);
    }
    const data = await res.json();
    const postings = data.results || data.postings || [];
    return { jobs: postings.map((j) => this.normalizeJob(j)) };
  }

  normalizeJob(raw) {
    return {
      externalId: raw.id || raw.publicationId,
      source: "ashby",
      url: raw.jobUrl || raw.applyLink,
      title: raw.title,
      company: raw.teamName || raw.departmentName,
      location: raw.locationName,
      descriptionText: raw.descriptionPlain || "",
      descriptionHtml: raw.descriptionHtml || "",
      workArrangement: "unknown",
      raw,
    };
  }
}
