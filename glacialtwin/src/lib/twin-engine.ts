import type { Lake, RiskContribution, RiskLevel } from "./types";
import type {
  SensorState,
  SeismicState,
  SlopeZoneState,
  ScenarioKind,
  TwinState,
  TwinTelemetry,
  TwinTimelineEvent,
} from "./twin-types";
import { getRiskLevel } from "./config";
import { hashString, mulberry32 } from "./utils";

/**
 * DIGITAL TWIN STATE ENGINE
 *
 * Builds the deterministic baseline twin state for a lake and advances it
 * through demo scenarios. All scores/levels are prototype outputs of the
 * heuristic engine — labelled as such everywhere they are displayed.
 */

export const INTERCEPT = 31;

/** Dynamic feature weights (prototype, not scientifically validated). */
export const DYNAMIC_WEIGHTS: Array<
  [key: string, label: string, weight: number]
> = [
  ["lakeLevel", "Lake level rise", 0.14],
  ["rainfall", "Rainfall intensity", 0.14],
  ["temperature", "Temperature", 0.06],
  ["slopeInstability", "Slope instability", 0.22],
  ["seismic", "Seismic activity", 0.12],
  ["inflow", "Lake inflow", 0.08],
  ["moraine", "Moraine dam stress", 0.24],
];

/** Per-scenario severity calibration (prototype). */
export const SCENARIO_MULTIPLIER: Record<ScenarioKind, number> = {
  NORMAL: 1,
  HEAVY_RAINFALL: 0.6,
  EARTHQUAKE: 0.8,
  LANDSLIDE: 0.75,
  LAKE_RISE: 0.5,
  COMPOUND: 1,
};

export const SCENARIO_META: Record<
  ScenarioKind,
  { label: string; description: string }
> = {
  NORMAL: { label: "Baseline", description: "Baseline observed conditions (demo)." },
  HEAVY_RAINFALL: {
    label: "Heavy rainfall",
    description: "Sustained extreme rainfall stresses the catchment slopes.",
  },
  EARTHQUAKE: {
    label: "Earthquake",
    description: "Seismic event detected near the monitored zone.",
  },
  LANDSLIDE: {
    label: "Landslide",
    description: "Unstable slope releases and enters the lake margin.",
  },
  LAKE_RISE: {
    label: "Lake rise",
    description: "Rapid water-level increase raises moraine dam stress.",
  },
  COMPOUND: {
    label: "Compound disaster",
    description: "Earthquake + heavy rainfall + unstable slope combined cascade.",
  },
};

export const SENSOR_TYPES = [
  "Rain Gauge",
  "Water Level",
  "Soil Moisture",
  "Pore Pressure",
  "Geophone",
  "Strain Gauge",
  "Inclinometer",
  "Crack Meter",
  "GNSS Ground Movement",
  "Weather Station",
] as const;

/* ------------------------------- Coordinates ------------------------------ */
// Matches the 3D viewer coordinate frame.
const LAKE_C = { x: -10, z: -46 };
const OUTLET = { x: -6, z: -12 };

export const SLOPE_DEFS = [
  { id: "zA", name: "Zone A", x: -48, z: -22, width: 27, depth: 16, rot: 0.9 },
  { id: "zB", name: "Zone B", x: 20, z: -6, width: 25, depth: 14, rot: -0.7 },
  { id: "zC", name: "Zone C", x: 36, z: -54, width: 23, depth: 15, rot: -2.3 },
  { id: "zM", name: "Moraine M1", x: -2, z: -16, width: 21, depth: 13, rot: 0.25 },
] as const;

const SENSOR_DEFS = [
  { code: "RG-01", label: "Rain Gauge", type: "rain" as const, x: -11, z: -2 },
  { code: "WL-02", label: "Water Level", type: "level" as const, x: 6, z: -38 },
  { code: "SM-03", label: "Soil Moisture", type: "soil" as const, x: -46, z: -26 },
  { code: "PZ-04", label: "Pore Pressure", type: "pore" as const, x: 22, z: -8 },
  { code: "GS-05", label: "Geophone", type: "seismic" as const, x: 62, z: -14 },
  { code: "ST-06", label: "Strain Gauge", type: "strain" as const, x: 0, z: -14 },
  { code: "IN-07", label: "Inclinometer", type: "inclino" as const, x: 34, z: -58 },
  { code: "CM-08", label: "Crack Meter", type: "crack" as const, x: -50, z: -18 },
  { code: "GP-09", label: "GNSS Movement", type: "gnss" as const, x: 22, z: 42 },
  { code: "WS-10", label: "Weather Station", type: "temp" as const, x: -20, z: -52 },
] as const;

/* --------------------------------- Helpers -------------------------------- */

function clamp(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v));
}

export function failureColor(pct: number): string {
  return pct >= 76 ? "#EF4444" : pct >= 51 ? "#F97316" : pct >= 26 ? "#EAB308" : "#22C55E";
}

export function sensorStatus(value: number, warn: number, crit: number) {
  if (value >= crit) return "ALERT" as const;
  if (value >= warn) return "WARNING" as const;
  return "OK" as const;
}

export function scenarioLabel(kind: ScenarioKind) {
  return SCENARIO_META[kind].label;
}

/* --------------------------- Baseline state builder ------------------------ */

interface ScenarioTargets {
  rain: number;
  soil: number;
  pore: number;
  disp: number;
  inflow: number;
  levelBoost: number;
  riseBoost: number;
  seisAct: number;
  slopeFailBoost: number;
  disturb: number;
  moraineBoost: number;
  tempDelta: number;
  mag: number | null;
  depth: number | null;
  dist: number;
  failingZone: string | null;
}

const SCENARIO_TARGETS: Record<ScenarioKind, ScenarioTargets> = {
  NORMAL: {
    rain: 0, soil: 0, pore: 0, disp: 0, inflow: 0, levelBoost: 0, riseBoost: 0,
    seisAct: 0, slopeFailBoost: 0, disturb: 0, moraineBoost: 0, tempDelta: 0,
    mag: null, depth: null, dist: 0, failingZone: null,
  },
  HEAVY_RAINFALL: {
    rain: 28, soil: 92, pore: 80, disp: 4.6, inflow: 18, levelBoost: 0.7, riseBoost: 6,
    seisAct: 0.28, slopeFailBoost: 24, disturb: 18, moraineBoost: 22, tempDelta: 0.6,
    mag: null, depth: null, dist: 0, failingZone: null,
  },
  EARTHQUAKE: {
    rain: 6, soil: 70, pore: 86, disp: 7.4, inflow: 8, levelBoost: 0.6, riseBoost: 3,
    seisAct: 0.94, slopeFailBoost: 34, disturb: 46, moraineBoost: 40, tempDelta: 0,
    mag: 5.8, depth: 12, dist: 11, failingZone: null,
  },
  LANDSLIDE: {
    rain: 14, soil: 82, pore: 84, disp: 16, inflow: 10, levelBoost: 0.4, riseBoost: 2,
    seisAct: 0.42, slopeFailBoost: 62, disturb: 62, moraineBoost: 30, tempDelta: 0,
    mag: null, depth: null, dist: 0, failingZone: "zA",
  },
  LAKE_RISE: {
    rain: 12, soil: 78, pore: 70, disp: 3.2, inflow: 26, levelBoost: 1.6, riseBoost: 20,
    seisAct: 0.2, slopeFailBoost: 10, disturb: 16, moraineBoost: 26, tempDelta: 0,
    mag: null, depth: null, dist: 0, failingZone: null,
  },
  COMPOUND: {
    rain: 30, soil: 95, pore: 96, disp: 19, inflow: 24, levelBoost: 1.1, riseBoost: 9,
    seisAct: 0.97, slopeFailBoost: 74, disturb: 90, moraineBoost: 60, tempDelta: 0.4,
    mag: 6.1, depth: 11, dist: 8, failingZone: "zB",
  },
};

const SENSITIVITIES: Record<string, { warn: number; crit: number }> = {
  rain: { warn: 12, crit: 22 },
  level: { warn: 2.4, crit: 4.2 },
  soil: { warn: 68, crit: 85 },
  pore: { warn: 62, crit: 82 },
  seismic: { warn: 9, crit: 20 },
  strain: { warn: 55, crit: 95 },
  inclino: { warn: 4, crit: 8 },
  crack: { warn: 4, crit: 9 },
  gnss: { warn: 2.5, crit: 6 },
  temp: { warn: Infinity, crit: Infinity },
};

export function buildBaselineTwinState(lake: Lake): TwinState {
  const rand = mulberry32(hashString(`${lake.id}:twin:v1`));
  const rainfallMmHr = 4 + Math.round(rand() * 5);
  const telemetry: TwinTelemetry = {
    rainfallMmHr,
    temperatureC: lake.temperatureC,
    relativeHumidityPct: 58 + Math.round(rand() * 12),
    soilMoisturePct: 46 + Math.round(rand() * 14),
    porePressureKPa: 38 + Math.round(rand() * 9),
    lakeLevelM: lake.waterLevelAnomalyM,
    lakeRiseRateMmHr: 0.8 + rand() * 0.9,
    inflowIncreasePct: 1 + rand() * 3,
    groundDisplacementMmDay: 0.6 + rand() * 1.1,
    seismicActivity: 0.16 + rand() * 0.06,
  };

  const slopes: SlopeZoneState[] = SLOPE_DEFS.map((def) => {
    const jitter = 0.92 + rand() * 0.16;
    const moraine = def.id === "zM";
    const stability = clamp(
      (94 - lake.instabilityIndex * 13) * jitter * (moraine ? 0.965 : 1),
      46,
      96
    );
    const displacement = moraine ? 0.9 + rand() * 0.7 : 0.5 + rand() * 1.2;
    const failureProb = clamp(
      (100 - stability) * 0.82 + displacement * 5.5,
      4,
      86
    );
    return {
      id: def.id,
      name: def.name,
      x: def.x,
      z: def.z,
      width: def.width,
      depth: def.depth,
      rot: def.rot,
      stabilityPct: Math.round(stability * 10) / 10,
      displacementMmDay: Math.round(displacement * 10) / 10,
      porePressureKPa: Math.round((38 + rand() * 12) * 10) / 10,
      soilMoisturePct: Math.round((44 + rand() * 14) * 10) / 10,
      failureProbPct: Math.round(failureProb * 10) / 10,
      failing: false,
    };
  });

  const sensors: SensorState[] = SENSOR_DEFS.map((def) => {
    const value = sensorValueForType(def.type, telemetry, lake);
    const sens = SENSITIVITIES[def.type];
    const status =
      def.type === "temp"
        ? "OK"
        : telemetry.seismicActivity > 0.5
          ? "WARNING"
          : sensorStatus(value, sens.warn, sens.crit);
    return {
      id: `${lake.id}-${def.code}`,
      code: def.code,
      label: def.label,
      type: def.type,
      x: def.x,
      y: 0,
      z: def.z,
      value: Math.round(value * 10) / 10,
      unit: sensorUnitForType(def.type),
      decimals: def.type === "level" || def.type === "temp" || def.type === "rain" ? 1 : 0,
      baseValue: Math.round(value * 10) / 10,
      status,
      batteryPct: 72 + Math.round(rand() * 26),
      trend: "stable",
      lastUpdateSecAgo: 8 + Math.round(rand() * 40),
    };
  });

  const seismic: SeismicState = {
    activity: telemetry.seismicActivity,
    magnitude: null,
    depthKm: null,
    distanceKm: 0,
    eventLabel: null,
    epicenterX: 70,
    epicenterZ: -24,
    eventAt: null,
  };

  const lakeBox = {
    levelAnomalyM: lake.waterLevelAnomalyM,
    areaKm2: lake.areaKm2,
    volumeMm3: lake.volumeMm3,
    riseRateMmHr: telemetry.lakeRiseRateMmHr,
    disturbancePct: 6 + Math.round(rand() * 6),
    moraineStressPct: 20 + Math.round(rand() * 10),
  };

  const base = {
    lakeId: lake.id,
    lakeName: lake.name,
    scenario: "NORMAL" as ScenarioKind,
    step: 0,
    syncSecondsAgo: 0,
    telemetry,
    sensors,
    slopes,
    seismic,
    lake: lakeBox,
    riskScore: 0,
    riskLevel: "LOW" as RiskLevel,
    contributions: [] as RiskContribution[],
    riskDelta: 0,
    timeline: [] as TwinTimelineEvent[],
  };

  const scored = scoreTwin(base);
  return { ...base, ...scored };
}

function sensorUnitForType(type: string): string {
  switch (type) {
    case "rain": return "mm/hr";
    case "level": return "m";
    case "soil": return "%";
    case "pore": return "kPa";
    case "seismic": return "µm/s";
    case "strain": return "µε";
    case "inclino": return "°";
    case "crack": return "mm";
    case "gnss": return "mm/day";
    default: return "°C";
  }
}

function sensorValueForType(type: string, t: TwinTelemetry, lake: Lake): number {
  switch (type) {
    case "rain": return t.rainfallMmHr;
    case "level": return t.lakeLevelM;
    case "soil": return t.soilMoisturePct;
    case "pore": return t.porePressureKPa;
    case "seismic": return t.seismicActivity * 46;
    case "strain": return 26 + t.seismicActivity * 8;
    case "inclino": return 1.4 + t.groundDisplacementMmDay * 0.5;
    case "crack": return 0.9 + t.groundDisplacementMmDay * 0.9;
    case "gnss": return t.groundDisplacementMmDay;
    default: return lake.temperatureC;
  }
}

/* ------------------------------- Risk scoring ------------------------------ */

function featuresOf(twin: TwinState) {
  const lvl = twin.lake.levelAnomalyM;
  const rise = twin.lake.riseRateMmHr;
  const avgFail = twin.slopes.reduce((a, s) => a + s.failureProbPct, 0) / Math.max(1, twin.slopes.length);
  return {
    lakeLevel: clamp(0.08 + lvl / 5 + rise / 220),
    rainfall: clamp(Math.sqrt(twin.telemetry.rainfallMmHr / 26)),
    temperature: clamp((twin.telemetry.temperatureC + 6) / 12),
    slopeInstability: clamp(avgFail / 100),
    seismic: clamp(twin.seismic.activity),
    inflow: clamp(Math.sqrt(twin.telemetry.inflowIncreasePct / 16)),
    moraine: clamp(twin.lake.moraineStressPct / 100),
  };
}

function scoreTwin(twin: TwinState): {
  riskScore: number;
  riskLevel: RiskLevel;
  contributions: RiskContribution[];
} {
  const f = featuresOf(twin);
  const mult = twin.step > 0 ? SCENARIO_MULTIPLIER[twin.scenario] : 1;
  const raw = DYNAMIC_WEIGHTS.map(([key, label, weight]) => {
    const val = f[key as keyof typeof f];
    const points = Math.round((weight * val * 100 * mult) * 10) / 10;
    return { feature: label, points };
  });
  const totalPositive = raw.reduce((a, c) => a + Math.max(0, c.points), 0) || 1;
  const contributions: RiskContribution[] = raw
    .sort((a, b) => b.points - a.points)
    .map((c) => ({
      ...c,
      sharePct: Math.round((Math.max(0, c.points) / totalPositive) * 1000) / 10,
    }));
  const riskScore = Math.round(clamp(INTERCEPT + raw.reduce((a, c) => a + c.points, 0), 0, 100));
  return { riskScore, riskLevel: getRiskLevel(riskScore), contributions };
}

/* ------------------------------ Scenario advance --------------------------- */

function mmss(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

let eventSeq = 0;

function event(
  time: string,
  label: string,
  category: TwinTimelineEvent["category"],
  level: RiskLevel,
): TwinTimelineEvent {
  eventSeq += 1;
  return { id: `evt-${eventSeq.toString(36)}-${Date.now().toString(36)}`, time, label, category, level };
}

/**
 * Advances the twin by one tick. `kind` is the active scenario; `dStep`
 * progress added per tick; `elapsedSec` is the running simulation clock.
 * Returns a NEW TwinState — never mutates the input.
 */
export function advanceTwin(lake: Lake, prev: TwinState, kind: ScenarioKind, dStep: number, elapsedSec: number): TwinState {
  if (kind === "NORMAL") return prev;
  const p = Math.min(1, prev.step + dStep);
  const base = buildBaselineTwinState(lake);
  const t = SCENARIO_TARGETS[kind];
  const k = p;

  const telemetry: TwinTelemetry = {
    rainfallMmHr: Math.round((base.telemetry.rainfallMmHr + (t.rain - base.telemetry.rainfallMmHr) * k) * 10) / 10,
    temperatureC: Math.round((base.telemetry.temperatureC + t.tempDelta * k) * 10) / 10,
    relativeHumidityPct: Math.round(base.telemetry.relativeHumidityPct + (t.soil > 60 ? 18 * k : 6 * k)),
    soilMoisturePct: Math.round(base.telemetry.soilMoisturePct + (t.soil - base.telemetry.soilMoisturePct) * k),
    porePressureKPa: Math.round((base.telemetry.porePressureKPa + (t.pore - base.telemetry.porePressureKPa) * k) * 10) / 10,
    lakeLevelM: Math.round((base.lake.levelAnomalyM + t.levelBoost * k) * 100) / 100,
    lakeRiseRateMmHr: Math.round((base.lake.riseRateMmHr + t.riseBoost * k) * 10) / 10,
    inflowIncreasePct: Math.round((base.telemetry.inflowIncreasePct + (t.inflow - base.telemetry.inflowIncreasePct) * k) * 10) / 10,
    groundDisplacementMmDay: Math.round((base.telemetry.groundDisplacementMmDay + (t.disp - base.telemetry.groundDisplacementMmDay) * k) * 10) / 10,
    seismicActivity: Math.round((base.telemetry.seismicActivity + (t.seisAct - base.telemetry.seismicActivity) * k) * 100) / 100,
  };

  const slopes: SlopeZoneState[] = base.slopes.map((s) => {
    const failBoost = t.slopeFailBoost * (s.id === t.failingZone ? 1.4 : s.id === "zM" ? 1.15 : 1);
    const failureProb = clamp((s.failureProbPct + failBoost * k) * 1.25, s.failureProbPct, 97);
    return {
      ...s,
      stabilityPct: Math.round((100 - failureProb) * 10) / 10,
      displacementMmDay: Math.round((s.displacementMmDay + telemetry.groundDisplacementMmDay * k) * 10) / 10,
      porePressureKPa: Math.round((s.porePressureKPa + (telemetry.porePressureKPa - s.porePressureKPa) * k) * 10) / 10,
      soilMoisturePct: Math.round((s.soilMoisturePct + (telemetry.soilMoisturePct - s.soilMoisturePct) * k) * 10) / 10,
      failureProbPct: Math.round(failureProb * 10) / 10,
      failing: k > 0.5 && s.id === t.failingZone,
    };
  });

  const sensors: SensorState[] = base.sensors.map((s) => {
    const value = Math.round(sensorValueForType(s.type, telemetry, lake) * 10) / 10;
    const sens = SENSITIVITIES[s.type];
    const status = s.type === "temp" ? ("OK" as const) : sensorStatus(value, sens.warn, sens.crit);
    return {
      ...s,
      value,
      status,
      trend: value > s.baseValue + 1e-4 ? "up" : value < s.baseValue - 1e-4 ? "down" : "stable",
      lastUpdateSecAgo: p >= 1 ? 4 + Math.round(p * 10) : 3,
    };
  });

  const seismic: SeismicState = {
    activity: telemetry.seismicActivity,
    magnitude: t.mag,
    depthKm: t.depth,
    distanceKm: t.dist,
    eventLabel: t.mag ? `M${t.mag.toFixed(1)} event detected near monitored zone` : null,
    epicenterX: 70,
    epicenterZ: -24,
    eventAt: t.mag ? mmss(elapsedSec) : null,
  };

  const lakeBox = {
    levelAnomalyM: Math.round((base.lake.levelAnomalyM + t.levelBoost * k) * 100) / 100,
    areaKm2: Math.round((base.lake.areaKm2 + t.levelBoost * 0.06 * k) * 1000) / 1000,
    volumeMm3: Math.round((base.lake.volumeMm3 + t.levelBoost * 2.4 * k) * 10) / 10,
    riseRateMmHr: telemetry.lakeRiseRateMmHr,
    disturbancePct: Math.round(base.lake.disturbancePct + (t.disturb - base.lake.disturbancePct) * k),
    moraineStressPct: Math.round(base.lake.moraineStressPct + t.moraineBoost * k),
  };

  const next: TwinState = {
    lakeId: lake.id,
    lakeName: lake.name,
    scenario: kind,
    step: p,
    syncSecondsAgo: 0,
    telemetry,
    sensors,
    slopes,
    seismic,
    lake: lakeBox,
    riskScore: 0,
    riskLevel: "LOW",
    contributions: [],
    riskDelta: 0,
    timeline: prev.timeline,
  };

  const scored = scoreTwin(next);
  const baselineScore = scoreTwin(base).riskScore;
  const withScore: TwinState = { ...next, ...scored, riskDelta: scored.riskScore - baselineScore };

  /* ------------------------------- Timeline -------------------------------- */
  const tl: TwinTimelineEvent[] = [...prev.timeline];
  let mutated = false;
  const pushTl = (t0: TwinTimelineEvent) => {
    mutated = true;
    tl.push(t0);
  };

  if (kind === "EARTHQUAKE" || kind === "COMPOUND") {
    if (p >= 0.05 && prev.step < 0.05) {
      pushTl(event(mmss(elapsedSec), `Seismic event detected — ${t.mag?.toFixed(1) ?? "5.8"} near monitored zone`, "seismic", "MODERATE"));
    }
    if (p >= 0.3 && prev.step < 0.3) pushTl(event(mmss(elapsedSec), "Ground vibration elevated at geophone array", "seismic", "MODERATE"));
    if (p >= 0.5 && prev.step < 0.5) pushTl(event(mmss(elapsedSec), "Slope stability reduced — Zones A/B", "slope", "HIGH"));
    if (p >= 0.65 && prev.step < 0.65) pushTl(event(mmss(elapsedSec), "Landslide probability increased", "slope", "HIGH"));
  }
  if (kind === "HEAVY_RAINFALL" || kind === "COMPOUND") {
    if (p >= 0.1 && prev.step < 0.1) pushTl(event(mmss(elapsedSec), "Rainfall threshold exceeded (>20 mm/h)", "sensor", "MODERATE"));
    if (p >= 0.35 && prev.step < 0.35) pushTl(event(mmss(elapsedSec), "Soil moisture elevated in catchment slopes", "sensor", "MODERATE"));
    if (p >= 0.6 && prev.step < 0.6) pushTl(event(mmss(elapsedSec), "Pore pressure increasing in slope zones", "sensor", "MODERATE"));
    if (p >= 0.8 && prev.step < 0.8) pushTl(event(mmss(elapsedSec), "Lake inflow rising above seasonal average", "lake", "MODERATE"));
  }
  if (kind === "LANDSLIDE" || kind === "COMPOUND") {
    const zone = t.failingZone ?? "zA";
    const zoneName = base.slopes.find((s) => s.id === zone)?.name ?? "Zone A";
    if (p >= 0.15 && prev.step < 0.15) pushTl(event(mmss(elapsedSec), "Rapid ground movement detected", "sensor", "MODERATE"));
    if (p >= 0.4 && prev.step < 0.4) pushTl(event(mmss(elapsedSec), `Landslide begins — ${zoneName}`, "slope", "HIGH"));
    if (p >= 0.65 && prev.step < 0.65) pushTl(event(mmss(elapsedSec), "Debris reaches lake margin", "lake", "HIGH"));
    if (p >= 0.85 && prev.step < 0.85) pushTl(event(mmss(elapsedSec), "Lake disturbance increasing — generated wave", "lake", "HIGH"));
  }
  if (kind === "LAKE_RISE") {
    if (p >= 0.2 && prev.step < 0.2) pushTl(event(mmss(elapsedSec), "Lake level rising above baseline", "lake", "MODERATE"));
    if (p >= 0.55 && prev.step < 0.55) pushTl(event(mmss(elapsedSec), "Inflow above seasonal average", "lake", "MODERATE"));
    if (p >= 0.85 && prev.step < 0.85) pushTl(event(mmss(elapsedSec), "Moraine dam stress increasing", "lake", "HIGH"));
  }
  if ((kind === "COMPOUND" || kind === "LANDSLIDE") && p >= 1 && prev.step < 1) {
    pushTl(event(mmss(elapsedSec), "Potential GLOF scenario generated — flood propagation downstream", "flood", "CRITICAL"));
  }
  if (kind === "HEAVY_RAINFALL" && p >= 1 && prev.step < 1) {
    pushTl(event(mmss(elapsedSec), "Sustained extreme rainfall — catchment fully saturated", "flood", "HIGH"));
  }
  if (kind === "COMPOUND" && p >= 0.95 && prev.step < 0.95) {
    pushTl(event(mmss(elapsedSec), "Compound hazard scenario crossed configured risk threshold", "alert", "CRITICAL"));
  }
  if (withScore.riskLevel !== prev.riskLevel && p > 0) {
    pushTl(event(mmss(elapsedSec), `Risk changed: ${prev.riskLevel} → ${withScore.riskLevel}`, "risk", withScore.riskLevel));
  }
  if (mutated) withScore.timeline = tl.slice(-48);

  return withScore;
}

/**
 * Difference between current and baseline contributions, for the
 * "Why did the risk change?" explainer.
 */
export function featureDeltas(
  current: RiskContribution[],
  baseline: RiskContribution[],
): Array<{ feature: string; delta: number }> {
  const base = new Map(baseline.map((b) => [b.feature, b.points]));
  return current.map((c) => ({
    feature: c.feature,
    delta: Math.round((c.points - (base.get(c.feature) ?? 0)) * 10) / 10,
  }));
}

/** Downstream asset exposure table for scenario output. */
export function downstreamAssets(lake: Lake): Array<{
  name: string;
  kind: "village" | "road" | "bridge" | "school" | "hospital" | "infrastructure";
  arrivalMin: number;
  risk: RiskLevel;
}> {
  const mk = mulberry32(hashString(`${lake.id}:assets`));
  const names =
    lake.settlementsDownstream.length >= 3
      ? lake.settlementsDownstream
      : ["Village A", "Village B", "Village C"];
  const assets = [
    { name: names[0] ?? "Village A", kind: "village" as const, base: 18 },
    { name: names[1] ?? "Village B", kind: "village" as const, base: 34 },
    { name: `${lake.name} Outlet Bridge`, kind: "bridge" as const, base: 11 },
    { name: "Valley Road", kind: "road" as const, base: 22 },
    { name: "Primary School", kind: "school" as const, base: 44 },
    { name: "District Hospital", kind: "hospital" as const, base: 58 },
  ];
  return assets.map((a) => {
    const arrival = Math.round(a.base + mk() * 8);
    const risk: RiskLevel = arrival <= 16 ? "CRITICAL" : arrival <= 30 ? "HIGH" : arrival <= 50 ? "MODERATE" : "LOW";
    return { name: a.name, kind: a.kind, arrivalMin: arrival, risk };
  });
}