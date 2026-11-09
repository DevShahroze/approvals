"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);

  async function load() {
    const data = await apiFetch("/api/documents");
    setDocuments(data.documents || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function upload() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("type", "cv");
    form.append("isMaster", "true");
    const auth = (await import("@/lib/firebase/client")).getClientAuth();
    const headers = {};
    if (auth?.currentUser) {
      headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
    }
    await fetch("/api/documents/upload", { method: "POST", body: form, headers });
    setFile(null);
    await load();
  }

  const columns = [
    { key: "title", label: "Title", render: (r) => r.title },
    { key: "type", label: "Type", render: (r) => r.type },
    { key: "version", label: "Ver.", render: (r) => r.version },
    { key: "master", label: "Master", render: (r) => (r.isMaster ? "Yes" : "") },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">CV Management</h2>
      <div className="flex flex-wrap items-center gap-2">
        <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0])} />
        <Button onClick={upload} disabled={!file}>
          Upload master CV
        </Button>
      </div>
      <DataTable columns={columns} rows={documents.map((d) => ({ ...d, id: d._id }))} />
    </div>
  );
}
