import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCards({ stats }) {
  const items = [
    { label: "Jobs discovered", value: stats.totalJobs ?? 0 },
    { label: "Matching profile", value: stats.matchingJobs ?? 0 },
    { label: "Awaiting approval", value: stats.pendingApprovals ?? 0 },
    { label: "Submitted", value: stats.submitted ?? 0 },
    { label: "Interviews", value: stats.interviews ?? 0 },
    { label: "Rejections", value: stats.rejections ?? 0 },
    { label: "Success rate", value: `${stats.successRate ?? 0}%` },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
