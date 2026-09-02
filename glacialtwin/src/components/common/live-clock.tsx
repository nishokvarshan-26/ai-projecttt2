"use client";

import { useEffect, useState } from "react";

/** UTC clock that renders a stable placeholder until mounted (hydration-safe). */
export function LiveClock() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const update = () =>
      setNow(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="hidden font-mono text-[11px] text-muted md:inline" suppressHydrationWarning>
      {now ?? "--:--:-- UTC"}
    </span>
  );
}
