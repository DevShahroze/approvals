"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { DataTable, StatusBadge } from "@/components/dashboard/data-table";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    apiFetch("/api/sessions").then((d) => setSessions(d.sessions || []));
  }, []);

  const columns = [
    { key: "adapter", label: "Adapter", render: (r) => r.adapter || "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "url", label: "Last URL", render: (r) => r.lastUrl || "—" },
    { key: "started", label: "Started", render: (r) => new Date(r.startedAt || r.createdAt).toLocaleString() },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Browser Sessions</h2>
      <DataTable columns={columns} rows={sessions.map((s) => ({ ...s, id: s._id }))} emptyMessage="No browser sessions yet." />
    </div>
  );
}
