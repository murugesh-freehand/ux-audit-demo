import React from "react";
import { cn } from "../ui/utils";

type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info"
  | "pending"
  | "mode";

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger:  "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
  info:    "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-gray-50 text-gray-500 border-gray-200",
  mode:    "bg-slate-100 text-slate-600 border-slate-200",
};

function resolveVariant(status: string): StatusVariant {
  const s = status.toUpperCase();
  if (["ACTIVE", "APPROVED", "PASS", "COMPLETED"].includes(s)) return "success";
  if (["INCOMPLETE", "HELD", "WARNING", "PARTIAL", "PROCESSING"].includes(s)) return "warning";
  if (["REJECTED", "FAILED", "FAIL"].includes(s)) return "danger";
  if (["CANCELLED", "SUPERSEDED", "EXPIRED", "INACTIVE"].includes(s)) return "neutral";
  if (["PENDING"].includes(s)) return "pending";
  return "neutral";
}

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const resolvedVariant = variant ?? resolveVariant(status);
  // Humanize: "APPROVED" → "Approved", "CROSS_DOC_MISMATCH" → kept as-is by callers using specific badges
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        variantStyles[resolvedVariant],
        className
      )}
    >
      {label}
    </span>
  );
}

interface ModeBadgeProps {
  mode: string;
  className?: string;
}

export function ModeBadge({ mode, className }: ModeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        variantStyles.mode,
        className
      )}
    >
      {mode}
    </span>
  );
}