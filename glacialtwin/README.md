# GlacialTwin AI

**AI-powered Digital Twin platform for glacial lake outburst (GLOF) risk monitoring, scenario simulation and early warning.**

> ⚠️ **Research prototype.** All data in this application is synthetic demonstration data generated deterministically at runtime. Risk values come from a heuristic prototype engine with fixed weights — no ML model has been trained or evaluated yet. This software is not a warning system and must not be used for emergency decisions.

## Features

- **Command Center dashboard** — regional KPIs, risk ranking, live twin states
- **Digital Twin viewer** — pseudo-3D lake/terrain visualization (Three.js) per lake
- **AI Risk Engine** — explainable heuristic scoring with feature contributions (SHAP-style bars)
- **Scenario Simulator** — what-if analysis (rainfall, temperature, glacier retreat) with saved history & CSV export
- **Flood Mapping** — schematic inundation corridors on MapLibre (satellite/dark/streets basemaps, measure tool)
- **Satellite Intelligence** — Sentinel-2 / Landsat scene catalogue + before/after comparison slider
- **Early Warning Center** — trend-triggered alerts with acknowledge/review workflow
- **GlacialTwin Copilot** — grounded rule-based assistant (answers only from app data; no external AI calls)
- **Reports** — printable technical report per lake (PDF via browser print, CSV export)
- **Model Intelligence** — transparent ML roadmap; metric cells honestly show "Evaluation pending"

## Tech Stack

| Layer | Tools |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4 (`@theme` tokens), custom design system |
| Charts | Recharts |
| Maps | MapLibre GL |
| 3D | Three.js |
| Motion | Framer Motion |

The frontend is architected to consume a future **FastAPI** service (pandas · scikit-learn · XGBoost · SHAP pipeline); all data access is isolated under `src/data` and `src/lib` for a clean swap.

## Getting Started

```bash
npm install     # already done if node_modules exists
npm run dev     # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Docker:

```bash
docker build -t glacialtwin .
docker run -p 3000:3000 glacialtwin
```

## Project Structure

```
src/
├── app/                  # App Router pages (+ (app) route group with shell)
├── components/           # ui/, common/, charts/, feature components
├── context/              # Global app state (selected lake, alerts, scenarios)
├── data/                 # Deterministic demo data generators
└── lib/                  # Risk engine, scenario engine, assistant engine, config
```

## Scientific Integrity Rules

1. Every data surface is labeled `DEMO DATA`, `MODEL PREDICTION`, `MODEL FORECAST`, or `SCENARIO`.
2. No fabricated accuracy metrics anywhere — see `/model-intelligence`.
3. The assistant refuses to answer beyond available data ("I don't have sufficient data to determine that.").
4. Disclaimers appear on every analytical surface.
