"use client";

import { useEffect, useState } from "react";
import { StatCards } from "@/components/dashboard/stat-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

export default function OverviewPage() {
  const [stats, setStats] = useState({});
  const [profileStatus, setProfileStatus] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, meRes] = await Promise.all([
          apiFetch("/api/stats/overview"),
          apiFetch("/api/me"),
        ]);
        setStats(statsRes.stats || {});
        setProfileStatus(meRes.profile);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  async function bootstrapProfile() {
    await apiFetch("/api/profile/bootstrap", { method: "POST" });
    const me = await apiFetch("/api/me");
    setProfileStatus(me.profile);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">Mandatory approval before every submission.</p>
        </div>
        <Button variant="outline" onClick={bootstrapProfile}>
          Bootstrap profile seed
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <StatCards stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle>Profile status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {profileStatus ? (
            <p>
              {profileStatus.personal?.firstName} {profileStatus.personal?.lastName} —{" "}
              {profileStatus.verifiedAt ? "Verified" : "Not verified (edit in Profile)"}
            </p>
          ) : (
            <p>Loading profile…</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
