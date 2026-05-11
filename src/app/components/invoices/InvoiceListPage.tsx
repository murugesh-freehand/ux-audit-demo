import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  Upload, Filter, ChevronRight, Clock, ChevronDown, X,
  FileText, CheckCircle2, AlertCircle, RefreshCw, Search,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { StatusBadge, ModeBadge } from "../shared/StatusBadge";
import { cn } from "../ui/utils";
import { invoices, type Invoice, type InvoiceStatus, type AuditStatus } from "../../data/mockData";

const PROCESSING_JOBS = 71;

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

// ─── Mock processing jobs ─────────────────────────────────────────────────────

type ProcessingStatus = "COMPLETED" | "DUPLICATE" | "PROCESSING" | "FAILED";

interface ProcessingJob {
  id: string;
  file: string;
  type: string;
  status: ProcessingStatus;
  durationSec: number | null;
  createdAt: string;
}

const processingJobs: ProcessingJob[] = [
  { id: "pj-01", file: "FXFE_886231774530_Priority_Corrected-CPP.txt", type: "EXTRACTION", status: "COMPLETED", durationSec: 0.2, createdAt: "2026-05-05T11:26:09Z" },
  { id: "pj-02", file: "FXFE_886231774530_Priority_Corrected-CPP.txt", type: "EXTRACTION", status: "COMPLETED", durationSec: 0.3, createdAt: "2026-04-30T17:26:51Z" },
  { id: "pj-03", file: "FXFE_886231774530_Priority_Corrected-CPP.txt", type: "EXTRACTION", status: "COMPLETED", durationSec: 0.2, createdAt: "2026-04-28T21:43:16Z" },
  { id: "pj-04", file: "zebra_fedex.txt", type: "EXTRACTION", status: "COMPLETED", durationSec: 0.1, createdAt: "2026-04-28T16:16:42Z" },
  { id: "pj-05", file: "zebra_fedex.txt", type: "EXTRACTION", status: "COMPLETED", durationSec: 0.2, createdAt: "2026-04-28T13:00:07Z" },
  { id: "pj-06", file: "FXFE_6178005960_EDI_Priority.txt", type: "EXTRACTION", status: "DUPLICATE", durationSec: null, createdAt: "2026-04-23T17:32:59Z" },
  { id: "pj-07", file: "FXNL_8202119914_EDI_Economy.txt", type: "EXTRACTION", status: "COMPLETED", durationSec: 1.1, createdAt: "2026-04-16T07:30:26Z" },
  { id: "pj-08", file: "FXNL_8202119914_EDI_Economy copy.txt", type: "EXTRACTION", status: "DUPLICATE", durationSec: null, createdAt: "2026-04-16T07:28:42Z" },
  { id: "pj-09", file: "FXNL_8202119914_EDI_Economy.txt", type: "EXTRACTION", status: "DUPLICATE", durationSec: null, createdAt: "2026-04-16T07:17:53Z" },
  { id: "pj-10", file: "ZBRA_DTSC_N149571.pdf", type: "EXTRACTION", status: "COMPLETED", durationSec: 0.9, createdAt: "2026-04-16T00:59:59Z" },
  { id: "pj-11", file: "FXFE_8363087316_EDI_Priority.txt", type: "EXTRACTION", status: "COMPLETED", durationSec: 0.1, createdAt: "2026-04-16T00:42:06Z" },
  { id: "pj-12", file: "FXFE_6178005960_EDI_Priority.txt", type: "EXTRACTION", status: "COMPLETED", durationSec: 0.1, createdAt: "2026-04-16T00:41:37Z" },
  { id: "pj-13", file: "FXNL_invoice_4136588131.pdf", type: "EXTRACTION", status: "COMPLETED", durationSec: 0.8, createdAt: "2026-04-16T00:41:05Z" },
  { id: "pj-14", file: "DTSC_N140081_EDI.txt", type: "EXTRACTION", status: "COMPLETED", durationSec: 0.1, createdAt: "2026-04-16T00:40:04Z" },
  { id: "pj-15", file: "FXFE_6178005960_EDI_Priority.txt", type: "EXTRACTION", status: "COMPLETED", durationSec: 0.1, createdAt: "2026-04-16T00:39:33Z" },
];

const statusCfg: Record<ProcessingStatus, { label: string; cls: string; icon: React.ElementType }> = {
  COMPLETED:  { label: "Completed",  cls: "bg-green-50 text-green-700 border-green-200",   icon: CheckCircle2 },
  DUPLICATE:  { label: "Duplicate",  cls: "bg-amber-50 text-amber-700 border-amber-200",   icon: AlertCircle },
  PROCESSING: { label: "Processing", cls: "bg-blue-50 text-blue-700 border-blue-200",      icon: RefreshCw },
  FAILED:     { label: "Failed",     cls: "bg-red-50 text-red-700 border-red-200",         icon: AlertCircle },
};

const fmtDateTime = (ts: string) =>
  new Date(ts).toLocaleString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).replace(",", "");

// ─── Processing Jobs Sheet ────────────────────────────────────────────────────

function ProcessingSheet({
  open, onOpenChange,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
}) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all"
    ? processingJobs
    : processingJobs.filter((j) => j.status === statusFilter);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[640px] max-w-full flex flex-col overflow-hidden p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold text-slate-950">Processing Jobs</SheetTitle>
            <span className="text-xs text-slate-400">{PROCESSING_JOBS} total</span>
          </div>
          {/* Filter bar */}
          <div className="flex items-center gap-2 mt-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:border-ring"
            >
              <option value="all">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="DUPLICATE">Duplicate</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">File</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-28">Status</th>
                <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-20">Duration</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-40">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((job) => {
                const cfg = statusCfg[job.status];
                return (
                  <tr key={job.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={13} className="text-slate-300 shrink-0" />
                        <span className="text-xs text-primary truncate max-w-[220px]" title={job.file}>
                          {job.file}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 pl-5">{job.type}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                        {job.status === "PROCESSING" ? (
                          <cfg.icon size={10} className="animate-spin" />
                        ) : null}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs text-slate-500">
                        {job.durationSec !== null ? `${job.durationSec}s` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(job.createdAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Vendor Dropdown ─────────────────────────────────────────────────────────

function useClickOutside(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [cb]);
  return ref;
}

function VendorDropdown({
  vendors, selected, onToggle, onClear,
}: {
  vendors: string[]; selected: Set<string>;
  onToggle: (v: string) => void; onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useClickOutside(() => setOpen(false));

  const displayed = q.trim()
    ? vendors.filter(v => v.toLowerCase().includes(q.trim().toLowerCase()))
    : vendors.slice(0, 10);
  const hasMore = !q.trim() && vendors.length > 10;

  const label = selected.size === 0
    ? "All Vendors"
    : selected.size === 1
      ? [...selected][0]
      : `${selected.size} vendors`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 bg-white transition-colors whitespace-nowrap",
          selected.size > 0
            ? "border-primary text-primary bg-orange-50"
            : "border-slate-200 text-slate-700 hover:border-slate-300"
        )}
      >
        {label}
        {selected.size > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-primary text-white text-[10px] w-4 h-4 font-medium leading-none">
            {selected.size}
          </span>
        )}
        <ChevronDown size={12} className={cn("text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg border border-slate-200 shadow-lg z-20 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search vendors…"
                className="w-full text-sm pl-7 pr-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="p-1.5 space-y-0.5 max-h-52 overflow-y-auto">
            {displayed.length === 0 ? (
              <p className="text-xs text-slate-400 px-2 py-2 text-center">No results</p>
            ) : displayed.map(vendor => (
              <label key={vendor} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selected.has(vendor)}
                  onChange={() => onToggle(vendor)}
                  className="accent-primary w-3.5 h-3.5 shrink-0"
                />
                <span className="text-sm text-slate-700 truncate">{vendor}</span>
              </label>
            ))}
            {hasMore && (
              <p className="text-xs text-slate-400 px-2 py-1.5 text-center italic">
                +{vendors.length - 10} more — type to search
              </p>
            )}
          </div>

          {selected.size > 0 && (
            <div className="px-3 py-2 border-t border-slate-100">
              <button onClick={onClear} className="text-[11px] text-slate-400 hover:text-primary transition-colors">
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Highlight ───────────────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-100 text-amber-900 rounded-sm px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Audit badge ──────────────────────────────────────────────────────────────

function AuditBadge({ status }: { status: AuditStatus }) {
  const map: Record<AuditStatus, { label: string; cls: string }> = {
    PASS:    { label: "Pass",    cls: "bg-green-50 text-green-700 border-green-200" },
    FAIL:    { label: "Fail",    cls: "bg-red-50 text-red-700 border-red-200" },
    WARNING: { label: "Warning", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    PENDING: { label: "Pending", cls: "bg-slate-50 text-slate-500 border-slate-200" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── More Filters Popover ────────────────────────────────────────────────────

interface MoreFilters {
  type: string;
  mode: string;
  currency: string;
  auditStatus: string;
}

function MoreFiltersPopover({
  filters, onChange, onReset, activeCount,
}: {
  filters: MoreFilters; onChange: (f: MoreFilters) => void;
  onReset: () => void; activeCount: number;
}) {
  const set = (key: keyof MoreFilters, val: string) =>
    onChange({ ...filters, [key]: val });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 relative">
          <Filter size={13} />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-white text-[10px] w-4 h-4 font-medium">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-4" align="start">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-800">More Filters</span>
          {activeCount > 0 && (
            <button onClick={onReset} className="text-xs text-primary hover:underline">
              Reset all
            </button>
          )}
        </div>
        {[
          { label: "Type",         key: "type",        options: ["all:All Types", "Freight:Freight", "Accessorial:Accessorial"] },
          { label: "Mode",         key: "mode",        options: ["all:All Modes", "LTL:LTL", "FTL:FTL", "ROAD:Road", "AIR:Air", "OCEAN:Ocean"] },
          { label: "Currency",     key: "currency",    options: ["all:All Currencies", "USD:USD", "CAD:CAD"] },
          { label: "Audit Result", key: "auditStatus", options: ["all:All Results", "PASS:Pass", "FAIL:Fail", "WARNING:Warning", "PENDING:Pending"] },
        ].map(({ label, key, options }) => (
          <div key={key}>
            <label className="text-xs font-medium text-slate-500 block mb-1">{label}</label>
            <select
              value={filters[key as keyof MoreFilters]}
              onChange={(e) => set(key as keyof MoreFilters, e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:border-ring"
            >
              {options.map((opt) => {
                const [val, lbl] = opt.split(":");
                return <option key={val} value={val}>{lbl}</option>;
              })}
            </select>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ─── Invoice Row ──────────────────────────────────────────────────────────────

function InvoiceRow({ invoice, query }: { invoice: Invoice; query: string }) {
  return (
    <Link
      to={`/invoices/${invoice.id}`}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group border-b border-slate-100 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-950">
            <Highlight text={invoice.ref} query={query} />
          </span>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-slate-400">
            <Highlight text={invoice.vendor} query={query} />
          </span>
          <span className="text-slate-200">·</span>
          <ModeBadge mode={invoice.mode} />
          <span className="text-xs text-slate-400">{invoice.type}</span>
          <span className="text-slate-200">·</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Highlight text={`${invoice.origin.city}, ${invoice.origin.state}`} query={query} />
            <span className="text-slate-300 mx-0.5">→</span>
            <Highlight text={`${invoice.destination.city}, ${invoice.destination.state}`} query={query} />
          </span>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-8 text-sm">
        {/* Amount */}
        <div className="text-right w-28">
          <p className="text-slate-950 font-medium">{usd(invoice.amount)}</p>
          <p className="text-xs text-slate-400">{invoice.currency}</p>
        </div>
        {/* Audit Status — just the badge, no sub-label */}
        <div className="text-right w-20">
          <AuditBadge status={invoice.auditStatus} />
        </div>
        {/* Bill Date — just the date, no sub-label */}
        <div className="text-right w-28">
          <p className="text-xs text-slate-600">
            {new Date(invoice.billedDate).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </p>
        </div>
      </div>

      <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors ml-2" />
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvoiceListPage() {
  const [search, setSearch]             = useState("");
  const [vendorFilters, setVendorFilters] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [moreFilters, setMoreFilters]   = useState<MoreFilters>({
    type: "all", mode: "all", currency: "all", auditStatus: "all",
  });
  const [processingOpen, setProcessingOpen] = useState(false);

  // Vendors sorted by invoice frequency (most common first)
  const allVendors = useMemo(() => {
    const counts = new Map<string, number>();
    invoices.forEach(inv => counts.set(inv.vendor, (counts.get(inv.vendor) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
  }, []);

  const moreActiveCount = [
    moreFilters.type !== "all",
    moreFilters.mode !== "all",
    moreFilters.currency !== "all",
    moreFilters.auditStatus !== "all",
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (q) {
        const route = `${inv.origin.city}, ${inv.origin.state} ${inv.destination.city}, ${inv.destination.state}`;
        if (![inv.ref, inv.vendor, route].some(v => v.toLowerCase().includes(q))) return false;
      }
      if (vendorFilters.size > 0 && !vendorFilters.has(inv.vendor)) return false;
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (moreFilters.type !== "all" && inv.type !== moreFilters.type) return false;
      if (moreFilters.mode !== "all" && inv.mode !== moreFilters.mode) return false;
      if (moreFilters.currency !== "all" && inv.currency !== moreFilters.currency) return false;
      if (moreFilters.auditStatus !== "all" && inv.auditStatus !== moreFilters.auditStatus) return false;
      return true;
    });
  }, [search, vendorFilters, statusFilter, moreFilters]);

  function toggleVendor(v: string) {
    setVendorFilters(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  }

  const resetAll = () => {
    setSearch("");
    setVendorFilters(new Set());
    setStatusFilter("all");
    setMoreFilters({ type: "all", mode: "all", currency: "all", auditStatus: "all" });
  };

  const hasAnyFilter = !!search || vendorFilters.size > 0 || statusFilter !== "all" || moreActiveCount > 0;

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            {/* h1 and chip on the same baseline */}
            <div className="flex items-center gap-2.5">
              <h1 className="text-slate-950">Invoices</h1>
              <button
                onClick={() => setProcessingOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <Clock size={11} className="text-amber-600" />
                <span className="text-xs font-medium text-amber-700">{PROCESSING_JOBS} processing</span>
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{filtered.length} of {invoices.length} invoices</p>
          </div>
          <Button size="sm" className="gap-1.5">
            <Upload size={14} />
            Upload Invoices
          </Button>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {/* Search */}
          <div className="relative min-w-56 flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice #, vendor, route…"
              className="pl-8 text-sm bg-slate-50 border-slate-200 focus:bg-white"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>

          <VendorDropdown
            vendors={allVendors}
            selected={vendorFilters}
            onToggle={toggleVendor}
            onClear={() => setVendorFilters(new Set())}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:border-ring"
          >
            <option value="all">All Statuses</option>
            {(["APPROVED", "HELD", "INCOMPLETE", "REJECTED", "COMPLETED", "PENDING"] as InvoiceStatus[]).map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>

          <MoreFiltersPopover
            filters={moreFilters}
            onChange={setMoreFilters}
            onReset={() => setMoreFilters({ type: "all", mode: "all", currency: "all", auditStatus: "all" })}
            activeCount={moreActiveCount}
          />

          {hasAnyFilter && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors ml-1"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Invoice list */}
      <div className="px-6 py-5">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Table header */}
          <div className="flex items-center px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <span className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wide">Invoice</span>
            <div className="hidden lg:flex items-center gap-8 mr-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-28 text-right">Amount</span>
              {/* Renamed from "Audit" → "Audit Status" */}
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-20 text-right">Audit Status</span>
              {/* Renamed from "Billed" → "Bill Date" */}
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-28 text-right">Bill Date</span>
            </div>
            <span className="w-5" />
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              No invoices match these filters
            </div>
          ) : (
            filtered.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} query={search.trim()} />)
          )}
        </div>
      </div>

      {/* Processing jobs sheet */}
      <ProcessingSheet open={processingOpen} onOpenChange={setProcessingOpen} />
    </div>
  );
}