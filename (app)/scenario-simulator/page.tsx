"use client";

import { useMemo, useState } from "react";
import { FlaskConical, Play, Trash2, Pencil, Download, Check } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Button, Input, Select, Slider } from "@/components/ui/controls";
import { RiskBadge } from "@/components/common/risk-badge";
import { buildScenarioResult, DEFAULT_SCENARIO, runScenario } from "@/lib/scenario-engine";
import { getRiskLevel, RISK_COLORS } from "@/lib/config";
import type { PrecipitationLevel, ScenarioInputs, ScenarioResult } from "@/lib/types";
import { cn, downloadTextFile, toCsv } from "@/lib/utils";

export default function ScenarioSimulatorPage() {
  const { selectedLake, risk, scenarios, addScenario, renameScenario, deleteScenario } = useApp();

  const [inputs, setInputs] = useState<ScenarioInputs>(DEFAULT_SCENARIO);
  const [result, setResult] = useState<{ score: number; baseline: number } | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const scenarioScore = useMemo(() => runScenario(selectedLake, inputs), [selectedLake, inputs]);

  const simulate = () => {
    setResult({ score: scenarioScore, baseline: risk.score });
    addScenario(
      buildScenarioResult(selectedLake, inputs, `Scenario ${String(scenarios.length + 1).padStart(2, "0")} — ${selectedLake.name}`)
    );
  };

  const exportScenarios = () => {
    const rows = scenarios.map((s) => ({
      name: s.name,
      lake: s.lakeName,
      rainfall_pct: s.inputs.rainfallIncreasePct,
      temperature_delta_c: s.inputs.temperatureDeltaC,
      area_change_pct: s.inputs.areaChangePct,
      precipitation: s.inputs.precipitationLevel,
      stability: s.inputs.environmentalStability,
      baseline_score: s.baselineScore,
      scenario_score: s.scenarioScore,
      created_at: s.createdAt,
    }));
    downloadTextFile("glacialtwin-scenarios.csv", toCsv(rows));
  };

  const compareRows = scenarios.filter((s) => compareIds.includes(s.id));

  return (
    <div>
      <PageHeader
        title="What-If Scenario Simulator"
        subtitle="Explore how environmental changes could alter the model-estimated risk."
        dataStatus="SCENARIO"
        meta={<span>Baseline: {selectedLake.name} at {risk.score}/100</span>}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Controls */}
        <Card elevated className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Scenario Controls</CardTitle>
              <CardDescription>Perturbations are applied to the lake's feature vector and re-scored</CardDescription>
            </div>
            <FlaskConical className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-5">
            <Slider
              id="rainfall"
              label="Rainfall increase"
              min={-50}
              max={100}
              step={5}
              value={inputs.rainfallIncreasePct}
              onChange={(v) => setInputs((s) => ({ ...s, rainfallIncreasePct: v }))}
              formatValue={(v) => `${v >= 0 ? "+" : ""}${v}%`}
            />
            <Slider
              id="temperature"
              label="Temperature change"
              min={-3}
              max={5}
              step={0.5}
              value={inputs.temperatureDeltaC}
              onChange={(v) => setInputs((s) => ({ ...s, temperatureDeltaC: v }))}
              formatValue={(v) => `${v >= 0 ? "+" : ""}${v} °C`}
            />
            <Slider
              id="area"
              label="Lake area change"
              min={-20}
              max={50}
              step={5}
              value={inputs.areaChangePct}
              onChange={(v) => setInputs((s) => ({ ...s, areaChangePct: v }))}
              formatValue={(v) => `${v >= 0 ? "+" : ""}${v}%`}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="precip" className="mb-1.5 block text-xs font-medium text-muted">
                  Recent precipitation
                </label>
                <Select
                  id="precip"
                  value={inputs.precipitationLevel}
                  onChange={(e) => setInputs((s) => ({ ...s, precipitationLevel: e.target.value as PrecipitationLevel }))}
                  className="h-9 w-full"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="ELEVATED">Elevated</option>
                  <option value="EXTREME">Extreme</option>
                </Select>
              </div>
              <div>
                <label htmlFor="stability" className="mb-1.5 block text-xs font-medium text-muted">
                  Environmental stability
                </label>
                <Select
                  id="stability"
                  value={inputs.environmentalStability}
                  onChange={(e) =>
                    setInputs((s) => ({ ...s, environmentalStability: e.target.value as ScenarioInputs["environmentalStability"] }))
                  }
                  className="h-9 w-full"
                >
                  <option value="STABLE">Stable</option>
                  <option value="REDUCED">Reduced</option>
                </Select>
              </div>
            </div>

            <Button variant="primary" size="lg" className="w-full" onClick={simulate}>
              <Play className="h-4 w-4" aria-hidden /> SIMULATE SCENARIO
            </Button>

            {/* Current state summary */}
            <div className="rounded-lg border border-border bg-surface p-3.5">
              <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-faint uppercase">Current state — {selectedLake.name}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
                {[
                  ["Lake area", `${selectedLake.areaKm2} km²`],
                  ["Rainfall", selectedLake.recentPrecipitation.toLowerCase()],
                  ["Temperature", `${selectedLake.temperatureC} °C`],
                  ["Risk", `${risk.score} (${risk.level})`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-faint">{k}</dt>
                    <dd className="font-mono text-text">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card elevated className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Scenario Result</CardTitle>
              <CardDescription>Model-based estimate under perturbed conditions</CardDescription>
            </div>
            <DataStatusBadge status="SCENARIO" />
          </CardHeader>
          <CardContent>
            {result === null ? (
              <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
                <FlaskConical className="h-6 w-6 text-faint" aria-hidden />
                <p className="max-w-[220px] text-xs text-muted">
                  Adjust the controls and run <span className="font-semibold text-text">SIMULATE SCENARIO</span> to see the
                  estimated effect on risk.
                </p>
                <p className="font-mono text-[11px] text-faint">
                  Live preview: {scenarioScore}/100 ({getRiskLevel(scenarioScore)})
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] tracking-wider text-faint uppercase">Current risk</p>
                    <p className="font-display text-3xl font-bold text-text">{result.baseline}</p>
                    <RiskBadge level={getRiskLevel(result.baseline)} size="sm" />
                  </div>
                  <div className="flex flex-col items-center text-primary">
                    <span className="text-2xl">→</span>
                    <span
                      className="font-mono text-sm font-bold"
                      style={{ color: result.score - result.baseline >= 0 ? RISK_COLORS.HIGH : RISK_COLORS.LOW }}
                    >
                      {result.score - result.baseline >= 0 ? "+" : ""}
                      {result.score - result.baseline} pts
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] tracking-wider text-faint uppercase">Scenario risk</p>
                    <p
                      className="font-display text-3xl font-bold"
                      style={{ color: RISK_COLORS[getRiskLevel(result.score)] }}
                    >
                      {result.score}
                    </p>
                    <RiskBadge level={getRiskLevel(result.score)} size="sm" />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface p-3.5 text-xs leading-relaxed text-muted">
                  Under this scenario the prototype estimate for{" "}
                  <span className="text-text">{selectedLake.name}</span> moves from{" "}
                  <span className="font-mono text-text">
                    {result.baseline} ({getRiskLevel(result.baseline)})
                  </span>{" "}
                  to{" "}
                  <span className="font-mono" style={{ color: RISK_COLORS[getRiskLevel(result.score)] }}>
                    {result.score} ({getRiskLevel(result.score)})
                  </span>
                  . Scenario outputs are model-based estimates for research/demo purposes and should
                  not be interpreted as official emergency forecasts.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card elevated className="mt-4">
        <CardHeader>
          <div>
            <CardTitle>Scenario History</CardTitle>
            <CardDescription>Saved locally · rename, compare, export or delete</CardDescription>
          </div>
          {scenarios.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportScenarios}>
              <Download className="h-3.5 w-3.5" aria-hidden /> Export CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {scenarios.length === 0 ? (
            <EmptyState
              icon={<FlaskConical className="h-6 w-6" aria-hidden />}
              title="No saved scenarios yet"
              description="Run a simulation and it will be stored here automatically."
            />
          ) : (
            <>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {scenarios.map((s) => (
                  <ScenarioHistoryItem
                    key={s.id}
                    scenario={s}
                    selected={compareIds.includes(s.id)}
                    onToggleCompare={() =>
                      setCompareIds((ids) => (ids.includes(s.id) ? ids.filter((i) => i !== s.id) : [...ids, s.id].slice(-3)))
                    }
                    renaming={renamingId === s.id}
                    onStartRename={() => {
                      setRenamingId(s.id);
                      setRenameValue(s.name);
                    }}
                    renameValue={renameValue}
                    onRenameChange={setRenameValue}
                    onRenameSubmit={() => {
                      if (renameValue.trim()) renameScenario(s.id, renameValue.trim());
                      setRenamingId(null);
                    }}
                    onDelete={() => {
                      deleteScenario(s.id);
                      setCompareIds((ids) => ids.filter((i) => i !== s.id));
                    }}
                  />
                ))}
              </ul>

              {compareRows.length >= 2 && (
                <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-elevated text-[10px] tracking-wider text-faint uppercase">
                        <th scope="col" className="px-3 py-2 font-semibold">Scenario</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Rainfall</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Temp</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Area</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Baseline</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Scenario</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compareRows.map((s) => (
                        <tr key={s.id} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-2 text-text">{s.name}</td>
                          <td className="px-3 py-2 font-mono text-muted">{s.inputs.rainfallIncreasePct >= 0 ? "+" : ""}{s.inputs.rainfallIncreasePct}%</td>
                          <td className="px-3 py-2 font-mono text-muted">{s.inputs.temperatureDeltaC >= 0 ? "+" : ""}{s.inputs.temperatureDeltaC}°C</td>
                          <td className="px-3 py-2 font-mono text-muted">{s.inputs.areaChangePct >= 0 ? "+" : ""}{s.inputs.areaChangePct}%</td>
                          <td className="px-3 py-2 font-mono text-text">{s.baselineScore}</td>
                          <td className="px-3 py-2 font-mono font-bold" style={{ color: RISK_COLORS[getRiskLevel(s.scenarioScore)] }}>
                            {s.scenarioScore}
                          </td>
                          <td className="px-3 py-2 font-mono" style={{ color: s.scenarioScore >= s.baselineScore ? RISK_COLORS.HIGH : RISK_COLORS.LOW }}>
                            {s.scenarioScore - s.baselineScore >= 0 ? "+" : ""}
                            {s.scenarioScore - s.baselineScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ScenarioHistoryItem({
  scenario: s,
  selected,
  onToggleCompare,
  renaming,
  onStartRename,
  renameValue,
  onRenameChange,
  onRenameSubmit,
  onDelete,
}: {
  scenario: ScenarioResult;
  selected: boolean;
  onToggleCompare: () => void;
  renaming: boolean;
  onStartRename: () => void;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={cn(
        "rounded-lg border bg-surface p-3.5 transition-colors",
        selected ? "border-primary/60" : "border-border hover:border-border-strong"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {renaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onRenameSubmit();
            }}
            className="flex flex-1 items-center gap-1.5"
          >
            <Input value={renameValue} onChange={(e) => onRenameChange(e.target.value)} autoFocus aria-label="Scenario name" className="h-7 text-xs" />
            <button type="submit" aria-label="Save name" className="cursor-pointer text-low">
              <Check className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <p className="truncate text-xs font-semibold text-text">{s.name}</p>
        )}
        <RiskBadge level={getRiskLevel(s.scenarioScore)} score={s.scenarioScore} size="sm" />
      </div>
      <p className="mt-1.5 font-mono text-[10.5px] text-muted">
        Rain {s.inputs.rainfallIncreasePct >= 0 ? "+" : ""}{s.inputs.rainfallIncreasePct}% · Temp{" "}
        {s.inputs.temperatureDeltaC >= 0 ? "+" : ""}{s.inputs.temperatureDeltaC}°C · Area{" "}
        {s.inputs.areaChangePct >= 0 ? "+" : ""}{s.inputs.areaChangePct}%
      </p>
      <p className="mt-0.5 font-mono text-[10.5px] text-faint">
        {s.baselineScore} → {s.scenarioScore} ({s.scenarioScore - s.baselineScore >= 0 ? "+" : ""}
        {s.scenarioScore - s.baselineScore}) · {s.lakeName}
      </p>
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2.5">
        <button
          onClick={onToggleCompare}
          aria-pressed={selected}
          className={cn(
            "cursor-pointer rounded px-1.5 py-1 text-[10px] font-medium transition-colors",
            selected ? "bg-primary/15 text-primary" : "text-muted hover:text-text"
          )}
        >
          Compare
        </button>
        <button onClick={onStartRename} className="cursor-pointer rounded px-1.5 py-1 text-[10px] font-medium text-muted transition-colors hover:text-text">
          <Pencil className="h-3 w-3" aria-hidden />
        </button>
        <button onClick={onDelete} aria-label="Delete scenario" className="ml-auto cursor-pointer rounded px-1.5 py-1 text-[10px] text-muted transition-colors hover:text-critical">
          <Trash2 className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </li>
  );
}
