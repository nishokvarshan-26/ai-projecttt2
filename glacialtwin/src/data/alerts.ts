import type { AlertItem } from "@/lib/types";

/**
 * DEMO DATA — alert seed records.
 * Alerts reference the prototype model trend or scenario evaluations and are
 * never presented as official warnings.
 */
export const ALERTS: AlertItem[] = [
  {
    id: "alr-001",
    severity: "CRITICAL",
    lakeId: "imja",
    lakeName: "Imja Lake",
    title: "Risk elevated under combined stress scenario",
    reason:
      "Rapid lake expansion (+17.4% last interval) combined with an elevated-precipitation scenario pushes the model estimate from 72% to 87%.",
    previousScore: 72,
    currentScore: 87,
    basis: "SCENARIO_EVALUATION",
    createdAt: "2026-08-20T16:12:00Z",
    acknowledged: false,
    reviewed: false,
  },
  {
    id: "alr-002",
    severity: "HIGH",
    lakeId: "thorthormi",
    lakeName: "Thorthormi Lake",
    title: "Risk trend increasing over trailing 3 months",
    reason:
      "Prototype model estimates a sustained upward risk trend driven by continued expansion and high instability of the supraglacial basin.",
    currentScore: 67,
    basis: "MODEL_TREND",
    createdAt: "2026-08-19T08:05:00Z",
    acknowledged: false,
    reviewed: false,
  },
  {
    id: "alr-003",
    severity: "MODERATE",
    lakeId: "tsho-rolpa",
    lakeName: "Tsho Rolpa",
    title: "Stable trend — routine monitoring",
    reason:
      "Post-mitigation conditions remain stable in the prototype model. No action required; kept for situational awareness.",
    currentScore: 44,
    basis: "MODEL_TREND",
    createdAt: "2026-08-18T13:40:00Z",
    acknowledged: true,
    reviewed: false,
  },
  {
    id: "alr-004",
    severity: "LOW",
    lakeId: "dig-tsho",
    lakeName: "Dig Tsho",
    title: "Stable / slightly shrinking surface area",
    reason:
      "Change detection shows a marginal decrease in lake area across the last observation window.",
    currentScore: 25,
    basis: "MODEL_TREND",
    createdAt: "2026-08-15T07:20:00Z",
    acknowledged: true,
    reviewed: true,
  },
];
