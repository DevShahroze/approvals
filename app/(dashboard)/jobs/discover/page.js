"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, StatusBadge } from "@/components/dashboard/data-table";

export default function DiscoverJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const data = await apiFetch(`/api/jobs?q=${encodeURIComponent(q)}`);
    setJobs(data.jobs || []);
  }

  useEffect(() => {
    load().catch(() => setJobs([]));
  }, []);

  async function runDiscover() {
    setDiscovering(true);
    setMessage("");
    try {
      const data = await apiFetch("/api/jobs/discover", {
        method: "POST",
        body: JSON.stringify({ filters: { query: q } }),
      });
      setMessage(JSON.stringify(data.results || data, null, 2));
      await load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setDiscovering(false);
    }
  }

  const columns = [
    { key: "title", label: "Title", render: (r) => r.title },
    { key: "company", label: "Company", render: (r) => r.company },
    { key: "source", label: "Source", render: (r) => r.source },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <Link className="text-primary hover:underline" href={`/jobs/${r._id}`}>
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Discover Jobs</h2>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Button onClick={load}>Search</Button>
        <Button onClick={runDiscover} disabled={discovering}>
          {discovering ? "Running discovery…" : "Run discovery"}
        </Button>
      </div>
      {message && <pre className="overflow-x-auto rounded-md bg-secondary p-3 text-xs">{message}</pre>}
      <DataTable columns={columns} rows={jobs.map((j) => ({ ...j, id: j._id }))} emptyMessage="No jobs yet — enable providers in Settings and run discovery." />
    </div>
  );
}
