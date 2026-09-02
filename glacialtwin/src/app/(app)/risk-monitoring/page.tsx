"use client";

import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { RiskRing } from "@/components/common/risk-ring";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge, InfoTip } from "@/components/ui/feedback";
import { ShapChart } from "@/components/charts/shap-chart";
import { ChartCard } from "@/components/charts/chart-card";
import { LineTrend } from "@/components/charts/trends";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { LakeRankingTable } from "@/components/lakes/lake-ranking-table";
import { assessRisk, topContributions } from "@/lib/risk-engine";
import { getForecast, getRiskTrend } from "@/data/series";
import { MODEL_INFO, RISK_THRESHOLDS, RISK_COLORS } from "@/lib/config";

const FEATURE_CHIPS = [
  "Lake expansion",
  "Rainfall",
  "Temperature",
  "Elevation",
  "Slope",
  "Glacier proximity",
  "Environmental trends",
  "Historical instability",
];

export default function RiskMonitoringPage() {
  const { lakes, selectedLake, risk } = useApp();
  const trend = getRiskTrend(selectedLake, risk.score);
  const forecast = getForecast(selectedLake);
  const shap = topContributions(risk, 5);

  return (
    <div>
      <PageHeader
        title="AI Risk Engine"
        subtitle="Prototype model estimates for glacial lake outburst risk — transparent features, transparent weights."
        dataStatus="MODEL_PREDICTION"
        meta={
          <>
            <span className="font-mono">Model {MODEL_INFO.version}</span>
            <span>·</span>
            <span>{selectedLake.name}</span>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Engine panel */}
        <Card elevated>
          <CardHeader>
            <div>
              <CardTitle>Current GLOF Risk</CardTitle>
              <CardDescription>{selectedLake.name}</CardDescription>
            </div>
            <Badge tone="warning">Prototype model</Badge>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <RiskRing score={risk.score} level={risk.level} size={180} />
            <dl className="mt-4 w-full space-y-1.5 text-xs">
              {[
                ["Model", "XGBoost-style (heuristic prototype)"],
                ["Version", MODEL_INFO.version],
                ["Last trained", MODEL_INFO.trainedAt],
                ["Assessed at", `${risk.assessedAt.slice(0, 16).replace("T", " ")} UTC`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-border/60 pb-1.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-mono text-[11px] text-text">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {FEATURE_CHIPS.map((f) => (
                <Badge key={f}>{f}</Badge>
              ))}
            </div>
            <p className="mt-3 rounded-md border border-moderate/30 bg-moderate/[0.07] px-3 py-2 text-[11px] leading-relaxed text-moderate">
              This interface is powered by a heuristic prototype engine with fixed expert weights —
              not a trained ML model. No accuracy metrics are claimed.
            </p>
          </CardContent>
        </Card>

        {/* SHAP */}
        <Card elevated className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Why is this lake {risk.level.toLowerCase()} risk?</CardTitle>
              <CardDescription>Feature contributions to the current estimate</CardDescription>
            </div>
            <DataStatusBadge status="MODEL_PREDICTION" />
          </CardHeader>
          <CardContent>
            <ShapChart contributions={shap} />
            <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2.5 text-xs leading-relaxed text-muted">
              The prototype model currently places the greatest weight on{" "}
              <span className="text-text">{shap[0]?.feature.toLowerCase()}</span> and{" "}
              <span className="text-text">{shap[1]?.feature.toLowerCase()}</span>. These
              contributions describe the model's arithmetic, not validated causal drivers of GLOF
              events.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend + forecast */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Risk Evolution"
          description={`${selectedLake.name} — trailing 12 months`}
          right={<DataStatusBadge status="MODEL_PREDICTION" />}
          footer={<span>Trend: {trend[11].score - trend[8].score >= 0 ? "increasing" : "decreasing"} over the last quarter</span>}
        >
          <LineTrend
            data={trend.map((t) => ({ label: t.label, score: t.score }))}
            xKey="label"
            lines={[{ key: "score", color: "#F97316", name: "Risk %" }]}
            yDomain={[0, 100]}
            height={240}
          />
        </ChartCard>

        <ChartCard
          title="Lake Expansion Forecast"
          description="Linear extrapolation of observed area trend"
          right={<DataStatusBadge status="MODEL_FORECAST" />}
          footer={<span>Dashed segment = model forecast · shaded band = uncertainty estimate</span>}
        >
          <ForecastChart data={forecast} height={240} />
        </ChartCard>
      </div>

      {/* Classification + ranking */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card elevated>
          <CardHeader>
            <div>
              <CardTitle>Risk Classification</CardTitle>
              <CardDescription>
                Configurable thresholds
                <InfoTip text="Thresholds are defined once in the central configuration (src/lib/config.ts) and consumed everywhere." />
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {RISK_THRESHOLDS.map((t) => (
                <li key={t.level} className="flex items-center gap-3">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: RISK_COLORS[t.level] }} aria-hidden />
                  <span className="w-20 text-xs font-semibold" style={{ color: RISK_COLORS[t.level] }}>
                    {t.level}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {t.min}–{t.max}
                  </span>
                  {risk.score >= t.min && risk.score <= t.max && (
                    <Badge tone="primary" className="ml-auto">Current</Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <span>Applied uniformly across all modules</span>
          </CardFooter>
        </Card>

        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold tracking-[0.08em] uppercase">Regional Risk Ranking</h2>
            <DataStatusBadge status="DEMO" />
          </div>
          <LakeRankingTable lakes={lakes} />
          <p className="mt-2 text-[11px] text-faint">
            Select a row to open that lake's Digital Twin; every module follows the selection.
          </p>
        </div>
      </div>
    </div>
  );
}
