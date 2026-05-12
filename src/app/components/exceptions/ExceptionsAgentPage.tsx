import React, { useState, useMemo, useCallback } from "react";
import { Link } from "react-router";
import {
  Bot, Sparkles, X, CheckSquare, Loader2, Search, Settings,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  exceptions,
  type AuditException,
  type ExceptionCode,
  type ExceptionStatus,
} from "../../data/exceptionsData";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEMO_TODAY = new Date("2026-05-11");

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", signDisplay: "exceptZero" }).format(n);

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysAgo(d: string) {
  return Math.floor((DEMO_TODAY.getTime() - new Date(d).getTime()) / 86_400_000);
}

const CODE_META: Record<ExceptionCode, { label: string; badgeCls: string }> = {
  RATE_UNAVAILABLE:   { label: "Rate Unavailable",   badgeCls: "bg-red-50 text-red-700 border-red-200"          },
  CROSS_DOC_MISMATCH: { label: "Cross-Doc Mismatch", badgeCls: "bg-amber-50 text-amber-700 border-amber-200"    },
  BUSINESS_RULE:      { label: "Business Rule",      badgeCls: "bg-blue-50 text-blue-700 border-blue-200"       },
  LANE_NOT_FOUND:     { label: "Lane Not Found",     badgeCls: "bg-purple-50 text-purple-700 border-purple-200" },
  DUPLICATE_CHARGE:   { label: "Duplicate Charge",   badgeCls: "bg-orange-50 text-orange-700 border-orange-200" },
};

const STATUS_CLS: Record<ExceptionStatus, string> = {
  OPEN:     "bg-red-50 text-red-700 border-red-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  ACCEPTED: "bg-slate-100 text-slate-600 border-slate-200",
  DISPUTED: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_DOT: Record<ExceptionStatus, string> = {
  OPEN:     "bg-red-600",
  RESOLVED: "bg-green-600",
  ACCEPTED: "bg-slate-400",
  DISPUTED: "bg-amber-600",
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type ColumnId =
  | "invoice" | "vendor" | "type" | "chargeCode" | "description"
  | "status" | "variance" | "billedAmount" | "contractedAmount"
  | "date" | "shipmentDate" | "daysInQueue" | "scac";

const COLUMN_LABELS: Record<ColumnId, string> = {
  invoice:          "Invoice",
  vendor:           "Vendor",
  type:             "Type",
  chargeCode:       "Charge Code",
  description:      "Description",
  status:           "Status",
  variance:         "Variance",
  billedAmount:     "Billed",
  contractedAmount: "Contracted",
  date:             "Invoice Date",
  shipmentDate:     "Ship Date",
  daysInQueue:      "Age",
  scac:             "SCAC",
};

type SortDir = "asc" | "desc";
type SortableCol =
  | "vendor" | "variance" | "billedAmount" | "contractedAmount"
  | "date" | "shipmentDate" | "daysInQueue";

interface ViewSort { col: SortableCol; dir: SortDir; }

const SORTABLE_MAP: Partial<Record<ColumnId, SortableCol>> = {
  vendor: "vendor", variance: "variance", billedAmount: "billedAmount",
  contractedAmount: "contractedAmount", date: "date",
  shipmentDate: "shipmentDate", daysInQueue: "daysInQueue",
};

interface AgentBucket {
  id: string;
  name: string;
  description: string;
  filter: (ex: AuditException) => boolean;
  columns: ColumnId[];
  dotCls: string;
  isDefault?: boolean;
  provenance?: "agent" | "user";
}

// ─── Agent buckets ─────────────────────────────────────────────────────────────

const INITIAL_BUCKETS: AgentBucket[] = [
  {
    id: "all",
    name: "All exceptions",
    description: "",
    filter: () => true,
    columns: ["invoice", "vendor", "type", "description", "status", "variance", "date"],
    dotCls: "bg-slate-400",
    isDefault: true,
  },
  {
    id: "fuel-anomalies",
    name: "Fuel surcharge anomalies",
    description: "Fuel and energy surcharge charges billed inconsistently across carriers. The pattern is consistent across FedEx and CEVA — suggesting a systematic error in carrier billing systems rather than isolated mistakes.",
    filter: (ex) => ["FSC", "ENS"].includes(ex.chargeCode),
    columns: ["invoice", "vendor", "scac", "chargeCode", "billedAmount", "contractedAmount", "status", "variance"],
    dotCls: "bg-amber-500",
    provenance: "agent",
  },
  {
    id: "aging-open",
    name: "Aging unresolved flags",
    description: "Exceptions on shipments older than 45 days that remain open. Most carriers close their dispute window at 90 days — items in this bucket are at increasing risk of becoming uncollectable.",
    filter: (ex) => daysAgo(ex.shipmentDate) > 45 && ex.status === "OPEN",
    columns: ["invoice", "vendor", "shipmentDate", "daysInQueue", "billedAmount", "status", "variance"],
    dotCls: "bg-red-500",
    provenance: "agent",
  },
  {
    id: "rate-mismatch",
    name: "Rate card mismatches",
    description: "Charges where the billed rate doesn't align with any active contract lane. Carrier may be using an expired rate card, or the lane isn't covered in the current agreement.",
    filter: (ex) => ["RATE_UNAVAILABLE", "LANE_NOT_FOUND"].includes(ex.code),
    columns: ["invoice", "vendor", "scac", "type", "billedAmount", "contractedAmount", "status", "variance"],
    dotCls: "bg-violet-500",
    provenance: "agent",
  },
  {
    id: "duplicate-charges",
    name: "Duplicate charge patterns",
    description: "Multiple line items for the same charge code on the same shipment. Low individual value but high aggregate recovery potential — a single billing system fix upstream could prevent recurrence.",
    filter: (ex) => ex.code === "DUPLICATE_CHARGE",
    columns: ["invoice", "vendor", "chargeCode", "billedAmount", "contractedAmount", "status", "variance"],
    dotCls: "bg-blue-500",
    provenance: "agent",
  },
];

// ─── NL bucket creator ─────────────────────────────────────────────────────────

function createBucketFromNL(query: string): AgentBucket {
  const q    = query.toLowerCase();
  const id   = `user-${Date.now()}`;
  const base = { id, provenance: "user" as const, dotCls: "bg-primary" };

  if (q.includes("fedex") || q.includes("fxfe")) return {
    ...base,
    name: "FedEx exceptions",
    description: `All exceptions from FedEx Freight, isolated for carrier-level review. Useful before opening a vendor conversation.`,
    filter: (ex) => ex.vendor === "FedEx Freight",
    columns: ["invoice", "scac", "chargeCode", "billedAmount", "contractedAmount", "status", "variance"],
  };

  if (q.includes("averitt") || q.includes("avrt")) return {
    ...base,
    name: "Averitt exceptions",
    description: `All exceptions from Averitt Express. Grouped for carrier-level reconciliation.`,
    filter: (ex) => ex.vendor === "Averitt Express",
    columns: ["invoice", "scac", "type", "billedAmount", "contractedAmount", "status", "variance"],
  };

  if (q.includes("ceva")) return {
    ...base,
    name: "CEVA exceptions",
    description: `All exceptions from CEVA Logistics in this batch.`,
    filter: (ex) => ex.vendor.includes("CEVA"),
    columns: ["invoice", "scac", "chargeCode", "billedAmount", "contractedAmount", "status", "variance"],
  };

  if (q.includes("high") || q.includes("large") || q.includes("over")) return {
    ...base,
    name: "High variance outliers",
    description: `Exceptions where billed amount exceeds contracted rate by more than $100. Highest-value recovery opportunities in this batch.`,
    filter: (ex) => (ex.variance ?? 0) > 100,
    columns: ["invoice", "vendor", "type", "billedAmount", "contractedAmount", "status", "variance"],
  };

  if (q.includes("business rule") || q.includes("rule")) return {
    ...base,
    name: "Business rule violations",
    description: `Exceptions flagged for business rule violations. These typically require manual policy review before accepting or disputing.`,
    filter: (ex) => ex.code === "BUSINESS_RULE",
    columns: ["invoice", "vendor", "type", "description", "status", "variance"],
  };

  if (q.includes("cross") || q.includes("mismatch") || q.includes("doc")) return {
    ...base,
    name: "Cross-doc mismatches",
    description: `Charges that don't reconcile across invoice, BOL, and rate card documents. Likely data entry or EDI mapping issues.`,
    filter: (ex) => ex.code === "CROSS_DOC_MISMATCH",
    columns: ["invoice", "vendor", "scac", "billedAmount", "contractedAmount", "status", "variance"],
  };

  return {
    ...base,
    name: query.length > 32 ? query.slice(0, 32) + "…" : query,
    description: `Custom pattern from your query: "${query}". Showing open exceptions with positive variance as a starting point.`,
    filter: (ex) => ex.status === "OPEN" && (ex.variance ?? 0) > 0,
    columns: ["invoice", "vendor", "type", "billedAmount", "contractedAmount", "status", "variance"],
  };
}

// ─── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ExceptionStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium ${STATUS_CLS[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Sort indicator ────────────────────────────────────────────────────────────

function SortIndicator({ col, sort, hovered }: { col: SortableCol; sort: ViewSort | null; hovered: boolean }) {
  if (sort?.col === col) return <span className="ml-1 text-[10px] text-primary">{sort.dir === "asc" ? "↑" : "↓"}</span>;
  if (hovered) return <span className="ml-1 text-[10px] text-slate-300">↕</span>;
  return null;
}

// ─── Exception table ───────────────────────────────────────────────────────────

function ExceptionTable({ rows, columns, selectedIds, onToggle, onToggleAll, analyzingId, onAnalyze, sort, onSort }: {
  rows: AuditException[];
  columns: ColumnId[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  analyzingId: string | null;
  onAnalyze: (id: string) => void;
  sort: ViewSort | null;
  onSort: (col: SortableCol) => void;
}) {
  const [hoveredSort, setHoveredSort] = useState<SortableCol | null>(null);

  if (rows.length === 0) {
    return (
      <div className="px-5 py-14 text-center">
        <p className="text-sm text-slate-400">No exceptions match in this bucket</p>
      </div>
    );
  }

  const rowIds      = rows.map((r) => r.id);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.has(id));
  const someSelected = rowIds.some((id) => selectedIds.has(id));

  const renderTh = (col: ColumnId) => {
    const sortCol  = SORTABLE_MAP[col];
    const label    = COLUMN_LABELS[col];
    const isRight  = ["variance", "billedAmount", "contractedAmount"].includes(col);
    const baseCls  = `px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap ${isRight ? "text-right" : "text-left"}`;

    if (sortCol) {
      return (
        <th key={col} className={`${baseCls} cursor-pointer select-none hover:bg-slate-100/60 transition-colors`}
          onClick={() => onSort(sortCol)}
          onMouseEnter={() => setHoveredSort(sortCol)}
          onMouseLeave={() => setHoveredSort(null)}
        >
          {label}
          <SortIndicator col={sortCol} sort={sort} hovered={hoveredSort === sortCol} />
        </th>
      );
    }
    return <th key={col} className={baseCls}>{label}</th>;
  };

  const renderCell = (ex: AuditException, col: ColumnId) => {
    switch (col) {
      case "invoice":
        return <td key={col} className="px-3 py-3"><span className="text-sm text-slate-800">{ex.invoiceRef}</span></td>;
      case "vendor":
        return <td key={col} className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{ex.vendor}</td>;
      case "type": {
        const m = CODE_META[ex.code];
        return <td key={col} className="px-3 py-3"><span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${m.badgeCls}`}>{m.label}</span></td>;
      }
      case "chargeCode":
        return <td key={col} className="px-3 py-3"><span className="font-mono text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{ex.chargeCode}</span></td>;
      case "scac":
        return <td key={col} className="px-3 py-3"><span className="font-mono text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{ex.vendorScac}</span></td>;
      case "description":
        return <td key={col} className="px-3 py-3 max-w-xs"><p className="text-sm text-slate-700 truncate">{ex.description}</p></td>;
      case "status":
        return <td key={col} className="px-3 py-3"><StatusPill status={ex.status} /></td>;
      case "variance":
        return (
          <td key={col} className="px-3 py-3 text-right text-sm font-medium">
            {ex.variance !== null
              ? <span className={ex.variance > 0 ? "text-red-600" : "text-green-600"}>{usd(ex.variance)}</span>
              : <span className="text-slate-300">—</span>}
          </td>
        );
      case "billedAmount":
        return (
          <td key={col} className="px-3 py-3 text-right text-sm text-slate-700">
            {ex.billedAmount !== null ? usd(ex.billedAmount as number) : <span className="text-slate-300">—</span>}
          </td>
        );
      case "contractedAmount":
        return (
          <td key={col} className="px-3 py-3 text-right text-sm text-slate-700">
            {ex.contractedAmount !== null ? usd(ex.contractedAmount as number) : <span className="text-slate-300">—</span>}
          </td>
        );
      case "date":
        return <td key={col} className="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{fmtDate(ex.date)}</td>;
      case "shipmentDate":
        return <td key={col} className="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{fmtDate(ex.shipmentDate)}</td>;
      case "daysInQueue": {
        const days = daysAgo(ex.shipmentDate);
        const cls  = days > 60 ? "bg-red-50 text-red-700 border-red-200"
                   : days > 30 ? "bg-amber-50 text-amber-700 border-amber-200"
                   : "bg-slate-100 text-slate-600 border-slate-200";
        return (
          <td key={col} className="px-3 py-3">
            <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${cls}`}>{days}d</span>
          </td>
        );
      }
      default:
        return <td key={col} className="px-3 py-3 text-sm text-slate-300">—</td>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-muted">
            <th className="w-10 px-4 py-2.5">
              <input type="checkbox" checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                onChange={() => onToggleAll(rowIds)}
                className="rounded border-slate-300 text-primary focus:ring-ring/20 cursor-pointer" />
            </th>
            {columns.map(renderTh)}
            <th className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((ex) => {
            const checked     = selectedIds.has(ex.id);
            const isAnalyzing = analyzingId === ex.id;
            return (
              <tr key={ex.id}
                onClick={() => onAnalyze(ex.id)}
                className={`cursor-pointer transition-colors ${
                  isAnalyzing ? "bg-orange-50/70"
                  : checked   ? "bg-orange-50 hover:bg-orange-100/60"
                  : "hover:bg-orange-50/50"
                }`}
              >
                <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={checked} onChange={() => onToggle(ex.id)}
                    className="rounded border-slate-300 text-primary focus:ring-ring/20 cursor-pointer" />
                </td>
                {columns.map((col) => renderCell(ex, col))}
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800">Accept</Button>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50">Dispute</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Root cause drawer ─────────────────────────────────────────────────────────

function RootCauseDrawer({ ex, onClose }: { ex: AuditException; onClose: () => void }) {
  const trace  = ex.rateTrace ?? null;
  const meta   = CODE_META[ex.code];
  const days   = daysAgo(ex.shipmentDate);
  const overPct =
    ex.variance !== null && ex.contractedAmount !== null && ex.contractedAmount > 0
      ? ((ex.variance / ex.contractedAmount) * 100).toFixed(1)
      : null;

  return (
    <div className="w-[480px] shrink-0 border-l border-slate-200 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${meta.badgeCls}`}>{meta.label}</span>
              <StatusPill status={ex.status} />
            </div>
            <p className="font-mono text-sm font-semibold text-slate-900">{ex.invoiceRef}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{ex.vendor} · {ex.chargeCode} charge</p>
          </div>
          <button onClick={onClose} className="shrink-0 mt-0.5 p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Financials */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="grid grid-cols-3 gap-4">
            {([
              ["Billed",     ex.billedAmount,     "text-slate-900"],
              ["Contracted", ex.contractedAmount, "text-slate-900"],
              ["Variance",   ex.variance,         "text-red-600"  ],
            ] as [string, number | null, string][]).map(([label, value, cls]) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                <p className={`text-base font-semibold ${cls}`}>
                  {value !== null ? usd(value) : <span className="text-slate-300">—</span>}
                </p>
              </div>
            ))}
          </div>
          {overPct && <p className="text-[11px] text-red-500 mt-2">{overPct}% above contracted rate</p>}
        </div>

        {/* Shipment details */}
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">① Shipment Details</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            {([
              ["Shipment date", fmtDate(ex.shipmentDate)],
              ["Invoice date",  fmtDate(ex.date)],
              ...(trace ? [
                ["Origin",      trace.origin],
                ["Destination", trace.destination],
                ["Service",     trace.serviceType],
                ["Weight",      `${trace.shipmentWeight.toLocaleString()} ${trace.weightUnit}`],
              ] : []),
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] text-slate-400 mb-0.5">{label}</dt>
                <dd className="text-sm font-medium text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>
          <div className={`mt-4 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border ${
            days > 60 ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"
          }`}>
            {days > 60 && <span className="text-red-500">⚠</span>}
            {days} days in queue · shipped {fmtDate(ex.shipmentDate)}
          </div>
        </div>

        {/* No trace fallback */}
        {!trace && (
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Exception Detail</p>
            <p className="text-sm text-slate-700 leading-relaxed">{ex.description}</p>
            <p className="mt-3 text-[11px] text-slate-400 italic">No rate trace available for this exception type.</p>
          </div>
        )}

        {/* Rate card lookup */}
        {trace && (
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">② Rate Card Lookup</p>
            <p className="text-[11px] text-slate-500 mb-3">{ex.vendor} LTL · Feb 1 – Jun 30, 2026</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-2 text-[10px] font-medium text-slate-400 uppercase tracking-wide">Class</th>
                  <th className="text-right pb-2 text-[10px] font-medium text-slate-400 uppercase tracking-wide">Rate / CWT</th>
                  <th className="pb-2 w-24" />
                </tr>
              </thead>
              <tbody>
                {trace.rateSlabs.map((slab) => (
                  <tr key={slab.label} className={
                    slab.flag === "applied" ? "bg-red-50/70" : slab.flag === "contracted" ? "bg-green-50/70" : ""
                  }>
                    <td className={`py-1.5 pr-3 font-medium ${slab.flag === "applied" ? "text-red-700" : slab.flag === "contracted" ? "text-green-700" : "text-slate-600"}`}>{slab.label}</td>
                    <td className={`py-1.5 text-right tabular-nums ${slab.flag === "applied" ? "text-red-700 font-semibold" : slab.flag === "contracted" ? "text-green-700 font-semibold" : "text-slate-500"}`}>{slab.rateLabel}</td>
                    <td className="py-1.5 pl-3 text-[10px] whitespace-nowrap">
                      {slab.flag === "applied"    && <span className="text-red-500 font-medium">← applied</span>}
                      {slab.flag === "contracted" && <span className="text-green-600 font-medium">← contracted</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 shrink-0" /><span className="text-slate-500">{trace.appliedWeightClass} applied</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 shrink-0" /><span className="text-slate-500">{trace.correctWeightClass} contracted</span></span>
            </div>
          </div>
        )}

        {/* Calculation trace */}
        {trace && (
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">③ Calculation Trace</p>
            <div className="space-y-2">
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-1.5">Applied (Billed)</p>
                <p className="text-sm text-slate-600 mb-1.5">{trace.appliedRateCalc}</p>
                <p className="text-xl font-bold text-red-600">{usd(trace.appliedTotal)}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-1.5">Contracted (Expected)</p>
                <p className="text-xs text-slate-600 mb-1.5">{trace.contractedRateCalc}</p>
                <p className="text-xl font-bold text-green-700">{usd(trace.contractedTotal)}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                <span className="text-xs font-medium text-slate-500">Variance</span>
                <span className="text-sm font-bold text-red-600">{usd(trace.appliedTotal - trace.contractedTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Mismatch reason */}
        {trace && (
          <div className="px-5 py-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">⚠ Mismatch Reason</p>
              <p className="text-sm text-amber-900 leading-relaxed">{trace.mismatchReason}</p>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 px-5 py-3 flex items-center gap-2 bg-white">
        <Button variant="ghost" size="sm" className="h-8 text-slate-600 hover:text-slate-900">Accept</Button>
        <Button variant="outline" size="sm" className="h-8 ml-auto border-red-200 text-red-600 hover:bg-red-50">Raise Dispute</Button>
      </div>
    </div>
  );
}

// ─── Bucket card ───────────────────────────────────────────────────────────────

function BucketCard({ bucket, count, totalVariance, isActive, onSelect, onDismiss }: {
  bucket: AgentBucket;
  count: number;
  totalVariance: number;
  isActive: boolean;
  onSelect: () => void;
  onDismiss?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative w-full text-left px-3 py-2.5 rounded-md transition-colors border-l-2 ${
        isActive
          ? "bg-orange-50 border-primary"
          : "border-transparent hover:bg-orange-50/40"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 mt-[5px] ${bucket.dotCls}`} />
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center justify-between gap-1">
            <p className={`text-xs font-medium leading-snug truncate ${isActive ? "text-primary" : "text-slate-800"}`}>
              {bucket.name}
            </p>
            <span className={`shrink-0 text-xs font-medium tabular-nums ${isActive ? "text-primary" : "text-slate-400"}`}>
              {count}
            </span>
          </div>
          {bucket.description && (
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
              {bucket.description}
            </p>
          )}
          {count > 0 && totalVariance > 0 && (
            <p className="text-[10px] mt-1 font-medium text-red-500">
              {usd(totalVariance)} variance
            </p>
          )}
        </div>
      </div>

      {!bucket.isDefault && onDismiss && hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="absolute top-2 right-2 p-0.5 rounded text-slate-300 hover:text-red-500 transition-colors"
          aria-label={`Remove ${bucket.name}`}
        >
          <X size={11} />
        </button>
      )}
    </button>
  );
}

// ─── NL discovery input ────────────────────────────────────────────────────────

function NLDiscoveryInput({ onDiscover }: { onDiscover: (query: string) => void }) {
  const [query, setQuery]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    const t = query.trim();
    if (!t || loading) return;
    setLoading(true);
    setTimeout(() => {
      onDiscover(t);
      setQuery("");
      setLoading(false);
    }, 700);
  };

  return (
    <div className="shrink-0 px-3 py-3 border-t border-slate-200">
      <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-all bg-slate-50/50 ${
        loading ? "border-ring/40" : "border-slate-200 focus-within:border-ring focus-within:shadow-[0_0_0_2px_rgba(254,99,1,0.08)]"
      }`}>
        {loading
          ? <Loader2 size={12} className="shrink-0 text-primary animate-spin" />
          : <Sparkles size={12} className="shrink-0 text-slate-300" />
        }
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder="Find a new pattern…"
          disabled={loading}
          className="flex-1 min-w-0 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
        />
        {query.trim() && !loading && (
          <kbd className="shrink-0 text-[9px] text-slate-400 bg-white border border-slate-200 rounded px-1 font-sans">↵</kbd>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 px-0.5">e.g. "FedEx exceptions" or "high variance"</p>
    </div>
  );
}

// ─── Agent panel ───────────────────────────────────────────────────────────────

function AgentPanel({ buckets, activeBucketId, onSelect, onDismiss, onDiscover }: {
  buckets: AgentBucket[];
  activeBucketId: string;
  onSelect: (id: string) => void;
  onDismiss: (id: string) => void;
  onDiscover: (query: string) => void;
}) {
  const agentCount = buckets.filter((b) => !b.isDefault).length;

  return (
    <aside className="w-[272px] shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
            <Bot size={11} className="text-primary" />
          </div>
          <span className="text-sm font-medium text-slate-800">Agent Findings</span>
          <span className="ml-auto text-[11px] text-slate-400 font-medium tabular-nums">{agentCount} buckets</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Patterns surfaced from this invoice batch
        </p>
      </div>

      {/* Bucket list */}
      <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
        {buckets.map((bucket) => {
          const rows  = exceptions.filter(bucket.filter);
          const total = rows.reduce((s, e) => s + (e.variance ?? 0), 0);
          return (
            <BucketCard
              key={bucket.id}
              bucket={bucket}
              count={rows.length}
              totalVariance={total}
              isActive={bucket.id === activeBucketId}
              onSelect={() => onSelect(bucket.id)}
              onDismiss={!bucket.isDefault ? () => onDismiss(bucket.id) : undefined}
            />
          );
        })}
      </div>

      {/* Discovery input */}
      <NLDiscoveryInput onDiscover={onDiscover} />
    </aside>
  );
}

// ─── Bucket context banner ─────────────────────────────────────────────────────

function BucketBanner({ bucket, rows }: { bucket: AgentBucket; rows: AuditException[] }) {
  if (bucket.isDefault) return null;

  const openCount    = rows.filter((r) => r.status === "OPEN").length;
  const totalVariance = rows.reduce((s, e) => s + (e.variance ?? 0), 0);

  return (
    <div className="shrink-0 px-5 py-3 border-b border-slate-200 bg-slate-50/60">
      <div className="flex items-start gap-2.5">
        <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-px">
          <Bot size={11} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 leading-relaxed">{bucket.description}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-slate-400">{rows.length} exception{rows.length !== 1 ? "s" : ""}</span>
            {openCount > 0 && <span className="text-xs text-red-500 font-medium">{openCount} open</span>}
            {totalVariance > 0 && (
              <span className="text-xs font-medium text-red-600">{usd(totalVariance)} total variance</span>
            )}
            {bucket.provenance === "user" && (
              <span className="text-[10px] text-slate-500 bg-slate-200 rounded px-1.5 py-0.5 font-medium">Your query</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk action bar ───────────────────────────────────────────────────────────

function BulkActionBar({ count, onAccept, onDispute, onClear }: {
  count: number; onAccept: () => void; onDispute: () => void; onClear: () => void;
}) {
  return (
    <div className="flex justify-center sticky bottom-6 z-20 pointer-events-none shrink-0">
      <div className="pointer-events-auto flex items-center gap-3 bg-[#1C1C1A] rounded-lg shadow-lg px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80">
          <CheckSquare size={15} className="text-orange-400" />
          {count} exception{count !== 1 ? "s" : ""} selected
        </span>
        <div className="h-4 w-px bg-white/20 mx-1" />
        <button onClick={onAccept} className="text-sm font-medium text-white/70 hover:text-white px-3 py-1.5 rounded hover:bg-white/10 transition-colors">
          Accept selected
        </button>
        <button onClick={onDispute} className="text-sm font-medium text-white border border-white/20 px-3 py-1.5 rounded hover:bg-red-600/70 hover:border-red-500/50 transition-colors">
          Dispute selected
        </button>
        <button onClick={onClear} className="ml-2 flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
          <X size={13} /> Clear
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ExceptionsAgentPage() {
  const [buckets, setBuckets]           = useState<AgentBucket[]>(INITIAL_BUCKETS);
  const [activeBucketId, setActiveBucketId] = useState("all");
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [analyzingId, setAnalyzingId]   = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [sort, setSort]                 = useState<ViewSort | null>(null);

  const activeBucket = useMemo(
    () => buckets.find((b) => b.id === activeBucketId) ?? buckets[0],
    [buckets, activeBucketId],
  );

  const bucketRows = useMemo(
    () => exceptions.filter(activeBucket.filter),
    [activeBucket],
  );

  const filteredRows = useMemo(() => {
    let rows = bucketRows;

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((e) =>
        e.invoiceRef.toLowerCase().includes(q) ||
        e.vendor.toLowerCase().includes(q) ||
        e.chargeCode.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q),
      );
    }

    if (sort) {
      rows = [...rows].sort((a, b) => {
        let va: string | number, vb: string | number;
        switch (sort.col) {
          case "vendor":           va = a.vendor;                      vb = b.vendor;                      break;
          case "variance":         va = a.variance          ?? -Infinity; vb = b.variance          ?? -Infinity; break;
          case "billedAmount":     va = (a.billedAmount as number)    ?? -Infinity; vb = (b.billedAmount as number)    ?? -Infinity; break;
          case "contractedAmount": va = (a.contractedAmount as number) ?? -Infinity; vb = (b.contractedAmount as number) ?? -Infinity; break;
          case "date":             va = a.date;                        vb = b.date;                        break;
          case "shipmentDate":     va = a.shipmentDate;                vb = b.shipmentDate;                break;
          case "daysInQueue":      va = daysAgo(a.shipmentDate);       vb = daysAgo(b.shipmentDate);       break;
          default: return 0;
        }
        if (va < vb) return sort.dir === "asc" ? -1 : 1;
        if (va > vb) return sort.dir === "asc" ?  1 : -1;
        return 0;
      });
    }

    return rows;
  }, [bucketRows, search, sort]);

  const analyzingException = useMemo(
    () => exceptions.find((e) => e.id === analyzingId) ?? null,
    [analyzingId],
  );

  const handleSort = useCallback((col: SortableCol) => {
    setSort((prev) =>
      !prev || prev.col !== col ? { col, dir: "asc" }
      : prev.dir === "asc"     ? { col, dir: "desc" }
      : null,
    );
  }, []);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  const handleToggleAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allIn = ids.every((id) => prev.has(id));
      const next  = new Set(prev);
      if (allIn) ids.forEach((id) => next.delete(id));
      else       ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleAnalyze = useCallback((id: string) => {
    setAnalyzingId((prev) => (prev === id ? null : id));
  }, []);

  const handleSelectBucket = useCallback((id: string) => {
    setActiveBucketId(id);
    setSelectedIds(new Set());
    setAnalyzingId(null);
    setSearch("");
    setSort(null);
  }, []);

  const handleDismissBucket = useCallback((id: string) => {
    setBuckets((prev) => prev.filter((b) => b.id !== id));
    if (activeBucketId === id) handleSelectBucket("all");
  }, [activeBucketId, handleSelectBucket]);

  const handleDiscover = useCallback((query: string) => {
    const newBucket = createBucketFromNL(query);
    setBuckets((prev) => [...prev, newBucket]);
    handleSelectBucket(newBucket.id);
  }, [handleSelectBucket]);

  const openTotal = exceptions.filter((e) => e.status === "OPEN").length;

  return (
    <div className="min-h-full flex flex-col">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-slate-950">Exceptions</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {openTotal} open · agent-categorized
            </p>
          </div>
          <Link to="/agents/audit-agent">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings size={13} />
              Configure Audit Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* Body: panel + table area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: agent findings panel */}
        <AgentPanel
          buckets={buckets}
          activeBucketId={activeBucketId}
          onSelect={handleSelectBucket}
          onDismiss={handleDismissBucket}
          onDiscover={handleDiscover}
        />

        {/* Right: table area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Bucket context banner */}
          <BucketBanner bucket={activeBucket} rows={bucketRows} />

          {/* Search toolbar */}
          <div className="shrink-0 bg-white border-b border-slate-200 px-5 py-2.5 flex items-center gap-3">
            <div className="relative flex items-center flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search within bucket…"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 bg-slate-50/50 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-ring focus:shadow-[0_0_0_2px_rgba(254,99,1,0.1)] transition-all"
              />
            </div>
            {search && (
              <button onClick={() => setSearch("")} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <X size={12} /> Clear
              </button>
            )}
            <p className="ml-auto text-xs text-slate-400 tabular-nums">
              {filteredRows.length} of {bucketRows.length} exception{bucketRows.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Table + optional drawer */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto">
              <div className="bg-white rounded-none">
                <ExceptionTable
                  rows={filteredRows}
                  columns={activeBucket.columns}
                  selectedIds={selectedIds}
                  onToggle={handleToggle}
                  onToggleAll={handleToggleAll}
                  analyzingId={analyzingId}
                  onAnalyze={handleAnalyze}
                  sort={sort}
                  onSort={handleSort}
                />
              </div>
              <div className={selectedIds.size > 0 ? "h-20" : "h-5"} />
            </div>

            {/* Root cause drawer */}
            {analyzingException && (
              <RootCauseDrawer
                ex={analyzingException}
                onClose={() => setAnalyzingId(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onAccept={clearSelection}
          onDispute={clearSelection}
          onClear={clearSelection}
        />
      )}
    </div>
  );
}
