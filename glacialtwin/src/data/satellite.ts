import type { SatelliteComparisonData, SatelliteScene } from "@/lib/types";
import { getLakeById, LAKES } from "./lakes";

/**
 * DEMO DATA — satellite catalogue metadata.
 * Scene IDs are synthetic. No real imagery is fetched; the comparison view
 * renders a clearly-labelled synthetic visualization derived from demo data.
 */

export const SATELLITE_SOURCES = [
  {
    id: "sentinel2",
    name: "Sentinel-2 MSI",
    agency: "ESA Copernicus",
    resolutionM: 10,
    revisitDays: 5,
    use: "Lake boundary mapping (NDWI)",
    status: "OPERATIONAL" as const,
  },
  {
    id: "landsat9",
    name: "Landsat 9 OLI-2",
    agency: "USGS / NASA",
    resolutionM: 30,
    revisitDays: 16,
    use: "Long-term change records",
    status: "OPERATIONAL" as const,
  },
  {
    id: "copdem",
    name: "Copernicus DEM GLO-30",
    agency: "ESA",
    resolutionM: 30,
    revisitDays: null,
    use: "Terrain, slope & flow routing",
    status: "OPERATIONAL" as const,
  },
] as const;

export function getScenesForLake(lakeId: string): SatelliteScene[] {
  const lake = getLakeById(lakeId);
  if (!lake) return [];
  return [
    {
      id: `${lakeId}-s2a`,
      platform: "Sentinel-2",
      sceneId: `S2B_MSIL1C_${lake.id.toUpperCase()}_20260818_DEMO`,
      acquiredAt: "2026-08-18T04:42:00Z",
      cloudCoverPct: 8.4,
      resolutionM: 10,
      processing: "PROCESSED",
      bandsUsed: "B3 (Green), B8 (NIR)",
      waterIndex: "NDWI > 0.15",
    },
    {
      id: `${lakeId}-s2b`,
      platform: "Sentinel-2",
      sceneId: `S2A_MSIL1C_${lake.id.toUpperCase()}_20260724_DEMO`,
      acquiredAt: "2026-07-24T04:39:00Z",
      cloudCoverPct: 21.7,
      resolutionM: 10,
      processing: "PROCESSED",
      bandsUsed: "B3 (Green), B8 (NIR)",
      waterIndex: "NDWI > 0.15",
    },
    {
      id: `${lakeId}-l9`,
      platform: "Landsat 9",
      sceneId: `LC09_L2SP_${lake.id.toUpperCase()}_20260802_DEMO`,
      acquiredAt: "2026-08-02T04:52:00Z",
      cloudCoverPct: 14.2,
      resolutionM: 30,
      processing: "ARCHIVED",
      bandsUsed: "B3 (Green), B5 (NIR)",
      waterIndex: "NDWI > 0.2",
    },
    {
      id: `${lakeId}-dem`,
      platform: "Copernicus DEM",
      sceneId: `COPDEM_GLO30_${lake.id.toUpperCase()}_DEMO`,
      acquiredAt: "2021-01-01T00:00:00Z",
      cloudCoverPct: 0,
      resolutionM: 30,
      processing: "PROCESSED",
      bandsUsed: "Elevation",
      waterIndex: "—",
    },
  ];
}

export function getComparison(lakeId: string): SatelliteComparisonData | null {
  const lake = getLakeById(lakeId);
  if (!lake || lake.areaHistory.length < 2) return null;
  const hist = lake.areaHistory;
  const before = hist[hist.length - 3] ?? hist[0];
  const after = hist[hist.length - 1];
  return {
    lakeId,
    beforeLabel: String(before.year),
    afterLabel: String(after.year),
    beforeAreaKm2: before.areaKm2,
    afterAreaKm2: after.areaKm2,
    changePct:
      Math.round(((after.areaKm2 - before.areaKm2) / before.areaKm2) * 1000) / 10,
    beforeDate: `${before.year}-09-14`,
    afterDate: "2026-08-18",
  };
}

export const ALL_SCENES: SatelliteScene[] = LAKES.flatMap((l) =>
  getScenesForLake(l.id).slice(0, 2)
);
