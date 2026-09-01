import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-line rounded-lg p-4 ${className}`}>{children}</div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card>
      <div className="py-4 text-center text-sm text-ink-soft">{children}</div>
    </Card>
  );
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 mt-7 mb-2.5">
      <h3 className="text-[0.95rem] font-display font-semibold">{title}</h3>
      {hint && <span className="text-xs text-ink-faint">{hint}</span>}
    </div>
  );
}

export function KpiTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "alert";
}) {
  const border =
    tone === "good" ? "border-t-good" : tone === "alert" ? "border-t-alert" : "border-t-accent";
  return (
    <div className={`bg-surface border border-line border-t-[3px] ${border} rounded-md px-3.5 py-3`}>
      <div className="text-[0.68rem] uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="mono text-[1.35rem] font-semibold mt-0.5">{value}</div>
      {hint && <div className="text-xs text-ink-faint mt-0.5">{hint}</div>}
    </div>
  );
}

export function Pill({ tone, children }: { tone: "stock" | "sold" | "age30" | "age60" | "age90"; children: ReactNode }) {
  const styles: Record<string, string> = {
    stock: "bg-good-soft text-good",
    sold: "bg-surface-2 text-ink-soft border border-line-strong",
    age30: "bg-amber-soft text-amber",
    age60: "bg-alert-soft text-alert",
    age90: "bg-alert text-white",
  };
  return (
    <span className={`mono inline-flex items-center gap-1 text-[0.68rem] uppercase tracking-wider px-2.5 py-1 rounded-full ${styles[tone]}`}>
      {children}
    </span>
  );
}

export function AgingBadge({ days }: { days: number }) {
  if (days >= 90) return <Pill tone="age90">{days}d — stale</Pill>;
  if (days >= 60) return <Pill tone="age60">{days}d — slow</Pill>;
  if (days >= 30) return <Pill tone="age30">{days}d</Pill>;
  return <span className="mono text-[0.78rem] text-ink-faint">{days}d</span>;
}

export function Button({
  children,
  variant = "default",
  size = "default",
  type = "button",
  className = "",
  ...rest
}: {
  children: ReactNode;
  variant?: "default" | "primary" | "ghost" | "danger";
  size?: "default" | "small";
  type?: "button" | "submit";
  className?: string;
  [key: string]: unknown;
}) {
  const base = "rounded font-body border transition-colors inline-flex items-center justify-center gap-1.5";
  const variants: Record<string, string> = {
    default: "bg-surface border-line-strong text-ink hover:border-ink-soft",
    primary: "bg-accent border-accent text-accent-ink font-semibold hover:brightness-[1.06]",
    ghost: "bg-transparent border-transparent text-ink-soft hover:text-ink",
    danger: "bg-transparent border-alert text-alert",
  };
  const sizes: Record<string, string> = {
    default: "px-4 py-2 text-sm",
    small: "px-2.5 py-1.5 text-[0.78rem]",
  };
  return (
    <button type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 text-[0.78rem] uppercase tracking-wide text-ink-soft ${wide ? "col-span-full" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto border border-line rounded-lg">{children}</div>;
}
