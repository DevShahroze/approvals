"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch("/api/profile").then((d) => setProfile(d.profile));
  }, []);

  function update(path, value) {
    setProfile((p) => {
      const next = { ...p };
      const [root, key] = path.split(".");
      if (key) next[root] = { ...next[root], [key]: value };
      else next[root] = value;
      return next;
    });
  }

  async function save(markVerified) {
    await apiFetch("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        personal: profile.personal,
        contact: profile.contact,
        preferences: profile.preferences,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education,
        publications: profile.publications,
        markVerified: markVerified || false,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!profile) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-semibold">Professional Profile</h2>
      <p className="text-sm text-muted-foreground">All generated documents trace to verified fields here.</p>

      <Card>
        <CardHeader>
          <CardTitle>Personal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>First name</Label>
            <Input value={profile.personal?.firstName || ""} onChange={(e) => update("personal.firstName", e.target.value)} />
          </div>
          <div>
            <Label>Last name</Label>
            <Input value={profile.personal?.lastName || ""} onChange={(e) => update("personal.lastName", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Headline</Label>
            <Input value={profile.personal?.headline || ""} onChange={(e) => update("personal.headline", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Summary</Label>
            <Textarea value={profile.personal?.summary || ""} onChange={(e) => update("personal.summary", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save(false)}>Save</Button>
        <Button variant="secondary" onClick={() => save(true)}>
          Save & mark verified
        </Button>
        {saved && <span className="text-sm text-emerald-400">Saved</span>}
      </div>
    </div>
  );
}
