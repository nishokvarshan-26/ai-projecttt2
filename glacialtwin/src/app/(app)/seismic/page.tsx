"use client";

import { Activity, RadioTower, Waves, BellRing, CircleDot } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, Progress } from "@/components/ui/feedback";
import { TwinScenarioControls } from "@/components/twin/twin-scenario-controls";
import { SensorBadge } from "@/components/twin/sensor-badge";
import { MODEL_INFO } from "@/lib/config";

function activityLabel(act: number) {
  if (act >= 0.85) return { label: "Very active", tone: "critical" as const, color: "#EF4444" };
  if (act >= 0.6) return { label: "Elevated", tone: "high" as const, color: "#F97316" };
  if (act >= 0.3) return { label: "Moderate", tone: "moderate" as const, color: "#EAB308" };
  return { label: "Quiet", tone: "low" as const, color: "#22C55E" };
}

export default function SeismicPage() {
  const {
    selectedLake,
    twin,
    scenarioActive,
    startTwinScenario,
    resetTwinScenario,
  } = useApp();

  const act = activityLabel(twin.seismic.activity);
  const seismometers = twin.sensors.filter((s) => ["seismic", "strain", "crack", "inclino", "gnss"].includes(s.type));
  const detected = twin.seismic.magnitude !== null;

  return (
    <div>
      <PageHeader
        title="Seismic Intelligence"
        subtitle={`Near-real-time activity monitoring for ${selectedLake.name} and the surrounding moraine complex.`}
        dataStatus="MODEL_PREDICTION"
        meta={
          <>
            <span className="font-mono">Model {MODEL_INFO.version}</span>
            <span>·</span>
            <span className="font-mono">Detection-only · no forecasting</span>
          </>
        }
        actions={
          <Badge tone={detected ? "high" : "neutral"}>
            {detected ? `Event detected · M${twin.seismic.magnitude?.toFixed(1) ?? "—"}` : "Network idle"}
          </Badge>
        }
      />

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Activity meter */}
          <Card elevated className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">Ground activity</p>
                <h2 className="font-display text-lg font-bold text-text">
                  {act.label}
                </h2>
              </div>
              <div className="text-right">
                <Badge tone={act.tone}>{twin.seismic.activity >= 0.3 ? "Active" : "Stable"}</Badge>
                <p className="mt-1 font-mono text-[10px] text-faint">index 0–1</p>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={twin.seismic.activity * 100} color={act.color} height={10} label="Ground activity index" />
            </div>
            <p className="mt-2 font-mono text-[10px] text-faint">
              Prototype ground-motion synthesis from the live twin state.
            </p>
          </Card>

          {/* Recent event */}
          <Card elevated className="p-4">
            <CardHeader className="px-0 pt-0">
              <div>
                <CardTitle>Detected Events</CardTitle>
                <CardDescription>Seismic events reported by the monitoring network</CardDescription>
              </div>
              <DataStatusBadge status="DEMO" />
            </CardHeader>
            <CardContent className="px-0">
              {detected ? (
                <div className="space-y-2">
                  <div className="rounded-md border border-high/40 bg-high/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-high">
                        <BellRing className="h-3.5 w-3.5" aria-hidden />
                        <span className="text-sm font-semibold">
                          M{twin.seismic.magnitude?.toFixed(1)} detected {twin.seismic.eventAt ? `at T+${twin.seismic.eventAt}` : ""}
                        </span>
                      </span>
                      <Badge tone="high">Detected</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">{twin.seismic.eventLabel}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat k="Magnitude" v={`${twin.seismic.magnitude?.toFixed(1) ?? "—"} Mw`} />
                    <Stat k="Depth" v={`${twin.seismic.depthKm?.toFixed(0) ?? "—"} km`} />
                    <Stat k="Distance" v={`~${twin.seismic.distanceKm} km`} />
                    <Stat k="Ground motion" v={`${(twin.seismic.activity * 100).toFixed(0)} idx`} />
                  </dl>
                  <p className="mt-2 text-[11px] leading-snug text-muted">
                    During earthquake scenarios the detected event stresses the moraine dam and reduces slope
                    stability — a possible trigger for the compound-GLOF chain.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-border bg-surface p-3">
                  <div className="flex items-center gap-2 text-faint">
                    <Activity className="h-3.5 w-3.5" aria-hidden />
                    <span className="text-xs text-muted">
                      No events detected — network in surveillance mode. Run an earthquake scenario to see a
                      detected event drive the twin.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seismometer status */}
          <Card elevated className="p-4">
            <CardHeader className="px-0 pt-0">
              <div>
                <CardTitle>Seismic Instruments</CardTitle>
                <CardDescription>Geophone and deformation sensors on the live twin</CardDescription>
              </div>
              <DataStatusBadge status="DEMO" />
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {seismometers.map((s) => (
                  <SensorBadge key={s.id} sensor={s} detail />
                ))}
              </div>
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
            <p className="mb-2 text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">Detection protocol</p>
            <ul className="space-y-2.5 text-xs text-muted">
              <li className="flex gap-2">
                <RadioTower className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                Seismic events are reported as <span className="text-text">detected</span> — the prototype does
                not forecast earthquakes.
              </li>
              <li className="flex gap-2">
                <Waves className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                A detected event raises moraine-dam stress and slope instability in the twin state.
              </li>
              <li className="flex gap-2">
                <CircleDot className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                Follow-on GLOF outputs are labelled scenario estimates, not predictions.
              </li>
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
              <Activity className="h-3.5 w-3.5" aria-hidden />
              Events shown are synthesized demo telemetry.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-2.5 py-2">
      <p className="text-[9px] tracking-wider text-faint uppercase">{k}</p>
      <p className="font-mono text-xs font-semibold text-text">{v}</p>
    </div>
  );
}