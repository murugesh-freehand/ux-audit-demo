import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  Upload,
  History,
  X,
  Copy,
  Check,
  Clock,
  AlertCircle,
  Search,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Progress } from "../ui/progress";
import { StatusBadge, ModeBadge } from "../shared/StatusBadge";
import { cn } from "../ui/utils";
import {
  carriers,
  contracts,
  lanes,
  uploadJobs,
  type Carrier,
} from "../../data/mockData";

// ─── Demo reference date (aligns with mock data timeline) ────────────────────
const DEMO_TODAY = new Date("2026-05-08T00:00:00");

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - DEMO_TODAY.getTime()) / 86_400_000);
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Upload History ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1 text-slate-400 hover:text-slate-600 transition-colors"
      title="Copy"
    >
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
    </button>
  );
}

function UploadHistorySheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500 hover:text-slate-800">
          <History size={14} /> Upload History
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[640px] max-w-full flex flex-col overflow-hidden p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-200 shrink-0">
          <SheetTitle className="text-base font-semibold text-slate-950">Upload History</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[210px]" /><col className="w-[90px]" />
              <col className="w-[110px]" /><col className="w-[auto]" /><col className="w-[60px]" />
            </colgroup>
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Job Ref</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Carrier</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Files</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Rates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uploadJobs.map((job) => {
                const shortRef = job.ref.length > 26 ? job.ref.slice(0, 26) + "…" : job.ref;
                return (
                  <tr key={job.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-mono text-xs text-slate-700 truncate" title={job.ref}>{shortRef}</span>
                        <CopyButton text={job.ref} />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(job.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-xs text-slate-800 block">{job.scac}</span>
                      <ModeBadge mode={job.mode} className="mt-1" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <StatusBadge status={job.status} />
                        {job.status === "PROCESSING" && <Progress value={job.progress} className="h-1 w-16" />}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-slate-700 truncate block max-w-full">{job.files[0]}</span>
                      {job.files.length > 1 && <span className="text-[11px] text-slate-400">+{job.files.length - 1} more</span>}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-slate-700">
                      {job.rates > 0 ? job.rates.toLocaleString() : "—"}
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

// ─── Carrier Row ──────────────────────────────────────────────────────────────

function CarrierRow({ carrier }: { carrier: Carrier }) {
  return (
    <Link
      to={`/contracts/${carrier.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors group border-b border-slate-100 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-950">{carrier.name}</span>
          <span className="font-mono text-xs text-slate-400">{carrier.scac}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {carrier.modes.map((m) => <ModeBadge key={m} mode={m} />)}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm">
        <p className="text-slate-950 font-medium w-20 text-right">{carrier.activeLanes.toLocaleString()}</p>
        <p className="text-slate-500 text-xs font-medium w-20 text-right">{carrier.totalLanes.toLocaleString()}</p>
        <p className="text-slate-500 text-xs w-24 text-right">
          {new Date(carrier.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
      <div className="flex items-center ml-4">
        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </Link>
  );
}

// ─── Validity Cell ────────────────────────────────────────────────────────────

function ValidityCell({ validFrom, validTo }: { validFrom: string; validTo: string }) {
  const days = daysUntil(validTo);
  const range = `${fmt(validFrom)} – ${fmt(validTo)}`;
  if (days < 0) return (
    <div>
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-medium text-red-700 whitespace-nowrap">
        <AlertCircle size={9} /> Expired
      </span>
      <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{range}</p>
    </div>
  );
  if (days <= 30) return (
    <div>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 whitespace-nowrap">
        <AlertCircle size={11} /> {days}d left
      </span>
      <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{range}</p>
    </div>
  );
  if (days <= 60) return (
    <div>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 whitespace-nowrap">
        <Clock size={11} /> {days}d left
      </span>
      <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{range}</p>
    </div>
  );
  return <p className="text-xs text-slate-500 whitespace-nowrap">{range}</p>;
}

// ─── Shared: click-outside hook ───────────────────────────────────────────────

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

// ─── MultiSelectDropdown ──────────────────────────────────────────────────────
// Explicit filter dropdown with checkbox list. Optionally searchable (for long lists).

function MultiSelectDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
  searchable = false,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: Set<string>;
  onToggle: (v: string) => void;
  onClear: () => void;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const close = () => { setOpen(false); setQuery(""); };
  const ref = useClickOutside(close);

  const displayed = searchable && query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  let btnLabel = label;
  if (selected.size === 1) {
    const match = options.find(o => o.value === [...selected][0]);
    const name = match?.label ?? label;
    btnLabel = name.length > 18 ? name.slice(0, 16) + "…" : name;
  } else if (selected.size > 1) {
    btnLabel = `${label} (${selected.size})`;
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors whitespace-nowrap",
          selected.size > 0
            ? "border-primary bg-orange-50 text-primary"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
        )}
      >
        {btnLabel}
        <ChevronDown size={12} className={cn("transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 bg-white rounded-lg border border-slate-200 shadow-lg z-20 min-w-[180px]">
          {searchable && (
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full text-xs pl-7 pr-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:border-primary bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div className="p-1.5 space-y-0.5 max-h-52 overflow-y-auto">
            {displayed.length === 0 ? (
              <p className="text-xs text-slate-400 px-2 py-2 text-center">No results</p>
            ) : displayed.map(({ value, label: optLabel }) => (
              <label
                key={value}
                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(value)}
                  onChange={() => onToggle(value)}
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-primary cursor-pointer shrink-0"
                />
                <span className="text-sm text-slate-700">{optLabel}</span>
              </label>
            ))}
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

// ─── ExpiryFilter ─────────────────────────────────────────────────────────────

type ValidityFilter = "all" | "30d" | "60d" | "expired";

const EXPIRY_OPTIONS: { value: ValidityFilter; label: string }[] = [
  { value: "all",     label: "All"          },
  { value: "30d",     label: "≤ 30 days"    },
  { value: "60d",     label: "≤ 60 days"    },
  { value: "expired", label: "Expired"      },
];

function ExpiryFilter({ value, onChange }: { value: ValidityFilter; onChange: (v: ValidityFilter) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const active = EXPIRY_OPTIONS.find(o => o.value === value)!;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors whitespace-nowrap",
          value !== "all"
            ? "border-primary bg-orange-50 text-primary"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
        )}
      >
        {value === "all" ? "Expiry" : active.label}
        <ChevronDown size={12} className={cn("transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 bg-white rounded-lg border border-slate-200 shadow-lg z-20 min-w-[140px] py-1">
          {EXPIRY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm transition-colors",
                opt.value === value
                  ? "text-primary font-medium bg-orange-50"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── More Filters (Mode · Service Type · Status) ──────────────────────────────

interface MoreFiltersProps {
  modeFilters: Set<string>;
  serviceFilters: Set<string>;
  statusFilters: Set<string>;
  serviceTypes: string[];
  activeCount: number;
  onToggleMode: (v: string) => void;
  onToggleService: (v: string) => void;
  onToggleStatus: (v: string) => void;
  onClear: () => void;
}

function MoreFilters({
  modeFilters, serviceFilters, statusFilters,
  serviceTypes, activeCount,
  onToggleMode, onToggleService, onToggleStatus, onClear,
}: MoreFiltersProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  function CheckList({
    label, options, selected, onToggle,
  }: { label: string; options: { value: string; label: string }[]; selected: Set<string>; onToggle: (v: string) => void }) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
          {selected.size > 0 && <span className="text-[10px] font-semibold text-primary">{selected.size} selected</span>}
        </div>
        <div className="space-y-0.5">
          {options.map(({ value, label: optLabel }) => (
            <label key={value} className="flex items-center gap-2 px-1 py-1 rounded cursor-pointer hover:bg-slate-50 transition-colors">
              <input type="checkbox" checked={selected.has(value)} onChange={() => onToggle(value)}
                className="h-3.5 w-3.5 rounded border-slate-300 accent-primary cursor-pointer" />
              <span className="text-sm text-slate-700">{optLabel}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors",
          activeCount > 0
            ? "border-primary bg-orange-50 text-primary"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
        )}
      >
        <SlidersHorizontal size={13} />
        More
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-semibold w-4 h-4 leading-none">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-20 p-3 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">More filters</span>
            {activeCount > 0 && (
              <button onClick={onClear} className="text-[11px] text-slate-400 hover:text-primary transition-colors">Clear all</button>
            )}
          </div>

          <CheckList
            label="Mode"
            options={[
              { value: "LTL",   label: "LTL"   },
              { value: "FTL",   label: "FTL"   },
              { value: "ROAD",  label: "Road"  },
              { value: "AIR",   label: "Air"   },
              { value: "OCEAN", label: "Ocean" },
            ]}
            selected={modeFilters}
            onToggle={onToggleMode}
          />

          <CheckList
            label="Service Type"
            options={serviceTypes.map(s => ({ value: s, label: s }))}
            selected={serviceFilters}
            onToggle={onToggleService}
          />

          <CheckList
            label="Status"
            options={[
              { value: "ACTIVE",   label: "Active"   },
              { value: "INACTIVE", label: "Inactive" },
            ]}
            selected={statusFilters}
            onToggle={onToggleStatus}
          />
        </div>
      )}
    </div>
  );
}

// ─── Lanes Tab ────────────────────────────────────────────────────────────────

function LanesTab() {
  const [search, setSearch]                   = useState("");
  const [originFilters, setOriginFilters]     = useState<Set<string>>(new Set());
  const [destFilters, setDestFilters]         = useState<Set<string>>(new Set());
  const [carrierFilters, setCarrierFilters]   = useState<Set<string>>(new Set());
  const [validityFilter, setValidityFilter]   = useState<ValidityFilter>("all");
  const [modeFilters, setModeFilters]         = useState<Set<string>>(new Set());
  const [serviceFilters, setServiceFilters]   = useState<Set<string>>(new Set());
  const [statusFilters, setStatusFilters]     = useState<Set<string>>(new Set());
  const [deactivated, setDeactivated]         = useState<Set<string>>(new Set());

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>) {
    return (v: string) => setter(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  }

  // Lane → Carrier join
  const carrierMap = useMemo(() => {
    const m = new Map<string, Carrier>();
    lanes.forEach(lane => {
      const contract = contracts.find(c => c.id === lane.contractId);
      if (contract) {
        const carrier = carriers.find(c => c.id === contract.carrierId);
        if (carrier) m.set(lane.id, carrier);
      }
    });
    return m;
  }, []);

  const laneCarriers = useMemo(() => {
    const seen = new Set<string>();
    const result: Carrier[] = [];
    lanes.forEach(lane => {
      const c = carrierMap.get(lane.id);
      if (c && !seen.has(c.id)) { seen.add(c.id); result.push(c); }
    });
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [carrierMap]);

  const serviceTypes = useMemo(() => [...new Set(lanes.map(l => l.service))].sort(), []);

  // Unique origin / destination keys for explicit filter dropdowns
  const originOptions = useMemo(() =>
    [...new Set(lanes.map(l => `${l.origin.city}, ${l.origin.state}`))].sort()
      .map(v => ({ value: v, label: v })),
    []
  );
  const destOptions = useMemo(() =>
    [...new Set(lanes.map(l => `${l.destination.city}, ${l.destination.state}`))].sort()
      .map(v => ({ value: v, label: v })),
    []
  );

  function toggleDeactivate(laneId: string) {
    setDeactivated(prev => {
      const next = new Set(prev);
      next.has(laneId) ? next.delete(laneId) : next.add(laneId);
      return next;
    });
  }

  const moreFiltersActiveCount = modeFilters.size + serviceFilters.size + statusFilters.size;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lanes
      .map(lane => {
        const carrier = carrierMap.get(lane.id);
        const effectiveStatus: "ACTIVE" | "INACTIVE" = deactivated.has(lane.id) ? "INACTIVE" : lane.status;
        return { ...lane, carrier, effectiveStatus };
      })
      .filter(lane => {
        // Text search: ref, carrier name/SCAC, service type
        if (q && ![
          lane.ref,
          lane.carrier?.name ?? "",
          lane.carrier?.scac ?? "",
          lane.service,
        ].some(v => v.toLowerCase().includes(q))) return false;

        const originKey = `${lane.origin.city}, ${lane.origin.state}`;
        const destKey   = `${lane.destination.city}, ${lane.destination.state}`;

        if (originFilters.size  > 0 && !originFilters.has(originKey))                  return false;
        if (destFilters.size    > 0 && !destFilters.has(destKey))                      return false;
        if (carrierFilters.size > 0 && !carrierFilters.has(lane.carrier?.id ?? ""))    return false;
        if (modeFilters.size    > 0 && !modeFilters.has(lane.mode))                    return false;
        if (serviceFilters.size > 0 && !serviceFilters.has(lane.service))              return false;
        if (statusFilters.size  > 0 && !statusFilters.has(lane.effectiveStatus))       return false;

        const days = daysUntil(lane.validTo);
        if (validityFilter === "30d"     && (days < 0 || days > 30)) return false;
        if (validityFilter === "60d"     && (days < 0 || days > 60)) return false;
        if (validityFilter === "expired" && days >= 0)                return false;

        return true;
      })
      .sort((a, b) => new Date(a.validTo).getTime() - new Date(b.validTo).getTime());
  }, [search, originFilters, destFilters, carrierFilters, modeFilters, serviceFilters, statusFilters, validityFilter, deactivated, carrierMap]);

  const hasActiveFilters =
    search || originFilters.size > 0 || destFilters.size > 0 ||
    carrierFilters.size > 0 || validityFilter !== "all" || moreFiltersActiveCount > 0;

  return (
    <div className="space-y-3">

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Text search (ref · carrier · service type) */}
        <div className="relative min-w-48 flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ref, carrier, service type…"
            className="pl-8 text-sm bg-slate-50 border-slate-200 focus:bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Origin */}
        <MultiSelectDropdown
          label="Origin"
          options={originOptions}
          selected={originFilters}
          onToggle={toggle(setOriginFilters)}
          onClear={() => setOriginFilters(new Set())}
        />

        {/* Destination */}
        <MultiSelectDropdown
          label="Destination"
          options={destOptions}
          selected={destFilters}
          onToggle={toggle(setDestFilters)}
          onClear={() => setDestFilters(new Set())}
        />

        {/* Carrier — searchable for long lists */}
        <MultiSelectDropdown
          label="Carrier"
          options={laneCarriers.map(c => ({ value: c.id, label: c.name }))}
          selected={carrierFilters}
          onToggle={toggle(setCarrierFilters)}
          onClear={() => setCarrierFilters(new Set())}
          searchable
        />

        {/* Expiry */}
        <ExpiryFilter value={validityFilter} onChange={setValidityFilter} />

        {/* More: Mode · Service Type · Status */}
        <MoreFilters
          modeFilters={modeFilters}
          serviceFilters={serviceFilters}
          statusFilters={statusFilters}
          serviceTypes={serviceTypes}
          activeCount={moreFiltersActiveCount}
          onToggleMode={toggle(setModeFilters)}
          onToggleService={toggle(setServiceFilters)}
          onToggleStatus={toggle(setStatusFilters)}
          onClear={() => { setModeFilters(new Set()); setServiceFilters(new Set()); setStatusFilters(new Set()); }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">
            {filtered.length} lane{filtered.length !== 1 ? "s" : ""}
            {hasActiveFilters && " matching filters"}
          </span>
          <span className="text-xs text-slate-400">Sorted by earliest expiry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Origin</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Destination</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Carrier</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Mode</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Service Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Ref</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Validity</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="w-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">
                    No lanes match the current filters
                  </td>
                </tr>
              ) : filtered.map(lane => {
                const isActive = lane.effectiveStatus === "ACTIVE";
                return (
                  <tr key={lane.id} className={cn("group transition-colors", isActive ? "hover:bg-slate-50/40" : "bg-slate-50/30 opacity-60 hover:opacity-100")}>
                    <td className="px-4 py-3 text-xs text-slate-800 whitespace-nowrap font-medium">{lane.origin.city}, {lane.origin.state}</td>
                    <td className="px-4 py-3 text-xs text-slate-800 whitespace-nowrap">{lane.destination.city}, {lane.destination.state}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-800 block">{lane.carrier?.name ?? "—"}</span>
                      <span className="font-mono text-[11px] text-slate-400">{lane.carrier?.scac}</span>
                    </td>
                    <td className="px-4 py-3"><ModeBadge mode={lane.mode} /></td>
                    <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{lane.service}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{lane.ref}</td>
                    <td className="px-4 py-3"><ValidityCell validFrom={lane.validFrom} validTo={lane.validTo} /></td>
                    <td className="px-4 py-3"><StatusBadge status={lane.effectiveStatus} /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleDeactivate(lane.id)}
                        className={cn(
                          "px-2.5 py-1 text-[11px] font-medium rounded border transition-all whitespace-nowrap opacity-0 group-hover:opacity-100",
                          isActive
                            ? "border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        )}
                      >
                        {isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ViewMode = "carriers" | "lanes";

export default function ContractsPage() {
  const [viewMode, setViewMode]     = useState<ViewMode>("carriers");
  const [modeFilter, setModeFilter] = useState("all");

  const filteredCarriers = useMemo(() =>
    carriers.filter(c => modeFilter === "all" || c.modes.includes(modeFilter as any)),
    [modeFilter]
  );

  const tabs: { id: ViewMode; label: string }[] = [
    { id: "carriers", label: "By Carrier" },
    { id: "lanes",    label: "By Lane"    },
  ];

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-slate-950">Contracts</h1>
            <p className="text-sm text-slate-500 mt-0.5">{carriers.length} carriers · {lanes.length} lanes</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <UploadHistorySheet />
            <Button size="sm" className="gap-1.5">
              <Upload size={14} /> Upload Contract
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0 mt-4 -mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm border-b-2 transition-colors",
                viewMode === tab.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-5">
        {viewMode === "lanes" ? (
          <LanesTab />
        ) : (
          <>
            {/* Carrier filter */}
            <div className="flex items-center gap-2 mb-4">
              <select
                value={modeFilter}
                onChange={e => setModeFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:border-ring"
              >
                <option value="all">All Modes</option>
                <option value="LTL">LTL</option>
                <option value="FTL">FTL</option>
                <option value="ROAD">Road</option>
                <option value="AIR">Air</option>
                <option value="OCEAN">Ocean</option>
              </select>
            </div>

            {/* Carrier list */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <span className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wide">Carrier</span>
                <div className="hidden md:flex items-center gap-8 mr-4">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-20 text-right">Active Lanes</span>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-20 text-right">Total Lanes</span>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-24 text-right">Last Updated</span>
                </div>
              </div>
              {filteredCarriers.map(carrier => <CarrierRow key={carrier.id} carrier={carrier} />)}
              {filteredCarriers.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-slate-400">No carriers match these filters</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
