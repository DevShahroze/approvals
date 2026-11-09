import { Badge } from "@/components/ui/badge";

export function DataTable({ columns, rows, emptyMessage = "No records" }) {
  if (!rows?.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-left text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border hover:bg-accent/30">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    active: "success",
    pending: "warning",
    approved: "success",
    submitted: "success",
    failed: "danger",
    awaiting_approval: "warning",
    needs_human: "warning",
    rejected: "danger",
    interview: "success",
    draft: "secondary",
  };
  return <Badge variant={map[status] || "outline"}>{status}</Badge>;
}
