"use client";

import type { TwinState } from "@/lib/twin-types";
import { hashString, mulberry32 } from "@/lib/utils";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const STATUS_COLOR: Record<string, string> = {
  ALERT: "#EF4444",
  WARNING: "#F59E0B",
  OK: "#10B981",
};

function spark(seedStr: string) {
  const rand = mulberry32(hashString(`tel:${seedStr}`));
  let v = 34 + rand() * 28;
  const out: number[] = [];
  for (let i = 0; i < 14; i++) {
    out.push(Math.round(v));
    v += (rand() - 0.44) * 20;
    v = Math.max(6, Math.min(100, v));
  }
  return out;
}

function LiveDot({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "#10B981";
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
        style={{ background: color }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

export function TwinTelemetry({ twin }: { twin: TwinState }) {
  return (
    <Card elevated className="p-4">
      <CardHeader className="px-0 pt-0">
        <div>
          <CardTitle>Live Telemetry</CardTitle>
          <CardDescription>
            Streaming from the twin sensor network · {twin.sensors.length} instruments
          </CardDescription>
        </div>
        <DataStatusBadge status="DEMO" />
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
          {twin.sensors.map((s) => {
            const color = STATUS_COLOR[s.status] ?? "#10B981";
            const up = s.trend === "up";
            const down = s.trend === "down";
            return (
              <div key={s.id} className="rounded-md border border-border bg-surface p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[9px] tracking-wider text-faint">{s.code}</span>
                  <LiveDot status={s.status} />
                </div>
                <p className="mt-1 truncate text-[11px] font-medium text-text" title={s.label}>
                  {s.label}
                </p>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span className="font-mono text-base leading-none font-bold tabular-nums" style={{ color }}>
                    {s.value.toFixed(s.decimals)}
                  </span>
                  <span className="font-mono text-[9px] text-faint">{s.unit}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <div className="flex items-end gap-[3px]" aria-hidden>
                    {spark(s.code).map((v, i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-sm"
                        style={{ height: `${(v / 100) * 18}px`, background: color, opacity: 0.35 + (v / 100) * 0.65 }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] font-semibold" style={{ color }} title={s.status}>
                    {up ? "↑" : down ? "↓" : "→"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2.5 font-mono text-[9px] text-faint">
          {twin.syncSecondsAgo === 0
            ? "Last sync · just now"
            : `Last sync · ~${Math.min(twin.syncSecondsAgo, 60)}s`}{" "}
          · battery 72–98% · prototype demo values
        </p>
      </CardContent>
    </Card>
  );
}