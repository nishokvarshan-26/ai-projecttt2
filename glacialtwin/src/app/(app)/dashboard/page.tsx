"use client";

import Link from "next/link";
import {
  Gauge,
  Boxes,
  OctagonAlert,
  BellRing,
  Users,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { MetricCard } from "@/components/common/metric-card";
import { RiskRing } from "@/components/common/risk-ring";
import { RiskBadge } from "@/components/common/risk-badge";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, Progress } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/controls";
import { DigitalTwinViewer } from "@/components/twin/digital-twin-viewer";
import { TwinStatus } from "@/components/twin/twin-status";
import { SystemHealth } from "@/components/system/system-health";
import { LakeRankingTable } from "@/components/lakes/lake-ranking-table";
import { AlertCard } from "@/components/alerts/alert-card";
import { LineTrend } from "@/components/charts/trends";
import { ChartCard } from "@/components/charts/chart-card";
import { MapPanel } from "@/components/map/map-panel";
import { ShapChart } from "@/components/charts/shap-chart";
import { getRiskTrend } from "@/data/series";
import { assessRisk, topContributions } from "@/lib/risk-engine";
import { getRiskLevel, MODEL_INFO, RISK_COLORS } from "@/lib/config";
import { formatCoord } from "@/lib/utils";

export default function DashboardPage() {
  const { lakes, selectedLake, risk, alerts, acknowledgeAlert, reviewAlert } = useApp();

  const trend = getRiskTrend(selectedLake, risk.score);
  const prevScore = trend[trend.length - 2].score;
  const scoredLakes = lakes.map((l) => ({ lake: l, score: assessRisk(l).score }));
  const regionalRisk = Math.max(...scoredLakes.map((s) => s.score));
  const criticalCount = scoredLakes.filter((s) => s.score >= 76).length;
  const highCount = scoredLakes.filter((s) => s.score >= 51 && s.score < 76).length;
  const totalExposure = lakes.reduce((a, l) => a + l.exposureEstimate, 0);
  const unack = alerts.filter((a) => !a.acknowledged);
  const shapTop = topContributions(risk, 4);

  return (
    <div>
      <PageHeader
        title="GlacialTwin AI Command Center"
        subtitle="AI-powered monitoring of glacial lake dynamics, environmental conditions and outburst risk."
        dataStatus="DEMO"
        meta={
          <>
            <span className="font-mono">Model {MODEL_INFO.version}</span>
            <span>·</span>
            <span className="font-mono">Last pipeline run 04:32 ago</span>
          </>
        }
        actions={
          <>
            <ButtonLink href="/digital-twin" variant="outline" size="sm">
              <Boxes className="h-3.5 w-3.5" aria-hidden /> Digital Twin
            </ButtonLink>
            <ButtonLink href="/scenario-simulator" variant="primary" size="sm">
              Simulate scenario <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </ButtonLink>
          </>
        }
      />

      {/* KPI row */}
      <section aria-label="Key metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card elevated className="relative overflow-hidden p-4">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-high/60 to-transparent" />
          <div className="flex items-center gap-2 text-muted">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-high/40 bg-high/10 text-high">
              <Gauge className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-[11px] font-semibold tracking-[0.1em] uppercase">Overall Regional Risk</span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <RiskRing score={regionalRisk} level={getRiskLevel(regionalRisk)} size={92} label="Overall regional risk" />
            <div>
              <RiskBadge level={getRiskLevel(regionalRisk)} size="sm" />
              <p className="mt-1.5 font-mono text-[11px]" style={{ color: RISK_COLORS[getRiskLevel(regionalRisk)] }}>
                ↑ {Math.max(0, Math.round(regionalRisk - prevScore))}% from previous obs.
              </p>
              <p className="mt-0.5 text-[10px] text-faint">Driven by {selectedLake.name}</p>
            </div>
          </div>
        </Card>

        <MetricCard
          icon={<Boxes className="h-3.5 w-3.5" />}
          label="Monitored Lakes"
          value={lakes.length}
          sublabel="Active monitoring"
          accent="#22D3EE"
          badge={<DataStatusBadge status="DEMO" />}
        />
        <MetricCard
          icon={<OctagonAlert className="h-3.5 w-3.5" />}
          label="Critical Lakes"
          value={criticalCount}
          sublabel={`${highCount} additional high-risk`}
          accent="#EF4444"
        />
        <MetricCard
          icon={<BellRing className="h-3.5 w-3.5" />}
          label="Active Alerts"
          value={unack.length}
          sublabel={`${highCount} High · ${criticalCount} Critical`}
          accent="#F97316"
          footer={<Progress value={(unack.length / Math.max(1, alerts.length)) * 100} color="#F97316" height={4} label="Unacknowledged share" />}
        />
        <MetricCard
          icon={<Users className="h-3.5 w-3.5" />}
          label="Potential Exposure"
          value={totalExposure}
          sublabel="Analytical downstream exposure estimate"
          accent="#94A3B8"
          badge={<Badge tone="neutral">Estimate</Badge>}
        />
      </section>

      {/* Twin + right rail */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card elevated className="p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <div>
                <h2 className="font-display text-sm font-bold tracking-[0.08em] uppercase">3D Digital Twin</h2>
                <p className="text-xs text-muted">Live virtual representation of {selectedLake.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <TwinStatus lake={selectedLake} compact />
                <ButtonLink href={`/digital-twin/${selectedLake.id}`} variant="outline" size="sm">
                  Open twin <ArrowRight className="h-3 w-3" aria-hidden />
                </ButtonLink>
              </div>
            </div>
            <DigitalTwinViewer lake={selectedLake} riskScore={risk.score} className="h-[420px] sm:h-[480px]" />
          </Card>
        </div>

        <div className="space-y-4">
          <Card elevated className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">Selected lake</p>
                <h2 className="font-display text-lg font-bold text-text">{selectedLake.name}</h2>
                <p className="font-mono text-[10px] text-faint">{formatCoord(selectedLake.latitude, selectedLake.longitude)}</p>
              </div>
              <RiskBadge level={risk.level} score={risk.score} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["Area", `${selectedLake.areaKm2} km²`],
                ["Elev.", `${(selectedLake.elevationM / 1000).toFixed(1)}k m`],
                ["Growth", `+${selectedLake.areaGrowthRatePctPerYear}%/yr`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md border border-border bg-surface px-2 py-2">
                  <p className="text-[9px] tracking-wider text-faint uppercase">{k}</p>
                  <p className="font-mono text-xs font-semibold text-text">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-faint uppercase">Why this level? (demo)</p>
              <ShapChart contributions={shapTop} />
            </div>
            <ButtonLink href="/risk-monitoring" variant="ghost" size="sm" className="mt-3 w-full">
              Full risk analysis <ArrowRight className="h-3 w-3" aria-hidden />
            </ButtonLink>
          </Card>

          <SystemHealth />
        </div>
      </section>

      {/* Trend + ranking */}
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={`Risk Evolution — ${selectedLake.name}`}
          description="Trailing 12 months, prototype model estimates"
          right={<DataStatusBadge status="MODEL_PREDICTION" />}
          footer={
            <span>
              Current {risk.score} · previous {prevScore} ({trend[trend.length - 1].event ?? "latest observation"})
            </span>
          }
        >
          <LineTrend
            data={trend.map((t) => ({ label: t.label, score: t.score }))}
            xKey="label"
            lines={[{ key: "score", color: "#F97316", name: "Risk %" }]}
            yDomain={[0, 100]}
          />
        </ChartCard>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold tracking-[0.08em] uppercase">Regional Risk Ranking</h2>
            <DataStatusBadge status="DEMO" />
          </div>
          <LakeRankingTable lakes={lakes} />
        </div>
      </section>

      {/* Map + alerts */}
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card elevated className="p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-display text-sm font-bold tracking-[0.08em] uppercase">Geospatial View</h2>
            <ButtonLink href="/flood-mapping" variant="ghost" size="sm">
              Flood mapping <ArrowRight className="h-3 w-3" aria-hidden />
            </ButtonLink>
          </div>
          <MapPanel lake={selectedLake} inundationIntensity={2} heightClass="h-[340px]" />
        </Card>

        <Card elevated className="p-4">
          <CardHeader className="px-0 pt-0">
            <div>
              <CardTitle>Latest Alerts</CardTitle>
              <CardDescription>Prototype trend & scenario notifications</CardDescription>
            </div>
            <ButtonLink href="/alerts" variant="ghost" size="sm">
              Alert Center <ArrowRight className="h-3 w-3" aria-hidden />
            </ButtonLink>
          </CardHeader>
          <CardContent className="space-y-3 px-0">
            {alerts.slice(0, 3).map((a) => (
              <AlertCard key={a.id} alert={a} onAcknowledge={acknowledgeAlert} onReview={reviewAlert} />
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
