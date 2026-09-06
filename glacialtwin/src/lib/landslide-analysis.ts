import type { RiskLevel } from "./types";
import { getRiskLevel } from "./config";

/**
 * Landslide Analysis module.
 * Parses the bundled demo dataset (public/landslide_dataset.csv), trains a
 * small logistic-regression model entirely in the browser, computes training
 * diagnostics and exposes a risk predictor. This is a prototype — the model is
 * fitted on demo data and is NOT validated or suitable for real warnings.
 */

export type LandslideSoil = "gravel" | "sand" | "silt";

export interface LandslideRow {
  rainfallMm: number;
  slopeAngle: number;
  soilSaturation: number;
  vegetationCover: number;
  earthquakeActivity: number;
  proximityToWater: number;
  landslide: number;
  soil: LandslideSoil;
}

export interface LandslideModel {
  weights: number[];
  intercept: number;
  means: number[];
  stds: number[];
  accuracyPct: number;
  aucPct: number;
  positives: number;
  negatives: number;
  rows: number;
}

export interface FeatureStat {
  key: string;
  label: string;
  unit: string;
  meanPositive: number;
  meanNegative: number;
  direction: "risk" | "protection";
  impactPct: number;
}

export interface FeatureInput {
  rainfall: number;
  slope: number;
  soilSaturation: number;
  vegetation: number;
  earthquake: number;
  proximity: number;
}

export const LANDSLIDE_SOILS: LandslideSoil[] = ["gravel", "sand", "silt"];

export const SOIL_LABEL: Record<LandslideSoil, string> = {
  gravel: "Gravel (moraine)",
  sand: "Sandy soil",
  silt: "Silty soil",
};

export const FEATURE_META: Array<{
  key: keyof FeatureInput;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  isFraction?: boolean;
}> = [
  { key: "rainfall", label: "Rainfall", unit: "mm", min: 50, max: 300, step: 1 },
  { key: "slope", label: "Slope angle", unit: "°", min: 0, max: 60, step: 0.5 },
  { key: "soilSaturation", label: "Soil saturation", unit: "", min: 0, max: 1, step: 0.01, isFraction: true },
  { key: "vegetation", label: "Vegetation cover", unit: "", min: 0, max: 1, step: 0.01, isFraction: true },
  { key: "earthquake", label: "Earthquake activity", unit: "", min: 0, max: 6.5, step: 0.1 },
  { key: "proximity", label: "Proximity to water", unit: "km", min: 0, max: 2, step: 0.01 },
];

export const DEFAULT_FEATURES: FeatureInput = {
  rainfall: 150,
  slope: 30,
  soilSaturation: 0.5,
  vegetation: 0.5,
  earthquake: 3,
  proximity: 1,
};

export function parseLandslideCsv(text: string): LandslideRow[] {
  const lines = text.trim().split(/\r?\n/);
  const rows: LandslideRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 10) continue;
    const nums = parts.map((p) => Number(p.trim()));
    if (nums.some((n) => Number.isNaN(n))) continue;
    const soil: LandslideSoil = nums[8] === 1 ? "sand" : nums[9] === 1 ? "silt" : "gravel";
    rows.push({
      rainfallMm: nums[0],
      slopeAngle: nums[1],
      soilSaturation: nums[2],
      vegetationCover: nums[3],
      earthquakeActivity: nums[4],
      proximityToWater: nums[5],
      landslide: nums[6] === 1 ? 1 : 0,
      soil,
    });
  }
  return rows;
}

const FEATURE_VALUES = (r: LandslideRow): number[] => [
  r.rainfallMm,
  r.slopeAngle,
  r.soilSaturation,
  r.vegetationCover,
  r.earthquakeActivity,
  r.proximityToWater,
];

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function trainLandslideModel(rows: LandslideRow[], epochs = 900): LandslideModel {
  const n = rows.length;
  const positives = rows.filter((r) => r.landslide === 1).length;
  const negatives = n - positives;

  const means = new Array(6).fill(0);
  const variance = new Array(6).fill(0);
  for (const r of rows) {
    const values = FEATURE_VALUES(r);
    for (let i = 0; i < 6; i++) {
      means[i] += values[i];
    }
  }
  for (let i = 0; i < 6; i++) means[i] /= n;
  for (const r of rows) {
    const values = FEATURE_VALUES(r);
    for (let i = 0; i < 6; i++) {
      variance[i] += (values[i] - means[i]) ** 2;
    }
  }
  const stds = variance.map((s) => Math.sqrt(s / n) || 1);

  const xs: number[][] = [];
  const ys: number[] = [];
  for (const r of rows) {
    const values = FEATURE_VALUES(r);
    const x = values.map((val, i) => (val - means[i]) / stds[i]);
    x.push(r.soil === "sand" ? 1 : 0);
    x.push(r.soil === "silt" ? 1 : 0);
    xs.push(x);
    ys.push(r.landslide);
  }

  let w = new Array(8).fill(0);
  let b = 0;
  const lr = 2;
  const l2 = 0.005;
  for (let e = 0; e < epochs; e++) {
    const g = new Array(8).fill(0);
    let gb = 0;
    for (let i = 0; i < n; i++) {
      const p = sigmoid(dot(xs[i], w) + b);
      const err = p - ys[i];
      for (let j = 0; j < 8; j++) g[j] += xs[i][j] * err;
      gb += err;
    }
    for (let j = 0; j < 8; j++) w[j] -= lr * (g[j] / n + l2 * w[j]);
    b -= lr * (gb / n);
  }

  let correct = 0;
  const scores: Array<{ s: number; y: number }> = [];
  for (let i = 0; i < n; i++) {
    const p = sigmoid(dot(xs[i], w) + b);
    if ((p >= 0.5 ? 1 : 0) === ys[i]) correct++;
    scores.push({ s: p, y: ys[i] });
  }
  scores.sort((a, b) => a.s - b.s);
  let rankSum = 0;
  let seenBefore = 0;
  for (const sc of scores) {
    if (sc.y === 1) rankSum += seenBefore + 1;
    seenBefore++;
  }
  const auc = positives > 0 && negatives > 0 ? rankSum / (positives * negatives) : 0.5;

  return {
    weights: w,
    intercept: b,
    means,
    stds,
    accuracyPct: (correct / n) * 100,
    aucPct: auc * 100,
    positives,
    negatives,
    rows: n,
  };
}

export function predictProbability(f: FeatureInput, soil: LandslideSoil, m: LandslideModel): number {
  const values = [f.rainfall, f.slope, f.soilSaturation, f.vegetation, f.earthquake, f.proximity];
  const x = values.map((v, i) => (v - m.means[i]) / m.stds[i]);
  x.push(soil === "sand" ? 1 : 0);
  x.push(soil === "silt" ? 1 : 0);
  return sigmoid(dot(x, m.weights) + m.intercept);
}

export function riskLevelOf(probPct: number): RiskLevel {
  return getRiskLevel(Math.min(100, Math.max(0, probPct)));
}

export function featureStats(rows: LandslideRow[], m: LandslideModel): FeatureStat[] {
  const pos = rows.filter((r) => r.landslide === 1);
  const neg = rows.filter((r) => r.landslide === 0);

  const meansOf = (subset: LandslideRow[]): number[] => {
    const sums = new Array(6).fill(0);
    for (const r of subset) {
      const values = FEATURE_VALUES(r);
      for (let i = 0; i < 6; i++) sums[i] += values[i];
    }
    return sums.map((s) => s / Math.max(1, subset.length));
  };

  const posMeans = meansOf(pos);
  const negMeans = meansOf(neg);

  const magnitude = m.weights.map((w, i) => Math.abs(w) * (i < 6 ? m.stds[i] || 1 : 1));
  const magSum = magnitude.reduce((a, b) => a + b, 0) || 1;
  const impact = magnitude.map((v) => (v / magSum) * 100);

  const labels = ["Rainfall", "Slope angle", "Soil saturation", "Vegetation cover", "Earthquake activity", "Proximity to water"];
  const units = ["mm", "°", "", "", "", "km"];
  const keys = ["rainfall", "slope", "soilSaturation", "vegetation", "earthquake", "proximity"] as const;

  return labels.map((label, i) => ({
    key: keys[i],
    label,
    unit: units[i],
    meanPositive: posMeans[i],
    meanNegative: negMeans[i],
    direction: i === 3 || i === 5 ? ("protection" as const) : ("risk" as const),
    impactPct: impact[i],
  }));
}

export function directionColor(direction: FeatureStat["direction"]): string {
  return direction === "risk" ? "#F97316" : "#22C55E";
}