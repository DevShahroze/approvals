"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function JobDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");

  async function load() {
    setData(await apiFetch(`/api/jobs/${id}`));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function runMatch() {
    setBusy("match");
    await apiFetch(`/api/jobs/${id}/match`, { method: "POST" });
    await load();
    setBusy("");
  }

  async function generateDocs() {
    setBusy("docs");
    await apiFetch("/api/documents/generate", {
      method: "POST",
      body: JSON.stringify({ jobId: id, type: "cv" }),
    });
    await apiFetch("/api/documents/generate", {
      method: "POST",
      body: JSON.stringify({ jobId: id, type: "cover_letter" }),
    });
    setBusy("");
  }

  async function prepareApplication() {
    setBusy("prep");
    const res = await apiFetch("/api/applications/prepare", {
      method: "POST",
      body: JSON.stringify({ jobId: id, queueBrowserPrep: true }),
    });
    setBusy("");
    if (res.application?._id) {
      window.location.href = `/applications/${res.application._id}`;
    }
  }

  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const { job, match, application } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{job.title}</h2>
          <p className="text-muted-foreground">
            {job.company} · {job.location} · {job.source}
          </p>
          <a href={job.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
            Original listing
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={runMatch} disabled={!!busy}>
            {busy === "match" ? "Matching…" : "Run match"}
          </Button>
          <Button variant="secondary" onClick={generateDocs} disabled={!!busy}>
            Generate CV + letter
          </Button>
          <Button variant="outline" onClick={prepareApplication} disabled={!!busy}>
            Prepare application
          </Button>
        </div>
      </div>

      {match && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Compatibility <Badge>{match.score}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{match.suitabilityExplanation}</p>
            <p>
              <strong>Matching:</strong> {(match.matchingSkills || []).join(", ") || "—"}
            </p>
            <p>
              <strong>Gaps:</strong> {(match.missingSkills || []).join(", ") || "—"}
            </p>
            {(match.eligibilityIssues || []).map((e) => (
              <p key={e} className="text-amber-400">
                {e}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {application && (
        <p className="text-sm">
          Application status: <Badge variant="outline">{application.status}</Badge>{" "}
          <Link href={`/applications/${application._id}`} className="text-primary hover:underline">
            Open application
          </Link>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">
          {job.descriptionText || "No description stored."}
        </CardContent>
      </Card>
    </div>
  );
}
