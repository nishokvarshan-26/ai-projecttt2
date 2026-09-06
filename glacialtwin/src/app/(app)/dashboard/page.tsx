"use client";

import {
  Boxes,
  OctagonAlert,
  BellRing,
  Users,
  ArrowRight,
  Cpu,
  Database,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { RiskRing } from "@/components/common/risk-ring";
import { RiskBadge } from "@/components/common/risk-badge";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/controls";
import { DigitalTwinViewer } from "@/components/twin/digital-twin-viewer";
import { TwinStatus } from "@/components/twin/twin-status";
import { TwinRiskPanel } from "@/components/twin/twin-risk-panel";
import { TwinTelemetry } from "@/components/twin/twin-telemetry";
import { TwinTimeline } from "@/components/twin/twin-timeline";
import { TwinScenarioControls } from "@/components/twin/twin-scenario-controls";
import { SystemHealth } from "@/components/system/system-health";
import { LakeRankingTable } from "@/components/lakes/lake-ranking-table";
import { LineTrend } from "@/components/charts/trends";
import { ChartCard } from "@/components/charts/chart-card";
import { MapPanel } from "@/components/map/map-panel";
import { getRiskTrend } from "@/data/series";
import { assessRisk } from "@/lib/risk-engine";
import { getRiskLevel, MODEL_INFO } from "@/lib/config";
import { SCENARIO_META } from "@/lib/twin-engine";
import { formatCoord } from "@/lib/utils";

export default function DashboardPage() {
  const {
    lakes,
    selectedLake,
    risk,
    alerts,
    acknowledgeAlert,
    reviewAlert,
    twin,
    twinBaseline,
    scenarioActive,
    scenarioKind,
    startTwinScenario,
    resetTwinScenario,
    twinLoading,
  } = useApp();

  const trend = getRiskTrend(selectedLake, risk.score);
  const prevScore = trend[trend.length - 2].score;
  const scoredLakes = lakes.map((l) => ({ lake: l, score: assessRisk(l).score }));
  const regionalRisk = Math.max(...scoredLakes.map((s) => s.score));
  const criticalCount = scoredLakes.filter((s) => s.score >= 76).length;
  const highCount = scoredLakes.filter((s) => s.score >= 51 && s.score < 76).length;
  const totalExposure = lakes.reduce((a, l) => a + l.exposureEstimate, 0);
  const unack = alerts.filter((a) => !a.acknowledged);
  const lakeAlerts = alerts.filter((a) => a.lakeId === selectedLake.id);

  const viewerReady = !twinLoading && twin.lakeId === selectedLake.id;

  const statusChips = [
    {
      label: "System status",
      value: "Operational",
      sub: "All subsystems nominal",
      icon: <ShieldCheck className="h-3.5 w-3.5" aria-hidden />,
      color: "#10B981",
    },
    {
      label: "Twin sync",
      value: selectedLake.twinStatus === "SYNCED" ? "Synced" : selectedLake.twinStatus,
      sub: `${formatCoord(selectedLake.latitude, selectedLake.longitude)}`,
      icon: <Database className="h-3.5 w-3.5" aria-hidden />,
      color: "#22D3EE",
    },
    {
      label: "AI engine",
      value: "Online",
      sub: `Model ${MODEL_INFO.version}`,
      icon: <Cpu className="h-3.5 w-3.5" aria-hidden />,
      color: "#818CF8",
    },
    {
      label: "Active alerts",
      value: String(unack.length),
      sub: `${highCount} high · ${criticalCount} critical`,
      icon: <BellRing className="h-3.5 w-3.5" aria-hidden />,
      color: unack.length > 0 ? "#F97316" : "#10B981",
    },
  ];

  const regionalChips = [
    { label: "Lakes monitored", value: String(lakes.length), icon: <Boxes className="h-3.5 w-3.5" aria-hidden />, color: "#22D3EE" },
    { label: "Critical", value: String(criticalCount), icon: <OctagonAlert className="h-3.5 w-3.5" aria-hidden />, color: "#EF4444" },
    { label: "High risk", value: String(highCount), icon: <TriangleAlert className="h-3.5 w-3.5" aria-hidden />, color: "#F97316" },
    { label: "Exposure", value: totalExposure.toLocaleString(), icon: <Users className="h-3.5 w-3.5" aria-hidden />, color: "#94A3B8" },
  ];

  return (
    <div>
      <PageHeader
        title="GlacialTwin AI Command Center"
        subtitle="Live digital twin of monitored glacial lakes — sensor telemetry, scenario simulation and AI risk intelligence."
        dataStatus="DEMO"
        meta={
          <>
            <span className="font-mono">Model {MODEL_INFO.version}</span>
            <span>·</span>
            <span className="font-mono">Prototype · heuristic models</span>
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

      {/* Status strip */}
      <Card elevated className="p-3">
        <div className="flex flex-wrap items-stretch gap-2">
          {statusChips.map((c) => (
            <div key={c.label} className="flex min-w-[180px] flex-1 items-center gap-3 rounded-md border border-border bg-surface px-3 py-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border"
                style={{ color: c.color, borderColor: `${c.color}44`, background: `${c.color}12` }}
              >
                {c.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold tracking-[0.12em] text-faint uppercase">{c.label}</p>
                <p className="truncate font-mono text-xs font-bold" style={{ color: c.color }}>
                  {c.value}
                </p>
                <p className="truncate text-[9px] text-muted">{c.sub}</p>
              </div>
            </div>
          ))}

          <div className="flex min-w-[220px] flex-1 items-center gap-4 rounded-md border border-border bg-surface px-3 py-2">
            <RiskRing score={regionalRisk} level={getRiskLevel(regionalRisk)} size={56} label="Regional risk" />
            <div>
              <p className="text-[9px] font-semibold tracking-[0.12em] text-faint uppercase">Regional risk</p>
              <RiskBadge level={getRiskLevel(regionalRisk)} score={regionalRisk} size="sm" />
              <p className="mt-1 text-[9px] text-muted">Driven by {selectedLake.name}</p>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
          {regionalChips.map((c) => (
            <span key={c.label} className="flex items-center gap-1.5 rounded-md border border-border bg-elevated px-2 py-1">
              <span style={{ color: c.color }}>{c.icon}</span>
              <span className="text-[9px] tracking-wider text-faint uppercase">{c.label}</span>
              <span className="font-mono text-xs font-semibold text-text">{c.value}</span>
            </span>
          ))}
          <DataStatusBadge status="MODEL_PREDICTION" className="ml-auto" />
        </div>
      </Card>

      {/* Twin + AI risk rail */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card elevated className="p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <div>
                <h2 className="font-display text-sm font-bold tracking-[0.08em] uppercase">3D Digital Twin</h2>
                <p className="text-xs text-muted">
                  Live virtual representation of {selectedLake.name}
                  {scenarioActive && (
                    <span className="ml-1 font-semibold text-high">· {SCENARIO_META[scenarioKind].label} scenario</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TwinStatus lake={selectedLake} compact />
                <ButtonLink href={`/digital-twin/${selectedLake.id}`} variant="outline" size="sm">
                  Open twin <ArrowRight className="h-3 w-3" aria-hidden />
                </ButtonLink>
              </div>
            </div>
            {viewerReady ? (
              <DigitalTwinViewer
                lake={selectedLake}
                twin={twin}
                scenarioActive={scenarioActive}
                scenarioKind={scenarioKind}
                onSimulate={() => startTwinScenario("LANDSLIDE")}
                className="h-[420px] sm:h-[520px]"
              />
            ) : (
              <div className="flex h-[420px] flex-col items-center justify-center gap-3 bg-bg sm:h-[520px]">
                <div className="skeleton h-2 w-44" />
                <p className="font-mono text-xs text-muted">Synchronizing {selectedLake.name} twin…</p>
              </div>
            )}
          </Card>
        </div>

        <TwinRiskPanel
          twin={twin}
          twinBaseline={twinBaseline}
          scenarioActive={scenarioActive}
          alerts={[...lakeAlerts].sort((a, b) => Number(a.acknowledged) - Number(b.acknowledged))}
          onAcknowledge={acknowledgeAlert}
          onReview={reviewAlert}
        />
      </section>

      {/* Telemetry + timeline + scenario controls */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TwinTelemetry twin={twin} />
        </div>
        <div className="space-y-4">
          <TwinTimeline twin={twin} />
          <TwinScenarioControls
            scenarioActive={scenarioActive}
            scenarioKind={scenarioKind}
            twinStep={twin.step}
            onStart={startTwinScenario}
            onReset={resetTwinScenario}
          />
        </div>
      </section>

      {/* Regional trend + ranking */}
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

      {/* Map + system health */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card elevated className="p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="font-display text-sm font-bold tracking-[0.08em] uppercase">Geospatial View</h2>
              <ButtonLink href="/flood-mapping" variant="ghost" size="sm">
                Flood mapping <ArrowRight className="h-3 w-3" aria-hidden />
              </ButtonLink>
            </div>
            <MapPanel lake={selectedLake} inundationIntensity={2} heightClass="h-[340px]" />
          </Card>
        </div>
        <SystemHealth />
      </section>
    </div>
  );
}