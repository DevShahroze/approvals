import { JobProvider } from "./base.js";
import { sanitizeHtmlBasic } from "@/lib/utils";

export class GreenhouseProvider extends JobProvider {
  constructor(boardToken) {
    super("greenhouse");
    this.boardToken = boardToken;
  }

  isConfigured() {
    return Boolean(this.boardToken);
  }

  async discover({ query } = {}) {
    if (!this.isConfigured()) {
      return { not_configured: true, jobs: [] };
    }
    const url = `https://boards-api.greenhouse.io/v1/boards/${this.boardToken}/jobs?content=true`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Greenhouse API error: ${res.status}`);
    }
    const data = await res.json();
    const jobs = (data.jobs || []).map((j) => this.normalizeJob(j));
    if (query) {
      const q = query.toLowerCase();
      return {
        jobs: jobs.filter(
          (j) =>
            j.title?.toLowerCase().includes(q) ||
            j.descriptionText?.toLowerCase().includes(q)
        ),
      };
    }
    return { jobs };
  }

  normalizeJob(raw) {
    const content = raw.content || "";
    return {
      externalId: String(raw.id),
      source: "greenhouse",
      url: raw.absolute_url,
      title: raw.title,
      company: raw.company?.name || raw.departments?.[0]?.name,
      location: raw.location?.name,
      descriptionHtml: sanitizeHtmlBasic(content),
      descriptionText: content.replace(/<[^>]+>/g, " "),
      workArrangement: "unknown",
      raw,
    };
  }
}
