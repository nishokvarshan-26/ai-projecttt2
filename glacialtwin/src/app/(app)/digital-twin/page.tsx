"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Thermometer, Mountain } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { RiskBadge } from "@/components/common/risk-badge";
import { TwinStatus } from "@/components/twin/twin-status";
import { DigitalTwinViewer } from "@/components/twin/digital-twin-viewer";
import { TwinScenarioControls } from "@/components/twin/twin-scenario-controls";
import { PipelineFlow } from "@/components/pipeline/pipeline-flow";
import { SystemHealth } from "@/components/system/system-health";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/feedback";
import { assessRisk } from "@/lib/risk-engine";
import { formatCoord } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DigitalTwinIndexPage() {
  const {
    lakes,
    selectLake,
    selectedLake,
    twin,
    twinLoading,
    scenarioActive,
    scenarioKind,
    startTwinScenario,
    resetTwinScenario,
  } = useApp();
  const viewerReady = !twinLoading && twin.lakeId === selectedLake.id;

  return (
    <div>
      <PageHeader
        title="Digital Twin"
        subtitle="Each monitored lake is represented as a continuously updated virtual state — geometry, environment, risk and history."
        dataStatus="DEMO"
        meta={<span className="font-mono">{lakes.length} twins active</span>}
      />

      {/* Live 3D twin hero */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card elevated className="p-3 lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <h2 className="font-display text-sm font-bold tracking-[0.08em] uppercase">Live 3D Twin</h2>
              <p className="text-xs text-muted">
                Virtual state of {selectedLake.name}
                {scenarioActive && (
                  <span className="ml-1 font-semibold text-high">· {scenarioKind} scenario</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TwinStatus lake={selectedLake} compact />
              <Link
                href={`/digital-twin/${selectedLake.id}`}
                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-semibold text-text transition-colors hover:border-primary/60 hover:text-primary"
              >
                Open full twin <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          </div>
          {viewerReady ? (
            <DigitalTwinViewer
              lake={selectedLake}
              twin={twin}
              scenarioActive={scenarioActive}
              scenarioKind={scenarioKind}
              onSimulate={() => startTwinScenario("LANDSLIDE")}
              className="h-[420px] sm:h-[500px]"
            />
          ) : (
            <div className="flex h-[420px] flex-col items-center justify-center gap-3 bg-bg sm:h-[500px]">
              <div className="skeleton h-2 w-44" />
              <p className="font-mono text-xs text-muted">Synchronizing {selectedLake.name} twin…</p>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card elevated className="p-4">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">Select lake</p>
            <div className="grid grid-cols-1 gap-1.5">
              {lakes.map((l) => {
                const r = assessRisk(l);
                const active = l.id === selectedLake.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => selectLake(l.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                      active
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-surface hover:border-primary/40 hover:bg-elevated"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-semibold text-text">{l.name}</span>
                      <span className="block font-mono text-[9px] text-faint">{formatCoord(l.latitude, l.longitude)}</span>
                    </span>
                    <RiskBadge level={r.level} score={r.score} size="sm" />
                  </button>
                );
              })}
            </div>
          </Card>

          <TwinScenarioControls
            scenarioActive={scenarioActive}
            scenarioKind={scenarioKind}
            twinStep={twin.step}
            onStart={startTwinScenario}
            onReset={resetTwinScenario}
          />

          <Card elevated className="p-4">
            <div className="flex items-center gap-3">
              <Badge tone="primary">Demo data</Badge>
              <p className="text-[11px] leading-snug text-muted">
                Twin states are populated by the demo data layer. Connect real satellite feeds to replace them.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {lakes.map((lake) => {
            const risk = assessRisk(lake);
            return (
              <Card
                key={lake.id}
                elevated
                className="group flex flex-col p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-base font-bold text-text group-hover:text-primary">
                      {lake.name}
                    </h2>
                    <p className="font-mono text-[10px] text-faint">
                      {formatCoord(lake.latitude, lake.longitude)} · {lake.elevationM.toLocaleString()} m
                    </p>
                  </div>
                  <RiskBadge level={risk.level} score={risk.score} size="sm" />
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Area", `${lake.areaKm2} km²`],
                    ["Volume", `${lake.volumeMm3} Mm³`],
                    ["Growth", `+${lake.areaGrowthRatePctPerYear}%/yr`],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-md border border-border bg-surface px-1.5 py-1.5">
                      <dt className="text-[9px] tracking-wider text-faint uppercase">{k}</dt>
                      <dd className="font-mono text-[11px] font-semibold text-text">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Thermometer className="h-3 w-3" aria-hidden /> {lake.temperatureC}°C
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mountain className="h-3 w-3" aria-hidden /> glacier {lake.glacierDistanceKm} km
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden /> {lake.country}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                  <TwinStatus lake={lake} compact />
                  <Link
                    href={`/digital-twin/${lake.id}`}
                    onClick={() => selectLake(lake.id)}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-primary/15 px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
                  >
                    Open twin <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card elevated className="p-4">
            <h2 className="font-display text-sm font-bold tracking-[0.08em] uppercase">Twin Update Pipeline</h2>
            <p className="mt-0.5 mb-3 text-xs text-muted">
              How observations flow into each lake's virtual state.
            </p>
            <PipelineFlow vertical />
          </Card>
          <SystemHealth />
          <Card elevated className="p-4">
            <Badge tone="primary">Demo data</Badge>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Twin states in this environment are populated by the demo data layer. Connect real
              satellite and environmental feeds to replace them without changing the application.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
