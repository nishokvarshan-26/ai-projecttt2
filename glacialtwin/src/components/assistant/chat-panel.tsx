"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, CornerDownLeft, User } from "lucide-react";
import { useApp } from "@/context/app-context";
import { answerQuery, SUGGESTED_PROMPTS } from "@/lib/assistant-engine";
import { Badge } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
  suggestions?: string[];
}

const WELCOME: Message = {
  role: "assistant",
  text: "Hello — I'm the GlacialTwin Copilot. I answer strictly from this application's demo data and prototype model. Ask me about lake risk, recent changes, scenarios or alerts.",
  suggestions: SUGGESTED_PROMPTS.slice(0, 3),
};

export function ChatPanel({ className }: { className?: string }) {
  const { lakes, selectedLake, alerts, scenarios } = useApp();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = (raw?: string) => {
    const q = (raw ?? input).trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setThinking(true);
    // Small delay so the interaction feels conversational; answers are local & deterministic.
    window.setTimeout(() => {
      const answer = answerQuery(q, { lakes, selectedLake, alerts, scenarios });
      setMessages((m) => [
        ...m,
        { role: "assistant", text: answer.text, suggestions: answer.suggestions },
      ]);
      setThinking(false);
    }, 420);
  };

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-lg border border-border bg-surface", className)}>
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
          <Bot className="h-4 w-4 text-primary" aria-hidden />
        </span>
        <div>
          <p className="font-display text-sm font-bold tracking-wide text-text">GlacialTwin Copilot</p>
          <p className="text-[10px] text-faint">Grounded in application data · no external AI calls</p>
        </div>
        <Badge tone="primary" className="ml-auto">
          Demo
        </Badge>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.role === "user" && "justify-end")}>
            {m.role === "assistant" && (
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                <Bot className="h-3.5 w-3.5 text-primary" aria-hidden />
              </span>
            )}
            <div className={cn("max-w-[85%]", m.role === "user" && "order-first")}>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-[13px] leading-relaxed",
                  m.role === "user"
                    ? "bg-primary/15 text-text"
                    : "border border-border bg-elevated text-muted"
                )}
              >
                {m.text}
              </div>
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="cursor-pointer rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {m.role === "user" && (
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-elevated">
                <User className="h-3.5 w-3.5 text-muted" aria-hidden />
              </span>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2 text-xs text-faint">
            <Bot className="h-3.5 w-3.5 animate-pulse text-primary" aria-hidden />
            Analysing application data…
          </div>
        )}
      </div>

      {/* Input */}
      <form
        className="border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${selectedLake.name} or the region…`}
            aria-label="Ask the GlacialTwin Copilot"
            className="h-9 flex-1 rounded-lg border border-border bg-elevated px-3 text-[13px] text-text placeholder:text-faint focus:border-primary/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-semibold text-[#04222b] transition-colors hover:bg-cyan-300 disabled:opacity-40"
          >
            Send <CornerDownLeft className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-faint">
          The copilot only reports information present in the demo data layer and will say when it
          cannot answer.
        </p>
      </form>
    </div>
  );
}
