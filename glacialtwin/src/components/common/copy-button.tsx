"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center gap-1 rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-muted transition-colors hover:border-primary/50 hover:text-primary ${className ?? ""}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
      aria-label={`${label}: ${text}`}
    >
      {copied ? <Check className="h-3 w-3 text-low" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
      {copied ? "Copied" : label}
    </button>
  );
}
