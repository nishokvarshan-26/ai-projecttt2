"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, Download, Link2, FileText, Trash2 } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Button, ButtonLink, Select } from "@/components/ui/controls";
import { TwinStateSummary } from "@/components/twin/twin-status";
import { ShapChart } from "@/components/charts/shap-chart";
import { assessRisk, topContributions } from "@/lib/risk-engine";
import { getScenesForLake } from "@/data/satellite";
import { getRiskTrend } from "@/data/series";
import { DISCLAIMER_FULL, MODEL_INFO } from "@/lib/config";
import { formatCoord, formatDateTime, downloadTextFile, toCsv, timeAgo } from "@/lib/utils";

const REPORTS_KEY = "glacialtwin.reports.v1";

interface ReportMeta {
  id: string;
  lakeId: string;
  lakeName: string;
  createdAt: string;
}

function ReportInner() {
  const searchParams = useSearchParams();
  const { lakes, alerts, scenarios } = useApp();
  const initial = searchParams.get("lake");
  const [lakeId, setLakeId] = useState(initial && lakes.some((l) => l.id === initial) ? initial : "");
  const activeId = lakeId || lakes[0]?.id || "";
  const lake = lakes.find((l) => l.id === activeId);
  const [history, setHistory] = useState<ReportMeta[]>([]);

  useEffect(() => {
    try {
      setHistory(JSON.parse(window.localStorage.getItem(REPORTS_KEY) ?? "[]"));
    } catch {}
  }, []);

  const risk = lake ? assessRisk(lake) : null;
  const trend = lake ? getRiskTrend(lake, assessRisk(lake).score) : [];
  const shap = risk ? topContributions(risk, 5) : [];
  const scenes = lake ? getScenesForLake(lake.id) : [];
  const lakeAlerts = lake ? alerts.filter((a) => a.lakeId === lake.id) : [];
  const lakeScenarios = lake ? scenarios.filter((s) => s.lakeId === lake.id).slice(0, 3) : [];

  const exportCsv = () => {
    if (!lake || !risk) return;
    const rows: Array<Record<string, string | number>> = [
      { metric: "Lake", value: lake.name },
      { metric: "Coordinates", value: formatCoord(lake.latitude, lake.longitude) },
      { metric: "Elevation (m)", value: lake.elevationM },
      { metric: "Area (km2)", value: lake.areaKm2 },
      { metric: "Volume (Mm3)", value: lake.volumeMm3 },
      { metric: "Water level anomaly (m)", value: lake.waterLevelAnomalyM },
      { metric: "Growth rate (%/yr)", value: lake.areaGrowthRatePctPerYear },
      { metric: "Temperature (C)", value: lake.temperatureC },
      { metric: "Rainfall (mm/month)", value: lake.rainfallMmPerMonth },
      { metric: "Glacier distance (km)", value: lake.glacierDistanceKm },
      { metric: "Slope (deg)", value: lake.slopeDeg },
      { metric: "Risk score", value: risk.score },
      { metric: "Risk level", value: risk.level },
      { metric: "Model version", value: MODEL_INFO.version },
      { metric: "Generated at", value: new Date().toISOString() },
    ];
    downloadTextFile(`glacialtwin-report-${lake.id}.csv`, toCsv(rows));
  };

  const saveToHistory = () => {
    if (!lake) return;
    const entry: ReportMeta = {
      id: `rep-${Date.now().toString(36)}`,
      lakeId: lake.id,
      lakeName: lake.name,
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...history].slice(0, 12);
    setHistory(next);
    try {
      window.localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <div>
      <PageHeader
        title="Risk Reports"
        subtitle="Generate a printable technical report from the current Digital Twin state."
        dataStatus="DEMO"
        meta={<span className="font-mono">Report engine v0.9 · PDF via browser print</span>}
        actions={
          <>
            <Select aria-label="Select lake" value={activeId} onChange={(e) => setLakeId(e.target.value)} className="h-9">
              {lakes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" aria-hidden /> Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" aria-hidden /> Export CSV
            </Button>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/reports?lake=${activeId}`).catch(() => {});
                saveToHistory();
              }}
            >
              <Link2 className="h-3.5 w-3.5" aria-hidden /> Share
            </Button>
          </>
        }
      />

      {lake && risk ? (
        <div className="print-light space-y-4">
          {/* Report header */}
          <Card elevated className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="font-display text-[10px] font-bold tracking-[0.22em] text-primary uppercase">
                  GlacialTwin AI — Technical Risk Report
                </p>
                <h2 className="mt-1 font-display text-xl font-bold">{lake.name}</h2>
                <p className="font-mono text-xs text-muted">
                  {formatCoord(lake.latitude, lake.longitude)} · {lake.country}
                </p>
              </div>
              <div className="text-right text-[11px] text-faint">
                <p className="font-mono">Generated {formatDateTime(new Date().toISOString())}</p>
                <p className="font-mono">Model {MODEL_INFO.version}</p>
                <div className="mt-1 flex justify-end gap-1.5">
                  <DataStatusBadge status="DEMO" />
                  <DataStatusBadge status="MODEL_PREDICTION" />
                </div>
              </div>
            </div>

            {/* Executive summary */}
            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-[10px] tracking-wider text-faint uppercase">Current risk estimate</p>
                <p className="mt-1 font-display text-3xl font-bold">{risk.score}<span className="text-sm text-faint">/100</span></p>
                <Badge tone={risk.level === "CRITICAL" ? "critical" : risk.level === "HIGH" ? "high" : risk.level === "MODERATE" ? "moderate" : "low"} className="mt-1">
                  {risk.level}
                </Badge>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-[10px] tracking-wider text-faint uppercase">12-month trend</p>
                <p className="mt-1 font-mono text-lg font-semibold">
                  {trend[trend.length - 1].score - trend[trend.length - 7].score >= 0 ? "+" : ""}
                  {trend[trend.length - 1].score - trend[trend.length - 7].score} pts
                </p>
                <p className="text-[11px] text-muted">over trailing six months</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-[10px] tracking-wider text-faint uppercase">Area change</p>
                <p className="mt-1 font-mono text-lg font-semibold text-high">+{lake.historyAreaChangePct}%</p>
                <p className="text-[11px] text-muted">since {lake.areaHistory[0].year}</p>
              </div>
            </div>
          </Card>

          {/* Twin state */}
          <Card elevated className="p-5">
            <h3 className="mb-3 font-display text-sm font-bold tracking-wide uppercase">1 · Digital Twin State</h3>
            <TwinStateSummary lake={lake} />
          </Card>

          {/* Satellite + environment */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card elevated className="p-5">
              <h3 className="mb-3 font-display text-sm font-bold tracking-wide uppercase">2 · Satellite Observations</h3>
              <ul className="space-y-2 text-xs">
                {scenes.slice(0, 3).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <div>
                      <p className="font-medium text-text">{s.platform}</p>
                      <p className="font-mono text-[10px] text-faint">{s.sceneId}</p>
                    </div>
                    <span className="font-mono text-muted">{s.acquiredAt.slice(0, 10)} · {s.cloudCoverPct}% cloud</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card elevated className="p-5">
              <h3 className="mb-3 font-display text-sm font-bold tracking-wide uppercase">3 · Environmental Observations</h3>
              <dl className="space-y-1.5 text-xs">
                {[
                  ["Mean temperature", `${lake.temperatureC} °C`],
                  ["Monthly rainfall", `${lake.rainfallMmPerMonth} mm`],
                  ["Recent precipitation", lake.recentPrecipitation.toLowerCase()],
                  ["Environmental trend", lake.areaGrowthRatePctPerYear > 8 ? "Warming-driven expansion" : "Gradual change"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border/60 pb-1.5">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-mono text-text capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          {/* Model explanation */}
          <Card elevated className="p-5">
            <h3 className="mb-1 font-display text-sm font-bold tracking-wide uppercase">4 · Model Explanation</h3>
            <p className="mb-3 text-xs text-muted">
              Leading feature contributions to the current estimate (prototype weights).
            </p>
            <ShapChart contributions={shap} />
          </Card>

          {/* Scenarios + alerts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card elevated className="p-5">
              <h3 className="mb-3 font-display text-sm font-bold tracking-wide uppercase">5 · Scenario Analysis</h3>
              {lakeScenarios.length === 0 ? (
                <p className="text-xs text-muted">No saved scenarios for this lake.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {lakeScenarios.map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
                      <span className="text-text">{s.name}</span>
                      <span className="font-mono text-muted">
                        {s.baselineScore} → {s.scenarioScore}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card elevated className="p-5">
              <h3 className="mb-3 font-display text-sm font-bold tracking-wide uppercase">6 · Related Alerts</h3>
              {lakeAlerts.length === 0 ? (
                <p className="text-xs text-muted">No alerts recorded for this lake.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {lakeAlerts.map((a) => (
                    <li key={a.id} className="rounded-md border border-border bg-surface px-3 py-2">
                      <p className="font-medium text-text">{a.severity} — {a.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{a.reason}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card elevated className="p-5">
            <h3 className="mb-2 font-display text-sm font-bold tracking-wide uppercase">Disclaimer</h3>
            <p className="text-[11px] leading-relaxed text-muted">{DISCLAIMER_FULL}</p>
          </Card>
        </div>
      ) : (
        <EmptyState title="No lake selected" description="Choose a lake to generate its report." />
      )}

      {/* Past reports */}
      <div className="no-print mt-6">
        <h2 className="mb-2 font-display text-sm font-bold tracking-[0.08em] uppercase">Generated Reports (local)</h2>
        {history.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" aria-hidden />}
            title="No reports generated yet"
            description="Use “Share” to register a report snapshot here, or print/CSV export above."
          />
        ) : (
          <ul className="space-y-2">
            {history.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-2.5">
                <div>
                  <p className="text-xs font-medium text-text">{r.lakeName} — risk report</p>
                  <p className="font-mono text-[10px] text-faint">{timeAgo(r.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <ButtonLink href={`/reports?lake=${r.lakeId}`} variant="ghost" size="sm">
                    Open
                  </ButtonLink>
                  <button
                    aria-label="Delete report entry"
                    className="cursor-pointer text-muted hover:text-critical"
                    onClick={() => {
                      const next = history.filter((h) => h.id !== r.id);
                      setHistory(next);
                      window.localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 w-full" />}>
      <ReportInner />
    </Suspense>
  );
}
