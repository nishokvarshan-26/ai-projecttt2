import type { AlertItem, Lake, ScenarioResult } from "./types";
import { assessRisk, topContributions } from "./risk-engine";
import { runScenario } from "./scenario-engine";
import { getRiskLevel } from "./config";
import { formatCoord } from "./utils";

/**
 * GLACIALTWIN COPILOT — deterministic retrieval assistant.
 * Answers are composed strictly from the application's own data layer
 * (lakes, risk engine, scenarios, alerts). When the requested information
 * is not present in the data layer the assistant says so explicitly.
 */

export interface AssistantContext {
  lakes: Lake[];
  selectedLake: Lake;
  alerts: AlertItem[];
  scenarios: ScenarioResult[];
}

interface Answer {
  text: string;
  suggestions?: string[];
}

const NOT_ENOUGH_DATA =
  "I don't have sufficient data to answer that. I can answer questions about monitored lakes, their prototype risk scores, model contributions, trends, scenarios and active alerts.";

function fmtPct(n: number) {
  return `${Math.round(n)}%`;
}

export function answerQuery(query: string, ctx: AssistantContext): Answer {
  const q = query.toLowerCase().trim();
  const { selectedLake, lakes, alerts, scenarios } = ctx;

  // Greeting / help
  if (/^(hi|hello|hey|help|what can you do)/.test(q)) {
    return {
      text: "I'm the GlacialTwin Copilot. I answer questions using this application's demo data and prototype model only. Try asking about a lake's risk, what changed recently, or what happens under a rainfall scenario.",
      suggestions: [
        "Why is Imja Lake high risk?",
        "Which lake needs the most attention?",
        "What happens if rainfall increases by 25%?",
      ],
    };
  }

  // Which lake needs most attention
  if (/(which|most).*(attention|risk|dangerous|critical)|worst lake|highest risk/.test(q)) {
    const ranked = [...lakes]
      .map((l) => ({ lake: l, risk: assessRisk(l) }))
      .sort((a, b) => b.risk.score - a.risk.score);
    const top = ranked[0];
    return {
      text: `Based on the prototype model, ${top.lake.name} has the highest estimated risk at ${fmtPct(top.risk.score)} (${top.risk.level}). Next are ${ranked[1].lake.name} (${fmtPct(ranked[1].risk.score)}) and ${ranked[2].lake.name} (${fmtPct(ranked[2].risk.score)}). These are model-based estimates from demo data.`,
      suggestions: [`Why is ${top.lake.name} high risk?`, "Show regional ranking"],
    };
  }

  // Why is X high risk / explain contributors
  const whyMatch = q.match(/why\s+is\s+([a-z\s'-]+?)(\shigh|\srisk|\sat|$)/);
  if (whyMatch || /(why|explain|contribut|shap)/.test(q)) {
    let lake = selectedLake;
    const namePart = whyMatch?.[1]?.trim();
    if (namePart) {
      const found = lakes.find((l) =>
        namePart.includes(l.name.toLowerCase().replace(" lake", "")) ||
        l.name.toLowerCase().includes(namePart)
      );
      if (found) lake = found;
    }
    const risk = assessRisk(lake);
    const top = topContributions(risk, 3);
    return {
      text: `${lake.name} currently scores ${fmtPct(risk.score)} (${risk.level}) on the prototype model. The largest contributing factors are: ${top
        .map((c) => `${c.feature} (~${c.sharePct}% of positive contribution)`)
        .join(", ")}. The prototype model currently places the greatest weight on recent lake expansion and precipitation-related features. These are demo model outputs, not validated causal findings.`,
      suggestions: ["What changed this month?", "Show strongest model contributors"],
    };
  }

  // Strongest contributors (global)
  if (/(strongest|top).*(contributor|feature|factor)/.test(q)) {
    const risk = assessRisk(selectedLake);
    const top = topContributions(risk, 5);
    return {
      text: `For ${selectedLake.name}, the strongest prototype-model contributors are: ${top
        .map((c) => `${c.feature} (${c.sharePct}%)`)
        .join(", ")}. Weights are fixed heuristic values for demonstration — no trained model is behind these numbers yet.`,
    };
  }

  // What changed this month / recent change
  if (/what.*(chang|happen|new)|this month|recent/.test(q)) {
    const hist = selectedLake.areaHistory;
    const prev = hist[hist.length - 2];
    const curr = hist[hist.length - 1];
    const change = ((curr.areaKm2 - prev.areaKm2) / prev.areaKm2) * 100;
    const trend = ctx.alerts.filter((a) => !a.acknowledged && a.lakeId === selectedLake.id);
    return {
      text: `In the latest observation window, ${selectedLake.name}'s area changed from ${prev.areaKm2} km² (${prev.year}) to ${curr.areaKm2} km² (${curr.year}), about ${change >= 0 ? "+" : ""}${change.toFixed(1)}%. The prototype risk estimate stands at ${fmtPct(assessRisk(selectedLake).score)}. ${trend.length > 0 ? `There ${trend.length === 1 ? "is 1 unacknowledged alert" : `are ${trend.length} unacknowledged alerts`} for this lake.` : "There are no unacknowledged alerts for this lake."} All values are demo data.`,
      suggestions: ["Show lakes with increasing area", "Open alerts"],
    };
  }

  // Rainfall scenario
  const rainMatch = q.match(/rainfall.*?(?:by|increase[sd]?)\s*\+?(\d+)\s*%/) ?? q.match(/\+?(\d+)\s*%.*rainfall/);
  if (rainMatch && /(rainfall|rain|precipitation)/.test(q)) {
    const pct = Math.min(100, Math.max(-50, parseInt(rainMatch[1], 10)));
    const base = assessRisk(selectedLake).score;
    const scenarioScore = runScenario(selectedLake, {
      rainfallIncreasePct: pct,
      temperatureDeltaC: 0,
      areaChangePct: 0,
      precipitationLevel: "ELEVATED",
      environmentalStability: "STABLE",
    });
    return {
      text: `Scenario simulation for ${selectedLake.name}: with rainfall ${pct >= 0 ? "+" : ""}${pct}% and other factors held constant, the prototype estimate moves from ${fmtPct(base)} (${getRiskLevel(base)}) to ${fmtPct(scenarioScore)} (${getRiskLevel(scenarioScore)}), a change of ${scenarioScore - base >= 0 ? "+" : ""}${scenarioScore - base} points. This is a model-based scenario estimate, not a forecast of real events.`,
      suggestions: ["Open Scenario Simulator", "Simulate temperature +2°C"],
    };
  }

  // Temperature scenario
  const tempMatch = q.match(/temperature.*?\+?(-?\d+(?:\.\d+)?)\s*°?\s*c/);
  if (tempMatch) {
    const dC = parseFloat(tempMatch[1]);
    const base = assessRisk(selectedLake).score;
    const scenarioScore = runScenario(selectedLake, {
      rainfallIncreasePct: 0,
      temperatureDeltaC: dC,
      areaChangePct: 0,
      precipitationLevel: "NORMAL",
      environmentalStability: "STABLE",
    });
    return {
      text: `Scenario simulation for ${selectedLake.name}: with temperature ${dC >= 0 ? "+" : ""}${dC}°C, the prototype estimate moves from ${fmtPct(base)} to ${fmtPct(scenarioScore)} (${getRiskLevel(scenarioScore)}). Scenario outputs are simplified estimates.`,
    };
  }

  // Lakes with increasing area
  if (/(increas|growing|expansion|shrinking|decreas)/.test(q) && /area|lake|show/.test(q)) {
    const growing = lakes
      .filter((l) => l.areaGrowthRatePctPerYear > 0)
      .sort((a, b) => b.areaGrowthRatePctPerYear - a.areaGrowthRatePctPerYear);
    const shrinking = lakes.filter((l) => l.areaGrowthRatePctPerYear <= 0);
    return {
      text: `Lakes with increasing area (demo data): ${growing
        .map((l) => `${l.name} (+${l.areaGrowthRatePctPerYear}%/yr)`)
        .join(", ")}. ${shrinking.length > 0 ? `Stable or shrinking: ${shrinking.map((l) => l.name).join(", ")}.` : ""}`,
    };
  }

  // Alerts summary
  if (/alert|warning|notification/.test(q)) {
    const unack = alerts.filter((a) => !a.acknowledged);
    if (unack.length === 0)
      return { text: "All alerts have been acknowledged. Nothing requires attention right now." };
    return {
      text: `There ${unack.length === 1 ? "is 1 unacknowledged alert" : `are ${unack.length} unacknowledged alerts`}: ${unack
        .map((a) => `${a.severity} — ${a.lakeName}: ${a.title}`)
        .join("; ")}. Remember these are prototype-system notifications, not official warnings.`,
      suggestions: ["Open Alert Center"],
    };
  }

  // Specific lake lookup
  const lakeHit = lakes.find(
    (l) => q.includes(l.name.toLowerCase()) || q.includes(l.id.replace("-", " "))
  );
  if (lakeHit && /(tell|about|status|summary|where|info)/.test(q)) {
    const risk = assessRisk(lakeHit);
    return {
      text: `${lakeHit.name} (${formatCoord(lakeHit.latitude, lakeHit.longitude)}, ~${lakeHit.elevationM.toLocaleString()} m elevation): area ${lakeHit.areaKm2} km², growth +${lakeHit.areaGrowthRatePctPerYear}%/yr, glacier distance ${lakeHit.glacierDistanceKm} km. Prototype risk estimate: ${fmtPct(risk.score)} (${risk.level}). All figures are demo data.`,
      suggestions: [`Open ${lakeHit.name} Digital Twin`],
    };
  }

  // Regional overview
  if (/region|overview|all lakes|summary|how many/.test(q)) {
    const scored = lakes.map((l) => ({ l, r: assessRisk(l) }));
    const critical = scored.filter((s) => s.r.level === "CRITICAL").length;
    const high = scored.filter((s) => s.r.level === "HIGH").length;
    return {
      text: `Regional overview (demo dataset): ${lakes.length} lakes monitored. Prototype estimates: ${critical} critical, ${high} high, ${scored.filter((s) => s.r.level === "MODERATE").length} moderate, ${scored.filter((s) => s.r.level === "LOW").length} low. Highest: ${[...scored].sort((a, b) => b.r.score - a.r.score)[0].l.name}.`,
    };
  }

  return { text: NOT_ENOUGH_DATA };
}

export const SUGGESTED_PROMPTS = [
  "Why is Imja Lake high risk?",
  "Which lake needs the most attention?",
  "What changed this month?",
  "What happens if rainfall increases by 25%?",
  "Show lakes with increasing area.",
  "What are the strongest model contributors?",
];
