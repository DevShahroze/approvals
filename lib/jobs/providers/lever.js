import { JobProvider } from "./base.js";

export class LeverProvider extends JobProvider {
  constructor(company) {
    super("lever");
    this.company = company;
  }

  isConfigured() {
    return Boolean(this.company);
  }

  async discover() {
    if (!this.isConfigured()) {
      return { not_configured: true, jobs: [] };
    }
    const url = `https://api.lever.co/v0/postings/${this.company}?mode=json`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Lever API error: ${res.status}`);
    }
    const data = await res.json();
    return { jobs: data.map((j) => this.normalizeJob(j)) };
  }

  normalizeJob(raw) {
    const text = [
      raw.descriptionPlain,
      raw.description,
      ...(raw.lists || []).flatMap((l) => [l.text, ...(l.content || [])]),
    ]
      .filter(Boolean)
      .join("\n");

    return {
      externalId: raw.id,
      source: "lever",
      url: raw.hostedUrl || raw.applyUrl,
      title: raw.text,
      company: raw.categories?.team || this.company,
      location: raw.categories?.location,
      workArrangement: (raw.workplaceType || "").toLowerCase() || "unknown",
      descriptionHtml: raw.description || "",
      descriptionText: text,
      raw,
    };
  }
}
