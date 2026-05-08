import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  Settings, ChevronDown, ChevronRight, X, CheckSquare,
  Sparkles, SlidersHorizontal, Loader2, Eye,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  exceptions,
  type AuditException,
  type ExceptionCode,
  type ExceptionStatus,
} from "../../data/exceptionsData";

// ─── Display constants ─────────────────────────────────────────────────────────

const CODE_META: Record<ExceptionCode, { label: string; badgeCls: string; dotCls: string }> = {
  RATE_UNAVAILABLE:   { label: "Rate Unavailable",   badgeCls: "bg-red-50 text-red-700 border-red-200",          dotCls: "bg-red-400"    },
  CROSS_DOC_MISMATCH: { label: "Cross-Doc Mismatch", badgeCls: "bg-amber-50 text-amber-700 border-amber-200",    dotCls: "bg-amber-400"  },
  BUSINESS_RULE:      { label: "Business Rule",      badgeCls: "bg-blue-50 text-blue-700 border-blue-200",       dotCls: "bg-blue-400"   },
  LANE_NOT_FOUND:     { label: "Lane Not Found",     badgeCls: "bg-purple-50 text-purple-700 border-purple-200", dotCls: "bg-purple-400" },
  DUPLICATE_CHARGE:   { label: "Duplicate Charge",   badgeCls: "bg-orange-50 text-orange-700 border-orange-200", dotCls: "bg-orange-400" },
};

const STATUS_CLS: Record<ExceptionStatus, string> = {
  OPEN:     "bg-red-50 text-red-700 border-red-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  ACCEPTED: "bg-slate-100 text-slate-600 border-slate-200",
  DISPUTED: "bg-amber-50 text-amber-700 border-amber-200",
};

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", signDisplay: "exceptZero" }).format(n);

// ─── Column system ─────────────────────────────────────────────────────────────

type ColumnId =
  | "invoice" | "vendor" | "type" | "description" | "status"  // always visible
  | "variance" | "date"                                         // default on
  | "scac" | "chargeCode" | "billedAmount" | "contractedAmount" | "resolvedBy"; // default off

interface ColumnDef {
  id: ColumnId;
  label: string;
  alwaysVisible?: boolean;
  defaultVisible: boolean;
  group: "core" | "charges";
}

const COLUMN_DEFS: ColumnDef[] = [
  { id: "invoice",          label: "Invoice",            alwaysVisible: true,  defaultVisible: true,  group: "core"    },
  { id: "vendor",           label: "Vendor",             alwaysVisible: true,  defaultVisible: true,  group: "core"    },
  { id: "type",             label: "Type",               alwaysVisible: true,  defaultVisible: true,  group: "core"    },
  { id: "description",      label: "Description",        alwaysVisible: true,  defaultVisible: true,  group: "core"    },
  { id: "status",           label: "Status",             alwaysVisible: true,  defaultVisible: true,  group: "core"    },
  { id: "variance",         label: "Variance",                                 defaultVisible: true,  group: "core"    },
  { id: "date",             label: "Date",                                     defaultVisible: true,  group: "core"    },
  { id: "scac",             label: "SCAC",                                     defaultVisible: false, group: "charges" },
  { id: "chargeCode",       label: "Charge Code",                              defaultVisible: false, group: "charges" },
  { id: "billedAmount",     label: "Billed Amount",                            defaultVisible: false, group: "charges" },
  { id: "contractedAmount", label: "Contracted Amount",                        defaultVisible: false, group: "charges" },
  { id: "resolvedBy",       label: "Resolved By",                              defaultVisible: false, group: "charges" },
];

// ─── Filter model ──────────────────────────────────────────────────────────────

type FilterOperator = "is" | "is_not";
type FilterDimension =
  | "type" | "vendor" | "status" | "scac" | "chargeCode"
  | "variance_gt" | "variance_lt"
  | "billedAmount_gt" | "billedAmount_lt";
type DimLogic = "or" | "and";

interface ActiveFilter {
  id: string;
  dimension: FilterDimension;
  dimensionLabel: string;
  value: string;
  valueLabel: string;
  operator: FilterOperator;
}

type FilterOption = {
  dimension: FilterDimension;
  dimensionLabel: string;
  value: string;
  valueLabel: string;
  dotCls: string;
};

let _uid = 0;
const uid = () => `f-${++_uid}`;

const DIM_ORDER: FilterDimension[] = [
  "type", "vendor", "scac", "status", "chargeCode",
  "variance_gt", "variance_lt", "billedAmount_gt", "billedAmount_lt",
];

const FILTER_OPTIONS: FilterOption[] = [
  // Exception type
  { dimension: "type",       dimensionLabel: "Type",        value: "RATE_UNAVAILABLE",   valueLabel: "Rate Unavailable",        dotCls: "bg-red-400"    },
  { dimension: "type",       dimensionLabel: "Type",        value: "CROSS_DOC_MISMATCH", valueLabel: "Cross-Doc Mismatch",      dotCls: "bg-amber-400"  },
  { dimension: "type",       dimensionLabel: "Type",        value: "BUSINESS_RULE",      valueLabel: "Business Rule",           dotCls: "bg-blue-400"   },
  { dimension: "type",       dimensionLabel: "Type",        value: "LANE_NOT_FOUND",     valueLabel: "Lane Not Found",          dotCls: "bg-purple-400" },
  { dimension: "type",       dimensionLabel: "Type",        value: "DUPLICATE_CHARGE",   valueLabel: "Duplicate Charge",        dotCls: "bg-orange-400" },
  // Vendor
  { dimension: "vendor",     dimensionLabel: "Vendor",      value: "FedEx Freight",      valueLabel: "FedEx Freight",           dotCls: "bg-slate-400"  },
  { dimension: "vendor",     dimensionLabel: "Vendor",      value: "CEVA",               valueLabel: "CEVA Logistics",          dotCls: "bg-slate-400"  },
  { dimension: "vendor",     dimensionLabel: "Vendor",      value: "Averitt Express",    valueLabel: "Averitt Express",         dotCls: "bg-slate-400"  },
  // SCAC
  { dimension: "scac",       dimensionLabel: "SCAC",        value: "FXFE",               valueLabel: "FXFE — FedEx Freight",    dotCls: "bg-slate-400"  },
  { dimension: "scac",       dimensionLabel: "SCAC",        value: "CEVA",               valueLabel: "CEVA — CEVA Logistics",   dotCls: "bg-slate-400"  },
  { dimension: "scac",       dimensionLabel: "SCAC",        value: "AVRT",               valueLabel: "AVRT — Averitt Express",  dotCls: "bg-slate-400"  },
  // Status
  { dimension: "status",     dimensionLabel: "Status",      value: "OPEN",               valueLabel: "Open",                    dotCls: "bg-red-400"    },
  { dimension: "status",     dimensionLabel: "Status",      value: "DISPUTED",           valueLabel: "Disputed",                dotCls: "bg-amber-400"  },
  { dimension: "status",     dimensionLabel: "Status",      value: "RESOLVED",           valueLabel: "Resolved",                dotCls: "bg-green-400"  },
  { dimension: "status",     dimensionLabel: "Status",      value: "ACCEPTED",           valueLabel: "Accepted",                dotCls: "bg-slate-400"  },
  // Charge code
  { dimension: "chargeCode", dimensionLabel: "Charge Code", value: "DSC",                valueLabel: "DSC — Discount",          dotCls: "bg-slate-400"  },
  { dimension: "chargeCode", dimensionLabel: "Charge Code", value: "ENS",                valueLabel: "ENS — Energy Surcharge",  dotCls: "bg-slate-400"  },
  { dimension: "chargeCode", dimensionLabel: "Charge Code", value: "400",                valueLabel: "400 — Extended Delivery", dotCls: "bg-slate-400"  },
  { dimension: "chargeCode", dimensionLabel: "Charge Code", value: "FSC",                valueLabel: "FSC — Fuel Surcharge",    dotCls: "bg-slate-400"  },
  { dimension: "chargeCode", dimensionLabel: "Charge Code", value: "BASE",               valueLabel: "BASE — Base Rate",        dotCls: "bg-slate-400"  },
  { dimension: "chargeCode", dimensionLabel: "Charge Code", value: "WT",                 valueLabel: "WT — Weight",             dotCls: "bg-slate-400"  },
  { dimension: "chargeCode", dimensionLabel: "Charge Code", value: "OHC",                valueLabel: "OHC — Origin Handling",   dotCls: "bg-slate-400"  },
  { dimension: "chargeCode", dimensionLabel: "Charge Code", value: "INSURANCE",          valueLabel: "INSURANCE — Cargo Ins.",  dotCls: "bg-slate-400"  },
];

const MENU_GROUPS: { label: string; dim: FilterDimension }[] = [
  { label: "Exception Type", dim: "type"       },
  { label: "Vendor",         dim: "vendor"     },
  { label: "SCAC",           dim: "scac"       },
  { label: "Status",         dim: "status"     },
  { label: "Charge Code",    dim: "chargeCode" },
];

// ─── Row matching helper ───────────────────────────────────────────────────────

function matchesDim(ex: AuditException, dim: FilterDimension, value: string): boolean {
  switch (dim) {
    case "type":             return ex.code === value;
    case "vendor":           return ex.vendor === value;
    case "status":           return ex.status === value;
    case "scac":             return ex.vendorScac === value;
    case "chargeCode":       return ex.chargeCode === value;
    case "variance_gt":      return ex.variance !== null && ex.variance > parseFloat(value);
    case "variance_lt":      return ex.variance !== null && ex.variance < parseFloat(value);
    case "billedAmount_gt":  return ex.billedAmount !== null && (ex.billedAmount as number) > parseFloat(value);
    case "billedAmount_lt":  return ex.billedAmount !== null && (ex.billedAmount as number) < parseFloat(value);
  }
}

// ─── NL mock parser ────────────────────────────────────────────────────────────

function parseNL(raw: string): Omit<ActiveFilter, "id">[] {
  const q = raw.toLowerCase();
  const out: Omit<ActiveFilter, "id">[] = [];

  const negated = (term: string): FilterOperator =>
    ["not ", "without ", "except ", "excluding "].some((p) => q.includes(p + term))
      ? "is_not" : "is";

  const push = (dimension: FilterDimension, value: string, operator: FilterOperator = "is") => {
    const opt = FILTER_OPTIONS.find((o) => o.dimension === dimension && o.value === value);
    if (opt) out.push({ dimension, dimensionLabel: opt.dimensionLabel, value, valueLabel: opt.valueLabel, operator });
  };

  // Exception types
  if (q.includes("rate") && !q.includes("rate card"))     push("type", "RATE_UNAVAILABLE",   negated("rate"));
  if (q.includes("mismatch") || q.includes("cross doc"))  push("type", "CROSS_DOC_MISMATCH", "is");
  if (q.includes("business rule") || q.includes("rule"))  push("type", "BUSINESS_RULE",      "is");
  if (q.includes("lane"))                                 push("type", "LANE_NOT_FOUND",     "is");
  if (q.includes("duplicate"))                            push("type", "DUPLICATE_CHARGE",   negated("duplicate"));

  // Vendor
  if (q.includes("fedex"))                               push("vendor", "FedEx Freight",   negated("fedex"));
  if (q.includes("averitt") || q.includes("avrt"))        push("vendor", "Averitt Express", negated("averitt"));
  if (q.includes("ceva") && !q.includes("scac"))          push("vendor", "CEVA",            negated("ceva"));

  // SCAC
  if (q.includes("fxfe"))  push("scac", "FXFE", negated("fxfe"));
  if (q.includes("avrt"))  push("scac", "AVRT", negated("avrt"));

  // Status
  if (q.includes("open") && !q.includes("reopen"))        push("status", "OPEN",     negated("open"));
  if (q.includes("disputed") || q.includes("dispute"))    push("status", "DISPUTED", negated("disputed"));
  if (q.includes("resolved"))                             push("status", "RESOLVED", negated("resolved"));
  if (q.includes("accepted"))                             push("status", "ACCEPTED", negated("accepted"));

  // Charge codes
  const chargeMappings: [string[], string][] = [
    [["dsc", "discount"],                        "DSC"       ],
    [["ens", "energy surcharge"],                "ENS"       ],
    [["extended delivery"],                      "400"       ],
    [["fsc", "fuel surcharge", "fuel"],          "FSC"       ],
    [["base rate"],                              "BASE"      ],
    [["ohc", "origin handling"],                 "OHC"       ],
    [["cargo insurance", "insurance charge"],    "INSURANCE" ],
  ];
  for (const [terms, code] of chargeMappings) {
    if (terms.some((t) => q.includes(t))) push("chargeCode", code, "is");
  }

  // Variance range
  const varAbove = q.match(/(?:variance|overcharge).*?(?:above|over|>)\s*\$?(\d+(?:\.\d+)?)/);
  if (varAbove) {
    const amt = parseFloat(varAbove[1]);
    out.push({ dimension: "variance_gt", dimensionLabel: "Variance", value: String(amt), valueLabel: `> $${amt.toLocaleString()}`, operator: "is" });
  }
  const varBelow = q.match(/(?:variance|overcharge).*?(?:below|under|<)\s*\$?(\d+(?:\.\d+)?)/);
  if (varBelow) {
    const amt = parseFloat(varBelow[1]);
    out.push({ dimension: "variance_lt", dimensionLabel: "Variance", value: String(amt), valueLabel: `< $${amt.toLocaleString()}`, operator: "is" });
  }

  // Generic above/below (variance, for backwards compat with previous examples)
  if (!varAbove) {
    const aboveM = q.match(/(?:above|over|more than|exceeding|>)\s*\$?(\d+(?:\.\d+)?)/);
    if (aboveM) {
      const amt = parseFloat(aboveM[1]);
      out.push({ dimension: "variance_gt", dimensionLabel: "Variance", value: String(amt), valueLabel: `> $${amt.toLocaleString()}`, operator: "is" });
    }
  }

  // Billed amount range
  const billAbove = q.match(/billed.*?(?:above|over|>)\s*\$?(\d+(?:\.\d+)?)/);
  if (billAbove) {
    const amt = parseFloat(billAbove[1]);
    out.push({ dimension: "billedAmount_gt", dimensionLabel: "Billed", value: String(amt), valueLabel: `> $${amt.toLocaleString()}`, operator: "is" });
  }
  const billBelow = q.match(/billed.*?(?:below|under|<)\s*\$?(\d+(?:\.\d+)?)/);
  if (billBelow) {
    const amt = parseFloat(billBelow[1]);
    out.push({ dimension: "billedAmount_lt", dimensionLabel: "Billed", value: String(amt), valueLabel: `< $${amt.toLocaleString()}`, operator: "is" });
  }

  const seen = new Set<string>();
  return out.filter((f) => {
    const k = `${f.dimension}:${f.value}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ─── Filter chip ───────────────────────────────────────────────────────────────

function FilterChip({
  filter, onRemove, onChangeOperator,
}: {
  filter: ActiveFilter;
  onRemove: () => void;
  onChangeOperator: (op: FilterOperator) => void;
}) {
  const [opOpen, setOpOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const isCategorical = !["variance_gt", "variance_lt", "billedAmount_gt", "billedAmount_lt"].includes(filter.dimension);
  const isExclude     = filter.operator === "is_not";

  useEffect(() => {
    if (!opOpen) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [opOpen]);

  return (
    <span
      ref={wrapRef}
      className={`relative inline-flex items-center rounded border text-xs select-none ${
        isExclude ? "bg-red-50/60 border-red-200" : "bg-white border-slate-200"
      }`}
    >
      <span className="pl-2 text-slate-500 whitespace-nowrap">{filter.dimensionLabel}</span>

      {isCategorical ? (
        <div className="relative">
          <button
            onClick={() => setOpOpen((v) => !v)}
            title="Change operator"
            className={`flex items-center gap-0.5 mx-1 px-1 py-0.5 rounded transition-colors ${
              opOpen
                ? "bg-slate-200 text-slate-700"
                : isExclude
                  ? "text-red-500 hover:bg-red-100"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            }`}
          >
            <span className="text-[10px] font-medium whitespace-nowrap">
              {isExclude ? "is not" : "is"}
            </span>
            <ChevronDown size={8} className={`transition-transform duration-100 ${opOpen ? "rotate-180" : ""}`} />
          </button>

          {opOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-md shadow-lg py-1 min-w-[90px]">
              {(["is", "is_not"] as FilterOperator[]).map((op) => (
                <button
                  key={op}
                  onClick={() => { onChangeOperator(op); setOpOpen(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors ${
                    filter.operator === op ? "text-primary font-medium bg-orange-50" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {filter.operator === op
                    ? <span className="text-primary text-[9px]">✓</span>
                    : <span className="w-[10px]" />
                  }
                  {op === "is" ? "is" : "is not"}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <span className="mx-1 text-[10px] text-slate-400">
          {filter.dimension.endsWith("_gt") ? ">" : "<"}
        </span>
      )}

      <span className={`font-medium pr-1 whitespace-nowrap ${isExclude ? "text-slate-500" : "text-slate-700"}`}>
        {filter.valueLabel}
      </span>

      <button
        onClick={onRemove}
        className={`pl-0.5 pr-2 transition-colors ${isExclude ? "text-red-300 hover:text-red-600" : "text-slate-300 hover:text-slate-600"}`}
        aria-label="Remove filter"
      >
        <X size={11} />
      </button>
    </span>
  );
}

// ─── Chip separator ────────────────────────────────────────────────────────────

function ChipSeparator({
  sameDim, prevOp, currOp, logic, dimension, onToggleLogic,
}: {
  sameDim: boolean;
  prevOp: FilterOperator;
  currOp: FilterOperator;
  logic: DimLogic;
  dimension: FilterDimension;
  onToggleLogic: () => void;
}) {
  const isCategorical = !["variance_gt", "variance_lt", "billedAmount_gt", "billedAmount_lt"].includes(dimension);

  if (sameDim && isCategorical) {
    if (prevOp === "is" && currOp === "is") {
      return (
        <button
          onClick={onToggleLogic}
          title="Click to toggle AND / OR"
          className="text-[10px] text-slate-400 hover:text-primary hover:bg-orange-50 rounded px-1.5 py-0.5 font-medium transition-colors"
        >
          {logic}
        </button>
      );
    }
    if (prevOp === "is_not" && currOp === "is_not") {
      return <span className="text-[10px] text-slate-400 px-1 select-none font-medium">and</span>;
    }
  }

  return <span className="text-[10px] text-slate-300 px-0.5 select-none">·</span>;
}

// ─── Add filter dropdown ───────────────────────────────────────────────────────

function AddFilterMenu({
  activeFilters, onAdd, onRemove,
}: {
  activeFilters: ActiveFilter[];
  onAdd: (opt: FilterOption) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const activeMap = new Map(
    activeFilters.filter((f) => f.operator === "is").map((f) => [`${f.dimension}:${f.value}`, f.id])
  );

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-colors whitespace-nowrap ${
          open ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
        }`}
      >
        <SlidersHorizontal size={12} />
        Add filter
        <ChevronDown size={11} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-60 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5 max-h-80 overflow-y-auto">
          {MENU_GROUPS.map((group, gi) => (
            <React.Fragment key={group.label}>
              {gi > 0 && <div className="my-1 border-t border-slate-100" />}
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              {FILTER_OPTIONS.filter((o) => o.dimension === group.dim).map((opt) => {
                const key      = `${opt.dimension}:${opt.value}`;
                const activeId = activeMap.get(key);
                const isActive = activeId !== undefined;
                return (
                  <button
                    key={key}
                    onClick={() => { isActive ? onRemove(activeId!) : onAdd(opt); }}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors ${
                      isActive ? "text-primary bg-orange-50 font-medium" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opt.dotCls}`} />
                    <span className="flex-1">{opt.valueLabel}</span>
                    {isActive && <X size={10} className="text-primary/60" />}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Columns picker ────────────────────────────────────────────────────────────

function ColumnsButton({
  visibleCols, onToggle,
}: {
  visibleCols: Set<ColumnId>;
  onToggle: (id: ColumnId) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggleable = COLUMN_DEFS.filter((c) => !c.alwaysVisible);
  const coreCols   = toggleable.filter((c) => c.group === "core");
  const extraCols  = toggleable.filter((c) => c.group === "charges");
  const extraActive = extraCols.filter((c) => visibleCols.has(c.id)).length;

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-colors whitespace-nowrap ${
          open ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
        }`}
      >
        <Eye size={12} />
        Columns
        {extraActive > 0 && (
          <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px] font-medium">
            {extraActive}
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-52 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Default</p>
          {coreCols.map((col) => (
            <label
              key={col.id}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 cursor-pointer hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={visibleCols.has(col.id)}
                onChange={() => onToggle(col.id)}
                className="rounded border-slate-300 text-primary focus:ring-ring/20 cursor-pointer"
              />
              {col.label}
            </label>
          ))}

          <div className="my-1.5 border-t border-slate-100" />

          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Charges &amp; details
          </p>
          {extraCols.map((col) => (
            <label
              key={col.id}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 cursor-pointer hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={visibleCols.has(col.id)}
                onChange={() => onToggle(col.id)}
                className="rounded border-slate-300 text-primary focus:ring-ring/20 cursor-pointer"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({
  activeFilters, dimLogic, visibleCols, onFiltersChange, onDimLogicChange, onToggleCol,
}: {
  activeFilters: ActiveFilter[];
  dimLogic: Partial<Record<FilterDimension, DimLogic>>;
  visibleCols: Set<ColumnId>;
  onFiltersChange: (filters: ActiveFilter[]) => void;
  onDimLogicChange: (dim: FilterDimension, logic: DimLogic) => void;
  onToggleCol: (id: ColumnId) => void;
}) {
  const [query, setQuery]           = useState("");
  const [isParsing, setIsParsing]   = useState(false);
  const [parseError, setParseError] = useState(false);
  const [focused, setFocused]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    const t = query.trim();
    if (!t || isParsing) return;
    setIsParsing(true);
    setParseError(false);
    setTimeout(() => {
      const parsed = parseNL(t);
      if (parsed.length > 0) {
        const existing = new Set(activeFilters.map((f) => `${f.dimension}:${f.value}`));
        const incoming = parsed
          .filter((p) => !existing.has(`${p.dimension}:${p.value}`))
          .map((p) => ({ ...p, id: uid() }));
        onFiltersChange([...activeFilters, ...incoming]);
        setQuery("");
      } else {
        setParseError(true);
        setTimeout(() => setParseError(false), 3500);
      }
      setIsParsing(false);
    }, 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter")  { e.preventDefault(); handleParse(); }
    if (e.key === "Escape") { setQuery(""); inputRef.current?.blur(); }
  };

  const addFromMenu = (opt: FilterOption) => {
    const key = `${opt.dimension}:${opt.value}`;
    if (activeFilters.some((f) => f.operator === "is" && `${f.dimension}:${f.value}` === key)) return;
    onFiltersChange([
      ...activeFilters,
      { id: uid(), dimension: opt.dimension, dimensionLabel: opt.dimensionLabel, value: opt.value, valueLabel: opt.valueLabel, operator: "is" },
    ]);
  };

  const removeChip    = (id: string) => onFiltersChange(activeFilters.filter((f) => f.id !== id));
  const changeOp      = (id: string, op: FilterOperator) =>
    onFiltersChange(activeFilters.map((f) => (f.id === id ? { ...f, operator: op } : f)));

  const sortedFilters = useMemo(
    () => [...activeFilters].sort((a, b) => DIM_ORDER.indexOf(a.dimension) - DIM_ORDER.indexOf(b.dimension)),
    [activeFilters]
  );

  const hasChips = activeFilters.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="bg-white border-b border-slate-200 px-6 shrink-0">
      <div className="flex items-center gap-2 py-2.5">
        {/* NL input */}
        <div
          className={`relative flex flex-1 items-center gap-2 rounded-md border px-3 py-1.5 transition-all ${
            parseError
              ? "border-red-300 bg-red-50/60"
              : focused
                ? "border-ring shadow-[0_0_0_2px_rgba(254,99,1,0.1)]"
                : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
          }`}
        >
          <Sparkles size={13} className={`shrink-0 transition-colors ${focused || hasQuery ? "text-primary" : "text-slate-300"}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setParseError(false); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Filter or describe exceptions…"
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          {isParsing && <Loader2 size={13} className="shrink-0 text-primary animate-spin" />}
          {!isParsing && hasQuery && (
            <kbd className="shrink-0 text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1 py-0.5 font-sans hidden sm:block">↵</kbd>
          )}
          {!isParsing && !hasQuery && focused && (
            <span className="shrink-0 text-[10px] text-slate-400 hidden sm:block whitespace-nowrap">try "open FedEx exceptions"</span>
          )}
        </div>

        {hasQuery && (
          <Button size="sm" onClick={handleParse} disabled={isParsing} className="h-8 text-xs shrink-0">Apply</Button>
        )}

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        <AddFilterMenu activeFilters={activeFilters} onAdd={addFromMenu} onRemove={removeChip} />
        <ColumnsButton visibleCols={visibleCols} onToggle={onToggleCol} />
      </div>

      {parseError && (
        <p className="text-xs text-red-500 -mt-1 pb-2.5">
          No filters detected. Try "open FedEx exceptions" or "billed above $100".
        </p>
      )}

      {hasChips && (
        <div className="flex flex-wrap items-center gap-y-1.5 pb-2.5">
          {sortedFilters.map((f, i) => {
            const prev = i > 0 ? sortedFilters[i - 1] : null;
            return (
              <React.Fragment key={f.id}>
                {prev && (
                  <ChipSeparator
                    sameDim={prev.dimension === f.dimension}
                    prevOp={prev.operator}
                    currOp={f.operator}
                    logic={dimLogic[f.dimension] ?? "or"}
                    dimension={f.dimension}
                    onToggleLogic={() => {
                      const cur = dimLogic[f.dimension] ?? "or";
                      onDimLogicChange(f.dimension, cur === "or" ? "and" : "or");
                    }}
                  />
                )}
                <FilterChip
                  filter={f}
                  onRemove={() => removeChip(f.id)}
                  onChangeOperator={(op) => changeOp(f.id, op)}
                />
              </React.Fragment>
            );
          })}
          <button
            onClick={() => onFiltersChange([])}
            className="text-[11px] text-slate-400 hover:text-slate-700 ml-2 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ExceptionStatus }) {
  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium ${STATUS_CLS[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Exception table ───────────────────────────────────────────────────────────

function ExceptionTable({
  rows, visibleCols, selectedIds, onToggle, onToggleAll, allSelected, someSelected, isResolved,
}: {
  rows: AuditException[];
  visibleCols: Set<ColumnId>;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  allSelected: boolean;
  someSelected: boolean;
  isResolved: boolean;
}) {
  if (rows.length === 0) return null;
  const rowIds = rows.map((r) => r.id);
  const show   = (id: ColumnId) => visibleCols.has(id);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60">
            <th className="w-10 px-4 py-2.5">
              {!isResolved && (
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={() => onToggleAll(rowIds)}
                  className="rounded border-slate-300 text-primary focus:ring-ring/20 cursor-pointer"
                />
              )}
            </th>
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Invoice</th>
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Vendor</th>
            {show("scac")             && <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">SCAC</th>}
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Type</th>
            {show("chargeCode")       && <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Charge Code</th>}
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Description</th>
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
            {show("resolvedBy")       && <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Resolved By</th>}
            {show("billedAmount")     && <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Billed</th>}
            {show("contractedAmount") && <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Contracted</th>}
            {show("variance")         && <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Variance</th>}
            {show("date")             && <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Date</th>}
            {!isResolved && <th className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((ex) => {
            const checked = selectedIds.has(ex.id);
            const meta    = CODE_META[ex.code];
            return (
              <tr
                key={ex.id}
                className={`transition-colors ${
                  isResolved ? "opacity-60 hover:opacity-90" : checked ? "bg-orange-50/40" : "hover:bg-slate-50/40"
                }`}
              >
                <td className="w-10 px-4 py-3">
                  {!isResolved && (
                    <input type="checkbox" checked={checked} onChange={() => onToggle(ex.id)}
                      className="rounded border-slate-300 text-primary focus:ring-ring/20 cursor-pointer" />
                  )}
                </td>
                <td className="px-3 py-3">
                  <Link to="/invoices" className="font-mono text-xs text-primary hover:underline">{ex.invoiceRef}</Link>
                </td>
                <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{ex.vendor}</td>
                {show("scac") && (
                  <td className="px-3 py-3">
                    <span className="font-mono text-[11px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{ex.vendorScac}</span>
                  </td>
                )}
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium ${meta.badgeCls}`}>
                    {meta.label}
                  </span>
                </td>
                {show("chargeCode") && (
                  <td className="px-3 py-3">
                    <span className="font-mono text-[11px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{ex.chargeCode}</span>
                  </td>
                )}
                <td className="px-3 py-3 max-w-xs">
                  <p className="text-xs text-slate-700 truncate">{ex.description}</p>
                  {!show("chargeCode") && (
                    <span className="font-mono text-[10px] text-slate-400">{ex.chargeCode}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <StatusPill status={ex.status} />
                </td>
                {show("resolvedBy") && (
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {ex.resolvedBy ?? <span className="text-slate-300">—</span>}
                  </td>
                )}
                {show("billedAmount") && (
                  <td className="px-3 py-3 text-right text-xs font-medium">
                    {ex.billedAmount !== null
                      ? <span className="text-slate-700">{usd(ex.billedAmount as number)}</span>
                      : <span className="text-slate-400">—</span>}
                  </td>
                )}
                {show("contractedAmount") && (
                  <td className="px-3 py-3 text-right text-xs font-medium">
                    {ex.contractedAmount !== null
                      ? <span className="text-slate-700">{usd(ex.contractedAmount as number)}</span>
                      : <span className="text-slate-400">—</span>}
                  </td>
                )}
                {show("variance") && (
                  <td className="px-3 py-3 text-right text-xs font-medium">
                    {ex.variance !== null
                      ? <span className={ex.variance > 0 ? "text-red-600" : "text-green-600"}>{usd(ex.variance)}</span>
                      : <span className="text-slate-400">—</span>}
                  </td>
                )}
                {show("date") && (
                  <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{ex.date}</td>
                )}
                {!isResolved && (
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800">Accept</Button>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50">Dispute</Button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Bulk action bar ───────────────────────────────────────────────────────────

function BulkActionBar({ count, onAccept, onDispute, onClear }: {
  count: number; onAccept: () => void; onDispute: () => void; onClear: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-10 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-5 py-3 flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
        <CheckSquare size={15} className="text-primary" />
        {count} exception{count !== 1 ? "s" : ""} selected
      </span>
      <div className="h-4 w-px bg-slate-200 mx-1" />
      <Button variant="ghost" size="sm" onClick={onAccept} className="text-slate-600 hover:text-slate-950">Accept selected</Button>
      <Button variant="outline" size="sm" onClick={onDispute} className="border-red-200 text-red-600 hover:bg-red-50">Dispute selected</Button>
      <button onClick={onClear} className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors">
        <X size={13} /> Clear selection
      </button>
    </div>
  );
}

// ─── Exception pane ────────────────────────────────────────────────────────────

function ExceptionPane({
  rows, visibleCols, selectedIds, onToggle, onToggleAll,
}: {
  rows: AuditException[];
  visibleCols: Set<ColumnId>;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
}) {
  const [showResolved, setShowResolved] = useState(false);
  const openRows     = rows.filter((e) => e.status === "OPEN");
  const resolvedRows = rows.filter((e) => e.status !== "OPEN");
  const openIds      = openRows.map((r) => r.id);
  const allChecked   = openIds.length > 0 && openIds.every((id) => selectedIds.has(id));
  const someChecked  = openIds.some((id) => selectedIds.has(id));

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {openRows.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-slate-500">No open exceptions match the current filters</p>
          {resolvedRows.length > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              {resolvedRows.length} resolved exception{resolvedRows.length !== 1 ? "s" : ""} below
            </p>
          )}
        </div>
      ) : (
        <ExceptionTable
          rows={openRows} visibleCols={visibleCols} selectedIds={selectedIds}
          onToggle={onToggle} onToggleAll={onToggleAll}
          allSelected={allChecked} someSelected={someChecked} isResolved={false}
        />
      )}

      {resolvedRows.length > 0 && (
        <div className="border-t border-slate-200">
          <button
            onClick={() => setShowResolved((v) => !v)}
            className="flex items-center gap-2 w-full px-5 py-3 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50/60 transition-colors"
          >
            {showResolved ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {resolvedRows.length} resolved exception{resolvedRows.length !== 1 ? "s" : ""}
          </button>
          {showResolved && (
            <div className="border-t border-slate-100 bg-slate-50/30">
              <ExceptionTable
                rows={resolvedRows} visibleCols={visibleCols} selectedIds={selectedIds}
                onToggle={onToggle} onToggleAll={onToggleAll}
                allSelected={false} someSelected={false} isResolved={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type ExTab = "exceptions" | "disputes";

export default function ExceptionsPage() {
  const [tab, setTab]                     = useState<ExTab>("exceptions");
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [dimLogic, setDimLogic]           = useState<Partial<Record<FilterDimension, DimLogic>>>({});
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols]     = useState<Set<ColumnId>>(
    () => new Set(COLUMN_DEFS.filter((c) => c.defaultVisible).map((c) => c.id))
  );

  const filteredRows = useMemo(() => {
    return exceptions.filter((ex) => {
      if (tab === "disputes" && ex.status !== "DISPUTED") return false;
      if (activeFilters.length === 0) return true;

      const byDim = new Map<FilterDimension, ActiveFilter[]>();
      for (const f of activeFilters) {
        const arr = byDim.get(f.dimension) ?? [];
        arr.push(f);
        byDim.set(f.dimension, arr);
      }

      for (const [dim, filters] of byDim) {
        const logic      = dimLogic[dim] ?? "or";
        const isFilters  = filters.filter((f) => f.operator === "is");
        const notFilters = filters.filter((f) => f.operator === "is_not");

        for (const f of notFilters) {
          if (matchesDim(ex, dim, f.value)) return false;
        }

        if (isFilters.length > 0) {
          const passes =
            logic === "or"
              ? isFilters.some((f)  => matchesDim(ex, dim, f.value))
              : isFilters.every((f) => matchesDim(ex, dim, f.value));
          if (!passes) return false;
        }
      }

      return true;
    });
  }, [tab, activeFilters, dimLogic]);

  const openTotal = exceptions.filter((e) => e.status === "OPEN").length;

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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

  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    if (filters.length === 0) {
      setDimLogic({});
    } else {
      const activeDims = new Set(filters.map((f) => f.dimension));
      setDimLogic((prev) => {
        const next = { ...prev };
        (Object.keys(next) as FilterDimension[]).forEach((d) => { if (!activeDims.has(d)) delete next[d]; });
        return next;
      });
    }
    clearSelection();
  }, [clearSelection]);

  const handleDimLogicChange = useCallback((dim: FilterDimension, logic: DimLogic) => {
    setDimLogic((prev) => ({ ...prev, [dim]: logic }));
    clearSelection();
  }, [clearSelection]);

  const handleToggleCol = useCallback((id: ColumnId) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectionCount = selectedIds.size;
  const openFiltered   = filteredRows.filter((e) => e.status === "OPEN").length;
  const hasFilters     = activeFilters.length > 0;

  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-slate-950">Exceptions</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Audit exceptions across all invoices · {openTotal} open
            </p>
          </div>
          <Link to="/agents/audit-agent">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings size={13} />
              Configure Audit Agent
            </Button>
          </Link>
        </div>

        <div className="flex items-center -mb-4 mt-4">
          {(["exceptions", "disputes"] as ExTab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); clearSelection(); }}
              className={`px-4 py-2.5 text-sm border-b-2 transition-colors capitalize ${
                tab === t ? "border-primary text-primary font-medium" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <FilterBar
        activeFilters={activeFilters}
        dimLogic={dimLogic}
        visibleCols={visibleCols}
        onFiltersChange={handleFiltersChange}
        onDimLogicChange={handleDimLogicChange}
        onToggleCol={handleToggleCol}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-4 pb-0">
          {hasFilters && (
            <p className="text-xs text-slate-400 mb-3">
              {openFiltered} open
              {filteredRows.filter((e) => e.status !== "OPEN").length > 0 &&
                ` · ${filteredRows.filter((e) => e.status !== "OPEN").length} resolved`}
              {` · ${activeFilters.length} active filter${activeFilters.length !== 1 ? "s" : ""}`}
            </p>
          )}
          <ExceptionPane
            rows={filteredRows}
            visibleCols={visibleCols}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            onToggleAll={handleToggleAll}
          />
          <div className={selectionCount > 0 ? "h-16" : "h-5"} />
        </div>
      </div>

      {selectionCount > 0 && (
        <BulkActionBar
          count={selectionCount}
          onAccept={clearSelection}
          onDispute={clearSelection}
          onClear={clearSelection}
        />
      )}
    </div>
  );
}
