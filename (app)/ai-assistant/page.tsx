"use client";

import { Bot, Database, Lock, MessageSquareText } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { ChatPanel } from "@/components/assistant/chat-panel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/common/risk-badge";
import { SUGGESTED_PROMPTS } from "@/lib/assistant-engine";

export default function AssistantPage() {
  const { selectedLake, risk, lakes, alerts } = useApp();

  return (
    <div>
      <PageHeader
        title="GlacialTwin Copilot"
        subtitle="A grounded assistant that answers strictly from this platform's demo data and prototype model."
        dataStatus="DEMO"
        meta={<span>No external AI services are called</span>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChatPanel className="h-[600px]" />
        </div>

        <div className="space-y-4">
          <Card elevated>
            <CardHeader>
              <div>
                <CardTitle>Current Context</CardTitle>
                <CardDescription>The copilot sees exactly this state</CardDescription>
              </div>
              <Database className="h-4 w-4 text-primary" aria-hidden />
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border bg-surface px-3 py-2.5">
                <p className="text-xs font-semibold text-text">{selectedLake.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <RiskBadge level={risk.level} score={risk.score} size="sm" />
                  <span className="font-mono text-[10px] text-faint">{lakes.length} lakes in scope</span>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-muted">
                <li>• Lake inventory & Digital Twin states</li>
                <li>• Prototype risk scores & feature contributions</li>
                <li>• Observation history & trends</li>
                <li>• Saved scenarios and active alerts ({alerts.filter((a) => !a.acknowledged).length} unacknowledged)</li>
              </ul>
            </CardContent>
          </Card>

          <Card elevated>
            <CardHeader>
              <div>
                <CardTitle>Suggested Prompts</CardTitle>
                <CardDescription>Click to ask</CardDescription>
              </div>
              <MessageSquareText className="h-4 w-4 text-primary" aria-hidden />
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {SUGGESTED_PROMPTS.map((p) => (
                  <li key={p} className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted">
                    “{p}”
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card elevated className="p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-low" aria-hidden />
              <CardTitle>Honest by design</CardTitle>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              The copilot cannot invent sensor readings or fabricate data. When information is not
              present in the application state it responds:{" "}
              <span className="text-text">“I don't have sufficient data to determine that.”</span>
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-faint">
              <Bot className="h-3 w-3" aria-hidden /> Deterministic retrieval · zero hallucination surface
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
