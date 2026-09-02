"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Thermometer, Mountain } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { RiskBadge } from "@/components/common/risk-badge";
import { TwinStatus } from "@/components/twin/twin-status";
import { PipelineFlow } from "@/components/pipeline/pipeline-flow";
import { SystemHealth } from "@/components/system/system-health";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/feedback";
import { assessRisk } from "@/lib/risk-engine";
import { formatCoord } from "@/lib/utils";

export default function DigitalTwinIndexPage() {
  const { lakes, selectLake } = useApp();

  return (
    <div>
      <PageHeader
        title="Digital Twin"
        subtitle="Each monitored lake is represented as a continuously updated virtual state — geometry, environment, risk and history."
        dataStatus="DEMO"
        meta={<span className="font-mono">{lakes.length} twins active</span>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
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
