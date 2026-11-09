import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { AutomationSettings } from "@/lib/db/models";

export async function GET(request) {
  try {
    const { profile } = await getRequestProfile(request);
    let settings = await AutomationSettings.findOne({ userId: profile._id });
    if (!settings) {
      settings = await AutomationSettings.create({ userId: profile._id });
    }
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function PUT(request) {
  try {
    const { profile } = await getRequestProfile(request);
    const body = await request.json();
    let settings = await AutomationSettings.findOne({ userId: profile._id });
    if (!settings) {
      settings = await AutomationSettings.create({ userId: profile._id });
    }

    if (body.minMatchScore !== undefined) settings.minMatchScore = body.minMatchScore;
    if (body.matchingWeights) settings.matchingWeights = body.matchingWeights;
    if (body.enabledProviders) settings.enabledProviders = { ...settings.enabledProviders, ...body.enabledProviders };
    if (body.providerCredentials) {
      settings.providerCredentials = { ...settings.providerCredentials, ...body.providerCredentials };
    }
    if (body.discoverySchedule) settings.discoverySchedule = body.discoverySchedule;
    if (body.expireJobsSchedule) settings.expireJobsSchedule = body.expireJobsSchedule;
    if (body.aiDailyBudgetUsd !== undefined) settings.aiDailyBudgetUsd = body.aiDailyBudgetUsd;

    await settings.save();
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
