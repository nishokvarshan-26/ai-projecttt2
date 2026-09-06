"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  Waves,
  FileText,
  LineChart,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { RiskBadge } from "@/components/common/risk-badge";
import { CopyButton } from "@/components/common/copy-button";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/controls";
import { DigitalTwinViewer } from "@/components/twin/digital-twin-viewer";
import { TwinStatus, TwinStateSummary } from "@/components/twin/twin-status";
import { ShapChart } from "@/components/charts/shap-chart";
import { AreaTrend } from "@/components/charts/trends";
import { ChartCard } from "@/components/charts/chart-card";
import { assessRisk, topContributions } from "@/lib/risk-engine";
import { MODEL_INFO } from "@/lib/config";
import { formatCoord } from "@/lib/utils";

export function TwinDetailClient({ lakeId }: { lakeId: string }) {
  const {
    lakes,
    selectLake,
    twin,
    twinLoading,
    scenarioActive,
    scenarioKind,
    startTwinScenario,
  } = useApp();
  const lake = lakes.find((l) => l.id === lakeId);

  useEffect(() => {
    if (lake) selectLake(lake.id);
  }, [lake, selectLake]);

  if (!lake) {
    return (
      <div className="panel p-10 text-center">
        <h1 className="font-display text-lg font-bold">Digital twin not found</h1>
        <p className="mt-2 text-sm text-muted">
          No monitored lake with identifier “{lakeId}” exists in the demo dataset.
        </p>
        <ButtonLink href="/digital-twin" variant="primary" size="sm" className="mt-4">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to Digital Twins
        </ButtonLink>
      </div>
    );
  }

  const risk = assessRisk(lake);
  const shapTop = topContributions(risk, 5);

  return (
    <div>
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {lake.name} — Digital Twin
            <RiskBadge level={risk.level} score={risk.score} />
          </span>
        }
        subtitle={`${lake.country} · ${formatCoord(lake.latitude, lake.longitude)} · ${lake.elevationM.toLocaleString()} m elevation`}
        dataStatus="DEMO"
        meta={
          <>
            <span className="font-mono">Model {MODEL_INFO.version}</span>
            <span>·</span>
            <span className="font-mono">Last obs {lake.lastObservationAt.slice(0, 16).replace("T", " ")} UTC</span>
            <CopyButton text={formatCoord(lake.latitude, lake.longitude)} label="Copy coords" />
          </>
        }
        actions={
          <>
            <ButtonLink href="/digital-twin" variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All twins
            </ButtonLink>
            <ButtonLink href={`/scenario-simulator`} variant="outline" size="sm">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Simulate
            </ButtonLink>
            <ButtonLink href={`/reports?lake=${lake.id}`} variant="primary" size="sm">
              <FileText className="h-3.5 w-3.5" aria-hidden /> Report
            </ButtonLink>
          </>
        }
      />

      {/* Viewer + status */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card elevated className="p-3 lg:col-span-2">
          {!twinLoading && twin.lakeId === lake.id ? (
            <DigitalTwinViewer
              lake={lake}
              twin={twin}
              scenarioActive={scenarioActive}
              scenarioKind={scenarioKind}
              onSimulate={() => startTwinScenario("LANDSLIDE")}
              className="h-[380px] sm:h-[460px]"
            />
          ) : (
            <div className="flex h-[380px] flex-col items-center justify-center gap-3 bg-bg sm:h-[460px]">
              <div className="skeleton h-2 w-44" />
              <p className="font-mono text-xs text-muted">Synchronizing {lake.name} twin…</p>
            </div>
          )}
        </Card>
        <div className="space-y-4">
          <Card elevated className="p-4">
            <CardTitle>Twin Status</CardTitle>
            <CardDescription className="mb-3">Synchronization & model state</CardDescription>
            <TwinStatus lake={lake} />
            <dl className="mt-3 space-y-1.5 text-xs">
              {[
                ["Model version", MODEL_INFO.version],
                ["Risk estimate", `${risk.score} / 100 · ${risk.level}`],
                ["Data status", "Demo data"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-border/60 pb-1.5">
                  <dt className="text-faint">{k}</dt>
                  <dd className="font-mono text-text">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card elevated className="p-4">
            <CardTitle>Why this risk level?</CardTitle>
            <CardDescription className="mb-3">Top prototype-model contributions</CardDescription>
            <ShapChart contributions={shapTop.slice(0, 4)} />
            <ButtonLink href="/risk-monitoring" variant="ghost" size="sm" className="mt-3 w-full">
              Full explanation <ArrowRight className="h-3 w-3" aria-hidden />
            </ButtonLink>
          </Card>
        </div>
      </section>

      {/* State sections */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card elevated>
          <CardHeader>
            <div>
              <CardTitle>Physical State</CardTitle>
              <CardDescription>Morphometry & water balance</CardDescription>
            </div>
            <DataStatusBadge status="DEMO" />
          </CardHeader>
          <CardContent>
            <dl className="space-y-1.5 text-xs">
              {[
                ["Lake area", `${lake.areaKm2} km²`],
                ["Estimated volume", `${lake.volumeMm3} Mm³`],
                ["Perimeter", `${lake.perimeterKm} km`],
                ["Elevation", `${lake.elevationM.toLocaleString()} m a.s.l.`],
                ["Water level anomaly", `${lake.waterLevelAnomalyM >= 0 ? "+" : ""}${lake.waterLevelAnomalyM} m`],
                ["Glacier distance", `${lake.glacierDistanceKm} km`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border/60 pb-1.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-mono text-text">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader>
            <div>
              <CardTitle>Environmental State</CardTitle>
              <CardDescription>Recent climate conditions</CardDescription>
            </div>
            <DataStatusBadge status="DEMO" />
          </CardHeader>
          <CardContent>
            <dl className="space-y-1.5 text-xs">
              {[
                ["Temperature (mean)", `${lake.temperatureC} °C`],
                ["Rainfall (monthly mean)", `${lake.rainfallMmPerMonth} mm`],
                [
                  "Recent precipitation",
                  lake.recentPrecipitation === "EXTREME"
                    ? "Extreme"
                    : lake.recentPrecipitation === "ELEVATED"
                      ? "Elevated"
                      : "Normal",
                ],
                ["Snow/ice indicator", "Seasonal accumulation present"],
                ["Environmental trend", lake.areaGrowthRatePctPerYear > 8 ? "Warming-driven expansion" : "Gradual change"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border/60 pb-1.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-mono text-text">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader>
            <div>
              <CardTitle>Geospatial State</CardTitle>
              <CardDescription>Terrain & downstream context</CardDescription>
            </div>
            <DataStatusBadge status="DEMO" />
          </CardHeader>
          <CardContent>
            <dl className="space-y-1.5 text-xs">
              {[
                ["Valley slope", `${lake.slopeDeg}°`],
                ["Surrounding relief", `${(lake.elevationM + 1400).toLocaleString()} m peaks`],
                ["Downstream direction", lake.downstreamDirection],
                ["Potentially exposed zones", lake.settlementsDownstream.join(", ")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-border/60 pb-1.5">
                  <dt className="shrink-0 text-muted">{k}</dt>
                  <dd className="text-right font-mono text-[11px] text-text">{v}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink href="/flood-mapping" variant="ghost" size="sm" className="mt-3 w-full">
              <Waves className="h-3.5 w-3.5" aria-hidden /> Inundation analysis
            </ButtonLink>
          </CardContent>
        </Card>
      </section>

      {/* Historical state */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Historical Area Evolution"
          description={`${lake.areaHistory[0].year} → ${lake.areaHistory[lake.areaHistory.length - 1].year}`}
          right={<DataStatusBadge status="DEMO" />}
          className="lg:col-span-2"
          footer={<span>Area grew from {lake.areaHistory[0].areaKm2} km² to {lake.areaKm2} km² (+{lake.historyAreaChangePct}% overall)</span>}
        >
          <AreaTrend
            data={lake.areaHistory.map((p) => ({ year: String(p.year), area: p.areaKm2 }))}
            xKey="year"
            yKey="area"
            unit="km²"
          />
        </ChartCard>

        <Card elevated>
          <CardHeader>
            <div>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Recorded observations</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-4">
              {[...lake.areaHistory].reverse().map((p, i) => (
                <li key={p.year} className="relative">
                  <span
                    className={`absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full border-2 ${
                      i === 0 ? "border-primary bg-primary shadow-[0_0_8px_#22d3ee]" : "border-border bg-elevated"
                    }`}
                    aria-hidden
                  />
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-text">
                      {i === 0 ? "Current" : p.year}
                    </p>
                    <p className="font-mono text-xs text-muted">{p.areaKm2} km²</p>
                  </div>
                  {i === 0 && (
                    <Badge tone="primary" className="mt-1">
                      Latest observation
                    </Badge>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
          <CardFooter>
            <span>Full analytics in Lake Analytics</span>
            <ButtonLink href="/lake-analytics" variant="ghost" size="sm">
              <LineChart className="h-3.5 w-3.5" aria-hidden />
            </ButtonLink>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
