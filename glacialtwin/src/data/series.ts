import type {
  EnvMonthPoint,
  ForecastPoint,
  Lake,
  RiskTrendPoint,
} from "@/lib/types";
import { hashString, mulberry32 } from "@/lib/utils";

/**
 * Deterministic demo time-series generators.
 * Series are derived from each lake's anchor values with a seeded PRNG so
 * they are stable across renders and reloads. All output is DEMO DATA.
 */

const MONTH_LABELS = [
  "Sep", "Oct", "Nov", "Dec", "Jan", "Feb",
  "Mar", "Apr", "May", "Jun", "Jul", "Aug",
];

/** Monsoon-shaped monthly precipitation + seasonal temperature for 12 months. */
export function getEnvironmentalSeries(lake: Lake): EnvMonthPoint[] {
  const rand = mulberry32(hashString(lake.id + "-env"));
  return MONTH_LABELS.map((month, i) => {
    // Monsoon peak around Jun–Sep (indices 9..12, 0)
    const monsoon = Math.exp(-Math.pow(((i - 10.5 + 12) % 12) - 0.5, 2) / 6);
    const rainfallMm = Math.round(
      lake.rainfallMmPerMonth * (0.25 + 1.75 * monsoon) * (0.85 + rand() * 0.3)
    );
    // Temperature lags monsoon slightly; higher altitude → colder
    const seasonal = Math.cos(((i - 1) / 12) * 2 * Math.PI);
    const temperatureC =
      Math.round((lake.temperatureC + seasonal * 5.5 + (rand() - 0.5)) * 10) / 10;
    return { month, temperatureC, rainfallMm };
  });
}

/** 12-month risk evolution ending at the current engine score. */
export function getRiskTrend(lake: Lake, currentScore: number): RiskTrendPoint[] {
  const rand = mulberry32(hashString(lake.id + "-risk"));
  const points: number[] = [currentScore];
  // Walk backwards with a slight downward drift so the series ends at currentScore.
  for (let i = 1; i < 12; i++) {
    const prev = points[0] - (rand() * 4.2 - 1.4);
    points.unshift(Math.min(97, Math.max(4, prev)));
  }
  const events: Record<number, string> = {
    4: "Monsoon onset",
    9: "Monsoon peak",
    11: "Latest observation",
  };
  return points.map((score, i) => ({
    label: MONTH_LABELS[i],
    score: Math.round(score),
    event: events[i],
  }));
}

/** Long-term glacier length/retreat proxy series (demo). */
export function getGlacierRetreat(lake: Lake): Array<{ year: number; retreatM: number }> {
  const rand = mulberry32(hashString(lake.id + "-glacier"));
  const annual = 8 + (lake.glacierDistanceKm < 1 ? 9 : 4);
  let cumulative = 0;
  const out: Array<{ year: number; retreatM: number }> = [];
  for (let year = 2000; year <= 2025; year++) {
    cumulative += annual * (0.7 + rand() * 0.6);
    out.push({ year, retreatM: Math.round(cumulative) });
  }
  return out;
}

/** Annual growth-rate bars derived from the recorded area history. */
export function getGrowthRates(lake: Lake): Array<{ year: number; growthPct: number }> {
  return lake.areaHistory.slice(1).map((p, i) => {
    const prev = lake.areaHistory[i].areaKm2;
    return {
      year: p.year,
      growthPct: Math.round(((p.areaKm2 - prev) / prev) * 1000) / 10,
    };
  });
}

/**
 * Linear-trend extrapolation of the recorded area history.
 * Clearly labelled MODEL FORECAST wherever rendered.
 */
export function getForecast(lake: Lake): ForecastPoint[] {
  const hist = lake.areaHistory;
  const first = hist[0];
  const last = hist[hist.length - 1];
  const slope = (last.areaKm2 - first.areaKm2) / (last.year - first.year);
  const points: ForecastPoint[] = hist.map((p) => ({
    year: p.year,
    areaKm2: p.areaKm2,
    lowerKm2: p.areaKm2,
    upperKm2: p.areaKm2,
    kind: "historical" as const,
  }));
  for (let k = 1; k <= 4; k++) {
    const year = last.year + k;
    const areaKm2 = Math.max(0, Math.round((last.areaKm2 + slope * k) * 100) / 100);
    const band = Math.round(areaKm2 * (0.02 + 0.025 * k) * 100) / 100;
    points.push({
      year,
      areaKm2,
      lowerKm2: Math.round((areaKm2 - band) * 100) / 100,
      upperKm2: Math.round((areaKm2 + band) * 100) / 100,
      kind: "forecast",
    });
  }
  return points;
}
