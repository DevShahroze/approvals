import { connectDB } from "@/lib/db/connect";
import { Job, ActivityLog, AutomationSettings } from "@/lib/db/models";
import { GreenhouseProvider } from "@/lib/jobs/providers/greenhouse";
import { LeverProvider } from "@/lib/jobs/providers/lever";
import { AshbyProvider } from "@/lib/jobs/providers/ashby";
import {
  LinkedInProvider,
  IndeedProvider,
  GlassdoorProvider,
  WellfoundProvider,
} from "@/lib/jobs/providers/stub";

export function buildProviders(settings) {
  const creds = settings?.providerCredentials || {};
  return {
    greenhouse: new GreenhouseProvider(creds.greenhouse?.boardToken),
    lever: new LeverProvider(creds.lever?.company),
    ashby: new AshbyProvider(creds.ashby?.organizationId, creds.ashby?.apiKey),
    linkedin: new LinkedInProvider(),
    indeed: new IndeedProvider(),
    glassdoor: new GlassdoorProvider(),
    wellfound: new WellfoundProvider(),
    career_page: new LinkedInProvider(),
  };
}

export async function upsertDiscoveredJob(normalized) {
  const existing = await Job.findOne({
    source: normalized.source,
    externalId: normalized.externalId,
  });

  if (existing) {
    existing.lastCheckedAt = new Date();
    if (normalized.descriptionText) {
      existing.descriptionText = normalized.descriptionText;
      existing.descriptionHtml = normalized.descriptionHtml;
    }
    await existing.save();
    return { job: existing, created: false };
  }

  const job = await Job.create({
    ...normalized,
    lastCheckedAt: new Date(),
  });
  return { job, created: true };
}

export async function runDiscovery(userId, filters = {}) {
  await connectDB();
  const settings = await AutomationSettings.findOne({ userId });
  const providers = buildProviders(settings);
  const enabled = settings?.enabledProviders || {};

  const results = {
    discovered: 0,
    updated: 0,
    providers: {},
    errors: [],
  };

  for (const [name, provider] of Object.entries(providers)) {
    if (!enabled[name]) continue;
    try {
      const out = await provider.discover(filters);
      results.providers[name] = {
        configured: !out.not_configured,
        count: out.jobs?.length || 0,
        message: out.message,
      };
      if (out.not_configured || !out.jobs?.length) continue;

      for (const normalized of out.jobs) {
        const { created } = await upsertDiscoveredJob(normalized);
        if (created) results.discovered += 1;
        else results.updated += 1;
      }
    } catch (err) {
      results.errors.push({ provider: name, message: err.message });
    }
  }

  await ActivityLog.create({
    userId,
    type: "discovery",
    message: `Discovery completed: ${results.discovered} new, ${results.updated} updated`,
    metadata: results,
  });

  return results;
}

export async function markExpiredJobs() {
  await connectDB();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const stale = await Job.find({
    status: "active",
    lastCheckedAt: { $lt: cutoff },
  });
  for (const job of stale) {
    job.status = "expired";
    await job.save();
  }
  return { expired: stale.length };
}
