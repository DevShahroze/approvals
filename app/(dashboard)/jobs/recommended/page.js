"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { DataTable } from "@/components/dashboard/data-table";

export default function RecommendedJobsPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/jobs/matches")
      .then((d) => setMatches(d.matches || []))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "title", label: "Job", render: (r) => r.jobId?.title || "—" },
    { key: "company", label: "Company", render: (r) => r.jobId?.company || "—" },
    { key: "score", label: "Score", render: (r) => `${r.score}%` },
    {
      key: "skills",
      label: "Matching skills",
      render: (r) => (r.matchingSkills || []).slice(0, 5).join(", "),
    },
    {
      key: "link",
      label: "",
      render: (r) =>
        r.jobId?._id ? (
          <Link href={`/jobs/${r.jobId._id}`} className="text-primary hover:underline">
            Details
          </Link>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Recommended Jobs</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={matches.map((m) => ({ ...m, id: m._id }))}
          emptyMessage="No matches yet. Open a job and run Match."
        />
      )}
    </div>
  );
}
