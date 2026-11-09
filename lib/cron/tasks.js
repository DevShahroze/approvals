import { UserProfile, AutomationSettings, ActivityLog } from "@/lib/db/models";
import { runDiscovery, markExpiredJobs } from "@/lib/jobs/discovery";
import { connectDB } from "@/lib/db/connect";

const SCHEDULE_ALLOWED = {
  discovery: ["hourly", "daily"],
  expire_jobs: ["hourly", "daily"],
};

function scheduleFieldForTask(task) {
  if (task === "discovery") return "discoverySchedule";
  if (task === "expire_jobs") return "expireJobsSchedule";
  return null;
}

export async function shouldRunForSchedule(task, scheduleHint) {
  const field = scheduleFieldForTask(task);
  if (!field) return { run: true };

  await connectDB();
  const profiles = await UserProfile.find({}).select("_id");
  const enabledProfiles = [];

  for (const profile of profiles) {
    const settings = await AutomationSettings.findOne({ userId: profile._id });
    const schedule = settings?.[field] || "daily";
    if (schedule === "off") continue;

    const hint = (scheduleHint || "").toLowerCase();
    if (hint && SCHEDULE_ALLOWED[task]?.includes(hint)) {
      if (schedule !== hint) continue;
    }

    enabledProfiles.push({ profileId: profile._id, schedule });
  }

  return { run: enabledProfiles.length > 0, profiles: enabledProfiles };
}

export async function executeDiscoveryCron(scheduleHint = "daily") {
  await connectDB();
  const profiles = await UserProfile.find({});
  const aggregate = { discovered: 0, updated: 0, users: 0, errors: [], schedule: scheduleHint };

  for (const profile of profiles) {
    const settings = await AutomationSettings.findOne({ userId: profile._id });
    if (!settings || settings.discoverySchedule === "off") continue;
    if (settings.discoverySchedule !== scheduleHint) continue;

    const hasProvider = Object.values(settings.enabledProviders || {}).some(Boolean);
    if (!hasProvider) continue;

    try {
      const results = await runDiscovery(profile._id, {});
      aggregate.discovered += results.discovered || 0;
      aggregate.updated += results.updated || 0;
      aggregate.users += 1;
      if (results.errors?.length) {
        aggregate.errors.push(...results.errors.map((e) => ({ userId: profile._id, ...e })));
      }
    } catch (err) {
      aggregate.errors.push({ userId: profile._id, message: err.message });
    }
  }

  await ActivityLog.create({
    type: "cron",
    message: `Scheduled discovery: ${aggregate.discovered} new, ${aggregate.updated} updated`,
    metadata: aggregate,
  });

  return aggregate;
}

export async function executeExpireJobsCron() {
  const result = await markExpiredJobs();
  await ActivityLog.create({
    type: "cron",
    message: `Scheduled expire check: ${result.expired} jobs marked expired`,
    metadata: result,
  });
  return result;
}
