"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PROVIDERS = ["greenhouse", "lever", "ashby", "linkedin", "indeed", "glassdoor", "wellfound", "career_page"];

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    apiFetch("/api/settings").then((d) => setSettings(d.settings));
  }, []);

  async function save() {
    await apiFetch("/api/settings", { method: "PUT", body: JSON.stringify(settings) });
  }

  if (!settings) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-semibold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled tasks (cron-job.org)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Job discovery</Label>
            <select
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={settings.discoverySchedule || "daily"}
              onChange={(e) => setSettings({ ...settings, discoverySchedule: e.target.value })}
            >
              <option value="off">Off</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <div>
            <Label>Expire stale listings</Label>
            <select
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={settings.expireJobsSchedule || "daily"}
              onChange={(e) => setSettings({ ...settings, expireJobsSchedule: e.target.value })}
            >
              <option value="off">Off</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            Point free cron URLs at your deployed app (see README). Match cron-job.org frequency to the schedule you
            select here.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matching</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Minimum match score</Label>
          <Input
            type="number"
            value={settings.minMatchScore}
            onChange={(e) => setSettings({ ...settings, minMatchScore: Number(e.target.value) })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discovery providers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {PROVIDERS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(settings.enabledProviders?.[p])}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    enabledProviders: { ...settings.enabledProviders, [p]: e.target.checked },
                  })
                }
              />
              {p}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Greenhouse board token</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="board token"
            value={settings.providerCredentials?.greenhouse?.boardToken || ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                providerCredentials: {
                  ...settings.providerCredentials,
                  greenhouse: { boardToken: e.target.value },
                },
              })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lever company slug</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={settings.providerCredentials?.lever?.company || ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                providerCredentials: {
                  ...settings.providerCredentials,
                  lever: { company: e.target.value },
                },
              })
            }
          />
        </CardContent>
      </Card>

      <Button onClick={save}>Save settings</Button>
    </div>
  );
}
