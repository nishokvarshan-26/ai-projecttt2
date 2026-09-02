import type { RiskLevel } from "./types";

/**
 * Central configuration for GlacialTwin AI.
 * Risk classification thresholds are defined here once and consumed
 * everywhere via getRiskLevel() — never hardcode thresholds in components.
 */

export const RISK_THRESHOLDS: Array<{
  level: RiskLevel;
  min: number;
  max: number;
}> = [
  { level: "LOW", min: 0, max: 25 },
  { level: "MODERATE", min: 26, max: 50 },
  { level: "HIGH", min: 51, max: 75 },
  { level: "CRITICAL", min: 76, max: 100 },
];

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "#22C55E",
  MODERATE: "#EAB308",
  HIGH: "#F97316",
  CRITICAL: "#EF4444",
};

export function getRiskLevel(score: number): RiskLevel {
  const t = RISK_THRESHOLDS.find((t) => score >= t.min && score <= t.max);
  return t ? t.level : "LOW";
}

export const MODEL_INFO = {
  name: "XGBoost-style Gradient Boosted Risk Model",
  shortName: "Prototype Risk Model",
  version: "gt-risk-v0.9.0-prototype",
  trainedAt: "Not yet trained — heuristic prototype weights",
  status: "PROTOTYPE" as const,
};

export const DEMO_TIMESTAMP = "2026-08-21T04:32:00Z";

export const REGIONS = [
  {
    id: "everest",
    name: "Everest / Khumbu Region",
    description: "Sagarmatha National Park, Nepal (demo dataset)",
  },
  {
    id: "rolwaling",
    name: "Rolwaling Valley",
    description: "Gaurishankar Conservation Area, Nepal (demo dataset)",
  },
  {
    id: "bhutan",
    name: "Lunana, Bhutan",
    description: "Northern Bhutan Himalaya (demo dataset)",
  },
] as const;

export const DISCLAIMER_SHORT =
  "Research & decision-support prototype. Model outputs and scenarios are estimates — not official emergency warnings.";

export const DISCLAIMER_FULL =
  "GlacialTwin AI is a research and decision-support prototype. All observations shown in this environment are demo data. Model outputs, forecasts and scenario simulations are simplified estimates produced by a prototype risk engine and should not be interpreted as official emergency warnings or scientifically validated predictions.";

export const PIPELINE_STEPS = [
  {
    id: "acquire",
    label: "Satellite Image",
    detail:
      "Optical scenes (Sentinel-2 / Landsat 9) are retrieved for the lake catchment. In this prototype, scenes are represented by demo metadata.",
  },
  {
    id: "preprocess",
    label: "Preprocessing",
    detail:
      "Cloud masking, atmospheric correction and co-registration against the reference geometry.",
  },
  {
    id: "water",
    label: "Water Detection",
    detail:
      "NDWI (Normalized Difference Water Index) thresholding isolates open-water pixels from ice, snow and terrain.",
  },
  {
    id: "boundary",
    label: "Lake Boundary",
    detail:
      "Water pixel clusters are vectorised into a lake boundary polygon and filtered by minimum size.",
  },
  {
    id: "area",
    label: "Area Calculation",
    detail:
      "Planimetric lake area is computed from the projected boundary polygon (EPSG:32645 / UTM 45N for the demo region).",
  },
  {
    id: "change",
    label: "Change Detection",
    detail:
      "Current area is compared with the previous observation to estimate expansion rate and flag anomalies.",
  },
  {
    id: "twin",
    label: "Digital Twin Update",
    detail:
      "The validated observation updates the lake's Digital Twin state, which drives analytics, prediction and alerting.",
  },
] as const;

export const FLOOD_DEPTH_CLASSES = [
  { id: "d1", label: "0–0.5 m", color: "#22D3EE" },
  { id: "d2", label: "0.5–1 m", color: "#0EA5E9" },
  { id: "d3", label: "1–2 m", color: "#6366F1" },
  { id: "d4", label: "2–3 m", color: "#F97316" },
  { id: "d5", label: "> 3 m", color: "#EF4444" },
] as const;

export const MAP_BASEMAPS = {
  satellite: {
    label: "Satellite",
    attribution:
      'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    maxzoom: 18,
  },
  dark: {
    label: "Dark",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"],
    maxzoom: 19,
  },
  streets: {
    label: "Streets",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    maxzoom: 19,
  },
} as const;

export type BasemapId = keyof typeof MAP_BASEMAPS;
