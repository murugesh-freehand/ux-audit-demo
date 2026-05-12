import React from "react";
import { cn } from "../ui/utils";
import {
  EXCEPTION_CODE_META,
  EXCEPTION_STATUS_CFG,
  PROCESSING_STATUS_CFG,
  type ProcessingStatus,
} from "./statusConfig";
import type { ExceptionCode, ExceptionStatus } from "../../data/exceptionsData";

// ─── Generic semantic badge ───────────────────────────────────────────────────

type StatusVariant = "success" | "warning" | "danger" | "neutral" | "info" | "pending" | "mode";

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger:  "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
  info:    "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-slate-50 text-slate-500 border-slate-200",
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
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, " ");
  return (
    <span className={cn("inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap", variantStyles[resolvedVariant], className)}>
      {label}
    </span>
  );
}

// ─── Mode badge ───────────────────────────────────────────────────────────────

export function ModeBadge({ mode, className }: { mode: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap", variantStyles.mode, className)}>
      {mode}
    </span>
  );
}

// ─── Exception code badge ─────────────────────────────────────────────────────

export function ExceptionCodeBadge({ code, className }: { code: ExceptionCode | string; className?: string }) {
  const meta = EXCEPTION_CODE_META[code as ExceptionCode] ?? { label: code, badgeCls: "bg-slate-50 text-slate-600 border-slate-200" };
  return (
    <span className={cn("inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap", meta.badgeCls, className)}>
      {meta.label}
    </span>
  );
}

// ─── Exception status badge ───────────────────────────────────────────────────

export function ExceptionStatusBadge({ status, className }: { status: ExceptionStatus | string; className?: string }) {
  const cfg = EXCEPTION_STATUS_CFG[status as ExceptionStatus] ?? { badgeCls: "bg-slate-100 text-slate-600 border-slate-200" };
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={cn("inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap", cfg.badgeCls, className)}>
      {label}
    </span>
  );
}

// ─── Processing status badge ──────────────────────────────────────────────────

export function ProcessingStatusBadge({ status, className }: { status: ProcessingStatus | string; className?: string }) {
  const cfg = PROCESSING_STATUS_CFG[status as ProcessingStatus] ?? { label: status, badgeCls: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={cn("inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap", cfg.badgeCls, className)}>
      {cfg.label}
    </span>
  );
}
