"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Mountain,
  Sparkles,
  Database,
  Cpu,
  BrainCircuit,
  TriangleAlert,
  CloudRain,
  Ruler,
  Sprout,
  Radio,
  Waves,
  Droplets,
  FlaskConical,
  Braces,
  Activity,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { RiskRing } from "@/components/common/risk-ring";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, Progress } from "@/components/ui/feedback";
import { Button, Slider, Select } from "@/components/ui/controls";
import { RISK_COLORS } from "@/lib/config";
import {
  parseLandslideCsv,
  trainLandslideModel,
  predictProbability,
  riskLevelOf,
  featureStats,
  directionColor,
  FEATURE_META,
  DEFAULT_FEATURES,
  LANDSLIDE_SOILS,
  SOIL_LABEL,
  type FeatureInput,
  type LandslideSoil,
  type LandslideModel,
  type LandslideRow,
} from "@/lib/landslide-analysis";

export default function LandslideAnalysisPage() {
  const { twin } = useApp();
  const [model, setModel] = useState<LandslideModel | null>(null);
  const [rows, setRows] = useState<LandslideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureInput>(DEFAULT_FEATURES);
  const [soil, setSoil] = useState<LandslideSoil>("silt");
  const [liveUsed, setLiveUsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/landslide_dataset.csv");
        if (!res.ok) throw new Error(`Failed to load dataset (HTTP ${res.status})`);
        const parsed = parseLandslideCsv(await res.text());
        const trained = trainLandslideModel(parsed);
        if (!cancelled) {
          setRows(parsed);
          setModel(trained);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const prob = model ? predictProbability(features, soil, model) * 100 : 0;
  const level = riskLevelOf(prob);
  const color = RISK_COLORS[level];

  const stats = useMemo(() => (model ? featureStats(rows, model) : []), [model, rows]);

  const soilBreakdown = useMemo(
    () =>
      LANDSLIDE_SOILS.map((s) => {
        const sub = rows.filter((r) => r.soil === s);
        const pos = sub.filter((r) => r.landslide === 1).length;
        return { soil: s, count: sub.length, pos, rate: sub.length ? (pos / sub.length) * 100 : 0 };
      }),
    [rows]
  );

  const pullLive = () => {
    const t = twin.telemetry;
    setFeatures({
      rainfall: Math.min(300, Math.max(50, Math.round(t.rainfallMmHr * 24))),
      slope: twin.scenario === "LANDSLIDE" || twin.scenario === "COMPOUND" ? 42 : 30,
      soilSaturation: Math.min(1, Math.max(0, t.soilMoisturePct / 100)),
      vegetation: 0.35,
      earthquake: Math.min(6.5, Math.max(0, ((twin.seismic.magnitude ?? 2) + 1) * 0.7)),
      proximity: 0.8,
    });
    setLiveUsed(true);
  };

  return (
    <div>
      <PageHeader
        title="Landslide Analysis"
        subtitle="Dataset-driven landslide probability engine — a logistic model trained entirely in your browser on the bundled demo dataset."
        dataStatus="MODEL_PREDICTION"
        meta={
          <>
            <span className="font-mono">{rows.length.toLocaleString()} rows loaded</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-high" aria-hidden /> Trained in-browser
            </span>
          </>
        }
        actions={
          <Button variant="primary" size="sm" onClick={pullLive} disabled={!model}>
            <BrainCircuit className="h-3.5 w-3.5" aria-hidden /> Pull live twin state
          </Button>
        }
      />

      {/* Bright hero band */}
      <section
        aria-label="Landslide analysis overview"
        className="relative overflow-hidden rounded-2xl border border-high/40 bg-gradient-to-br from-high/[0.14] via-high/[0.04] to-transparent p-5 shadow-[0_0_44px_rgba(249,115,22,0.14)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-high/50 bg-high/20 text-high shadow-[0_0_24px_rgba(249,115,22,0.35)]">
            <Mountain className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-lg font-bold tracking-tight text-text">
                Dataset-driven Landslide Engine
              </p>
              <DataStatusBadge status="MODEL_PREDICTION" />
            </div>
            <p className="mt-0.5 text-xs text-muted">
              6 triggers + soil composition scored by a logistic model fitted on {rows.length.toLocaleString()} labeled demo
              records — the same signals, now grounded in real data patterns.
            </p>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <Chip icon={<Database className="h-3.5 w-3.5" />} label="Records" value={rows.length.toLocaleString()} tone="#22D3EE" />
          <Chip icon={<TriangleAlert className="h-3.5 w-3.5" />} label="Landslide cases" value={model?.positives.toLocaleString() ?? "—"} tone="#F97316" />
          <Chip icon={<Activity className="h-3.5 w-3.5" />} label="Stable cases" value={model?.negatives.toLocaleString() ?? "—"} tone="#22C55E" />
          <Chip icon={<Cpu className="h-3.5 w-3.5" />} label="Train accuracy" value={model ? `${model.accuracyPct.toFixed(1)}%` : "—"} tone="#F97316" />
          <Chip icon={<Braces className="h-3.5 w-3.5" />} label="ROC AUC (train)" value={model ? `${model.aucPct.toFixed(0)}%` : "—"} tone="#A78BFA" />
        </div>
      </section>

      {loading && (
        <Card elevated className="mt-4 p-6">
          <p className="text-xs text-muted">Loading demo dataset and training the in-browser model…</p>
          <Progress value={100} color="#F97316" className="mt-3 animate-pulse" />
        </Card>
      )}

      {error && (
        <Card elevated className="mt-4 border-critical/40 p-6">
          <p className="flex items-center gap-2 text-xs text-critical">
            <TriangleAlert className="h-4 w-4" aria-hidden /> {error}
          </p>
        </Card>
      )}

      {model && (
        <>
          {/* Predictor + model */}
          <section className="mt-4 grid gap-4 lg:grid-cols-5">
            {/* Predictor */}
            <Card
              className="relative overflow-hidden border border-high/35 p-4 shadow-[0_0_28px_rgba(249,115,22,0.1)] lg:col-span-3"
              elevated
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }}
              />
              <CardHeader className="relative px-0 pt-0">
                <div>
                  <CardTitle>
                    <span className="inline-flex items-center gap-1.5">
                      <CloudRain className="h-3.5 w-3.5 text-high" aria-hidden /> Landslide probability estimator
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Move the sliders to score a slope — outputs a prototype probability (not a warning).
                  </CardDescription>
                </div>
                {liveUsed && (
                  <Badge tone="high">
                    <Radio className="h-2.5 w-2.5" aria-hidden /> Live twin state
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="relative px-0">
                <div className="grid grid-cols-1 gap-x-5 gap-y-3.5 sm:grid-cols-2">
                  {FEATURE_META.map((f) => (
                    <Slider
                      key={f.key}
                      id={`slider-${f.key}`}
                      label={`${f.label} (${f.unit})`}
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      value={features[f.key]}
                      onChange={(v) => setFeatures((prev) => ({ ...prev, [f.key]: v }))}
                      formatValue={(v) => (f.isFraction ? `${(v * 100).toFixed(0)}%` : v.toFixed(f.step < 1 ? 2 : 0))}
                    />
                  ))}
                  <div>
                    <label htmlFor="soil-select" className="mb-1.5 block text-xs font-medium text-muted">
                      Soil composition
                    </label>
                    <Select id="soil-select" className="w-full" value={soil} onChange={(e) => setSoil(e.target.value as LandslideSoil)}>
                      {LANDSLIDE_SOILS.map((s) => (
                        <option key={s} value={s}>
                          {SOIL_LABEL[s]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-5 rounded-xl border border-border bg-surface/70 p-4">
                  <RiskRing score={prob} level={level} size={148} label="Landslide probability" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-mono text-[10px] tracking-[0.15em] text-faint uppercase">Output</p>
                    <p className="font-display text-3xl font-bold tracking-tight" style={{ color }}>
                      {prob.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted">
                      {level === "LOW" && "Slope conditions are currently stable in the prototype model."}
                      {level === "MODERATE" && "Elevated factors — monitor rainfall and displacement."}
                      {level === "HIGH" && "High trigger combination — treat as a model warning."}
                      {level === "CRITICAL" && "Critical combination of triggers — prototype flags imminent risk."}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-faint">
                      <FlaskConical className="h-3 w-3" aria-hidden />
                      Prototype heuristic fit on demo data — not validated.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model card */}
            <div className="space-y-4 lg:col-span-2">
              <Card elevated className="p-4">
                <CardHeader className="px-0 pt-0">
                  <div>
                    <CardTitle>Feature impact</CardTitle>
                    <CardDescription>Weight × feature scale, normalized. Sign matters.</CardDescription>
                  </div>
                  <DataStatusBadge status="MODEL_PREDICTION" />
                </CardHeader>
                <CardContent className="space-y-2.5 px-0">
                  {stats.map((s) => (
                    <div key={s.key}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 text-muted">
                          {s.direction === "risk" ? (
                            <Activity className="h-3 w-3 text-high" aria-hidden />
                          ) : (
                            <Sprout className="h-3 w-3 text-low" aria-hidden />
                          )}
                          {s.label}
                        </span>
                        <span className="font-mono text-[10px] text-faint">{s.impactPct.toFixed(0)}%</span>
                      </div>
                      <Progress value={s.impactPct} color={directionColor(s.direction)} height={5} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card elevated className="p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">
                  <Braces className="h-3.5 w-3.5" aria-hidden /> Method (prototype)
                </p>
                <ul className="mt-2 space-y-2 text-xs text-muted">
                  <li className="flex gap-2">
                    <span className="text-high">1.</span>
                    {rows.length.toLocaleString()} labeled records are parsed from the bundled CSV.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-high">2.</span>
                    Continuous triggers are standardized; a logistic regression is fitted with gradient descent in your browser.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-high">3.</span>
                    The fitted weights drive the probability estimator and feature impact above.
                  </li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Dataset insight */}
          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card elevated className="p-4">
              <CardHeader className="px-0 pt-0">
                <div>
                  <CardTitle>Dataset insight</CardTitle>
                  <CardDescription>Class mean for each trigger — landslide records vs stable records.</CardDescription>
                </div>
                <DataStatusBadge status="DEMO" />
              </CardHeader>
              <CardContent className="px-0">
                <div className="divide-y divide-border/50 overflow-x-auto">
                  {stats.map((s) => {
                    const riskCo = s.direction === "risk" ? "#F97316" : "#22C55E";
                    return (
                      <div key={s.key} className="grid grid-cols-[1.4fr_1fr_1fr_2fr] items-center gap-3 py-2 text-xs">
                        <span className="text-muted">{s.label}</span>
                        <span className="font-mono text-[11px] text-high">{s.unit ? `${s.meanPositive.toFixed(1)}` : s.meanPositive.toFixed(2)}</span>
                        <span className="font-mono text-[11px] text-low">{s.unit ? `${s.meanNegative.toFixed(1)}` : s.meanNegative.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-[9px] tracking-wider text-faint uppercase">
                            {s.direction === "risk" ? "raises risk" : "reduces risk"}
                          </span>
                          <span className="flex-1">
                            <Progress value={s.impactPct} color={riskCo} height={4} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-faint uppercase">
                  <span>Feature</span>
                  <span className="flex gap-6">
                    <span className="text-high">Landslide mean</span>
                    <span className="text-low">Stable mean</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card elevated className="p-4">
              <CardHeader className="px-0 pt-0">
                <div>
                  <CardTitle>Soil composition</CardTitle>
                  <CardDescription>Share of landslide labels within each soil class.</CardDescription>
                </div>
                <DataStatusBadge status="DEMO" />
              </CardHeader>
              <CardContent className="space-y-3 px-0">
                {soilBreakdown.map((s) => (
                  <div key={s.soil}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 text-muted">
                        <Droplets className="h-3 w-3 text-high" aria-hidden /> {SOIL_LABEL[s.soil]}
                      </span>
                      <span className="font-mono text-[11px] text-muted">
                        {s.rate.toFixed(0)}% · {s.pos}/{s.count}
                      </span>
                    </div>
                    <Progress value={s.rate} color="#F97316" height={6} />
                  </div>
                ))}
                <div className="mt-3 flex items-center gap-2 rounded-md border border-border/60 bg-surface/60 p-2.5 text-[11px] text-faint">
                  <Ruler className="h-3.5 w-3.5 shrink-0 text-high" aria-hidden />
                  Silty and gravel moraines show elevated landslide rates in this demo set.
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="mt-4 flex flex-wrap items-center gap-2 border-moderate/30 p-3 text-xs text-muted">
            <Waves className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              This engine is a prototype trained on the bundled demo dataset. Outputs are educational and not suitable
              for real-world early-warning decisions — refer to official agencies for actual hazard alerts.
            </span>
          </Card>
        </>
      )}
    </div>
  );
}

function Chip({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface/70 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase" style={{ color: tone }}>
        {icon}
        {label}
      </div>
      <p className="mt-1 font-display text-xl font-bold tracking-tight text-text">{value}</p>
    </div>
  );
}