"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* --------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "outline" | "ghost" | "subtle" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-[#04222b] font-semibold hover:bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.25)]",
  outline: "border border-border bg-transparent text-text hover:border-primary/60 hover:text-primary",
  ghost: "bg-transparent text-muted hover:text-text hover:bg-elevated",
  subtle: "bg-elevated border border-border text-text hover:border-border-strong",
  danger: "border border-critical/40 bg-critical/10 text-critical hover:bg-critical/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-[13px] gap-2 rounded-lg",
  lg: "h-11 px-6 text-sm gap-2 rounded-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "subtle",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-45",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = "subtle",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Link>
  );
}

/* ---------------------------------- Input ---------------------------------- */

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border border-border bg-elevated px-3 text-[13px] text-text placeholder:text-faint focus:border-primary/60 focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

/* ---------------------------------- Select --------------------------------- */

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("gt-select", className)} {...props}>
      {children}
    </select>
  );
}

/* ---------------------------------- Slider --------------------------------- */

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  formatValue,
  id,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
  formatValue?: (v: number) => string;
  id?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs font-medium text-muted">
          {label}
        </label>
        <span className="font-mono text-xs text-primary">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="gt-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* ---------------------------------- Switch --------------------------------- */

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:opacity-40",
        checked ? "border-primary/60 bg-primary/30" : "border-border bg-elevated"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all",
          checked ? "left-[18px] bg-primary" : "left-[3px] bg-muted"
        )}
      />
    </button>
  );
}

/* ----------------------------------- Tabs ---------------------------------- */

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Array<{ id: T; label: string; icon?: React.ReactNode }>;
  active: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1", className)}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            active === t.id
              ? "bg-primary/15 text-primary"
              : "text-muted hover:text-text hover:bg-elevated"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
