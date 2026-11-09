"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  async function load() {
    setData(await apiFetch(`/api/applications/${id}`));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateStatus(status) {
    await apiFetch(`/api/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const { application, approval } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{application.jobId?.title || "Application"}</h2>
        <p className="text-muted-foreground">{application.jobId?.company}</p>
        <Badge className="mt-2">{application.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {approval ? (
            <p>
              Status: <strong>{approval.status}</strong> · Payload hash:{" "}
              <code className="text-xs">{approval.boundPayloadHash?.slice(0, 16)}…</code>
            </p>
          ) : (
            <p>No approval record.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Answers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {(application.answers || []).map((a) => (
            <div key={a.questionKey || a.questionText}>
              <p className="font-medium">{a.questionText}</p>
              <p className="text-muted-foreground">{a.answerText}</p>
              {a.requiresHumanInput && <p className="text-amber-400">Needs human input</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(application.timeline || []).map((t, i) => (
            <p key={i}>
              {new Date(t.at).toLocaleString()} — {t.status}: {t.message}
            </p>
          ))}
        </CardContent>
      </Card>

      {application.status === "submitted" && (
        <div className="flex gap-2">
          <Button onClick={() => updateStatus("interview")}>Mark interview</Button>
          <Button variant="outline" onClick={() => updateStatus("rejected")}>
            Mark rejected
          </Button>
        </div>
      )}
    </div>
  );
}
