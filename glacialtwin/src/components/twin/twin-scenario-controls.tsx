"use client";

import { CloudRain, Activity, Mountain, Waves, Layers, RotateCcw } from "lucide-react";
import type { ScenarioKind } from "@/lib/twin-types";
import { SCENARIO_META } from "@/lib/twin-engine";
import { Badge, Progress } from "@/components/ui/feedback";
import { Button } from "@/components/ui/controls";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const OPTIONS: Array<{ kind: ScenarioKind; icon: React.ReactNode }> = [
  { kind: "HEAVY_RAINFALL", icon: <CloudRain className="h-3.5 w-3.5" aria-hidden /> },
  { kind: "EARTHQUAKE", icon: <Activity className="h-3.5 w-3.5" aria-hidden /> },
  { kind: "LANDSLIDE", icon: <Mountain className="h-3.5 w-3.5" aria-hidden /> },
  { kind: "LAKE_RISE", icon: <Waves className="h-3.5 w-3.5" aria-hidden /> },
  { kind: "COMPOUND", icon: <Layers className="h-3.5 w-3.5" aria-hidden /> },
];

export function TwinScenarioControls({
  scenarioActive,
  scenarioKind,
  twinStep,
  onStart,
  onReset,
}: {
  scenarioActive: boolean;
  scenarioKind: ScenarioKind;
  twinStep: number;
  onStart: (kind: ScenarioKind) => void;
  onReset: () => void;
}) {
  return (
    <Card elevated className="p-4">
      <CardHeader className="px-0 pt-0">
        <div>
          <CardTitle>Scenario Simulation</CardTitle>
          <CardDescription>Drive the live twin through hazard chains</CardDescription>
        </div>
        <Badge tone={scenarioActive ? "high" : "neutral"}>{scenarioActive ? "Simulating" : "Idle"}</Badge>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OPTIONS.map((o) => {
            const meta = SCENARIO_META[o.kind];
            const active = scenarioActive && scenarioKind === o.kind;
            return (
              <button
                key={o.kind}
                type="button"
                disabled={scenarioActive && !active}
                onClick={() => onStart(o.kind)}
                title={meta.description}
                className={`cursor-pointer rounded-md border p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                  active
                    ? "border-high/60 bg-high/15"
                    : "border-border bg-surface hover:border-primary/50 hover:bg-elevated"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={active ? "text-high" : "text-primary"}>{o.icon}</span>
                  <span className="text-[11px] font-semibold text-text">{meta.label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-high" aria-hidden />}
                </span>
                <span className="mt-1 block text-[9px] leading-snug text-muted">{meta.description}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-md border border-border bg-surface p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-faint uppercase">Scenario progress</span>
            <span className="font-mono text-[10px] font-semibold text-primary">
              {scenarioActive ? `${Math.round(twinStep * 100)}%` : "—"}
            </span>
          </div>
          <Progress value={scenarioActive ? twinStep * 100 : 0} color={scenarioActive ? "#F97316" : "#22D3EE"} height={4} />
        </div>

        <Button
          variant={scenarioActive ? "danger" : "outline"}
          size="md"
          className="mt-3 w-full"
          disabled={!scenarioActive}
          onClick={onReset}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset to baseline
        </Button>

        <p className="mt-2 font-mono text-[9px] text-faint">
          Compound disaster chains earthquake → slope failure → GLOF scenario. Prototype demo.
        </p>
      </CardContent>
    </Card>
  );
}