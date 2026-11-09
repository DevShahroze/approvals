"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { DataTable, StatusBadge } from "@/components/dashboard/data-table";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    apiFetch("/api/applications").then((d) => setApplications(d.applications || []));
  }, []);

  const columns = [
    { key: "job", label: "Job", render: (r) => r.jobId?.title || "—" },
    { key: "company", label: "Company", render: (r) => r.jobId?.company || "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "updated", label: "Updated", render: (r) => new Date(r.updatedAt).toLocaleString() },
    {
      key: "link",
      label: "",
      render: (r) => (
        <Link href={`/applications/${r._id}`} className="text-primary hover:underline">
          Details
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Applications</h2>
      <DataTable
        columns={columns}
        rows={applications.map((a) => ({ ...a, id: a._id }))}
        emptyMessage="No applications yet."
      />
    </div>
  );
}
