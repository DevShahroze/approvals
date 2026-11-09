"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <p className="text-sm text-muted-foreground">
        Signed in as <span className="text-foreground">{user?.email || "—"}</span>
      </p>
      <Button variant="outline" size="sm" onClick={() => logout()}>
        Sign out
      </Button>
    </header>
  );
}
