"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview" },
  { href: "/jobs/discover", label: "Discover Jobs" },
  { href: "/jobs/recommended", label: "Recommended" },
  { href: "/approvals", label: "Pending Approvals" },
  { href: "/applications", label: "Applications" },
  { href: "/documents", label: "CV Management" },
  { href: "/profile", label: "Professional Profile" },
  { href: "/activity", label: "Agent Activity" },
  { href: "/sessions", label: "Browser Sessions" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card p-4">
      <div className="mb-8 px-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Job Approvals</p>
        <h1 className="text-lg font-semibold">Automation Hub</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
