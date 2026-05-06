import React, { useState, useMemo, useCallback } from "react";
import { Link } from "react-router";
import {
  Settings, ChevronDown, ChevronRight, X, CheckSquare,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  exceptions,
  type AuditException,
  type ExceptionCode,
  type ExceptionStatus,
} from "../../data/exceptionsData";

// ─── Constants ─────────────────────────────────────────────────────────────────

const CODE_META: Record<ExceptionCode, { label: string; badgeCls: string; dotCls: string }> = {
  RATE_UNAVAILABLE:   { label: "Rate Unavailable",   badgeCls: "bg-red-50 text-red-700 border-red-200",       dotCls: "bg-red-400" },
  CROSS_DOC_MISMATCH: { label: "Cross-Doc Mismatch", badgeCls: "bg-amber-50 text-amber-700 border-amber-200", dotCls: "bg-amber-400" },
  BUSINESS_RULE:      { label: "Business Rule",      badgeCls: "bg-blue-50 text-blue-700 border-blue-200",    dotCls: "bg-blue-400" },
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
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", signDisplay: "exceptZero",
  }).format(n);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ExceptionStatus }) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STATUS_CLS[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Left rail category nav ───────────────────────────────────────────────────

interface Category { id: string; label: string; openCount: number; dotCls?: string }

function CategoryNav({
  categories, selected, onSelect,
}: {
  categories: Category[]; selected: string; onSelect: (id: string) => void;
}) {
  return (
    <nav className="w-48 shrink-0 border-r border-slate-200 bg-white flex flex-col pt-2 pb-4">
      {categories.map((cat, i) => {
        const isActive = selected === cat.id;
        return (
          <React.Fragment key={cat.id}>
            {i === 1 && <div className="mx-3 my-2 border-t border-slate-200" />}
            <button
              onClick={() => onSelect(cat.id)}
              className={`relative flex items-center justify-between gap-2 mx-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                isActive
                  ? "bg-orange-50 text-primary font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r bg-primary" />
              )}
              <div className="flex items-center gap-2 min-w-0">
                {cat.dotCls && cat.id !== "all" && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dotCls}`} />
                )}
                <span className="truncate">{cat.label}</span>
              </div>
              {cat.openCount > 0 && (
                <span className={`inline-flex items-center justify-center rounded-full text-[10px] font-medium w-5 h-5 shrink-0 ${
                  isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {cat.openCount}
                </span>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Exception Table with bulk checkboxes ─────────────────────────────────────

function ExceptionTable({
  rows,
  showCode,
  selectedIds,
  onToggle,
  onToggleAll,
  allSelected,
  someSelected,
  isResolved,
}: {
  rows: AuditException[];
  showCode: boolean;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  allSelected: boolean;
  someSelected: boolean;
  isResolved: boolean;
}) {
  if (rows.length === 0) return null;
  const openIds = rows.filter((r) => !isResolved).map((r) => r.id);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60">
            {/* Select-all checkbox — only shown on open rows */}
            <th className="w-10 px-4 py-2.5">
              {!isResolved && (
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={() => onToggleAll(openIds)}
                  className="rounded border-gray-300 text-primary focus:ring-ring/20 cursor-pointer"
                />
              )}
            </th>
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Invoice</th>
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Vendor</th>
            {showCode && (
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Type</th>
            )}
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Description</th>
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
            <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Variance</th>
            <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Date</th>
            {!isResolved && (
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((ex) => {
            const isChecked = selectedIds.has(ex.id);
            const meta = CODE_META[ex.code];
            return (
              <tr
                key={ex.id}
                className={`transition-colors ${
                  isResolved ? "opacity-50 hover:opacity-80" : isChecked ? "bg-orange-50/40" : "hover:bg-slate-50/40"
                }`}
              >
                <td className="w-10 px-4 py-3">
                  {!isResolved && (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggle(ex.id)}
                      className="rounded border-gray-300 text-primary focus:ring-ring/20 cursor-pointer"
                    />
                  )}
                </td>
                <td className="px-3 py-3">
                  <Link to="/invoices" className="font-mono text-xs text-primary hover:underline">
                    {ex.invoiceRef}
                  </Link>
                </td>
                <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{ex.vendor}</td>
                {showCode && (
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${meta.badgeCls}`}>
                      {meta.label}
                    </span>
                  </td>
                )}
                <td className="px-3 py-3 max-w-xs">
                  <p className="text-slate-700 truncate">{ex.description}</p>
                  <span className="font-mono text-[10px] text-slate-400">{ex.chargeCode}</span>
                </td>
                <td className="px-3 py-3">
                  <StatusPill status={ex.status} />
                  {ex.resolvedBy && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{ex.resolvedBy}</p>
                  )}
                </td>
                <td className="px-3 py-3 text-right font-medium">
                  {ex.variance !== null ? (
                    <span className={ex.variance > 0 ? "text-red-600" : "text-green-600"}>
                      {usd(ex.variance)}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{ex.date}</td>
                {!isResolved && (
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800">
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Dispute
                      </Button>
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

function BulkActionBar({
  count,
  onAccept,
  onDispute,
  onClear,
}: {
  count: number;
  onAccept: () => void;
  onDispute: () => void;
  onClear: () => void;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-10 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-5 py-3 flex items-center gap-3">
      {/* Count */}
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
        <CheckSquare size={15} className="text-primary" />
        {count} exception{count !== 1 ? "s" : ""} selected
      </span>

      <div className="h-4 w-px bg-slate-200 mx-1" />

      {/* Accept all — ghost (less prominent: accepting is not the primary concern) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAccept}
        className="gap-1.5 text-slate-600 hover:text-slate-950"
      >
        Accept selected
      </Button>

      {/* Dispute all — outlined danger (primary concern) */}
      <Button
        variant="outline"
        size="sm"
        onClick={onDispute}
        className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
      >
        Dispute selected
      </Button>

      {/* Clear */}
      <button
        onClick={onClear}
        className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors"
      >
        <X size={13} />
        Clear selection
      </button>
    </div>
  );
}

// ─── Right pane ────────────────────────────────────────────────────────────────

function ExceptionPane({
  allRows,
  selectedCode,
  selectedIds,
  onToggle,
  onToggleAll,
}: {
  allRows: AuditException[];
  selectedCode: string;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[], forceState?: boolean) => void;
}) {
  const [showResolved, setShowResolved] = useState(false);

  const visibleRows =
    selectedCode === "all"
      ? allRows
      : allRows.filter((e) => e.code === selectedCode);

  const openRows     = visibleRows.filter((e) => e.status === "OPEN");
  const resolvedRows = visibleRows.filter((e) => e.status !== "OPEN");

  React.useEffect(() => {
    setShowResolved(false);
  }, [selectedCode]);

  const openIds    = openRows.map((r) => r.id);
  const allChecked = openIds.length > 0 && openIds.every((id) => selectedIds.has(id));
  const someChecked = openIds.some((id) => selectedIds.has(id));

  const showCode = selectedCode === "all";

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {openRows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">
          No open exceptions in this category
        </div>
      ) : (
        <ExceptionTable
          rows={openRows}
          showCode={showCode}
          selectedIds={selectedIds}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
          allSelected={allChecked}
          someSelected={someChecked}
          isResolved={false}
        />
      )}

      {/* Single resolved toggle at the very bottom */}
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
                rows={resolvedRows}
                showCode={showCode}
                selectedIds={selectedIds}
                onToggle={onToggle}
                onToggleAll={onToggleAll}
                allSelected={false}
                someSelected={false}
                isResolved={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type ExTab = "exceptions" | "disputes";

export default function ExceptionsPage() {
  const [tab, setTab]               = useState<ExTab>("exceptions");
  const [selectedCode, setSelected] = useState("all");
  const [statusFilter, setStatus]   = useState("all");
  const [vendorFilter, setVendor]   = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allVendors = useMemo(
    () => [...new Set(exceptions.map((e) => e.vendor))].sort(),
    []
  );

  const filteredRows = useMemo(() => {
    return exceptions.filter((e) => {
      if (tab === "disputes" && e.status !== "DISPUTED") return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (vendorFilter !== "all" && e.vendor !== vendorFilter) return false;
      return true;
    });
  }, [tab, statusFilter, vendorFilter]);

  const allCodes = useMemo(
    () => [...new Set(exceptions.map((e) => e.code))] as ExceptionCode[],
    []
  );

  const openTotal = exceptions.filter((e) => e.status === "OPEN").length;

  const categories: Category[] = [
    {
      id: "all",
      label: "All Exceptions",
      openCount: filteredRows.filter((e) => e.status === "OPEN").length,
    },
    ...allCodes.map((code) => {
      const codeRows = filteredRows.filter((e) => e.code === code);
      return {
        id: code,
        label: CODE_META[code].label,
        openCount: codeRows.filter((e) => e.status === "OPEN").length,
        dotCls: CODE_META[code].dotCls,
      };
    }),
  ];

  // ── Selection handlers ──────────────────────────────────────────────────────

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allIn = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allIn) { ids.forEach((id) => next.delete(id)); }
      else       { ids.forEach((id) => next.add(id)); }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkAccept  = useCallback(() => {
    // In production: dispatch mutation; here just clear selection
    clearSelection();
  }, [clearSelection]);

  const handleBulkDispute = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const hasFilter = statusFilter !== "all" || vendorFilter !== "all";
  const selectionCount = selectedIds.size;

  return (
    <div className="min-h-full flex flex-col">
      {/* Page header */}
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

        {/* Tabs */}
        <div className="flex items-center -mb-4 mt-4">
          {(["exceptions", "disputes"] as ExTab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); clearSelection(); }}
              className={`px-4 py-2.5 text-sm border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 shrink-0">
        <select
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); clearSelection(); }}
          className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:border-ring"
        >
          <option value="all">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISPUTED">Disputed</option>
          <option value="ACCEPTED">Accepted</option>
        </select>

        <select
          value={vendorFilter}
          onChange={(e) => { setVendor(e.target.value); clearSelection(); }}
          className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:border-ring"
        >
          <option value="all">All Vendors</option>
          {allVendors.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {hasFilter && (
          <button
            onClick={() => { setStatus("all"); setVendor("all"); clearSelection(); }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={12} /> Clear
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400">
          {filteredRows.filter((e) => e.status === "OPEN").length} open
          {filteredRows.filter((e) => e.status !== "OPEN").length > 0 && (
            <span className="text-slate-300 ml-1">
              · {filteredRows.filter((e) => e.status !== "OPEN").length} resolved
            </span>
          )}
        </span>
      </div>

      {/* Body: left rail + content */}
      <div className="flex flex-1 overflow-hidden">
        <CategoryNav
          categories={categories}
          selected={selectedCode}
          onSelect={(id) => { setSelected(id); clearSelection(); }}
        />

        {/* Right pane — relative so bulk bar sticks to its bottom */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 pb-0">
            <ExceptionPane
              allRows={filteredRows}
              selectedCode={selectedCode}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
            />
            {/* Bottom spacer so content isn't hidden behind bulk bar */}
            <div className={selectionCount > 0 ? "h-16" : "h-5"} />
          </div>

          {/* Bulk action bar — only when items are selected */}
          {selectionCount > 0 && (
            <BulkActionBar
              count={selectionCount}
              onAccept={handleBulkAccept}
              onDispute={handleBulkDispute}
              onClear={clearSelection}
            />
          )}
        </div>
      </div>
    </div>
  );
}
