import { JobProvider } from "./base.js";

function stubProvider(name) {
  return class extends JobProvider {
    constructor() {
      super(name);
    }
    async discover() {
      return {
        not_configured: true,
        jobs: [],
        message: `${name} requires a permitted official API integration. Configure credentials in Settings.`,
      };
    }
  };
}

export const LinkedInProvider = stubProvider("linkedin");
export const IndeedProvider = stubProvider("indeed");
export const GlassdoorProvider = stubProvider("glassdoor");
export const WellfoundProvider = stubProvider("wellfound");
