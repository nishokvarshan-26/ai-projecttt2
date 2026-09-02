import type { Lake, ScenarioInputs, ScenarioResult } from "./types";
import { getRiskLevel } from "./config";
import { assessRisk, extractFeatures, scoreFromFeatures } from "./risk-engine";

/**
 * SCENARIO ENGINE — applies user-defined perturbations to a lake's feature
 * vector and re-runs the prototype risk model. Outputs are SCENARIO
 * SIMULATIONS (model-based estimates), never forecasts of real events.
 */

export const DEFAULT_SCENARIO: ScenarioInputs = {
  rainfallIncreasePct: 30,
  temperatureDeltaC: 2,
  areaChangePct: 15,
  precipitationLevel: "ELEVATED",
  environmentalStability: "REDUCED",
};

export function runScenario(lake: Lake, inputs: ScenarioInputs): number {
  const f = extractFeatures(lake);
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

  const rainfall = clamp01(f.rainfall * (1 + inputs.rainfallIncreasePct / 100));
  const temperature = clamp01(f.temperature + inputs.temperatureDeltaC / 10);
  const expansion = clamp01(f.expansion * (1 + inputs.areaChangePct / 100));
  const stability =
    inputs.precipitationLevel === "EXTREME"
      ? 1
      : inputs.precipitationLevel === "ELEVATED"
        ? 0.5
        : 0;
  const instability = clamp01(
    f.instability +
      (inputs.environmentalStability === "REDUCED" ? 0.3 : 0) +
      Math.max(0, inputs.areaChangePct / 250)
  );

  return scoreFromFeatures({
    ...f,
    rainfall,
    temperature,
    expansion,
    stability,
    instability,
  });
}

export function buildScenarioResult(
  lake: Lake,
  inputs: ScenarioInputs,
  name?: string
): ScenarioResult {
  const baseline = assessRisk(lake).score;
  const scenarioScore = runScenario(lake, inputs);
  return {
    id: `scn-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`,
    name:
      name ??
      `Scenario ${new Date().toISOString().slice(5, 16).replace("T", " ")}`,
    lakeId: lake.id,
    lakeName: lake.name,
    inputs,
    baselineScore: baseline,
    scenarioScore,
    createdAt: new Date().toISOString(),
  };
}

export function describeScenarioDelta(
  baseline: number,
  scenario: number
): { delta: number; fromLevel: string; toLevel: string } {
  return {
    delta: scenario - baseline,
    fromLevel: getRiskLevel(baseline),
    toLevel: getRiskLevel(scenario),
  };
}
