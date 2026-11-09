"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [usage, setUsage] = useState({});

  useEffect(() => {
    apiFetch("/api/activity").then((d) => {
      setLogs(d.logs || []);
      setUsage(d.aiUsage || {});
    });
  }, []);

  const columns = [
    { key: "type", label: "Type", render: (r) => r.type },
    { key: "message", label: "Message", render: (r) => r.message },
    { key: "at", label: "When", render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Agent Activity</h2>
      <Card>
        <CardHeader>
          <CardTitle>Claude usage (estimated)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Input tokens: {usage.inputTokens || 0} · Output: {usage.outputTokens || 0} · ~${(usage.costUsd || 0).toFixed(4)} USD
        </CardContent>
      </Card>
      <DataTable columns={columns} rows={logs.map((l) => ({ ...l, id: l._id }))} />
    </div>
  );
}
