"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChatPanel } from "./chat-panel";

/** Floating copilot launcher available across the app (hidden on the dedicated page). */
export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (pathname.startsWith("/ai-assistant")) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed right-4 bottom-20 z-50 h-[520px] w-[calc(100vw-2rem)] max-w-sm sm:bottom-24"
            role="dialog"
            aria-label="GlacialTwin Copilot"
          >
            <ChatPanel className="h-full shadow-2xl shadow-black/60" />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close GlacialTwin Copilot" : "Open GlacialTwin Copilot"}
        className="fixed right-4 bottom-20 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-primary/50 bg-[#07242e] text-primary shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-transform hover:scale-105 sm:bottom-6"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </button>

      {!open && (
        <Link
          href="/ai-assistant"
          className="fixed right-20 bottom-20 z-40 hidden rounded-full border border-border bg-surface/90 px-3 py-1.5 text-[11px] text-muted backdrop-blur transition-colors hover:text-text sm:block sm:bottom-6"
        >
          Open full assistant
        </Link>
      )}
    </>
  );
}
