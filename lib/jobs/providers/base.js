export class JobProvider {
  constructor(name) {
    this.name = name;
  }

  isConfigured() {
    return false;
  }

  async discover() {
    return { not_configured: true, jobs: [], message: `${this.name} integration is not configured` };
  }

  normalizeJob(raw) {
    throw new Error("normalizeJob not implemented");
  }
}
