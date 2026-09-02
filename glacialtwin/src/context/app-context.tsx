"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AlertItem, Lake, Region, ScenarioResult } from "@/lib/types";
import { LAKES } from "@/data/lakes";
import { ALERTS } from "@/data/alerts";
import { assessRisk } from "@/lib/risk-engine";
import { REGIONS } from "@/lib/config";

const SCENARIOS_KEY = "glacialtwin.scenarios.v1";
const SIDEBAR_KEY = "glacialtwin.sidebar.collapsed";
const REGION_KEY = "glacialtwin.region";

interface AppState {
  lakes: Lake[];
  regions: readonly Region[];
  regionId: string;
  setRegionId: (id: string) => void;
  selectedLake: Lake;
  selectedLakeId: string;
  selectLake: (id: string) => void;
  risk: ReturnType<typeof assessRisk>;
  alerts: AlertItem[];
  acknowledgeAlert: (id: string) => void;
  reviewAlert: (id: string) => void;
  scenarios: ScenarioResult[];
  addScenario: (s: ScenarioResult) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  demoMode: true;
}

const AppContext = createContext<AppState | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedLakeId, setSelectedLakeId] = useState<string>("imja");
  const [regionId, setRegionIdState] = useState<string>("all");
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS);
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setScenarios(loadJson<ScenarioResult[]>(SCENARIOS_KEY, []));
    const savedRegion = window.localStorage.getItem(REGION_KEY);
    if (savedRegion) setRegionIdState(savedRegion);
    setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "1");
  }, []);

  const selectLake = useCallback((id: string) => setSelectedLakeId(id), []);

  const setRegionId = useCallback((id: string) => {
    setRegionIdState(id);
    try {
      window.localStorage.setItem(REGION_KEY, id);
    } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => {
      try {
        window.localStorage.setItem(SIDEBAR_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  }, []);

  const reviewAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, reviewed: true } : a))
    );
  }, []);

  const persistScenarios = useCallback((next: ScenarioResult[]) => {
    setScenarios(next);
    try {
      window.localStorage.setItem(SCENARIOS_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const addScenario = useCallback(
    (s: ScenarioResult) => persistScenarios([s, ...loadJson<ScenarioResult[]>(SCENARIOS_KEY, [])].slice(0, 30)),
    [persistScenarios]
  );

  const renameScenario = useCallback(
    (id: string, name: string) => {
      persistScenarios(loadJson<ScenarioResult[]>(SCENARIOS_KEY, []).map((s) => (s.id === id ? { ...s, name } : s)));
    },
    [persistScenarios]
  );

  const deleteScenario = useCallback(
    (id: string) => {
      persistScenarios(loadJson<ScenarioResult[]>(SCENARIOS_KEY, []).filter((s) => s.id !== id));
    },
    [persistScenarios]
  );

  const lakes = useMemo(
    () => (regionId === "all" ? LAKES : LAKES.filter((l) => l.regionId === regionId)),
    [regionId]
  );

  const selectedLake = useMemo(() => {
    const inRegion = lakes.find((l) => l.id === selectedLakeId);
    return inRegion ?? lakes[0] ?? LAKES[0];
  }, [lakes, selectedLakeId]);

  // Keep selection valid when the region changes.
  useEffect(() => {
    if (!lakes.some((l) => l.id === selectedLakeId) && lakes.length > 0) {
      setSelectedLakeId(lakes[0].id);
    }
  }, [lakes, selectedLakeId]);

  const risk = useMemo(() => assessRisk(selectedLake), [selectedLake]);

  const value: AppState = {
    lakes,
    regions: REGIONS,
    regionId,
    setRegionId,
    selectedLake,
    selectedLakeId: selectedLake.id,
    selectLake,
    risk,
    alerts,
    acknowledgeAlert,
    reviewAlert,
    scenarios,
    addScenario,
    renameScenario,
    deleteScenario,
    sidebarCollapsed,
    toggleSidebar,
    demoMode: true,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
