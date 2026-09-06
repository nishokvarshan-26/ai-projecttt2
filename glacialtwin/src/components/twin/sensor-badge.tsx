"use client";

import type { SensorState } from "@/lib/twin-types";
import { Badge } from "@/components/ui/feedback";

const STATUS_TONE: Record<string, "low" | "moderate" | "critical"> = {
  OK: "low",
  WARNING: "moderate",
  ALERT: "critical",
};

const STATUS_COLOR: Record<string, string> = {
  ALERT: "#EF4444",
  WARNING: "#F59E0B",
  OK: "#10B981",
};

export function SensorBadge({ sensor, detail }: { sensor: SensorState; detail?: boolean }) {
  const color = STATUS_COLOR[sensor.status] ?? "#10B981";
  return (
    <div className="rounded-md border border-border bg-surface p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] tracking-wider text-faint">{sensor.code}</span>
        <Badge tone={STATUS_TONE[sensor.status] ?? "low"}>{sensor.status}</Badge>
      </div>
      <p className="mt-1 truncate text-[11px] font-medium text-text" title={sensor.label}>
        {sensor.label}
      </p>
      <p className="mt-1 font-mono text-base leading-none font-bold tabular-nums" style={{ color }}>
        {sensor.value.toFixed(sensor.decimals)}
        <span className="ml-1 text-[9px] font-normal text-faint">{sensor.unit}</span>
      </p>
      {detail && (
        <p className="mt-1.5 font-mono text-[9px] text-faint">
          bat {sensor.batteryPct}% · sync {sensor.lastUpdateSecAgo}s
        </p>
      )}
    </div>
  );
}