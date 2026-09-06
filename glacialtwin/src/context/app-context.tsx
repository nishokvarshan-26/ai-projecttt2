"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AlertItem, Lake, Region, ScenarioResult } from "@/lib/types";
import { LAKES } from "@/data/lakes";
import { ALERTS } from "@/data/alerts";
import { assessRisk } from "@/lib/risk-engine";
import { REGIONS } from "@/lib/config";
import {
  buildBaselineTwinState,
  advanceTwin,
} from "@/lib/twin-engine";
import type { ScenarioKind, TwinState } from "@/lib/twin-types";

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
  pushAlert: (a: Omit<AlertItem, "id" | "createdAt">) => void;
  scenarios: ScenarioResult[];
  addScenario: (s: ScenarioResult) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  demoMode: true;
  // ---- Digital Twin live state ----
  twin: TwinState;
  twinBaseline: TwinState;
  scenarioActive: boolean;
  scenarioKind: ScenarioKind;
  startTwinScenario: (kind: ScenarioKind) => void;
  resetTwinScenario: () => void;
  /** True while the twin is pre-loading for a freshly selected lake. */
  twinLoading: boolean;
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

let alertSeq = 0;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedLakeId, setSelectedLakeId] = useState<string>("imja");
  const [regionId, setRegionIdState] = useState<string>("all");
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS);
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [twinLoading, setTwinLoading] = useState(true);

  const initialTwin = useMemo<TwinState>(() => buildBaselineTwinState(LAKES[0]), []);
  const [twin, setTwin] = useState<TwinState>(initialTwin);
  const [twinBaseline, setTwinBaseline] = useState<TwinState>(initialTwin);
  const [scenarioActive, setScenarioActive] = useState(false);
  const [scenarioKind, setScenarioKind] = useState<ScenarioKind>("NORMAL");

  const twinRef = useRef<TwinState>(initialTwin);
  twinRef.current = twin;
  const kindRef = useRef<ScenarioKind>("NORMAL");
  kindRef.current = scenarioKind;
  const activeRef = useRef(false);
  activeRef.current = scenarioActive;
  const elapsedRef = useRef(0);
  const consumedRef = useRef<Set<string>>(new Set());

  /* ---------------------------- Persistence ------------------------------ */
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
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  }, []);
  const reviewAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, reviewed: true } : a)));
  }, []);
  const pushAlert = useCallback((a: Omit<AlertItem, "id" | "createdAt">) => {
    alertSeq += 1;
    const id = `alr-live-${Date.now().toString(36)}-${alertSeq}`;
    setAlerts((prev) => [{ ...a, id, createdAt: new Date().toISOString() }, ...prev].slice(0, 60));
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
    (id: string, name: string) =>
      persistScenarios(loadJson<ScenarioResult[]>(SCENARIOS_KEY, []).map((s) => (s.id === id ? { ...s, name } : s))),
    [persistScenarios]
  );
  const deleteScenario = useCallback(
    (id: string) => persistScenarios(loadJson<ScenarioResult[]>(SCENARIOS_KEY, []).filter((s) => s.id !== id)),
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

  useEffect(() => {
    if (!lakes.some((l) => l.id === selectedLakeId) && lakes.length > 0) {
      setSelectedLakeId(lakes[0].id);
    }
  }, [lakes, selectedLakeId]);

  const risk = useMemo(() => assessRisk(selectedLake), [selectedLake]);

  /* --------------------- Twin state lifecycle per lake -------------------- */
  useEffect(() => {
    let cancelled = false;
    setTwinLoading(true);
    setScenarioActive(false);
    setScenarioKind("NORMAL");
    elapsedRef.current = 0;
    consumedRef.current = new Set();
    const base = buildBaselineTwinState(selectedLake);
    // Brief loading window for a convincing init sequence.
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setTwin(base);
      setTwinBaseline(base);
      twinRef.current = base;
      setTwinLoading(false);
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selectedLake]);

  /* ------------------------------ Run loop -------------------------------- */
  useEffect(() => {
    if (!scenarioActive) return;
    const timer = window.setInterval(() => {
      const kind = kindRef.current;
      if (kind === "NORMAL" || !activeRef.current) return;
      const prev = twinRef.current;
      elapsedRef.current += 6;
      // ~0.045 progress per tick; ~22 ticks => ~26s to fully develop.
      const next = advanceTwin(selectedLake, prev, kind, 0.045, elapsedRef.current);
      twinRef.current = next;
      setTwin(next);

      // Promote new critical / flood / GLOF events to the alert center.
      for (const evt of next.timeline) {
        if (consumedRef.current.has(evt.id)) continue;
        if (evt.category === "alert" || evt.level === "CRITICAL" || evt.category === "flood") {
          consumedRef.current.add(evt.id);
          const severity = evt.level;
          pushAlert({
            lakeId: selectedLake.id,
            lakeName: selectedLake.name,
            title: evt.label,
            reason: `Generated live by the ${SCENARIO_LABEL[kind] ?? kind} scenario on the selected Digital Twin state.`,
            severity,
            basis: "SCENARIO_EVALUATION",
            acknowledged: false,
            reviewed: false,
          });
        }
      }
      if (next.step >= 1) {
        window.clearInterval(timer);
        setScenarioActive(false);
      }
    }, 1150);
    return () => window.clearInterval(timer);
  }, [scenarioActive, selectedLake, pushAlert]);

  const selectedLakeRef = useRef(selectedLake);
  useEffect(() => {
    selectedLakeRef.current = selectedLake;
  }, [selectedLake]);

  const startTwinScenario = useCallback((kind: ScenarioKind) => {
    setScenarioKind(kind);
    setScenarioActive(true);
    elapsedRef.current = 0;
    consumedRef.current = new Set();
    // Restart from a clean baseline snapshot so the scenario develops coherently.
    const base = buildBaselineTwinState(selectedLakeRef.current);
    setTwin(base);
    setTwinBaseline(base);
    twinRef.current = base;
  }, []);

  const resetTwinScenario = useCallback(() => {
    setScenarioActive(false);
    setScenarioKind("NORMAL");
    elapsedRef.current = 0;
    consumedRef.current = new Set();
    const base = buildBaselineTwinState(selectedLakeRef.current);
    setTwin(base);
    setTwinBaseline(base);
    twinRef.current = base;
  }, []);

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
    pushAlert,
    scenarios,
    addScenario,
    renameScenario,
    deleteScenario,
    sidebarCollapsed,
    toggleSidebar,
    demoMode: true,
    twin,
    twinBaseline,
    scenarioActive,
    scenarioKind,
    startTwinScenario,
    resetTwinScenario,
    twinLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

const SCENARIO_LABEL: Partial<Record<string, string>> = {
  EARTHQUAKE: "Earthquake",
  HEAVY_RAINFALL: "Heavy rainfall",
  LANDSLIDE: "Landslide",
  LAKE_RISE: "Lake rise",
  COMPOUND: "Compound disaster",
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}