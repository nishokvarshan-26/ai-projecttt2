import { PageHeader } from "@/components/common/page-header";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/feedback";
import { ShapChart } from "@/components/charts/shap-chart";
import { assessRisk, topContributions } from "@/lib/risk-engine";
import { getLakeById } from "@/data/lakes";

/**
 * MODEL & SYSTEM INTELLIGENCE
 * A transparent technical page. No model metrics are fabricated: until real
 * models are trained and evaluated, metric cells show "Evaluation pending".
 */

const MODELS = [
  { name: "Random Forest", role: "Baseline ensemble", status: "Not trained" },
  { name: "XGBoost", role: "Primary risk classifier (target)", status: "Not trained" },
  { name: "Logistic Regression", role: "Interpretable reference", status: "Not trained" },
];

const METRICS = ["Accuracy", "Precision", "Recall", "F1", "ROC-AUC"];

export default function ModelIntelligencePage() {
  const imja = getLakeById("imja");
  const demoContributions = imja ? topContributions(assessRisk(imja), 5) : [];

  return (
    <div>
      <PageHeader
        title="Model & System Intelligence"
        subtitle="Transparent view of the ML roadmap, evaluation protocol and current prototype behaviour."
        dataStatus="MODEL_PREDICTION"
        meta={<span className="font-mono">Honesty first: no fabricated metrics anywhere on this page</span>}
      />

      <div className="mb-4 rounded-lg border border-moderate/35 bg-moderate/[0.07] px-4 py-3 text-xs leading-relaxed text-moderate">
        <span className="font-semibold">Evaluation not available.</span> The machine-learning models
        referenced in this platform have not yet been trained on labelled GLOF outcomes. All numeric
        risk values in the application come from a heuristic prototype engine with fixed weights.
        Metric cells below intentionally display “Evaluation pending” rather than invented numbers.
      </div>

      {/* Model comparison */}
      <Card elevated className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Model Comparison</CardTitle>
            <CardDescription>Planned candidate models for the risk classification task</CardDescription>
          </div>
          <Badge tone="warning">Evaluation pending</Badge>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-0">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-y border-border bg-elevated text-[10px] tracking-[0.1em] text-faint uppercase">
                <th scope="col" className="px-4 py-2.5 font-semibold">Model</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Role</th>
                {METRICS.map((m) => (
                  <th key={m} scope="col" className="px-3 py-2.5 text-right font-semibold">{m}</th>
                ))}
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m) => (
                <tr key={m.name} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-text">{m.name}</td>
                  <td className="px-3 py-3 text-muted">{m.role}</td>
                  {METRICS.map((metric) => (
                    <td key={metric} className="px-3 py-3 text-right font-mono text-faint">—</td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <Badge>{m.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Confusion matrix placeholder */}
        <Card elevated>
          <CardHeader>
            <div>
              <CardTitle>Confusion Matrix</CardTitle>
              <CardDescription>Held-out evaluation — unavailable until training completes</CardDescription>
            </div>
            <DataStatusBadge status="DEMO" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-1 text-center text-[10px]" aria-label="Confusion matrix placeholder">
              <span />
              {["LOW", "MOD", "HIGH", "CRIT"].map((l) => (
                <span key={l} className="pb-1 font-mono text-faint">{l}</span>
              ))}
              {["LOW", "MOD", "HIGH", "CRIT"].map((row) => (
                <>
                  <span key={`${row}-label`} className="flex items-center justify-end pr-2 font-mono text-faint">{row}</span>
                  {["LOW", "MOD", "HIGH", "CRIT"].map((col) => (
                    <span
                      key={`${row}-${col}`}
                      className="flex h-12 items-center justify-center rounded border border-dashed border-border font-mono text-faint"
                    >
                      ·
                    </span>
                  ))}
                </>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-faint">
              Cells will populate after supervised evaluation on a labelled historical dataset.
            </p>
          </CardContent>
        </Card>

        {/* Feature importance (demo weights) */}
        <Card elevated>
          <CardHeader>
            <div>
              <CardTitle>Feature Importance (Prototype Weights)</CardTitle>
              <CardDescription>Fixed heuristic weights currently driving all scores</CardDescription>
            </div>
            <DataStatusBadge status="MODEL_PREDICTION" />
          </CardHeader>
          <CardContent>
            <ShapChart contributions={demoContributions} />
          </CardContent>
        </Card>
      </div>

      {/* Protocol */}
      <Card elevated className="mt-4 p-5">
        <h2 className="font-display text-sm font-bold tracking-wide uppercase">Planned Evaluation Protocol</h2>
        <ol className="mt-3 grid gap-3 text-xs leading-relaxed text-muted md:grid-cols-2">
          <li className="rounded-lg border border-border bg-surface p-3.5">
            <p className="mb-1 font-semibold text-text">1 · Dataset construction</p>
            Historical lake-state records paired with documented GLOF / non-GLOF outcomes;
            class imbalance handled via stratified sampling; temporal split to avoid leakage.
          </li>
          <li className="rounded-lg border border-border bg-surface p-3.5">
            <p className="mb-1 font-semibold text-text">2 · Training & tuning</p>
            Random Forest / XGBoost / Logistic Regression baselines with grouped
            cross-validation by basin; calibration assessed via reliability curves.
          </li>
          <li className="rounded-lg border border-border bg-surface p-3.5">
            <p className="mb-1 font-semibold text-text">3 · Evaluation</p>
            Accuracy, precision, recall, F1 and ROC-AUC on a strictly held-out temporal test set,
            plus confusion analysis per risk class.
          </li>
          <li className="rounded-lg border border-border bg-surface p-3.5">
            <p className="mb-1 font-semibold text-text">4 · Explanation</p>
            SHAP value computation on the trained booster to replace the current
            heuristic contribution display with genuine attributions.
          </li>
        </ol>
        <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2.5 text-[11px] leading-relaxed text-muted">
          The ML pipeline (pandas · numpy · scikit-learn · XGBoost · SHAP) is designed to run as a
          Python service behind the API layer; this frontend consumes its outputs without modification
          once available.
        </p>
      </Card>
    </div>
  );
}
