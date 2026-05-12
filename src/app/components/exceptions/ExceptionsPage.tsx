import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  Settings, ChevronDown, ChevronRight, X, CheckSquare,
  Sparkles, SlidersHorizontal, Loader2, Eye, Search, Plus, Layers,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  exceptions,
  chargeName,
  type AuditException,
  type ExceptionCode,
  type ExceptionStatus,
} from "../../data/exceptionsData";
import { EXCEPTION_CODE_META, EXCEPTION_STATUS_CFG } from "../shared/statusConfig";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEMO_TODAY = new Date("2026-05-11");

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", signDisplay: "exceptZero" }).format(n);

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Column system ─────────────────────────────────────────────────────────────

type ColumnId =
  | "invoice" | "vendor" | "type" | "description" | "status"
  | "variance" | "date"
  | "scac" | "chargeCode" | "shipmentDate"
  | "billedAmount" | "contractedAmount" | "resolvedBy";

interface ColumnDef {
  id: ColumnId;
  label: string;
  alwaysVisible?: boolean;
  defaultVisible: boolean;
  group: "core" | "charges";
}

const COLUMN_DEFS: ColumnDef[] = [
  { id: "invoice",          label: "Invoice",           alwaysVisible: true, defaultVisible: true,  group: "core"    },
  { id: "vendor",           label: "Vendor",            alwaysVisible: true, defaultVisible: true,  group: "core"    },
  { id: "type",             label: "Type",              alwaysVisible: true, defaultVisible: true,  group: "core"    },
  { id: "description",      label: "Description",       alwaysVisible: true, defaultVisible: true,  group: "core"    },
  { id: "status",           label: "Status",            alwaysVisible: true, defaultVisible: true,  group: "core"    },
  { id: "variance",         label: "Variance",                               defaultVisible: true,  group: "core"    },
  { id: "date",             label: "Date",                                   defaultVisible: true,  group: "core"    },
  { id: "scac",             label: "SCAC",                                   defaultVisible: false, group: "core"    },
  { id: "chargeCode",       label: "Charge",        alwaysVisible: true,  defaultVisible: true,  group: "core"    },
  { id: "shipmentDate",     label: "Shipment Date",                          defaultVisible: false, group: "core"    },
  { id: "billedAmount",     label: "Billed Amount",                          defaultVisible: false, group: "charges" },
  { id: "contractedAmount", label: "Contracted Amount",                      defaultVisible: false, group: "charges" },
  { id: "resolvedBy",       label: "Resolved By",                            defaultVisible: false, group: "charges" },
];

// ─── Filter model ──────────────────────────────────────────────────────────────

type FilterOperator = "is" | "is_not";
type FilterDimension =
  | "type" | "vendor" | "status" | "scac" | "chargeCode"
  | "variance_gt" | "variance_lt"
  | "billedAmount_gt" | "billedAmount_lt"
  | "shipmentDate_before";
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

const NON_CATEGORICAL: FilterDimension[] = [
  "variance_gt", "variance_lt", "billedAmount_gt", "billedAmount_lt", "shipmentDate_before",
];

const DIM_ORDER: FilterDimension[] = [
  "type", "vendor", "scac", "status", "chargeCode",
  "billedAmount_gt", "billedAmount_lt",
  "variance_gt", "variance_lt",
  "shipmentDate_before",
];

const FILTER_OPTIONS: FilterOption[] = [
  { dimension: "type",       dimensionLabel: "Type",        value: "RATE_UNAVAILABLE",   valueLabel: "Rate Unavailable",        dotCls: "bg-red-400"    },
  { dimension: "type",       dimensionLabel: "Type",        value: "CROSS_DOC_MISMATCH", valueLabel: "Cross-Doc Mismatch",      dotCls: "bg-amber-400"  },
  { dimension: "type",       dimensionLabel: "Type",        value: "BUSINESS_RULE",      valueLabel: "Business Rule",           dotCls: "bg-blue-400"   },
  { dimension: "type",       dimensionLabel: "Type",        value: "LANE_NOT_FOUND",     valueLabel: "Lane Not Found",          dotCls: "bg-purple-400" },
  { dimension: "type",       dimensionLabel: "Type",        value: "DUPLICATE_CHARGE",   valueLabel: "Duplicate Charge",        dotCls: "bg-orange-400" },
  { dimension: "vendor",     dimensionLabel: "Vendor",      value: "FedEx Freight",      valueLabel: "FedEx Freight",           dotCls: "bg-slate-400"  },
  { dimension: "vendor",     dimensionLabel: "Vendor",      value: "CEVA",               valueLabel: "CEVA Logistics",          dotCls: "bg-slate-400"  },
  { dimension: "vendor",     dimensionLabel: "Vendor",      value: "Averitt Express",    valueLabel: "Averitt Express",         dotCls: "bg-slate-400"  },
  { dimension: "scac",       dimensionLabel: "SCAC",        value: "FXFE",               valueLabel: "FXFE — FedEx Freight",    dotCls: "bg-slate-400"  },
  { dimension: "scac",       dimensionLabel: "SCAC",        value: "CEVA",               valueLabel: "CEVA — CEVA Logistics",   dotCls: "bg-slate-400"  },
  { dimension: "scac",       dimensionLabel: "SCAC",        value: "AVRT",               valueLabel: "AVRT — Averitt Express",  dotCls: "bg-slate-400"  },
  { dimension: "status",     dimensionLabel: "Status",      value: "OPEN",               valueLabel: "Open",                    dotCls: "bg-red-400"    },
  { dimension: "status",     dimensionLabel: "Status",      value: "DISPUTED",           valueLabel: "Disputed",                dotCls: "bg-amber-400"  },
  { dimension: "status",     dimensionLabel: "Status",      value: "RESOLVED",           valueLabel: "Resolved",                dotCls: "bg-green-400"  },
  { dimension: "status",     dimensionLabel: "Status",      value: "ACCEPTED",           valueLabel: "Accepted",                dotCls: "bg-slate-400"  },
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

// ─── View model ────────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc";
type SortableCol =
  | "vendor" | "code" | "status" | "variance"
  | "date" | "shipmentDate" | "billedAmount" | "contractedAmount";
type GroupByDimension = "vendor" | "code" | "status";

interface ViewSort { col: SortableCol; dir: SortDir; }

interface SavedView {
  id: string;
  name: string;
  filters: ActiveFilter[];
  dimLogic: Partial<Record<FilterDimension, DimLogic>>;
  sort: ViewSort | null;
  groupBy: GroupByDimension | null;
  isDefault: boolean;
}

let _vid = 0;
const vid = () => `view-${++_vid}`;

const DEFAULT_VIEW: SavedView = {
  id: "all", name: "All",
  filters: [], dimLogic: {}, sort: null, groupBy: null,
  isDefault: true,
};

const GROUP_BY_LABELS: Record<GroupByDimension, string> = {
  vendor: "Vendor",
  code:   "Exception Type",
  status: "Status",
};

// ─── Sort / group helpers ──────────────────────────────────────────────────────

function sortRows(rows: AuditException[], sort: ViewSort | null): AuditException[] {
  if (!sort) return rows;
  return [...rows].sort((a, b) => {
    let va: string | number, vb: string | number;
    switch (sort.col) {
      case "vendor":           va = a.vendor;                    vb = b.vendor;                    break;
      case "code":             va = a.code;                      vb = b.code;                      break;
      case "status":           va = a.status;                    vb = b.status;                    break;
      case "variance":         va = a.variance          ?? -Infinity; vb = b.variance          ?? -Infinity; break;
      case "date":             va = a.date;                      vb = b.date;                      break;
      case "shipmentDate":     va = a.shipmentDate;              vb = b.shipmentDate;              break;
      case "billedAmount":     va = a.billedAmount      ?? -Infinity; vb = b.billedAmount      ?? -Infinity; break;
      case "contractedAmount": va = a.contractedAmount  ?? -Infinity; vb = b.contractedAmount  ?? -Infinity; break;
      default: return 0;
    }
    if (va < vb) return sort.dir === "asc" ? -1 : 1;
    if (va > vb) return sort.dir === "asc" ?  1 : -1;
    return 0;
  });
}

function groupRows(
  rows: AuditException[],
  groupBy: GroupByDimension,
): { key: string; label: string; rows: AuditException[] }[] {
  const map = new Map<string, AuditException[]>();
  for (const row of rows) {
    const key =
      groupBy === "vendor" ? row.vendor :
      groupBy === "code"   ? row.code   :
      row.status;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return Array.from(map.entries()).map(([key, rows]) => ({
    key,
    label:
      groupBy === "code"   ? EXCEPTION_CODE_META[key as ExceptionCode].label :
      groupBy === "status" ? key.charAt(0) + key.slice(1).toLowerCase() :
      key,
    rows,
  }));
}

// ─── Row matching ──────────────────────────────────────────────────────────────

function matchesDim(ex: AuditException, dim: FilterDimension, value: string): boolean {
  switch (dim) {
    case "type":                return ex.code === value;
    case "vendor":              return ex.vendor === value;
    case "status":              return ex.status === value;
    case "scac":                return ex.vendorScac === value;
    case "chargeCode":          return ex.chargeCode === value;
    case "variance_gt":         return ex.variance !== null && ex.variance > parseFloat(value);
    case "variance_lt":         return ex.variance !== null && ex.variance < parseFloat(value);
    case "billedAmount_gt":     return ex.billedAmount !== null && (ex.billedAmount as number) > parseFloat(value);
    case "billedAmount_lt":     return ex.billedAmount !== null && (ex.billedAmount as number) < parseFloat(value);
    case "shipmentDate_before": return new Date(ex.shipmentDate) < new Date(value);
  }
}

// ─── NL parser ────────────────────────────────────────────────────────────────

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

  if (q.includes("rate") && !q.includes("rate card"))     push("type", "RATE_UNAVAILABLE",   negated("rate"));
  if (q.includes("mismatch") || q.includes("cross doc"))  push("type", "CROSS_DOC_MISMATCH", "is");
  if (q.includes("business rule") || q.includes("rule"))  push("type", "BUSINESS_RULE",      "is");
  if (q.includes("lane"))                                 push("type", "LANE_NOT_FOUND",     "is");
  if (q.includes("duplicate"))                            push("type", "DUPLICATE_CHARGE",   negated("duplicate"));

  if (q.includes("fedex"))                               push("vendor", "FedEx Freight",   negated("fedex"));
  if (q.includes("averitt") || q.includes("avrt"))        push("vendor", "Averitt Express", negated("averitt"));
  if (q.includes("ceva") && !q.includes("scac"))          push("vendor", "CEVA",            negated("ceva"));

  if (q.includes("fxfe"))  push("scac", "FXFE", negated("fxfe"));
  if (q.includes("avrt"))  push("scac", "AVRT", negated("avrt"));

  if (q.includes("open") && !q.includes("reopen"))        push("status", "OPEN",     negated("open"));
  if (q.includes("disputed") || q.includes("dispute"))    push("status", "DISPUTED", negated("disputed"));
  if (q.includes("resolved"))                             push("status", "RESOLVED", negated("resolved"));
  if (q.includes("accepted"))                             push("status", "ACCEPTED", negated("accepted"));

  const chargeMappings: [string[], string][] = [
    [["dsc", "discount"],                       "DSC"       ],
    [["ens", "energy surcharge"],               "ENS"       ],
    [["extended delivery"],                     "400"       ],
    [["fsc", "fuel surcharge", "fuel"],         "FSC"       ],
    [["base rate"],                             "BASE"      ],
    [["ohc", "origin handling"],                "OHC"       ],
    [["cargo insurance", "insurance charge"],   "INSURANCE" ],
  ];
  for (const [terms, code] of chargeMappings) {
    if (terms.some((t) => q.includes(t))) push("chargeCode", code, "is");
  }

  const varAbove = q.match(/(?:variance|overcharge).*?(?:above|over|>)\s*\$?(\d+(?:\.\d+)?)/);
  if (varAbove) {
    const amt = parseFloat(varAbove[1]);
    out.push({ dimension: "variance_gt", dimensionLabel: "Variance", value: String(amt), valueLabel: `> $${amt.toLocaleString()}`, operator: "is" });
  }
  const varBelow = q.match(/(?:variance|overcharge).*?(?:below|under|<)\s*\$?(\d+(?:\.\d+)?)/);
  if (varBelow) {
    const amt = parseFloat(varBelow[1]);
    out.push({ dimension: "variance_lt", dimensionLabel: "Discrepancy", value: String(amt), valueLabel: `< $${amt.toLocaleString()}`, operator: "is" });
  }
  if (!varAbove) {
    const aboveM = q.match(/(?:above|over|more than|exceeding|>)\s*\$?(\d+(?:\.\d+)?)/);
    if (aboveM) {
      const amt = parseFloat(aboveM[1]);
      out.push({ dimension: "billedAmount_gt", dimensionLabel: "Invoice Amt", value: String(amt), valueLabel: `> $${amt.toLocaleString()}`, operator: "is" });
    }
  }
  const billAbove = q.match(/billed.*?(?:above|over|>)\s*\$?(\d+(?:\.\d+)?)/);
  if (billAbove) {
    const amt = parseFloat(billAbove[1]);
    out.push({ dimension: "billedAmount_gt", dimensionLabel: "Invoice Amt", value: String(amt), valueLabel: `> $${amt.toLocaleString()}`, operator: "is" });
  }
  const billBelow = q.match(/billed.*?(?:below|under|<)\s*\$?(\d+(?:\.\d+)?)/);
  if (billBelow) {
    const amt = parseFloat(billBelow[1]);
    out.push({ dimension: "billedAmount_lt", dimensionLabel: "Invoice Amt", value: String(amt), valueLabel: `< $${amt.toLocaleString()}`, operator: "is" });
  }
  const olderMatch = q.match(/(?:older than|aged?\s+(?:more than|over)|shipment.*before)\s+(\d+)\s+days?/);
  if (olderMatch) {
    const days = parseInt(olderMatch[1]);
    const cutoff = new Date(DEMO_TODAY);
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const label = `before ${cutoff.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    out.push({ dimension: "shipmentDate_before", dimensionLabel: "Shipment Date", value: cutoffStr, valueLabel: label, operator: "is" });
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

function FilterChip({ filter, onRemove, onChangeOperator }: {
  filter: ActiveFilter;
  onRemove: () => void;
  onChangeOperator: (op: FilterOperator) => void;
}) {
  const [opOpen, setOpOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const isCategorical = !NON_CATEGORICAL.includes(filter.dimension);
  const isExclude     = filter.operator === "is_not";

  useEffect(() => {
    if (!opOpen) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [opOpen]);

  const operatorSymbol = isCategorical ? null
    : filter.dimension.includes("_gt") ? ">"
    : filter.dimension.includes("_lt") ? "<"
    : null;

  return (
    <span
      ref={wrapRef}
      className={`relative inline-flex items-center rounded border text-xs select-none ${
        isExclude ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
      }`}
    >
      <span className={`pl-2 whitespace-nowrap ${isExclude ? "text-red-600" : "text-orange-700"}`}>{filter.dimensionLabel}</span>

      {isCategorical ? (
        <div className="relative">
          <button
            onClick={() => setOpOpen((v) => !v)}
            className={`flex items-center gap-0.5 mx-1 px-1 py-0.5 rounded transition-colors ${
              opOpen ? "bg-slate-200 text-slate-700"
                : isExclude ? "text-red-500 hover:bg-red-100"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            }`}
          >
            <span className="text-[10px] font-medium whitespace-nowrap">{isExclude ? "is not" : "is"}</span>
            <ChevronDown size={8} className={`transition-transform duration-100 ${opOpen ? "rotate-180" : ""}`} />
          </button>
          {opOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-md shadow-lg py-1 min-w-[90px]">
              {(["is", "is_not"] as FilterOperator[]).map((op) => (
                <button
                  key={op}
                  onClick={() => { onChangeOperator(op); setOpOpen(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors ${
                    filter.operator === op ? "text-primary font-medium bg-orange-50" : "text-slate-700 hover:bg-orange-50"
                  }`}
                >
                  {filter.operator === op ? <span className="text-primary text-[9px]">✓</span> : <span className="w-[10px]" />}
                  {op === "is" ? "is" : "is not"}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        operatorSymbol && <span className="mx-1 text-[10px] text-slate-400">{operatorSymbol}</span>
      )}

      <span className={`font-medium pr-1 whitespace-nowrap ${isExclude ? "text-red-700" : "text-orange-800"} ${!isCategorical && !operatorSymbol ? "ml-1" : ""}`}>
        {filter.valueLabel}
      </span>

      <button onClick={onRemove} className={`pl-0.5 pr-2 transition-colors ${isExclude ? "text-red-300 hover:text-red-600" : "text-orange-300 hover:text-orange-600"}`} aria-label="Remove filter">
        <X size={11} />
      </button>
    </span>
  );
}

// ─── Chip separator ────────────────────────────────────────────────────────────

function ChipSeparator({ sameDim, prevOp, currOp, logic, dimension, onToggleLogic }: {
  sameDim: boolean; prevOp: FilterOperator; currOp: FilterOperator;
  logic: DimLogic; dimension: FilterDimension; onToggleLogic: () => void;
}) {
  const isCategorical = !NON_CATEGORICAL.includes(dimension);
  if (sameDim && isCategorical) {
    if (prevOp === "is" && currOp === "is") {
      return (
        <button onClick={onToggleLogic} title="Click to toggle AND / OR"
          className="text-[10px] text-slate-400 hover:text-primary hover:bg-orange-50 rounded px-1.5 py-0.5 font-medium transition-colors">
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

// ─── Group by button ───────────────────────────────────────────────────────────

function GroupByButton({ groupBy, onChange }: {
  groupBy: GroupByDimension | null;
  onChange: (g: GroupByDimension | null) => void;
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

  const isActive = groupBy !== null;

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-colors whitespace-nowrap ${
          isActive
            ? "bg-orange-50 border-primary/30 text-primary font-medium"
            : open
            ? "bg-slate-100 border-slate-300 text-slate-700"
            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
        }`}
      >
        <Layers size={14} />
        {isActive ? `Grouped: ${GROUP_BY_LABELS[groupBy!]}` : "Group by"}
        <ChevronDown size={12} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Group by</p>
          {([null, "vendor", "code", "status"] as (GroupByDimension | null)[]).map((g) => (
            <button
              key={String(g)}
              onClick={() => { onChange(g); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors ${
                groupBy === g ? "text-primary font-medium bg-orange-50" : "text-slate-700 hover:bg-orange-50"
              }`}
            >
              {groupBy === g && <span className="text-primary text-[9px]">✓</span>}
              {groupBy !== g && <span className="w-[10px]" />}
              {g === null ? "None" : GROUP_BY_LABELS[g]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add filter dropdown ───────────────────────────────────────────────────────

function AddFilterMenu({ activeFilters, onAdd, onRemove, onAddRaw }: {
  activeFilters: ActiveFilter[];
  onAdd: (opt: FilterOption) => void;
  onRemove: (id: string) => void;
  onAddRaw: (f: Omit<ActiveFilter, "id">) => void;
}) {
  const [open, setOpen]             = useState(false);
  const [billedGt, setBilledGt]     = useState("");
  const [varianceLt, setVarianceLt] = useState("");
  const [shipDate, setShipDate]     = useState("");
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

  const applyBilledGt = () => {
    const n = parseFloat(billedGt);
    if (isNaN(n) || n < 0) return;
    onAddRaw({ dimension: "billedAmount_gt", dimensionLabel: "Invoice Amt", value: String(n), valueLabel: `> $${n.toLocaleString()}`, operator: "is" });
    setBilledGt(""); setOpen(false);
  };
  const applyVarianceLt = () => {
    const n = parseFloat(varianceLt);
    if (isNaN(n) || n < 0) return;
    onAddRaw({ dimension: "variance_lt", dimensionLabel: "Discrepancy", value: String(n), valueLabel: `< $${n.toLocaleString()}`, operator: "is" });
    setVarianceLt(""); setOpen(false);
  };
  const applyShipDate = () => {
    if (!shipDate) return;
    const d = new Date(shipDate);
    const label = `before ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    onAddRaw({ dimension: "shipmentDate_before", dimensionLabel: "Shipment Date", value: shipDate, valueLabel: label, operator: "is" });
    setShipDate(""); setOpen(false);
  };

  const inputCls = "flex-1 min-w-0 h-6 text-xs border border-slate-200 rounded px-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white";
  const applyBtnCls = "h-6 w-6 flex items-center justify-center text-xs font-semibold rounded bg-primary text-white disabled:opacity-30 hover:bg-primary/90 shrink-0";

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-colors whitespace-nowrap ${
          open ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
        }`}
      >
        <SlidersHorizontal size={14} />
        Add filter
        <ChevronDown size={12} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-72 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5 max-h-96 overflow-y-auto">
          <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Amount &amp; Discrepancy</p>
          <div className="px-3 pb-2 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 w-[92px] shrink-0">Invoice amt &gt;</span>
              <span className="text-[11px] text-slate-400">$</span>
              <input type="number" min="0" step="any" value={billedGt} onChange={(e) => setBilledGt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyBilledGt(); } }}
                placeholder="e.g. 500" className={inputCls} />
              <button onClick={applyBilledGt} disabled={!billedGt} className={applyBtnCls}>+</button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 w-[92px] shrink-0">Discrepancy &lt;</span>
              <span className="text-[11px] text-slate-400">$</span>
              <input type="number" min="0" step="any" value={varianceLt} onChange={(e) => setVarianceLt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyVarianceLt(); } }}
                placeholder="e.g. 1" className={inputCls} />
              <button onClick={applyVarianceLt} disabled={!varianceLt} className={applyBtnCls}>+</button>
            </div>
          </div>

          <div className="my-1 border-t border-slate-100" />

          <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Shipment Age</p>
          <div className="px-3 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 w-[92px] shrink-0">Shipped before</span>
              <input type="date" value={shipDate} onChange={(e) => setShipDate(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyShipDate(); } }}
                className={`${inputCls} pr-1`} />
              <button onClick={applyShipDate} disabled={!shipDate} className={applyBtnCls}>+</button>
            </div>
          </div>

          <div className="my-1 border-t border-slate-100" />

          {MENU_GROUPS.map((group, gi) => (
            <React.Fragment key={group.label}>
              {gi > 0 && <div className="my-1 border-t border-slate-100" />}
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
              {FILTER_OPTIONS.filter((o) => o.dimension === group.dim).map((opt) => {
                const key      = `${opt.dimension}:${opt.value}`;
                const activeId = activeMap.get(key);
                const isActive = activeId !== undefined;
                return (
                  <button key={key} onClick={() => { isActive ? onRemove(activeId!) : onAdd(opt); }}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors ${
                      isActive ? "text-primary bg-orange-50 font-medium" : "text-slate-700 hover:bg-orange-50"
                    }`}>
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

function ColumnsButton({ visibleCols, onToggle }: { visibleCols: Set<ColumnId>; onToggle: (id: ColumnId) => void }) {
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

  const toggleable  = COLUMN_DEFS.filter((c) => !c.alwaysVisible);
  const coreCols    = toggleable.filter((c) => c.group === "core");
  const extraCols   = toggleable.filter((c) => c.group === "charges");
  const extraActive = extraCols.filter((c) => visibleCols.has(c.id)).length;

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border transition-colors whitespace-nowrap ${
          open ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700"
        }`}>
        <Eye size={14} />
        Columns
        {extraActive > 0 && (
          <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px] font-medium">{extraActive}</span>
        )}
        <ChevronDown size={12} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-52 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Default</p>
          {coreCols.map((col) => (
            <label key={col.id} className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 cursor-pointer hover:bg-orange-50">
              <input type="checkbox" checked={visibleCols.has(col.id)} onChange={() => onToggle(col.id)}
                className="rounded border-slate-300 text-primary focus:ring-ring/20 cursor-pointer" />
              {col.label}
            </label>
          ))}
          <div className="my-1.5 border-t border-slate-100" />
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Charges &amp; details</p>
          {extraCols.map((col) => (
            <label key={col.id} className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 cursor-pointer hover:bg-orange-50">
              <input type="checkbox" checked={visibleCols.has(col.id)} onChange={() => onToggle(col.id)}
                className="rounded border-slate-300 text-primary focus:ring-ring/20 cursor-pointer" />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({ activeFilters, dimLogic, visibleCols, groupBy, onFiltersChange, onDimLogicChange, onToggleCol, onGroupByChange }: {
  activeFilters: ActiveFilter[];
  dimLogic: Partial<Record<FilterDimension, DimLogic>>;
  visibleCols: Set<ColumnId>;
  groupBy: GroupByDimension | null;
  onFiltersChange: (filters: ActiveFilter[]) => void;
  onDimLogicChange: (dim: FilterDimension, logic: DimLogic) => void;
  onToggleCol: (id: ColumnId) => void;
  onGroupByChange: (g: GroupByDimension | null) => void;
}) {
  const [query, setQuery]           = useState("");
  const [isParsing, setIsParsing]   = useState(false);
  const [parseError, setParseError] = useState(false);
  const [focused, setFocused]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    const t = query.trim();
    if (!t || isParsing) return;
    setIsParsing(true); setParseError(false);
    setTimeout(() => {
      const parsed = parseNL(t);
      if (parsed.length > 0) {
        const existing = new Set(activeFilters.map((f) => `${f.dimension}:${f.value}`));
        const incoming = parsed.filter((p) => !existing.has(`${p.dimension}:${p.value}`)).map((p) => ({ ...p, id: uid() }));
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
    onFiltersChange([...activeFilters, { id: uid(), dimension: opt.dimension, dimensionLabel: opt.dimensionLabel, value: opt.value, valueLabel: opt.valueLabel, operator: "is" }]);
  };

  const addRawFilter = useCallback((f: Omit<ActiveFilter, "id">) => {
    const rest = activeFilters.filter((e) => e.dimension !== f.dimension);
    onFiltersChange([...rest, { ...f, id: uid() }]);
  }, [activeFilters, onFiltersChange]);

  const removeChip = (id: string) => onFiltersChange(activeFilters.filter((f) => f.id !== id));
  const changeOp   = (id: string, op: FilterOperator) =>
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
        <div className={`relative flex flex-1 items-center gap-2 rounded-md border px-3 py-1.5 transition-all ${
          parseError ? "border-red-300 bg-red-50/60"
            : focused ? "border-ring shadow-[0_0_0_2px_rgba(254,99,1,0.1)]"
            : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
        }`}>
          <Sparkles size={13} className={`shrink-0 transition-colors ${focused || hasQuery ? "text-primary" : "text-slate-300"}`} />
          <input ref={inputRef} type="text" value={query}
            onChange={(e) => { setQuery(e.target.value); setParseError(false); }}
            onKeyDown={handleKeyDown} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder="Filter or describe exceptions…"
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none" />
          {isParsing && <Loader2 size={13} className="shrink-0 text-primary animate-spin" />}
          {!isParsing && hasQuery && <kbd className="shrink-0 text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1 py-0.5 font-sans hidden sm:block">↵</kbd>}
          {!isParsing && !hasQuery && focused && <span className="shrink-0 text-[10px] text-slate-400 hidden sm:block whitespace-nowrap">try "open FedEx" or "older than 60 days"</span>}
        </div>
        {hasQuery && <Button size="sm" onClick={handleParse} disabled={isParsing} className="h-8 text-xs shrink-0">Apply</Button>}
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <AddFilterMenu activeFilters={activeFilters} onAdd={addFromMenu} onRemove={removeChip} onAddRaw={addRawFilter} />
        <ColumnsButton visibleCols={visibleCols} onToggle={onToggleCol} />
        <GroupByButton groupBy={groupBy} onChange={onGroupByChange} />
      </div>

      {parseError && <p className="text-xs text-red-500 -mt-1 pb-2.5">No filters detected. Try "open FedEx exceptions" or "older than 60 days".</p>}

      {hasChips && (
        <div className="flex flex-wrap items-center gap-y-1.5 pb-2.5">
          {sortedFilters.map((f, i) => {
            const prev = i > 0 ? sortedFilters[i - 1] : null;
            return (
              <React.Fragment key={f.id}>
                {prev && (
                  <ChipSeparator sameDim={prev.dimension === f.dimension} prevOp={prev.operator} currOp={f.operator}
                    logic={dimLogic[f.dimension] ?? "or"} dimension={f.dimension}
                    onToggleLogic={() => { const cur = dimLogic[f.dimension] ?? "or"; onDimLogicChange(f.dimension, cur === "or" ? "and" : "or"); }} />
                )}
                <FilterChip filter={f} onRemove={() => removeChip(f.id)} onChangeOperator={(op) => changeOp(f.id, op)} />
              </React.Fragment>
            );
          })}
          <button onClick={() => onFiltersChange([])} className="text-[11px] text-slate-400 hover:text-slate-700 ml-2 transition-colors">Clear all</button>
        </div>
      )}
    </div>
  );
}

// ─── Views bar ─────────────────────────────────────────────────────────────────

function ViewTab({ view, isActive, onSwitch, onDelete }: {
  view: SavedView;
  isActive: boolean;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role="tab"
      onClick={() => onSwitch(view.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex items-center gap-1 px-4 py-2.5 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
        isActive
          ? "border-primary text-primary font-medium"
          : "border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      <span className="text-sm">{view.name}</span>
      {!view.isDefault && hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(view.id); }}
          className="ml-0.5 p-0.5 rounded text-slate-300 hover:text-red-500 transition-colors"
          aria-label={`Delete ${view.name}`}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

function ViewsBar({ views, activeViewId, onSwitch, onCreate, onDelete }: {
  views: SavedView[];
  activeViewId: string;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const commit = () => {
    const t = name.trim();
    if (t) onCreate(t);
    setAdding(false);
    setName("");
  };

  return (
    <div className="flex items-center bg-white border-b border-slate-200 px-6 shrink-0 overflow-x-auto">
      {views.map((view) => (
        <ViewTab
          key={view.id}
          view={view}
          isActive={view.id === activeViewId}
          onSwitch={onSwitch}
          onDelete={onDelete}
        />
      ))}

      {adding ? (
        <div className="flex items-center px-2 py-2.5 border-b-2 border-primary">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")  { e.preventDefault(); commit(); }
              if (e.key === "Escape") { setAdding(false); setName(""); }
            }}
            onBlur={commit}
            placeholder="View name…"
            className="text-sm w-28 focus:outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 px-3 py-2.5 text-xs text-slate-400 hover:text-slate-700 border-b-2 border-transparent transition-colors whitespace-nowrap"
        >
          <Plus size={12} />
          New view
        </button>
      )}
    </div>
  );
}

// ─── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ExceptionStatus }) {
  const cfg = EXCEPTION_STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium ${cfg.badgeCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotCls}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Root cause drawer ─────────────────────────────────────────────────────────

function RootCauseDrawer({ ex, onClose }: { ex: AuditException; onClose: () => void }) {
  const trace = ex.rateTrace ?? null;
  const meta  = EXCEPTION_CODE_META[ex.code];

  const daysInQueue = Math.floor(
    (DEMO_TODAY.getTime() - new Date(ex.shipmentDate).getTime()) / 86_400_000
  );
  const overPct =
    ex.variance !== null && ex.contractedAmount !== null && ex.contractedAmount > 0
      ? ((ex.variance / ex.contractedAmount) * 100).toFixed(1)
      : null;

  return (
    <div className="w-[480px] shrink-0 border-l border-slate-200 flex flex-col bg-white overflow-hidden">
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
            daysInQueue > 60 ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"
          }`}>
            {daysInQueue > 60 && <span className="text-red-500">⚠</span>}
            {daysInQueue} days in queue · shipped {fmtDate(ex.shipmentDate)}
          </div>
        </div>

        {!trace && (
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Exception Detail</p>
            <p className="text-sm text-slate-700 leading-relaxed">{ex.description}</p>
            <p className="mt-3 text-[11px] text-slate-400 italic">No rate trace available for this exception type.</p>
          </div>
        )}

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

// ─── Sort indicator ────────────────────────────────────────────────────────────

function SortIndicator({ col, sort, hovered }: { col: SortableCol; sort: ViewSort | null; hovered: boolean }) {
  const isActive = sort?.col === col;
  if (!isActive && !hovered) return null;
  if (!isActive) return <span className="ml-1 text-[10px] text-slate-300">↕</span>;
  return <span className="ml-1 text-[10px] text-primary">{sort!.dir === "asc" ? "↑" : "↓"}</span>;
}

// ─── Exception table ───────────────────────────────────────────────────────────

function ExceptionTable({ rows, visibleCols, selectedIds, onToggle, onToggleAll, allSelected, someSelected, isResolved, analyzingId, onAnalyze, sort, onSort }: {
  rows: AuditException[];
  visibleCols: Set<ColumnId>;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  allSelected: boolean;
  someSelected: boolean;
  isResolved: boolean;
  analyzingId: string | null;
  onAnalyze: (id: string) => void;
  sort: ViewSort | null;
  onSort: (col: SortableCol) => void;
}) {
  const [hoveredSort, setHoveredSort] = useState<SortableCol | null>(null);
  if (rows.length === 0) return null;
  const rowIds = rows.map((r) => r.id);
  const show   = (id: ColumnId) => visibleCols.has(id);

  const sortTh = (col: SortableCol, label: string, extra = "") => (
    <th
      className={`text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:bg-slate-100/60 transition-colors ${extra}`}
      onClick={() => onSort(col)}
      onMouseEnter={() => setHoveredSort(col)}
      onMouseLeave={() => setHoveredSort(null)}
    >
      {label}
      <SortIndicator col={col} sort={sort} hovered={hoveredSort === col} />
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-muted">
            <th className="w-10 px-4 py-2.5">
              {!isResolved && (
                <input type="checkbox" checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={() => onToggleAll(rowIds)}
                  className="rounded border-slate-300 text-primary focus:ring-ring/20 cursor-pointer" />
              )}
            </th>
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Invoice</th>
            {sortTh("vendor", "Vendor")}
            {show("scac") && <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">SCAC</th>}
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Charge</th>
            {sortTh("code", "Type")}
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Description</th>
            {sortTh("status", "Status")}
            {show("resolvedBy") && <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Resolved By</th>}
            {show("billedAmount")     && sortTh("billedAmount",     "Billed",      "text-right")}
            {show("contractedAmount") && sortTh("contractedAmount", "Contracted",  "text-right")}
            {show("variance")         && sortTh("variance",         "Variance",    "text-right")}
            {show("date")             && sortTh("date",             "Date")}
            {show("shipmentDate")     && sortTh("shipmentDate",     "Shipment Date")}
            {!isResolved && <th className="px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((ex) => {
            const checked     = selectedIds.has(ex.id);
            const isAnalyzing = analyzingId === ex.id;
            const meta        = EXCEPTION_CODE_META[ex.code];
            return (
              <tr key={ex.id}
                onClick={() => onAnalyze(ex.id)}
                className={`cursor-pointer transition-colors ${
                  isResolved    ? "opacity-60 hover:opacity-90 hover:bg-orange-50/30"
                  : isAnalyzing ? "bg-orange-50/60"
                  : checked     ? "bg-orange-50 hover:bg-orange-100/60"
                  : "hover:bg-orange-50/50"
                }`}>
                <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {!isResolved && (
                    <input type="checkbox" checked={checked} onChange={() => onToggle(ex.id)}
                      className="rounded border-slate-300 text-primary focus:ring-ring/20 cursor-pointer" />
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className="text-sm text-slate-800">{ex.invoiceRef}</span>
                </td>
                <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{ex.vendor}</td>
                {show("scac") && (
                  <td className="px-3 py-3">
                    <span className="font-mono text-[11px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{ex.vendorScac}</span>
                  </td>
                )}
                <td className="px-3 py-3 text-sm text-slate-700 whitespace-nowrap">{chargeName(ex.chargeCode)}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${meta.badgeCls}`}>{meta.label}</span>
                </td>
                <td className="px-3 py-3 max-w-xs">
                  <p className="text-sm text-slate-700 truncate">{ex.description}</p>
                </td>
                <td className="px-3 py-3"><StatusPill status={ex.status} /></td>
                {show("resolvedBy") && (
                  <td className="px-3 py-3 text-sm text-slate-500">{ex.resolvedBy ?? <span className="text-slate-300">—</span>}</td>
                )}
                {show("billedAmount") && (
                  <td className="px-3 py-3 text-right text-sm font-medium">
                    {ex.billedAmount !== null ? <span className="text-slate-700">{usd(ex.billedAmount as number)}</span> : <span className="text-slate-400">—</span>}
                  </td>
                )}
                {show("contractedAmount") && (
                  <td className="px-3 py-3 text-right text-sm font-medium">
                    {ex.contractedAmount !== null ? <span className="text-slate-700">{usd(ex.contractedAmount as number)}</span> : <span className="text-slate-400">—</span>}
                  </td>
                )}
                {show("variance") && (
                  <td className="px-3 py-3 text-right text-sm font-medium">
                    {ex.variance !== null
                      ? <span className={ex.variance > 0 ? "text-red-600" : "text-green-600"}>{usd(ex.variance)}</span>
                      : <span className="text-slate-400">—</span>}
                  </td>
                )}
                {show("date")         && <td className="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{ex.date}</td>}
                {show("shipmentDate") && <td className="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{fmtDate(ex.shipmentDate)}</td>}
                {!isResolved && (
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
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

// ─── Grouped exception pane ────────────────────────────────────────────────────

function GroupedExceptionPane({ rows, groupBy, visibleCols, selectedIds, onToggle, onToggleAll, analyzingId, onAnalyze, sort, onSort }: {
  rows: AuditException[];
  groupBy: GroupByDimension;
  visibleCols: Set<ColumnId>;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  analyzingId: string | null;
  onAnalyze: (id: string) => void;
  sort: ViewSort | null;
  onSort: (col: SortableCol) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const groups = groupRows(rows, groupBy);

  const toggle = (key: string) =>
    setCollapsed((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isCollapsed   = collapsed.has(group.key);
        const openIds       = group.rows.filter((r) => r.status === "OPEN").map((r) => r.id);
        const isGroupResolved = openIds.length === 0;
        const allChecked    = openIds.length > 0 && openIds.every((id) => selectedIds.has(id));
        const someChecked   = openIds.some((id) => selectedIds.has(id));

        return (
          <div key={group.key} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggle(group.key)}
              className="flex items-center gap-2 w-full px-5 py-3 text-left bg-slate-50/60 border-b border-slate-200 hover:bg-slate-100/60 transition-colors"
            >
              {isCollapsed ? <ChevronRight size={13} className="text-slate-400 shrink-0" /> : <ChevronDown size={13} className="text-slate-400 shrink-0" />}
              <span className="text-sm font-medium text-slate-800">{group.label}</span>
              <span className="ml-auto text-xs text-slate-400 font-normal">
                {group.rows.length} exception{group.rows.length !== 1 ? "s" : ""}
                {openIds.length > 0 && ` · ${openIds.length} open`}
              </span>
            </button>
            {!isCollapsed && (
              <ExceptionTable
                rows={group.rows}
                visibleCols={visibleCols}
                selectedIds={selectedIds}
                onToggle={onToggle}
                onToggleAll={onToggleAll}
                allSelected={allChecked}
                someSelected={someChecked}
                isResolved={isGroupResolved}
                analyzingId={analyzingId}
                onAnalyze={onAnalyze}
                sort={sort}
                onSort={onSort}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Exception pane ────────────────────────────────────────────────────────────

function ExceptionPane({ rows, visibleCols, selectedIds, onToggle, onToggleAll, analyzingId, onAnalyze, sort, onSort }: {
  rows: AuditException[];
  visibleCols: Set<ColumnId>;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  analyzingId: string | null;
  onAnalyze: (id: string) => void;
  sort: ViewSort | null;
  onSort: (col: SortableCol) => void;
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
            <p className="text-xs text-slate-400 mt-1">{resolvedRows.length} resolved exception{resolvedRows.length !== 1 ? "s" : ""} below</p>
          )}
        </div>
      ) : (
        <ExceptionTable rows={openRows} visibleCols={visibleCols} selectedIds={selectedIds}
          onToggle={onToggle} onToggleAll={onToggleAll}
          allSelected={allChecked} someSelected={someChecked} isResolved={false}
          analyzingId={analyzingId} onAnalyze={onAnalyze} sort={sort} onSort={onSort} />
      )}
      {resolvedRows.length > 0 && (
        <div className="border-t border-slate-200">
          <button onClick={() => setShowResolved((v) => !v)}
            className="flex items-center gap-2 w-full px-5 py-3 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50/60 transition-colors">
            {showResolved ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {resolvedRows.length} resolved exception{resolvedRows.length !== 1 ? "s" : ""}
          </button>
          {showResolved && (
            <div className="border-t border-slate-100 bg-slate-50/30">
              <ExceptionTable rows={resolvedRows} visibleCols={visibleCols} selectedIds={selectedIds}
                onToggle={onToggle} onToggleAll={onToggleAll}
                allSelected={false} someSelected={false} isResolved={true}
                analyzingId={analyzingId} onAnalyze={onAnalyze} sort={sort} onSort={onSort} />
            </div>
          )}
        </div>
      )}
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

export default function ExceptionsPage() {
  const [views, setViews]         = useState<SavedView[]>([DEFAULT_VIEW]);
  const [activeViewId, setActiveViewId] = useState("all");
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [analyzingId, setAnalyzingId]   = useState<string | null>(null);
  const [visibleCols, setVisibleCols]   = useState<Set<ColumnId>>(
    () => new Set(COLUMN_DEFS.filter((c) => c.defaultVisible).map((c) => c.id))
  );

  const activeView = useMemo(
    () => views.find((v) => v.id === activeViewId) ?? views[0],
    [views, activeViewId]
  );

  const patchView = useCallback((patch: Partial<Omit<SavedView, "id" | "isDefault">>) => {
    setViews((prev) => prev.map((v) => v.id === activeViewId ? { ...v, ...patch } : v));
  }, [activeViewId]);

  const filteredRows = useMemo(() => {
    const { filters, dimLogic, sort } = activeView;
    const filtered = exceptions.filter((ex) => {
      if (filters.length === 0) return true;
      const byDim = new Map<FilterDimension, ActiveFilter[]>();
      for (const f of filters) {
        const arr = byDim.get(f.dimension) ?? [];
        arr.push(f);
        byDim.set(f.dimension, arr);
      }
      for (const [dim, fs] of byDim) {
        const logic      = dimLogic[dim] ?? "or";
        const isFilters  = fs.filter((f) => f.operator === "is");
        const notFilters = fs.filter((f) => f.operator === "is_not");
        for (const f of notFilters) { if (matchesDim(ex, dim, f.value)) return false; }
        if (isFilters.length > 0) {
          const passes = logic === "or"
            ? isFilters.some((f)  => matchesDim(ex, dim, f.value))
            : isFilters.every((f) => matchesDim(ex, dim, f.value));
          if (!passes) return false;
        }
      }
      return true;
    });
    return sortRows(filtered, sort);
  }, [activeView]);

  const analyzingException = useMemo(
    () => analyzingId ? (exceptions.find((e) => e.id === analyzingId) ?? null) : null,
    [analyzingId]
  );

  const openTotal    = exceptions.filter((e) => e.status === "OPEN").length;
  const openFiltered = filteredRows.filter((e) => e.status === "OPEN").length;
  const hasFilters   = activeView.filters.length > 0;

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

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

  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    const activeDims = new Set(filters.map((f) => f.dimension));
    const newDimLogic = { ...activeView.dimLogic };
    (Object.keys(newDimLogic) as FilterDimension[]).forEach((d) => { if (!activeDims.has(d)) delete newDimLogic[d]; });
    patchView({ filters, dimLogic: filters.length === 0 ? {} : newDimLogic });
    clearSelection();
  }, [activeView.dimLogic, patchView, clearSelection]);

  const handleDimLogicChange = useCallback((dim: FilterDimension, logic: DimLogic) => {
    patchView({ dimLogic: { ...activeView.dimLogic, [dim]: logic } });
    clearSelection();
  }, [activeView.dimLogic, patchView, clearSelection]);

  const handleSort = useCallback((col: SortableCol) => {
    const cur = activeView.sort;
    const newSort: ViewSort | null =
      !cur || cur.col !== col ? { col, dir: "asc" }
      : cur.dir === "asc"     ? { col, dir: "desc" }
      : null;
    patchView({ sort: newSort });
  }, [activeView.sort, patchView]);

  const handleGroupByChange = useCallback((g: GroupByDimension | null) => {
    patchView({ groupBy: g });
  }, [patchView]);

  const handleToggleCol = useCallback((id: ColumnId) => {
    setVisibleCols((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  const handleAnalyze = useCallback((id: string) => {
    setAnalyzingId((prev) => (prev === id ? null : id));
  }, []);

  const handleSwitchView = useCallback((id: string) => {
    setActiveViewId(id);
    clearSelection();
    setAnalyzingId(null);
  }, [clearSelection]);

  const handleCreateView = useCallback((name: string) => {
    const newView: SavedView = {
      id: vid(),
      name,
      filters:  activeView.filters,
      dimLogic: activeView.dimLogic,
      sort:     activeView.sort,
      groupBy:  activeView.groupBy,
      isDefault: false,
    };
    setViews((prev) => [...prev, newView]);
    setActiveViewId(newView.id);
    clearSelection();
    setAnalyzingId(null);
  }, [activeView, clearSelection]);

  const handleDeleteView = useCallback((id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
    if (activeViewId === id) handleSwitchView("all");
  }, [activeViewId, handleSwitchView]);

  const selectionCount = selectedIds.size;

  const sharedPaneProps = {
    rows: filteredRows,
    visibleCols,
    selectedIds,
    onToggle: handleToggle,
    onToggleAll: handleToggleAll,
    analyzingId,
    onAnalyze: handleAnalyze,
    sort: activeView.sort,
    onSort: handleSort,
  };

  return (
    <div className="min-h-full flex flex-col">

      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-slate-950">Exceptions</h1>
            <p className="text-sm text-slate-500 mt-0.5">Audit exceptions across all invoices · {openTotal} open</p>
          </div>
          <Link to="/agents/audit-agent">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings size={13} />
              Configure Audit Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* Views tab bar */}
      <ViewsBar
        views={views}
        activeViewId={activeViewId}
        onSwitch={handleSwitchView}
        onCreate={handleCreateView}
        onDelete={handleDeleteView}
      />

      {/* Filter + groupby bar */}
      <FilterBar
        activeFilters={activeView.filters}
        dimLogic={activeView.dimLogic}
        visibleCols={visibleCols}
        groupBy={activeView.groupBy}
        onFiltersChange={handleFiltersChange}
        onDimLogicChange={handleDimLogicChange}
        onToggleCol={handleToggleCol}
        onGroupByChange={handleGroupByChange}
      />

      {/* Main content + drawer */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="px-5 pt-4 pb-0">
            {hasFilters && (
              <p className="text-xs text-slate-400 mb-3">
                {openFiltered} open
                {filteredRows.filter((e) => e.status !== "OPEN").length > 0 && ` · ${filteredRows.filter((e) => e.status !== "OPEN").length} resolved`}
                {` · ${activeView.filters.length} active filter${activeView.filters.length !== 1 ? "s" : ""}`}
              </p>
            )}

            {activeView.groupBy ? (
              <GroupedExceptionPane groupBy={activeView.groupBy} {...sharedPaneProps} />
            ) : (
              <ExceptionPane {...sharedPaneProps} />
            )}

            <div className={selectionCount > 0 ? "h-16" : "h-5"} />
          </div>
        </div>

        {analyzingException && (
          <RootCauseDrawer ex={analyzingException} onClose={() => setAnalyzingId(null)} />
        )}
      </div>

      {selectionCount > 0 && (
        <BulkActionBar count={selectionCount} onAccept={clearSelection} onDispute={clearSelection} onClear={clearSelection} />
      )}
    </div>
  );
}
