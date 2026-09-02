"use client";

import { useEffect, useState } from "react";
import { CircleUserRound, SlidersHorizontal, Database, Gauge, Activity, Info, Trash2 } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/feedback";
import { Button, Select, Switch } from "@/components/ui/controls";
import { SystemHealth } from "@/components/system/system-health";
import { DISCLAIMER_FULL, MODEL_INFO, RISK_COLORS, RISK_THRESHOLDS } from "@/lib/config";

const REGION_KEY = "glacialtwin.region";

export default function SettingsPage() {
  const { regionId, setRegionId, regions } = useApp();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Platform preferences, data sources and system configuration."
        dataStatus="DEMO"
        meta={<span className="font-mono">GlacialTwin AI v0.9.0-prototype</span>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile */}
        <Card elevated id="profile" className="scroll-mt-24 p-5">
          <CardHeader className="px-0 pt-0">
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Demo account — authentication is architecture-ready but not enabled</CardDescription>
            </div>
            <CircleUserRound className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-gradient-to-br from-primary/30 to-blue-900/40 font-display text-sm font-bold">
              GT
            </span>
            <div>
              <p className="text-sm font-semibold text-text">Demo Operator</p>
              <p className="text-xs text-muted">operator@glacialtwin.demo</p>
              <Badge tone="primary" className="mt-1">Research access</Badge>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card elevated id="preferences" className="scroll-mt-24 p-5">
          <CardHeader className="px-0 pt-0">
            <div>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Stored locally in your browser</CardDescription>
            </div>
            <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="default-region" className="mb-1.5 block text-xs font-medium text-muted">
                Default region
              </label>
              <Select
                id="default-region"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="h-9 w-full"
              >
                <option value="all">All regions</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-text">Reduced motion</p>
                <p className="text-[11px] text-faint">
                  {reduceMotion ? "Active (detected from your OS setting)" : "Follows your OS accessibility setting"}
                </p>
              </div>
              <Switch checked={reduceMotion} onCheckedChange={() => {}} label="Reduced motion" disabled />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <div>
                <p className="text-xs font-medium text-text">Units</p>
                <p className="text-[11px] text-faint">Metric (km², m, mm) — fixed in this prototype</p>
              </div>
              <Badge>SI</Badge>
            </div>
          </div>
        </Card>

        {/* Risk thresholds */}
        <Card elevated id="risk-thresholds" className="scroll-mt-24 p-5">
          <CardHeader className="px-0 pt-0">
            <div>
              <CardTitle>Risk Classification Thresholds</CardTitle>
              <CardDescription>Defined centrally in src/lib/config.ts — read-only view</CardDescription>
            </div>
            <Gauge className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <ul className="space-y-2.5">
            {RISK_THRESHOLDS.map((t) => (
              <li key={t.level} className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-sm" style={{ background: RISK_COLORS[t.level] }} aria-hidden />
                <span className="w-24 text-xs font-semibold" style={{ color: RISK_COLORS[t.level] }}>{t.level}</span>
                <span className="font-mono text-xs text-muted">{t.min}–{t.max}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Data sources */}
        <Card elevated id="data-sources" className="scroll-mt-24 p-5">
          <CardHeader className="px-0 pt-0">
            <div>
              <CardTitle>Data Sources</CardTitle>
              <CardDescription>Prototype integrations & demo layer</CardDescription>
            </div>
            <Database className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <ul className="space-y-2 text-xs">
            {[
              ["Sentinel-2 / Landsat catalogue", "Planned integration — demo metadata active"],
              ["Copernicus DEM GLO-30", "Terrain analytics (demo values)"],
              ["ERA5 reanalysis", "Environmental series (demo values)"],
              ["Local demo data layer", "src/data/* — deterministic generators"],
            ].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2">
                <span className="text-text">{k}</span>
                <span className="text-right text-[10.5px] text-faint">{v}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* System status */}
        <div id="system-status" className="scroll-mt-24">
          <SystemHealth />
        </div>

        {/* About */}
        <Card elevated id="about" className="scroll-mt-24 p-5">
          <CardHeader className="px-0 pt-0">
            <div>
              <CardTitle>About</CardTitle>
              <CardDescription>GlacialTwin AI — research prototype</CardDescription>
            </div>
            <Info className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <dl className="space-y-1.5 text-xs">
            {[
              ["Version", "v0.9.0-prototype"],
              ["Risk model", MODEL_INFO.version],
              ["API readiness", "FastAPI-compatible service layer planned"],
              ["Deployment", "Dockerfile included"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border/60 pb-1.5">
                <dt className="text-muted">{k}</dt>
                <dd className="font-mono text-text">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-faint">{DISCLAIMER_FULL}</p>

          <div className="mt-4 rounded-lg border border-critical/30 bg-critical/[0.05] p-3.5">
            <p className="text-xs font-semibold text-critical">Danger zone</p>
            <p className="mt-1 text-[11px] text-muted">Clears saved scenarios, reports and preferences from this browser.</p>
            <Button
              variant="danger"
              size="sm"
              className="mt-2"
              onClick={() => {
                ["glacialtwin.scenarios.v1", "glacialtwin.reports.v1", REGION_KEY, "glacialtwin.sidebar.collapsed"].forEach((k) => {
                  try {
                    window.localStorage.removeItem(k);
                  } catch {}
                });
                window.location.reload();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Reset local data
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-faint">
        <Activity className="h-3.5 w-3.5" aria-hidden />
        All settings are client-side in this prototype; the schema is ready for server-side persistence.
      </div>
    </div>
  );
}
