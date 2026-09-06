import type { RiskContribution, RiskLevel } from "./types";

/**
 * CENTRAL DIGITAL TWIN STATE
 *
 * Every module (3D viewer, dashboard, telemetry, landslide/seismic pages,
 * copilot, alerts) reads from one TwinState object. Scenario simulation
 * mutates this state and the risk engine recomputes from it — there are no
 * isolated fake values scattered across pages.
 */

export type ScenarioKind =
  | "NORMAL"
  | "HEAVY_RAINFALL"
  | "EARTHQUAKE"
  | "LANDSLIDE"
  | "LAKE_RISE"
  | "COMPOUND";

export type ViewMode =
  | "NORMAL"
  | "SATELLITE"
  | "ELEVATION"
  | "SLOPE_RISK"
  | "LANDSLIDE"
  | "FLOOD"
  | "SEISMIC"
  | "SENSORS";

export type SensorStatus = "OK" | "WARNING" | "ALERT";

export interface SensorState {
  id: string;
  /** Short class label, e.g. "PZ-014". */
  code: string;
  label: string;
  /** Driver type used by the engine ("rain" | "level" | "soil" | ...). */
  type: string;
  /** Scene (3D) coordinates — driven by the viewer coordinate frame. */
  x: number;
  y: number;
  z: number;
  value: number;
  unit: string;
  decimals: number;
  baseValue: number;
  status: SensorStatus;
  batteryPct: number;
  trend: "up" | "down" | "stable";
  lastUpdateSecAgo: number;
}

export interface SlopeZoneState {
  id: string;
  name: string;
  /** Scene (3D) footprint. */
  x: number;
  z: number;
  width: number;
  depth: number;
  stabilityPct: number;
  displacementMmDay: number;
  porePressureKPa: number;
  soilMoisturePct: number;
  failureProbPct: number;
  failing: boolean;
}

export interface SeismicState {
  /** 0 (quiet) … 1 (very active). */
  activity: number;
  magnitude: number | null;
  depthKm: number | null;
  distanceKm: number;
  eventLabel: string | null;
  epicenterX: number;
  epicenterZ: number;
  eventAt: string | null;
}

export interface TwinTimelineEvent {
  id: string;
  /** Simulation clock, "HH:MM". */
  time: string;
  label: string;
  category:
    | "data"
    | "sensor"
    | "slope"
    | "seismic"
    | "lake"
    | "risk"
    | "alert"
    | "flood";
  level: RiskLevel;
}

export interface TwinTelemetry {
  rainfallMmHr: number;
  temperatureC: number;
  relativeHumidityPct: number;
  soilMoisturePct: number;
  porePressureKPa: number;
  lakeLevelM: number;
  lakeRiseRateMmHr: number;
  inflowIncreasePct: number;
  groundDisplacementMmDay: number;
  seismicActivity: number;
}

export interface TwinState {
  lakeId: string;
  lakeName: string;
  scenario: ScenarioKind;
  /** Scenario progress 0..1 (1 = fully developed). */
  step: number;
  /** Seconds since the twin was (re)synchronized. */
  syncSecondsAgo: number;
  telemetry: TwinTelemetry;
  sensors: SensorState[];
  slopes: SlopeZoneState[];
  seismic: SeismicState;
  lake: {
    levelAnomalyM: number;
    areaKm2: number;
    volumeMm3: number;
    riseRateMmHr: number;
    /** Lake disturbance 0..100 (waves, inflow turbidity) during scenarios. */
    disturbancePct: number;
    moraineStressPct: number;
  };
  riskScore: number;
  riskLevel: RiskLevel;
  contributions: RiskContribution[];
  /** Risk score change relative to baseline (positive = worsened). */
  riskDelta: number;
  timeline: TwinTimelineEvent[];
}