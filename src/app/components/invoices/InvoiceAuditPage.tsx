import React, { useState } from "react";
import { Link, useParams } from "react-router";
import {
  ChevronRight, RefreshCw, CheckCircle2, AlertCircle,
  AlertTriangle, ChevronDown, ChevronRight as ChevronRightSm,
  FileCheck, ArrowLeft, ChevronUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { invoices } from "../../data/mockData";
import { auditRuns, type AuditRun, type AuditOverallStatus } from "../../data/auditData";
import { exceptions } from "../../data/exceptionsData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (ts: string) =>
  new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const fmtDateTime = (ts: string) =>
  new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

const matchModeLabel: Record<string, string> = {
  THREE_WAY: "Three-way match",
  TWO_WAY:   "Two-way match",
  ONE_WAY:   "One-way match",
};

const precedenceLabel: Record<string, string> = {
  MOST_SPECIFIC: "Most Specific",
  FIRST_MATCH:   "First Match",
  HIGHEST_VERSION: "Highest Version",
};

// ─── Status display helpers ────────────────────────────────────────────────────

const statusConfig: Record<AuditOverallStatus, {
  label: string; icon: React.ElementType;
  pillCls: string; textCls: string; iconCls: string;
}> = {
  PASS: {
    label: "Pass",
    icon: CheckCircle2,
    pillCls: "bg-green-50 border-green-200 text-green-700",
    textCls: "text-green-700",
    iconCls: "text-green-600",
  },
  INCOMPLETE: {
    label: "Incomplete",
    icon: AlertTriangle,
    pillCls: "bg-amber-50 border-amber-200 text-amber-700",
    textCls: "text-amber-700",
    iconCls: "text-amber-500",
  },
  FAIL: {
    label: "Fail",
    icon: AlertCircle,
    pillCls: "bg-red-50 border-red-200 text-red-700",
    textCls: "text-red-700",
    iconCls: "text-red-600",
  },
};

function StatusPill({ status, size = "sm" }: { status: AuditOverallStatus; size?: "sm" | "md" }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 font-medium ${size === "md" ? "text-sm gap-1.5" : "text-xs gap-1"} ${cfg.pillCls}`}>
      {size === "md" && <cfg.icon size={13} className={cfg.iconCls} />}
      {cfg.label}
    </span>
  );
}

// ─── Previous Audits sidebar ──────────────────────────────────────────────────

function PreviousAudits({
  runs, selected, onSelect,
}: {
  runs: AuditRun[]; selected: string; onSelect: (id: string) => void;
}) {
  return (
    <aside className="w-52 shrink-0 border-r border-gray-100 bg-white overflow-y-auto flex flex-col gap-px pt-2 pb-4">
      <p className="px-4 pb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
        Previous Audits
      </p>
      {runs.map((run) => {
        const isActive = run.id === selected;
        const cfg = statusConfig[run.status];
        return (
          <button
            key={run.id}
            onClick={() => onSelect(run.id)}
            className={`relative mx-2 px-3 py-2.5 rounded-md text-left transition-colors ${
              isActive ? "bg-orange-50" : "hover:bg-gray-50"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-[#F06B00]" />
            )}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <StatusPill status={run.status} />
              <span className="text-[10px] text-gray-400 shrink-0">{fmtDate(run.startedAt)}</span>
            </div>
            <p className="text-xs text-gray-500 truncate">{run.triggeredBy}</p>
          </button>
        );
      })}
    </aside>
  );
}

// ─── Audit check row ──────────────────────────────────────────────────────────

function CheckRow({ label, status }: { label: string; status: AuditOverallStatus }) {
  const cfg = statusConfig[status];
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <StatusPill status={status} />
    </div>
  );
}

// ─── Summary panel ────────────────────────────────────────────────────────────

function SummaryPanel({ run }: { run: AuditRun }) {
  const cfg = statusConfig[run.status];
  const Icon = cfg.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
        <Icon size={18} className={cfg.iconCls} />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900">Audit Summary</h3>
            <StatusPill status={run.status} size="md" />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(run.startedAt)}</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Summary bullets */}
        <ul className="space-y-2">
          {run.summaryPoints.map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-gray-300 mt-1 shrink-0">·</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>

        {/* Audit checks — simple label + pill rows, not colored stat cards */}
        <div className="rounded-md bg-gray-50 border border-gray-100 px-4 py-3 space-y-2.5">
          <p className="text-xs font-medium text-gray-500 mb-1">Audit Checks</p>
          <CheckRow label="Non-rate checks" status={run.nonRateStatus} />
          <CheckRow label="Rate matching"   status={run.rateStatus} />
          <CheckRow label="Overall"         status={run.status} />
        </div>

        {/* Metadata — 4 items in a compact 2×2 grid */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Match Mode</dt>
            <dd className="text-sm text-gray-700">{matchModeLabel[run.matchMode] ?? run.matchMode}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Triggered By</dt>
            <dd className="text-sm text-gray-700">{run.triggeredBy}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Started</dt>
            <dd className="text-sm text-gray-700">{fmtDateTime(run.startedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Duration</dt>
            <dd className="text-sm text-gray-700">{(run.durationMs / 1000).toFixed(1)}s</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

// ─── Contract Matched panel ────────────────────────────────────────────────────

function ContractPanel({ run }: { run: AuditRun }) {
  const [showAll, setShowAll] = useState(false);
  const c = run.contract;
  const topRows = showAll ? c.topCandidates : c.topCandidates.slice(0, 3);

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
        <FileCheck size={15} className="text-gray-400" />
        <h3 className="text-sm font-medium text-gray-900">Contract Match</h3>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Matched contract details */}
        <div className="flex items-start gap-3">
          <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5 ${
            c.status === "MATCHED"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-500 border-gray-200"
          }`}>
            {c.status === "MATCHED" ? "Matched" : "Unmatched"}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-900">{c.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{c.scac}</p>
          </div>
        </div>

        {/* 2×2 detail grid */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Lane</dt>
            <dd className="text-sm font-mono text-gray-700">{c.lane}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Specificity Score</dt>
            <dd className="text-sm text-gray-700">{c.specificityScore}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Precedence</dt>
            <dd className="text-sm text-gray-700">{precedenceLabel[c.precedencePolicy] ?? c.precedencePolicy}</dd>
          </div>
        </dl>

        {/* Evaluated contracts — collapsed by default */}
        {c.topCandidates.length > 0 && (
          <div className="border-t border-gray-50 pt-4">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-3"
            >
              {showAll ? <ChevronDown size={12} /> : <ChevronRightSm size={12} />}
              <span>
                {c.evaluatedCount} contracts evaluated
                {!showAll && " — top candidates"}
              </span>
            </button>

            <div className="overflow-x-auto rounded-md border border-gray-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-3 py-2 text-gray-500 font-medium uppercase tracking-wide w-12">Score</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium uppercase tracking-wide">Contract</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium uppercase tracking-wide w-12">Ver.</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium uppercase tracking-wide">Lane</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topRows.map((r, i) => (
                    <tr key={i} className={`${i === 0 ? "bg-green-50/40" : "hover:bg-gray-50/40"}`}>
                      <td className={`px-3 py-2 font-medium ${i === 0 ? "text-green-700" : "text-gray-600"}`}>{r.score}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-xs truncate">{r.name}</td>
                      <td className="px-3 py-2 text-gray-400 font-mono">{r.version}</td>
                      <td className="px-3 py-2 text-gray-600 font-mono">{r.lane}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!showAll && c.evaluatedCount > 3 && (
              <button
                onClick={() => setShowAll(true)}
                className="text-xs text-[#F06B00] hover:underline mt-2"
              >
                View all {c.evaluatedCount} evaluated contracts →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Exception code badge ──────────────────────────────────────────────────────

const exCodeMeta: Record<string, { label: string; cls: string }> = {
  RATE_UNAVAILABLE:   { label: "Rate Unavailable",   cls: "bg-red-50 text-red-700 border-red-200" },
  CROSS_DOC_MISMATCH: { label: "Cross-Doc Mismatch", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  BUSINESS_RULE:      { label: "Business Rule",      cls: "bg-blue-50 text-blue-700 border-blue-200" },
  LANE_NOT_FOUND:     { label: "Lane Not Found",     cls: "bg-purple-50 text-purple-700 border-purple-200" },
  DUPLICATE_CHARGE:   { label: "Duplicate Charge",   cls: "bg-orange-50 text-orange-700 border-orange-200" },
};

function ExCodeBadge({ code }: { code: string }) {
  const meta = exCodeMeta[code] ?? { label: code, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

const usdSigned = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", signDisplay: "exceptZero",
  }).format(n);

// ─── Exceptions tab with expandable rows ──────────────────────────────────────

function ExceptionsTab({ invoiceRef }: { invoiceRef: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const invExceptions = exceptions.filter((e) => e.invoiceRef === invoiceRef);
  const open     = invExceptions.filter((e) => e.status === "OPEN");
  const resolved = invExceptions.filter((e) => e.status !== "OPEN");

  if (invExceptions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 px-5 py-10 text-center text-sm text-gray-400">
        No exceptions found for this invoice
      </div>
    );
  }

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const ExRow = ({ ex, isResolved }: { ex: typeof invExceptions[0]; isResolved: boolean }) => {
    const isExpanded = expandedId === ex.id;
    return (
      <>
        {/* Row */}
        <button
          onClick={() => toggle(ex.id)}
          className={`w-full text-left px-5 py-3 flex items-center justify-between gap-4 transition-colors ${
            isResolved ? "opacity-50" : ""
          } ${isExpanded ? "bg-gray-50/60" : "hover:bg-gray-50/40"}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <ExCodeBadge code={ex.code} />
            <p className="text-sm text-gray-700 truncate">{ex.description}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {ex.variance !== null && (
              <span className={`text-xs font-medium ${ex.variance > 0 ? "text-red-600" : "text-green-600"}`}>
                {usdSigned(ex.variance)}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp size={13} className="text-gray-400" />
            ) : (
              <ChevronDown size={13} className="text-gray-400" />
            )}
          </div>
        </button>

        {/* Expanded detail panel */}
        {isExpanded && (
          <div className="border-t border-gray-50 bg-gray-50/30 px-5 py-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Description</p>
                <p className="text-sm text-gray-700">{ex.description}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Charge Code</p>
                <p className="text-sm font-mono text-gray-700">{ex.chargeCode}</p>
              </div>
              {ex.variance !== null && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Variance</p>
                  <p className={`text-sm font-medium ${ex.variance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {usdSigned(ex.variance)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Detected</p>
                <p className="text-sm text-gray-700">{ex.date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${
                  ex.status === "OPEN"     ? "bg-red-50 text-red-700 border-red-200" :
                  ex.status === "RESOLVED" ? "bg-green-50 text-green-700 border-green-200" :
                  ex.status === "DISPUTED" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  {ex.status.charAt(0) + ex.status.slice(1).toLowerCase()}
                </span>
              </div>
              {ex.resolvedBy && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Resolved By</p>
                  <p className="text-sm text-gray-700">{ex.resolvedBy}</p>
                </div>
              )}
            </div>

            {/* Actions — only for open exceptions */}
            {!isResolved && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Button variant="ghost" size="sm" className="h-7 px-3 text-xs text-gray-500 hover:text-gray-800">
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50"
                >
                  Dispute
                </Button>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-3">
      {open.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/60 flex items-center gap-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Open</h3>
            <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600">
              {open.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {open.map((ex) => <ExRow key={ex.id} ex={ex} isResolved={false} />)}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/60">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resolved</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {resolved.map((ex) => <ExRow key={ex.id} ex={ex} isResolved={true} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type AuditTab = "checks" | "exceptions" | "disputes";

export default function InvoiceAuditPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [tab, setTab]           = useState<AuditTab>("checks");
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  const invoice = invoices.find((i) => i.id === invoiceId);
  const runs = auditRuns.filter((r) => r.invoiceId === invoiceId);
  const activeRunId = selectedRun ?? runs[0]?.id;
  const activeRun = runs.find((r) => r.id === activeRunId) ?? runs[0];

  if (!invoice || !activeRun) {
    return (
      <div className="p-8 text-center text-sm text-gray-400">
        No audit data found for this invoice.
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Link to="/invoices" className="hover:text-gray-600 transition-colors">Invoice Audit</Link>
          <ChevronRight size={12} />
          <Link to={`/invoices/${invoice.id}`} className="hover:text-gray-600 transition-colors">
            {invoice.ref}
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-600">Audit</span>
        </nav>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={`/invoices/${invoice.id}`}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={14} />
            </Link>
            <div>
              <h1 className="text-gray-900">Audit · {invoice.ref}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {runs.length} audit run{runs.length !== 1 ? "s" : ""} · last on {fmtDate(runs[0].startedAt)}
              </p>
            </div>
          </div>
          {/* Re-run is a secondary action — outline, not primary fill */}
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCw size={13} />
            Re-run Audit
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center -mb-4 mt-4">
          {([
            { id: "checks",     label: "Checks & Details" },
            { id: "exceptions", label: "Exceptions" },
            { id: "disputes",   label: "Disputes" },
          ] as { id: AuditTab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
                tab === t.id
                  ? "border-[#F06B00] text-[#F06B00] font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Previous audits sidebar — only on Checks tab */}
        {tab === "checks" && (
          <PreviousAudits
            runs={runs}
            selected={activeRunId}
            onSelect={setSelectedRun}
          />
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "checks" && (
            <div className="space-y-4 max-w-2xl">
              <SummaryPanel run={activeRun} />
              <ContractPanel run={activeRun} />
            </div>
          )}

          {tab === "exceptions" && (
            <div className="max-w-2xl">
              <ExceptionsTab invoiceRef={invoice.ref} />
            </div>
          )}

          {tab === "disputes" && (
            <div className="bg-white rounded-lg border border-gray-100 px-5 py-10 text-center text-sm text-gray-400 max-w-2xl">
              No disputes raised for this invoice
            </div>
          )}
        </div>
      </div>
    </div>
  );
}