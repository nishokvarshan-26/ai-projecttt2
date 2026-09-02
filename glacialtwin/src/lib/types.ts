export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type PrecipitationLevel = "NORMAL" | "ELEVATED" | "EXTREME";

export type DataStatus =
  | "VERIFIED"
  | "DEMO"
  | "MODEL_PREDICTION"
  | "MODEL_FORECAST"
  | "SCENARIO";

export type TrendDirection = "UP" | "DOWN" | "STABLE";

export interface AreaPoint {
  year: number;
  areaKm2: number;
}

export interface Lake {
  id: string;
  name: string;
  regionId: string;
  country: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  /** Current observed/modelled lake area (demo value). */
  areaKm2: number;
  /** Estimated volume in million m³ (demo value). */
  volumeMm3: number;
  /** Water level anomaly relative to reference level, metres (demo value). */
  waterLevelAnomalyM: number;
  perimeterKm: number;
  areaGrowthRatePctPerYear: number;
  /** Mean recent air temperature near the lake, °C (demo value). */
  temperatureC: number;
  /** Mean monthly precipitation, mm (demo value). */
  rainfallMmPerMonth: number;
  recentPrecipitation: PrecipitationLevel;
  glacierDistanceKm: number;
  slopeDeg: number;
  downstreamDirection: string;
  settlementsDownstream: string[];
  exposureEstimate: number;
  instabilityIndex: number;
  historyAreaChangePct: number;
  areaHistory: AreaPoint[];
  lastObservationAt: string;
  twinSyncMinutesAgo: number;
  twinStatus: "SYNCED" | "PENDING" | "ISSUE";
}

export interface Region {
  id: string;
  name: string;
  description: string;
}

export interface RiskContribution {
  feature: string;
  /** Contribution to the final score in percentage points. */
  points: number;
  /** Share of total positive contribution, %. */
  sharePct: number;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  contributions: RiskContribution[];
  assessedAt: string;
}

export interface ScenarioInputs {
  rainfallIncreasePct: number; // -50 .. +100
  temperatureDeltaC: number; // -3 .. +5
  areaChangePct: number; // -20 .. +50
  precipitationLevel: PrecipitationLevel;
  environmentalStability: "STABLE" | "REDUCED";
}

export interface ScenarioResult {
  id: string;
  name: string;
  lakeId: string;
  lakeName: string;
  inputs: ScenarioInputs;
  baselineScore: number;
  scenarioScore: number;
  createdAt: string;
}

export interface AlertItem {
  id: string;
  severity: RiskLevel;
  lakeId: string;
  lakeName: string;
  title: string;
  reason: string;
  previousScore?: number;
  currentScore?: number;
  basis: "MODEL_TREND" | "SCENARIO_EVALUATION";
  createdAt: string;
  acknowledged: boolean;
  reviewed: boolean;
}

export interface SatelliteScene {
  id: string;
  platform: "Sentinel-2" | "Landsat 9" | "Copernicus DEM" | "HMA DEM";
  sceneId: string;
  acquiredAt: string;
  cloudCoverPct: number;
  resolutionM: number;
  processing: "PROCESSED" | "PROCESSING" | "ARCHIVED";
  bandsUsed: string;
  waterIndex: string;
}

export interface SatelliteComparisonData {
  lakeId: string;
  beforeLabel: string;
  afterLabel: string;
  beforeAreaKm2: number;
  afterAreaKm2: number;
  changePct: number;
  beforeDate: string;
  afterDate: string;
}

export interface ForecastPoint {
  year: number;
  areaKm2: number;
  lowerKm2: number;
  upperKm2: number;
  kind: "historical" | "forecast";
}

export interface EnvMonthPoint {
  month: string;
  temperatureC: number;
  rainfallMm: number;
}

export interface RiskTrendPoint {
  label: string;
  score: number;
  event?: string;
}

export interface TwinChecklistStep {
  label: string;
  state: "done" | "active" | "pending";
}
