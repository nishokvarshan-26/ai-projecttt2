"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/feedback";
import { DataStatusBadge } from "./data-status-badge";
import type { DataStatus } from "@/lib/types";

function crumbs(pathname: string): Array<{ href: string; label: string }> {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p, i) => ({
    href: "/" + parts.slice(0, i + 1).join("/"),
    label: p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}

export function PageHeader({
  title,
  subtitle,
  actions,
  meta,
  dataStatus,
}: {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  dataStatus?: DataStatus;
}) {
  const pathname = usePathname();
  const items = crumbs(pathname);

  return (
    <header className="mb-5">
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-[11px] text-faint">
        <Link href="/dashboard" className="inline-flex items-center gap-1 hover:text-muted">
          <Home className="h-3 w-3" aria-hidden /> Command Center
        </Link>
        {items.map((c) => (
          <span key={c.href} className="inline-flex items-center gap-1">
            <ChevronRight className="h-3 w-3" aria-hidden />
            <Link href={c.href} className="hover:text-muted capitalize">
              {c.label}
            </Link>
          </span>
        ))}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1 max-w-2xl text-[13px] text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {(meta || dataStatus) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-faint">
          {dataStatus && <DataStatusBadge status={dataStatus} />}
          {meta}
        </div>
      )}
    </header>
  );
}

export function DemoBanner() {
  return (
    <div className="no-print flex items-center justify-center gap-2 border-b border-moderate/25 bg-moderate/[0.06] px-4 py-1.5 text-[11px] text-moderate">
      <Badge tone="warning">Demo environment</Badge>
      <span className="hidden sm:inline">
        All observations in this environment are demo data processed by a prototype model.
      </span>
      <span className="sm:hidden">Demo data · prototype model.</span>
    </div>
  );
}
