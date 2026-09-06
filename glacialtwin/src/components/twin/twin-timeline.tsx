"use client";

import { useEffect, useRef } from "react";
import type { TwinState, TwinTimelineEvent } from "@/lib/twin-types";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const CAT_COLORS: Record<TwinTimelineEvent["category"], string> = {
  data: "#64748B",
  sensor: "#22D3EE",
  slope: "#F59E0B",
  seismic: "#F97316",
  lake: "#38BDF8",
  risk: "#818CF8",
  alert: "#EF4444",
  flood: "#FF6B4A",
};

const LEVEL_TONE: Record<TwinTimelineEvent["level"], "low" | "moderate" | "high" | "critical"> = {
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
  CRITICAL: "critical",
};

export function TwinTimeline({ twin }: { twin: TwinState }) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [twin.timeline.length]);

  return (
    <Card elevated className="flex flex-col p-4">
      <CardHeader className="px-0 pt-0">
        <div>
          <CardTitle>Event Timeline</CardTitle>
          <CardDescription>Live events from the active twin state</CardDescription>
        </div>
        <Badge tone={twin.step > 0 && twin.step < 1 ? "high" : "neutral"}>
          {twin.timeline.length} events
        </Badge>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-0">
        {twin.timeline.length === 0 ? (
          <EmptyState
            title="No live events yet"
            description="Run a scenario to populate the twin event timeline with detected conditions."
          />
        ) : (
          <ol ref={listRef} className="max-h-72 space-y-2 overflow-y-auto pr-1 no-scrollbar">
            {twin.timeline.map((ev) => (
              <li key={ev.id} className="flex items-start gap-2.5 rounded-md border border-border/60 bg-surface/60 px-2.5 py-2">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: CAT_COLORS[ev.category], boxShadow: `0 0 8px ${CAT_COLORS[ev.category]}66` }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] leading-snug text-text">{ev.label}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-faint">T+{ev.time}</p>
                </div>
                <Badge tone={LEVEL_TONE[ev.level]}> {ev.level} </Badge>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-2 font-mono text-[9px] text-faint">
          Scenarios are heuristic what-if estimates — not forecasts of real events.
        </p>
      </CardContent>
    </Card>
  );
}