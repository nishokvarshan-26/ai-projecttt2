import { cn } from "@/lib/utils";

/** GlacialTwin AI mark: mountain + glacier + lake + network nodes. */
export function LogoMark({
  size = 34,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="GlacialTwin AI logo"
    >
      <defs>
        <linearGradient id="gt-mountain" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67E8F9" />
          <stop offset="1" stopColor="#0E7490" />
        </linearGradient>
        <linearGradient id="gt-lake" x1="14" y1="30" x2="36" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" />
          <stop offset="1" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="10" fill="#0B1422" stroke="#20334A" />
      {/* Mountain peaks */}
      <path d="M9 33 L19 12 L26 24 L31 16 L39 33 Z" fill="url(#gt-mountain)" opacity="0.92" />
      <path d="M19 12 L23 19 L21 21 L17 18 Z" fill="#F8FAFC" opacity="0.85" />
      <path d="M31 16 L34 21 L31.5 22.5 L29 20 Z" fill="#F8FAFC" opacity="0.7" />
      {/* Lake */}
      <path d="M11 35 C15 32.5 20 37 24 35.5 C28 34 33 37.5 37 35 L37 38 C33 41 27 38.5 23 40 C19 41.5 14 39 11 38 Z" fill="url(#gt-lake)" />
      {/* Network nodes */}
      <circle cx="13" cy="13" r="1.8" fill="#22D3EE" />
      <circle cx="38" cy="10" r="1.4" fill="#22D3EE" opacity="0.85" />
      <circle cx="41" cy="24" r="1.2" fill="#22D3EE" opacity="0.65" />
      <path d="M13 13 L24 20 M38 10 L31 16 M41 24 L39 33" stroke="#22D3EE" strokeWidth="0.9" opacity="0.5" strokeDasharray="2 2" />
    </svg>
  );
}

export function Logo({
  size = 34,
  compact = false,
  tagline = false,
  className,
}: {
  size?: number;
  compact?: boolean;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-[15px] font-bold tracking-[0.14em] text-text">
            GLACIALTWIN<span className="text-primary"> AI</span>
          </span>
          {tagline && (
            <span className="block text-[9.5px] font-medium tracking-[0.22em] text-muted uppercase">
              Monitor · Predict · Simulate · Protect
            </span>
          )}
        </span>
      )}
    </span>
  );
}
