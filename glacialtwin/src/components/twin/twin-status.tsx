"use client";

import { Check, CircleDashed, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import type { Lake } from "@/lib/types";

const STATUS_META = {
  SYNCED: {
    label: "Twin synchronized",
    tone: "low" as const,
    dot: "bg-low",
    text: "text-low",
  },
  PENDING: {
    label: "Awaiting new satellite observation",
    tone: "moderate" as const,
    dot: "bg-moderate",
    text: "text-moderate",
  },
  ISSUE: {
    label: "Data synchronization issue",
    tone: "critical" as const,
    dot: "bg-critical",
    text: "text-critical",
  },
} as const;

export function TwinStatus({
  lake,
  compact = false,
}: {
  lake: Lake;
  compact?: boolean;
}) {
  const meta = STATUS_META[lake.twinStatus];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-2",
        compact && "px-2.5 py-1.5"
      )}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60 animate-pulse-dot", meta.dot)} />
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", meta.dot)} />
      </span>
      <div className="leading-tight">
        <p className={cn("text-xs font-semibold", meta.text)}>{meta.label}</p>
        {!compact && (
          <p className="font-mono text-[10px] text-faint">
            Last synchronized: {lake.twinSyncMinutesAgo} min ago · {lake.lastObservationAt.slice(0, 10)}
          </p>
        )}
      </div>
    </div>
  );
}

export function TwinSyncChecklist({
  steps,
}: {
  steps: Array<{ label: string; state: "done" | "active" | "pending" }>;
}) {
  return (
    <ul className="space-y-2 text-xs" aria-label="Digital twin synchronization progress">
      {steps.map((s) => (
        <li key={s.label} className="flex items-center gap-2">
          {s.state === "done" ? (
            <Check className="h-3.5 w-3.5 text-low" aria-hidden />
          ) : s.state === "active" ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
          ) : (
            <CircleDashed className="h-3.5 w-3.5 text-faint" aria-hidden />
          )}
          <span className={cn(s.state === "pending" ? "text-faint" : "text-muted")}>{s.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function TwinStateSummary({ lake }: { lake: Lake }) {
  const rows: Array<[string, string]> = [
    ["Lake ID", lake.id],
    ["Name", lake.name],
    ["Coordinates", `${lake.latitude.toFixed(4)}, ${lake.longitude.toFixed(4)}`],
    ["Elevation", `${lake.elevationM.toLocaleString()} m`],
    ["Area", `${lake.areaKm2} km²`],
    ["Est. volume", `${lake.volumeMm3} Mm³`],
    ["Water level", `${lake.waterLevelAnomalyM >= 0 ? "+" : ""}${lake.waterLevelAnomalyM} m`],
    ["Perimeter", `${lake.perimeterKm} km`],
    ["Growth rate", `+${lake.areaGrowthRatePctPerYear}% / yr`],
    ["Temperature", `${lake.temperatureC} °C`],
    ["Rainfall", `${lake.rainfallMmPerMonth} mm / month`],
    ["Glacier distance", `${lake.glacierDistanceKm} km`],
    ["Slope", `${lake.slopeDeg}°`],
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5">
          <dt className="text-[11px] tracking-wide text-faint uppercase">{k}</dt>
          <dd className="font-mono text-xs text-text">{v}</dd>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 sm:col-span-2 lg:col-span-3">
        <dt className="text-[11px] tracking-wide text-faint uppercase">Data status</dt>
        <dd>
          <Badge tone="primary">Demo data</Badge>
        </dd>
      </div>
    </dl>
  );
}
