import type { Lake, RiskAssessment, RiskContribution, RiskLevel, ScenarioInputs } from "./types";
import { getRiskLevel } from "./config";

/**
 * PROTOTYPE RISK ENGINE — heuristic, transparent feature-weight model.
 *
 * This is NOT a trained machine-learning model. It applies fixed expert-set
 * weights to normalised demo features so the whole application has a single,
 * internally consistent source of risk scores. Outputs are labelled
 * MODEL PREDICTION (prototype) throughout the UI.
 */

interface FeatureVector {
  expansion: number;
  rainfall: number;
  temperature: number;
  elevation: number;
  slope: number;
  glacierProximity: number;
  stability: number;
  history: number;
  instability: number;
}

const WEIGHTS: Record<keyof FeatureVector, number> = {
  expansion: 0.22,
  rainfall: 0.18,
  temperature: 0.1,
  elevation: 0.05,
  slope: 0.09,
  glacierProximity: 0.12,
  stability: 0.08,
  history: 0.06,
  instability: 0.1,
};

const FEATURE_LABELS: Record<keyof FeatureVector, string> = {
  expansion: "Lake Expansion",
  rainfall: "Rainfall",
  temperature: "Temperature Trend",
  elevation: "Elevation Setting",
  slope: "Slope",
  glacierProximity: "Glacier Proximity",
  stability: "Recent Precipitation",
  history: "Historical Change",
  instability: "Dam Instability Index",
};

const INTERCEPT = 2;

function precipStabilityValue(level: Lake["recentPrecipitation"]): number {
  if (level === "EXTREME") return 1;
  if (level === "ELEVATED") return 0.5;
  return 0;
}

export function extractFeatures(lake: Lake): FeatureVector {
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  return {
    expansion: clamp01(lake.areaGrowthRatePctPerYear / 20),
    rainfall: clamp01(lake.rainfallMmPerMonth / 450 + precipStabilityValue(lake.recentPrecipitation) * 0.16),
    temperature: clamp01(lake.temperatureC / 10),
    elevation: clamp01((5600 - lake.elevationM) / 1600),
    slope: clamp01(lake.slopeDeg / 20),
    glacierProximity: clamp01(1 - lake.glacierDistanceKm / 5),
    stability: precipStabilityValue(lake.recentPrecipitation),
    history: clamp01(lake.historyAreaChangePct / 60),
    instability: clamp01(lake.instabilityIndex),
  };
}

export function scoreFromFeatures(f: FeatureVector): number {
  let s = INTERCEPT;
  (Object.keys(WEIGHTS) as Array<keyof FeatureVector>).forEach((k) => {
    s += WEIGHTS[k] * f[k] * 100;
  });
  return Math.round(Math.min(100, Math.max(0, s)));
}

export function classify(score: number): RiskLevel {
  return getRiskLevel(score);
}

export function assessRisk(lake: Lake): RiskAssessment {
  const f = extractFeatures(lake);
  const score = scoreFromFeatures(f);
  const contributions = (Object.keys(WEIGHTS) as Array<keyof FeatureVector>)
    .map((k) => ({
      key: k,
      feature: FEATURE_LABELS[k],
      points: Math.round(WEIGHTS[k] * f[k] * 1000) / 10,
    }))
    .sort((a, b) => b.points - a.points)
    .map(({ feature, points }) => ({ feature, points }));

  const totalPositive = contributions.reduce((acc, c) => acc + Math.max(0, c.points), 0) || 1;
  const withShares: RiskContribution[] = contributions.map((c) => ({
    ...c,
    sharePct: Math.round((Math.max(0, c.points) / totalPositive) * 1000) / 10,
  }));

  return {
    score,
    level: classify(score),
    contributions: withShares,
    assessedAt: lake.lastObservationAt,
  };
}

/** Aggregate top contributions into Top-N + Other for SHAP-style display. */
export function topContributions(risk: RiskAssessment, n = 5): RiskContribution[] {
  const top = risk.contributions.slice(0, n);
  const otherPoints =
    Math.round(
      (risk.contributions.slice(n).reduce((a, c) => a + c.points, 0)) * 10
    ) / 10;
  const otherShare =
    Math.round((100 - top.reduce((a, c) => a + c.sharePct, 0)) * 10) / 10;
  if (otherPoints > 0) {
    top.push({ feature: "Other", points: otherPoints, sharePct: Math.max(0, otherShare) });
  }
  return top;
}
