"use client";

import { Mountain, Footprints, Activity, Droplets, Gauge, Move3d } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { MetricCard } from "@/components/common/metric-card";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, Progress } from "@/components/ui/feedback";
import { Button } from "@/components/ui/controls";
import { TwinScenarioControls } from "@/components/twin/twin-scenario-controls";
import { SensorBadge } from "@/components/twin/sensor-badge";
import { failureColor } from "@/lib/twin-engine";
import { MODEL_INFO } from "@/lib/config";

function zoneLevel(pct: number) {
  return pct >= 76 ? "CRITICAL" : pct >= 51 ? "HIGH" : pct >= 26 ? "MODERATE" : "LOW";
}

const ZONE_TONE: Record<string, "low" | "moderate" | "high" | "critical"> = {
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
  CRITICAL: "critical",
};

export default function LandslidePage() {
  const {
    selectedLake,
    twin,
    scenarioActive,
    startTwinScenario,
    resetTwinScenario,
    twinLoading,
  } = useApp();

  const failing = twin.slopes.filter((s) => s.failing).length;
  const maxFail = Math.max(...twin.slopes.map((s) => s.failureProbPct), 0);
  const avgDisp = twin.slopes.reduce((a, s) => a + s.displacementMmDay, 0) / Math.max(1, twin.slopes.length);
  const scenario = twin.scenario;

  const evidence = twin.sensors.filter((s) =>
    ["soil", "strain", "inclino", "crack", "gnss", "pore"].includes(s.type)
  );

  return (
    <div>
      <PageHeader
        title="Landslide Intelligence"
        subtitle={`Slope stability, displacement and failure probability for ${selectedLake.name} and its catchment.`}
        dataStatus="MODEL_PREDICTION"
        meta={
          <>
            <span className="font-mono">Model {MODEL_INFO.version}</span>
            <span>·</span>
            <span className="font-mono">{twin.slopes.length} zones monitored</span>
          </>
        }
        actions={
          <Button variant={scenarioActive ? "danger" : "outline"} size="sm" onClick={resetTwinScenario} disabled={!scenarioActive}>
            Reset to baseline
          </Button>
        }
      />

      {scenarioActive && (scenario === "LANDSLIDE" || scenario === "COMPOUND") && (
        <Card elevated className="mt-4 border-high/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-high/40 bg-high/15 text-high">
                <Mountain className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-text">Landslide chain in progress</p>
                <p className="text-xs text-muted">
                  Ground movement detected → debris approaching the lake margin → generated wave.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="high">Simulating</Badge>
              <span className="font-mono text-xs text-high">{Math.round(twin.step * 100)}%</span>
            </div>
          </div>
        </Card>
      )}

      {/* KPIs */}
      <section aria-label="Landslide metrics" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Mountain className="h-3.5 w-3.5" />}
          label="Slope zones"
          value={twin.slopes.length}
          sublabel={`${selectedLake.name} catchment`}
          accent="#22D3EE"
          badge={<DataStatusBadge status="MODEL_PREDICTION" />}
        />
        <MetricCard
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Zones failing"
          value={failing}
          sublabel={failing > 0 ? "Active failure detected" : "No active failure"}
          accent="#EF4444"
        />
        <MetricCard
          icon={<Gauge className="h-3.5 w-3.5" />}
          label="Max failure prob."
          value={maxFail}
          digits={0}
          suffix="%"
          sublabel={zoneLevel(maxFail).toLowerCase()}
          accent={failureColor(maxFail)}
          footer={<Progress value={maxFail} color={failureColor(maxFail)} height={4} label="Max failure probability" />}
        />
        <MetricCard
          icon={<Move3d className="h-3.5 w-3.5" />}
          label="Avg displacement"
          value={avgDisp}
          digits={1}
          suffix=" mm/day"
          sublabel="Baseline < 1.5 mm/day"
          accent="#F59E0B"
        />
      </section>

      {/* Zone matrix */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm font-bold tracking-[0.08em] uppercase">Slope Zone Matrix</h2>
            <div className="flex flex-wrap items-center gap-1.5">
              {(["LOW", "MODERATE", "HIGH", "CRITICAL"] as const).map((l) => (
                <Badge key={l} tone={ZONE_TONE[l]}>
                  {l}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {twin.slopes.map((s) => {
              const level = zoneLevel(s.failureProbPct);
              const color = failureColor(s.failureProbPct);
              return (
                <Card key={s.id} elevated className={`p-4 ${s.failing ? "border-high/60 bg-high/5" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-sm font-bold text-text">{s.name}</p>
                      <p className="font-mono text-[9px] text-faint">Zone {s.id}</p>
                    </div>
                    {s.failing ? (
                      <Badge tone="critical">Failing</Badge>
                    ) : (
                      <Badge tone={ZONE_TONE[level]}>{level}</Badge>
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <Row k="Stability" v={`${s.stabilityPct.toFixed(0)}%`} />
                    <Row k="Ground displacement" v={`${s.displacementMmDay.toFixed(1)} mm/day`} highlight />
                    <Row k="Pore pressure" v={`${s.porePressureKPa.toFixed(1)} kPa`} />
                    <Row k="Soil moisture" v={`${s.soilMoisturePct.toFixed(0)}%`} />
                    <Row k="Rainfall (live)" v={`${twin.telemetry.rainfallMmHr.toFixed(1)} mm/hr`} />
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] tracking-wider text-faint uppercase">Failure probability</span>
                      <span className="font-mono text-sm font-bold" style={{ color }}>
                        {s.failureProbPct.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={s.failureProbPct} color={color} height={5} />
                  </div>

                  <Button
                    variant={s.failing ? "danger" : "outline"}
                    size="sm"
                    className="mt-3 w-full"
                    disabled={scenarioActive}
                    onClick={() => startTwinScenario("LANDSLIDE")}
                  >
                    <Footprints className="h-3 w-3" aria-hidden /> Simulate failure
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Evidence */}
          <Card elevated className="p-4">
            <CardHeader className="px-0 pt-0">
              <div>
                <CardTitle>Sensor Evidence</CardTitle>
                <CardDescription>Instruments feeding the slope model (live twin state)</CardDescription>
              </div>
              <DataStatusBadge status="DEMO" />
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {evidence.map((s) => (
                  <SensorBadge key={s.id} sensor={s} detail />
                ))}
              </div>
              <p className="mt-2 font-mono text-[9px] text-faint">
                {twinLoading ? "Synchronizing twin…" : "Streaming from live twin state · prototype values"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <TwinScenarioControls
            scenarioActive={scenarioActive}
            scenarioKind={twin.scenario}
            twinStep={twin.step}
            onStart={startTwinScenario}
            onReset={resetTwinScenario}
          />

          <Card elevated className="p-4">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">Method (prototype)</p>
            <ul className="space-y-2 text-xs text-muted">
              <li className="flex gap-2">
                <span className="text-primary">1.</span>
                Displacement, pore pressure and soil moisture are combined into a heuristic failure probability.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">2.</span>
                Rainfall and seismic stress raise slope instability during scenarios.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">3.</span>
                A failing zone feeds debris into the lake margin — a trigger for potential GLOF scenarios.
              </li>
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-high">
              <Droplets className="h-3.5 w-3.5" aria-hidden />
              Prototype heuristic — not a validated early-warning system.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/50 pb-1">
      <dt className="text-[10px] tracking-wide text-faint uppercase">{k}</dt>
      <dd className={`font-mono text-[11px] ${highlight ? "font-semibold text-text" : "text-muted"}`}>{v}</dd>
    </div>
  );
}