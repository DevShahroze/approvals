"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { DataTable, StatusBadge } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);

  async function load() {
    const data = await apiFetch("/api/approvals?status=pending");
    setApprovals(data.approvals || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id, queueSubmit) {
    await apiFetch(`/api/approvals/${id}`, {
      method: "POST",
      body: JSON.stringify({ action: "approve", queueSubmit }),
    });
    await load();
  }

  async function reject(id) {
    await apiFetch(`/api/approvals/${id}`, {
      method: "POST",
      body: JSON.stringify({ action: "reject" }),
    });
    await load();
  }

  const columns = [
    { key: "job", label: "Job", render: (r) => r.jobId?.title || "—" },
    { key: "company", label: "Company", render: (r) => r.jobId?.company || "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          {r.applicationId?._id && (
            <Link href={`/applications/${r.applicationId._id}`} className="text-xs text-primary hover:underline">
              Review
            </Link>
          )}
          <Button size="sm" onClick={() => approve(r._id, false)}>
            Approve
          </Button>
          <Button size="sm" variant="secondary" onClick={() => approve(r._id, true)}>
            Approve & queue submit
          </Button>
          <Button size="sm" variant="outline" onClick={() => reject(r._id)}>
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Pending Approvals</h2>
      <p className="text-sm text-muted-foreground">Nothing is submitted without your explicit approval here.</p>
      <DataTable columns={columns} rows={approvals.map((a) => ({ ...a, id: a._id }))} emptyMessage="No pending approvals." />
    </div>
  );
}
