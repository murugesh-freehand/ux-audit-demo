import React from "react";
import { Link } from "react-router";
import {
  CheckCircle2,
  Lock,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Activity,
} from "lucide-react";
import { cn } from "../ui/utils";
import { invoices, contracts } from "../../data/mockData";
import { exceptions } from "../../data/exceptionsData";
import { ExceptionCodeBadge, StatusBadge } from "../shared/StatusBadge";

// ─── Data ─────────────────────────────────────────────────────────────────────

const openExceptions    = exceptions.filter((e) => e.status === "OPEN").slice(0, 5);
const openExceptionCount = exceptions.filter((e) => e.status === "OPEN").length;
const resolvedThisMonth  = exceptions.filter((e) => e.status === "RESOLVED").length;

const recentInvoices = [...invoices]
  .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
  .slice(0, 6);

const activeContracts  = contracts.filter((c) => c.status === "ACTIVE").length;
const totalInvoices    = invoices.length;
const autoCleared      = invoices.filter((i) => i.auditStatus === "PASS").length;
const flaggedForReview = invoices.filter((i) => ["FAIL", "WARNING"].includes(i.auditStatus)).length;
const clearRate        = Math.round((autoCleared / totalInvoices) * 100);

// ─── Setup steps ──────────────────────────────────────────────────────────────

type StepState = "done" | "active" | "locked";

interface SetupStep {
  id: string;
  title: string;
  desc: string;
  state: StepState;
  ctaLabel?: string;
  ctaTo?: string;
}

const setupSteps: SetupStep[] = [
  {
    id: "s1",
    title: "Upload your first contract",
    desc: `${activeContracts} carrier contracts active — Averitt Express, FedEx Freight, CEVA Logistics.`,
    state: "done",
  },
  {
    id: "s2",
    title: "Activate the Contract Parser agent",
    desc: "Lanes and rates extracted across all active carriers.",
    state: "done",
  },
  {
    id: "s3",
    title: "Connect invoice source",
    desc: "2 connectors active.",
    state: "done",
  },
  {
    id: "s4",
    title: "Configure the Audit Agent",
    desc: `${totalInvoices} invoices are waiting. Configure the agent to extract line items, charges, and freight details automatically.`,
    state: "active",
    ctaLabel: "Configure Audit Agent",
    ctaTo: "/agents",
  },
  {
    id: "s5",
    title: "Review your first exceptions",
    desc: "Accept or dispute flagged overcharges and unauthorized charges.",
    state: "locked",
  },
];

const doneCount   = setupSteps.filter((s) => s.state === "done").length;
const progressPct = Math.round((doneCount / setupSteps.length) * 100);

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
        <CheckCircle2 size={12} className="text-white" strokeWidth={2.5} />
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0 mt-0.5">
        <div className="w-2 h-2 rounded-full bg-primary" />
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
      <Lock size={9} className="text-slate-300" />
    </div>
  );
}


function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-full bg-slate-50 flex flex-col">

      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <h1 className="text-slate-950 font-semibold">Good morning, CFO</h1>
        {openExceptionCount > 0 && (
          <p className="text-sm mt-0.5">
            <span className="text-slate-500">SLB — </span>
            <Link to="/exceptions" className="text-primary font-medium hover:underline">
              {openExceptionCount} open exception{openExceptionCount !== 1 ? "s" : ""} need{openExceptionCount === 1 ? "s" : ""} your attention
            </Link>
          </p>
        )}
      </div>

      <div className="flex-1 px-6 py-5 space-y-5">

        {/* Setup checklist ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-950">Finish setting up</p>
              <p className="text-xs text-slate-400 mt-0.5">Complete these steps to start auditing invoices</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700">
              {doneCount} of {setupSteps.length} done
            </span>
          </div>
          <div className="h-1 bg-slate-100">
            <div className="h-1 bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {setupSteps.map((step, idx) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 px-5 py-4",
                  idx >= 2 && "border-t border-slate-100",
                  step.state === "active" && "bg-amber-50/40"
                )}
              >
                <StepIcon state={step.state} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn("text-sm font-medium leading-tight", step.state === "locked" ? "text-slate-400" : "text-slate-950")}>
                      {step.title}
                    </p>
                    {step.state === "done" && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Done</span>
                    )}
                    {step.state === "active" && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700">Up next</span>
                    )}
                  </div>
                  <p className={cn("text-xs mt-1 leading-relaxed", step.state === "locked" ? "text-slate-300" : "text-slate-500")}>
                    {step.desc}
                  </p>
                  {step.ctaTo && (
                    <Link to={step.ctaTo} className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-primary hover:underline">
                      {step.ctaLabel} <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stat tiles ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          <Link to="/invoices"
            className="bg-white rounded-lg border border-slate-200 border-l-2 border-l-emerald-400 px-4 py-4 hover:border-orange-200 hover:shadow-sm transition-all"
          >
            <p className="text-xs text-slate-500 mb-1.5">Approved automatically</p>
            <p className="text-2xl font-semibold text-emerald-600">{autoCleared}</p>
            <p className="text-[11px] text-slate-400 mt-1.5">no review needed · {clearRate}% of invoices</p>
          </Link>

          <Link to="/invoices"
            className="bg-white rounded-lg border border-slate-200 border-l-2 border-l-amber-400 px-4 py-4 hover:border-orange-200 hover:shadow-sm transition-all"
          >
            <p className="text-xs text-slate-500 mb-1.5">Flagged for review</p>
            <p className="text-2xl font-semibold text-amber-600">{flaggedForReview}</p>
            <p className="text-[11px] text-slate-400 mt-1.5">of {totalInvoices} invoices this month</p>
          </Link>

          <Link to="/exceptions"
            className={cn(
              "bg-white rounded-lg border border-slate-200 px-4 py-4 hover:border-orange-200 hover:shadow-sm transition-all",
              openExceptionCount > 0 ? "border-l-2 border-l-red-400" : ""
            )}
          >
            <p className="text-xs text-slate-500 mb-1.5">Open exceptions</p>
            <p className={cn("text-2xl font-semibold", openExceptionCount > 0 ? "text-red-600" : "text-slate-400")}>
              {openExceptionCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-1.5">{resolvedThisMonth} resolved this month</p>
          </Link>

          <Link to="/contracts"
            className="bg-white rounded-lg border border-slate-200 px-4 py-4 hover:border-orange-200 hover:shadow-sm transition-all"
          >
            <p className="text-xs text-slate-500 mb-1.5">Contracts active</p>
            <p className="text-2xl font-semibold text-slate-950">{activeContracts}</p>
            <p className="text-[11px] text-slate-400 mt-1.5">rate cards loaded</p>
          </Link>

        </div>

        {/* Bottom two-column — full width, equal height ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">

          {/* Open exceptions */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                <p className="text-sm font-semibold text-slate-950">Open exceptions</p>
                {openExceptionCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-600">
                    {openExceptionCount}
                  </span>
                )}
              </div>
              <Link to="/exceptions" className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                View all <ChevronRight size={12} />
              </Link>
            </div>

            <div className="flex-1 divide-y divide-slate-100">
              {openExceptions.length === 0 ? (
                <div className="flex items-center justify-center h-full py-10">
                  <p className="text-sm text-slate-400">No open exceptions</p>
                </div>
              ) : (
                openExceptions.map((ex) => (
                  <div key={ex.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-snug">{ex.description}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{ex.vendor} · {ex.invoiceRef}</p>
                    </div>
                    <ExceptionCodeBadge code={ex.code} />
                  </div>
                ))
              )}
            </div>

            {resolvedThisMonth > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 bg-emerald-50/40 shrink-0">
                <p className="text-[11px] text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 size={11} className="shrink-0" />
                  {resolvedThisMonth} exception{resolvedThisMonth !== 1 ? "s" : ""} resolved this month — agent handled {resolvedThisMonth - 0} without escalation
                </p>
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-slate-400" />
                <p className="text-sm font-semibold text-slate-950">Recent activity</p>
              </div>
              <Link to="/invoices" className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                See all <ChevronRight size={12} />
              </Link>
            </div>

            <div className="flex-1 divide-y divide-slate-100">
              {recentInvoices.map((inv) => {
                const dotColor =
                  inv.status === "HELD" || inv.status === "REJECTED"       ? "bg-red-400"
                  : inv.status === "APPROVED" || inv.status === "COMPLETED" ? "bg-emerald-400"
                  : "bg-slate-300";
                return (
                  <Link
                    key={inv.id}
                    to={`/invoices/${inv.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 truncate">
                        <span className="font-medium text-slate-950">{inv.ref}</span>
                        <span className="text-slate-400"> · {inv.vendor}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{inv.mode} · {inv.service}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={inv.status} />
                      <span className="text-[11px] text-slate-400 w-10 text-right">{formatDate(inv.receivedDate)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <p className="text-[11px] text-slate-400">
                {autoCleared} of {totalInvoices} invoices cleared automatically this month
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
