import Link from "next/link";
import {
  ArrowRight,
  Satellite,
  BrainCircuit,
  Boxes,
  FlaskConical,
  Lightbulb,
  Waves,
  BellRing,
  ScanEye,
  ShieldCheck,
  Mountain,
  ChevronRight,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/common/logo";
import { FadeIn } from "@/components/common/fade-in";
import { Badge } from "@/components/ui/feedback";
import { DISCLAIMER_FULL } from "@/lib/config";

const FEATURES = [
  {
    icon: Satellite,
    title: "Satellite Intelligence",
    text: "Sentinel-2 and Landsat observation workflows with NDWI water detection and change tracking.",
  },
  {
    icon: BrainCircuit,
    title: "AI Risk Prediction",
    text: "A transparent prototype risk engine combines lake expansion, precipitation and terrain features.",
  },
  {
    icon: Boxes,
    title: "Digital Twin",
    text: "Every lake is a living virtual state — geometry, environment, risk and history in one model.",
  },
  {
    icon: FlaskConical,
    title: "Scenario Simulation",
    text: "What-if analysis for rainfall, temperature and expansion — instantly re-scored by the engine.",
  },
  {
    icon: Lightbulb,
    title: "Explainable AI",
    text: "SHAP-style contribution views show which features drive every risk estimate.",
  },
  {
    icon: Waves,
    title: "Flood Mapping",
    text: "Scenario-based inundation corridors with depth classes along downstream valleys.",
  },
  {
    icon: BellRing,
    title: "Early Warning Workflow",
    text: "Trend- and scenario-triggered alerts with acknowledge, review and report actions.",
  },
  {
    icon: ScanEye,
    title: "AI Assistant",
    text: "A grounded copilot that answers strictly from the platform's own data layer.",
  },
];

const LOOP = [
  { id: "01", label: "Observe", text: "Satellite + environmental data" },
  { id: "02", label: "Understand", text: "Lake dynamics + geospatial analytics" },
  { id: "03", label: "Predict", text: "Prototype ML risk engine" },
  { id: "04", label: "Simulate", text: "What-if scenario engine" },
  { id: "05", label: "Explain", text: "SHAP-style contributions + copilot" },
  { id: "06", label: "Alert", text: "Risk notifications & reports" },
];

function HeroScene() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/40">
      <svg viewBox="0 0 640 460" className="block h-auto w-full" role="img" aria-label="Stylised Himalayan glacial lake scene with digital overlay">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1626" />
            <stop offset="100%" stopColor="#050b14" />
          </linearGradient>
          <linearGradient id="peakFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b3350" />
            <stop offset="100%" stopColor="#101d2f" />
          </linearGradient>
          <linearGradient id="peakMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#24405f" />
            <stop offset="100%" stopColor="#132238" />
          </linearGradient>
          <linearGradient id="peakNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#31527a" />
            <stop offset="100%" stopColor="#182a44" />
          </linearGradient>
          <linearGradient id="lakeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="lakeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="640" height="460" fill="url(#sky)" />

        {/* Satellite grid */}
        {Array.from({ length: 16 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="460" stroke="#22d3ee" strokeOpacity="0.06" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 40} x2="640" y2={i * 40} stroke="#22d3ee" strokeOpacity="0.06" />
        ))}

        {/* Terrain contours */}
        {[70, 100, 130, 160].map((r, i) => (
          <ellipse key={r} cx="300" cy="330" rx={r * 1.7} ry={r * 0.62} fill="none" stroke="#94a3b8" strokeOpacity={0.1 - i * 0.02} strokeDasharray="3 6" />
        ))}

        {/* Mountain layers */}
        <path d="M0 250 L90 130 L150 210 L230 80 L320 220 L400 120 L480 230 L560 150 L640 260 L640 460 L0 460 Z" fill="url(#peakFar)" opacity="0.75" />
        <path d="M0 300 L110 170 L190 270 L290 130 L390 280 L500 180 L640 310 L640 460 L0 460 Z" fill="url(#peakMid)" opacity="0.9" />
        {/* Snow caps */}
        <path d="M230 80 L258 122 L244 118 L232 128 L218 112 L206 116 Z" fill="#e2e8f0" opacity="0.85" />
        <path d="M290 130 L314 168 L302 162 L292 172 L280 158 L272 162 Z" fill="#e2e8f0" opacity="0.7" />
        <path d="M110 170 L128 198 L118 194 L108 202 L98 190 Z" fill="#e2e8f0" opacity="0.55" />
        <path d="M0 340 L80 240 L150 330 L240 220 L330 350 L430 260 L540 360 L640 300 L640 460 L0 460 Z" fill="url(#peakNear)" />

        {/* Glacier tongue */}
        <path d="M262 208 C270 240 258 262 268 286 C276 304 292 312 306 318 L282 322 C262 314 248 298 246 274 C245 252 252 228 256 206 Z" fill="#cfe8ff" opacity="0.75" />

        {/* Lake */}
        <ellipse cx="308" cy="332" rx="86" ry="30" fill="url(#lakeGlow)" />
        <path d="M236 330 C252 312 286 306 316 312 C346 318 376 322 384 334 C372 350 336 358 302 354 C268 350 242 344 236 330 Z" fill="url(#lakeGrad)" />
        <path d="M236 330 C252 312 286 306 316 312 C346 318 376 322 384 334" fill="none" stroke="#67e8f9" strokeWidth="1.6" strokeDasharray="6 4" opacity="0.95" />

        {/* Downstream river */}
        <path d="M384 334 C420 344 436 366 462 380 C488 394 520 398 556 410" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <path d="M384 334 C420 344 436 366 462 380 C488 394 520 398 556 410" fill="none" stroke="#67e8f9" strokeWidth="1.2" strokeDasharray="2 10" className="animate-flow-dash" strokeLinecap="round" />

        {/* Network nodes */}
        <g stroke="#22d3ee" strokeOpacity="0.45" strokeDasharray="2 3">
          <line x1="308" y1="332" x2="230" y2="80" />
          <line x1="308" y1="332" x2="470" y2="140" />
          <line x1="308" y1="332" x2="556" y2="410" />
        </g>
        {[
          [230, 80],
          [470, 140],
          [556, 410],
          [308, 332],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === 3 ? 5 : 3.4} fill="#22d3ee">
            <animate attributeName="opacity" values="1;0.35;1" dur={`${2.2 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      {/* Scanning line */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-10 animate-scan bg-gradient-to-b from-transparent via-primary/10 to-transparent" />

      {/* Floating chips */}
      <div className="absolute left-4 top-4 rounded-md border border-border bg-bg/80 px-2.5 py-1.5 backdrop-blur">
        <p className="text-[8.5px] font-semibold tracking-[0.16em] text-faint uppercase">Lake Area</p>
        <p className="font-mono text-xs font-semibold text-text">1.62 km²</p>
      </div>
      <div className="absolute right-4 top-10 rounded-md border border-high/40 bg-bg/80 px-2.5 py-1.5 backdrop-blur">
        <p className="text-[8.5px] font-semibold tracking-[0.16em] text-faint uppercase">Risk</p>
        <p className="font-mono text-xs font-semibold text-high">72 · HIGH</p>
      </div>
      <div className="absolute bottom-4 left-4 rounded-md border border-border bg-bg/80 px-2.5 py-1.5 backdrop-blur">
        <p className="text-[8.5px] font-semibold tracking-[0.16em] text-faint uppercase">Coordinates</p>
        <p className="font-mono text-xs font-semibold text-text">27.8933° N · 86.6331° E</p>
      </div>
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-md border border-low/40 bg-bg/80 px-2.5 py-1.5 backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-low" />
        <span className="text-[10px] font-medium text-low">Twin synchronized</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size={32} tagline />
          <nav className="hidden items-center gap-6 text-[13px] text-muted md:flex" aria-label="Landing sections">
            <a href="#problem" className="hover:text-text">Problem</a>
            <a href="#how-it-works" className="hover:text-text">How it works</a>
            <a href="#features" className="hover:text-text">Features</a>
            <a href="#technology" className="hover:text-text">Technology</a>
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-[#04222b] shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-colors hover:bg-cyan-300"
          >
            Launch Platform <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-16 pb-14 sm:px-6 lg:grid-cols-2 lg:pt-24">
          <FadeIn>
            <Badge tone="primary" className="mb-5">
              AI-powered GLOF research platform
            </Badge>
            <h1 className="font-display text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">
              Understand the Glacier.
              <br />
              Predict the Risk.
              <br />
              <span className="text-glow-primary text-primary">Protect the Valley.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
              GlacialTwin AI combines satellite intelligence, machine learning, geospatial analytics
              and Digital Twin technology to monitor evolving glacial lake conditions.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-[#04222b] shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-colors hover:bg-cyan-300"
              >
                Explore Command Center <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/digital-twin/imja"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-6 text-sm font-semibold text-text transition-colors hover:border-primary/60 hover:text-primary"
              >
                Explore Digital Twin
              </Link>
            </div>
            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4">
              {[
                ["Lakes modelled", "5"],
                ["Observation series", "2015–2026"],
                ["Model status", "Prototype"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[10px] tracking-[0.14em] text-faint uppercase">{k}</dt>
                  <dd className="mt-0.5 font-mono text-lg font-semibold text-text">{v}</dd>
                </div>
              ))}
            </dl>
          </FadeIn>

          <FadeIn delay={0.15}>
            <HeroScene />
          </FadeIn>
        </div>

        {/* Source strip */}
        <div className="border-y border-border bg-surface/50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-3 text-[11px] tracking-wider text-faint uppercase sm:px-6">
            <span className="inline-flex items-center gap-1.5"><Satellite className="h-3.5 w-3.5" /> Sentinel-2</span>
            <span className="inline-flex items-center gap-1.5"><Satellite className="h-3.5 w-3.5" /> Landsat 9</span>
            <span className="inline-flex items-center gap-1.5"><Mountain className="h-3.5 w-3.5" /> Copernicus DEM</span>
            <span className="inline-flex items-center gap-1.5"><BrainCircuit className="h-3.5 w-3.5" /> Prototype risk engine</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Explainable outputs</span>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <FadeIn>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">The problem</p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight">
            Glacial lakes are dynamic systems whose characteristics can change over time.
          </h2>
        </FadeIn>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Expanding lakes",
              d: "As glaciers retreat, meltwater can accumulate and expand lakes between terminal moraines — sometimes rapidly.",
            },
            {
              t: "Complex failure drivers",
              d: "Ice/snow avalanches, moraine stability and extreme precipitation interact in ways that are hard to assess manually.",
            },
            {
              t: "Downstream exposure",
              d: "Valley settlements, trails and infrastructure can sit tens of kilometres below vulnerable lakes.",
            },
          ].map((c, i) => (
            <FadeIn key={c.t} delay={i * 0.08}>
              <div className="panel h-full p-5">
                <Mountain className="h-5 w-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-display text-base font-semibold text-text">{c.t}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{c.d}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <FadeIn>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">How it works</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">One connected intelligence loop</h2>
          </FadeIn>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {LOOP.map((s, i) => (
              <FadeIn key={s.id} delay={i * 0.07}>
                <li className="panel relative h-full p-4">
                  <span className="font-mono text-[10px] text-primary">{s.id}</span>
                  <h3 className="mt-1 font-display text-sm font-bold tracking-wide text-text uppercase">{s.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{s.text}</p>
                  {i < LOOP.length - 1 && (
                    <ChevronRight aria-hidden className="absolute top-1/2 -right-3 hidden h-4 w-4 -translate-y-1/2 text-border-strong lg:block" />
                  )}
                </li>
              </FadeIn>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <FadeIn>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Platform features</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">From observation to early warning</h2>
        </FadeIn>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={(i % 4) * 0.06}>
              <div className="panel group h-full p-5 transition-colors hover:border-primary/40">
                <f.icon className="h-5 w-5 text-primary transition-transform group-hover:scale-110" aria-hidden />
                <h3 className="mt-3 font-display text-sm font-semibold text-text">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <FadeIn>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Platform preview</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">A command center for the high Himalaya</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-8 overflow-hidden rounded-xl border border-border shadow-2xl shadow-black/50">
              <div className="flex items-center gap-1.5 border-b border-border bg-elevated px-4 py-2.5">
                <LogoMark size={20} />
                <span className="ml-1 font-display text-[11px] font-bold tracking-[0.14em] text-muted">GLACIALTWIN AI</span>
                <span className="ml-auto font-mono text-[9px] text-faint">GT-OPS / COMMAND CENTER</span>
              </div>
              <div className="grid gap-3 bg-surface p-4 md:grid-cols-3">
                <div className="space-y-3 md:col-span-2">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Regional risk", "72", "#F97316"],
                      ["Monitored lakes", "5", "#22D3EE"],
                      ["Active alerts", "2", "#EF4444"],
                      ["Exposure est.", "12.4k", "#94A3B8"],
                    ].map(([k, v, c]) => (
                      <div key={k} className="rounded-lg border border-border bg-elevated p-3">
                        <p className="text-[9px] tracking-wider text-faint uppercase">{k}</p>
                        <p className="mt-1 font-display text-xl font-bold" style={{ color: c }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-border bg-elevated p-4">
                    <p className="mb-2 text-[10px] tracking-wider text-faint uppercase">Lake area — observed vs forecast</p>
                    <svg viewBox="0 0 400 110" className="w-full">
                      <polyline points="0,88 80,80 160,68 240,54 320,34" fill="none" stroke="#22D3EE" strokeWidth="2.4" />
                      <polyline points="320,34 370,24 400,14" fill="none" stroke="#F97316" strokeWidth="2" strokeDasharray="5 4" />
                      <circle cx="320" cy="34" r="3" fill="#22D3EE" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg border border-high/40 bg-high/[0.06] p-4">
                    <p className="text-[10px] tracking-wider text-faint uppercase">Imja Lake — risk</p>
                    <p className="mt-1 font-display text-3xl font-bold text-high">72<span className="text-sm text-faint"> /100</span></p>
                    <p className="mt-1 text-[11px] text-muted">HIGH · ↑ from previous observation</p>
                  </div>
                  <div className="rounded-lg border border-border bg-elevated p-4">
                    <p className="mb-2 text-[10px] tracking-wider text-faint uppercase">Top contributors (demo)</p>
                    {[
                      ["Lake expansion", 82],
                      ["Rainfall", 64],
                      ["Glacier proximity", 42],
                    ].map(([l, w]) => (
                      <div key={l as string} className="mb-1.5">
                        <p className="flex justify-between text-[10px] text-muted">
                          <span>{l}</span>
                          <span className="font-mono">{w}%</span>
                        </p>
                        <div className="h-1.5 rounded-full bg-surface">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-primary" style={{ width: `${w}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <FadeIn>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Technology</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Built on an open geospatial stack</h2>
        </FadeIn>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            "Next.js", "TypeScript", "Tailwind CSS", "Three.js", "MapLibre GL", "Recharts",
            "Framer Motion", "FastAPI-ready API layer", "PostGIS schema", "XGBoost roadmap", "SHAP roadmap", "Docker",
          ].map((t, i) => (
            <FadeIn key={t} delay={i * 0.03}>
              <div className="panel-elevated px-3 py-3 text-center font-mono text-[11px] text-muted">{t}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.06] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
          <FadeIn>
            <LogoMark size={52} className="mx-auto" />
            <h2 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Monitor. Predict. Simulate. Protect.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
              Turning Earth observation data into actionable intelligence for high-mountain communities.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-7 text-sm font-semibold text-[#04222b] shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-colors hover:bg-cyan-300"
              >
                Open Command Center <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/digital-twin"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-7 text-sm font-semibold text-text transition-colors hover:border-primary/60 hover:text-primary"
              >
                View Digital Twin
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <Logo size={30} tagline />
              <p className="mt-3 max-w-md text-[11px] leading-relaxed text-faint">{DISCLAIMER_FULL}</p>
            </div>
            <nav className="grid grid-cols-2 gap-x-10 gap-y-1.5 text-xs text-muted" aria-label="Footer">
              {[
                ["Command Center", "/dashboard"],
                ["Digital Twin", "/digital-twin"],
                ["Risk Monitoring", "/risk-monitoring"],
                ["Scenario Simulator", "/scenario-simulator"],
                ["Alerts", "/alerts"],
                ["Reports", "/reports"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="hover:text-primary">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="mt-8 border-t border-border pt-4 font-mono text-[10px] text-faint">
            © 2026 GlacialTwin AI — research & education prototype. Not an official disaster-warning system.
          </p>
        </div>
      </footer>
    </div>
  );
}
