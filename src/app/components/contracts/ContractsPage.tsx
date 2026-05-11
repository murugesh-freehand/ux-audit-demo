import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  Upload,
  X,
  Copy,
  Check,
  Clock,
  AlertCircle,
  Search,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  FileText,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Ban,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { StatusBadge, ModeBadge } from "../shared/StatusBadge";
import { cn } from "../ui/utils";
import {
  carriers,
  contracts,
  lanes,
  uploadJobs,
  type Carrier,
  type UploadJob,
} from "../../data/mockData";

// ─── Demo reference date ──────────────────────────────────────────────────────
const DEMO_TODAY = new Date("2026-05-11T00:00:00");

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - DEMO_TODAY.getTime()) / 86_400_000);
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function relativeTime(iso: string): string {
  const diff = DEMO_TODAY.getTime() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return fmt(iso);
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

// ─── CopyButton ───────────────────────────────────────────────────────────────

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

// ─── Upload Modal ─────────────────────────────────────────────────────────────

const MODES = ["LTL", "FTL", "ROAD", "AIR", "OCEAN"];
const DELIVERY_TYPES = ["Standard", "Express", "Priority", "Economy"];

function UploadModal({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded: () => void }) {
  const [contractName, setContractName] = useState("");
  const [vendor, setVendor] = useState("");
  const [mode, setMode] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [instructions, setInstructions] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFileName(f.name);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  }

  function handleUpload() {
    onClose();
    onUploaded();
  }

  const canUpload = !!fileName && !!vendor && !!mode && !!deliveryType;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-slate-200">
          <DialogTitle className="text-base font-semibold text-slate-950">Upload Contract</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Drop zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleFileDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer",
              fileName ? "border-primary bg-orange-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
            )}
            onClick={() => document.getElementById("contract-file-input")?.click()}
          >
            <input
              id="contract-file-input"
              type="file"
              accept=".pdf,.csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileInput}
            />
            {fileName ? (
              <>
                <FileText size={22} className="text-primary" />
                <p className="text-sm font-medium text-primary">{fileName}</p>
                <button
                  onClick={e => { e.stopPropagation(); setFileName(null); }}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <X size={11} /> Remove
                </button>
              </>
            ) : (
              <>
                <Upload size={22} className="text-slate-400" />
                <p className="text-sm text-slate-600">Drop file here or <span className="text-primary font-medium">click to browse</span></p>
                <p className="text-xs text-slate-400">Supports CSV, Excel, and PDF</p>
              </>
            )}
          </div>

          {/* Contract Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Contract Name <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
            <Input
              value={contractName}
              onChange={e => setContractName(e.target.value)}
              placeholder="Enter contract name"
              className="text-sm"
            />
          </div>

          {/* Vendor */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Vendor <span className="text-red-500">*</span></label>
            <Input
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              placeholder="Search by name, SCAC, DOT#"
              className="text-sm"
            />
            <p className="text-xs text-slate-400">Don't see the vendor? Add them in Settings.</p>
          </div>

          {/* Mode + Delivery Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Mode <span className="text-red-500">*</span></label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
              >
                <option value="">Select mode…</option>
                {MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Delivery Type <span className="text-red-500">*</span></label>
              <select
                value={deliveryType}
                onChange={e => setDeliveryType(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
              >
                <option value="">Select type…</option>
                {DELIVERY_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Extraction Instructions */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Extraction Instructions <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g., 'All rates are per pallet', 'Currency is EUR', 'Ignore the first worksheet'…"
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring resize-none"
            />
            <p className="text-xs text-slate-400">Provide guidance to help the AI understand your contract format.</p>
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!canUpload} onClick={handleUpload} className="gap-1.5">
            <Upload size={13} /> Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

// ─── MultiSelectDropdown ──────────────────────────────────────────────────────

function MultiSelectDropdown({
  label, options, selected, onToggle, onClear, searchable = false,
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
              <label key={value} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-50 transition-colors">
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
  { value: "all",     label: "All"       },
  { value: "30d",     label: "≤ 30 days" },
  { value: "60d",     label: "≤ 60 days" },
  { value: "expired", label: "Expired"   },
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
                opt.value === value ? "text-primary font-medium bg-orange-50" : "text-slate-700 hover:bg-slate-50"
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

// ─── More Filters ─────────────────────────────────────────────────────────────

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

  function CheckList({ label, options, selected, onToggle }: {
    label: string; options: { value: string; label: string }[]; selected: Set<string>; onToggle: (v: string) => void;
  }) {
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
          <CheckList label="Mode" options={[
            { value: "LTL", label: "LTL" }, { value: "FTL", label: "FTL" },
            { value: "ROAD", label: "Road" }, { value: "AIR", label: "Air" }, { value: "OCEAN", label: "Ocean" },
          ]} selected={modeFilters} onToggle={onToggleMode} />
          <CheckList label="Service Type" options={serviceTypes.map(s => ({ value: s, label: s }))} selected={serviceFilters} onToggle={onToggleService} />
          <CheckList label="Status" options={[
            { value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" },
          ]} selected={statusFilters} onToggle={onToggleStatus} />
        </div>
      )}
    </div>
  );
}

// ─── Lanes Tab ────────────────────────────────────────────────────────────────

function LanesTab() {
  const [search, setSearch]                 = useState("");
  const [originFilters, setOriginFilters]   = useState<Set<string>>(new Set());
  const [destFilters, setDestFilters]       = useState<Set<string>>(new Set());
  const [carrierFilters, setCarrierFilters] = useState<Set<string>>(new Set());
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>("all");
  const [modeFilters, setModeFilters]       = useState<Set<string>>(new Set());
  const [serviceFilters, setServiceFilters] = useState<Set<string>>(new Set());
  const [statusFilters, setStatusFilters]   = useState<Set<string>>(new Set());
  const [deactivated, setDeactivated]       = useState<Set<string>>(new Set());

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>) {
    return (v: string) => setter(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  }

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

  const originOptions = useMemo(() =>
    [...new Set(lanes.map(l => `${l.origin.city}, ${l.origin.state}`))].sort().map(v => ({ value: v, label: v })), []);
  const destOptions = useMemo(() =>
    [...new Set(lanes.map(l => `${l.destination.city}, ${l.destination.state}`))].sort().map(v => ({ value: v, label: v })), []);

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
        if (q && ![lane.ref, lane.carrier?.name ?? "", lane.carrier?.scac ?? "", lane.service]
          .some(v => v.toLowerCase().includes(q))) return false;
        const originKey = `${lane.origin.city}, ${lane.origin.state}`;
        const destKey = `${lane.destination.city}, ${lane.destination.state}`;
        if (originFilters.size > 0 && !originFilters.has(originKey)) return false;
        if (destFilters.size > 0 && !destFilters.has(destKey)) return false;
        if (carrierFilters.size > 0 && !carrierFilters.has(lane.carrier?.id ?? "")) return false;
        if (modeFilters.size > 0 && !modeFilters.has(lane.mode)) return false;
        if (serviceFilters.size > 0 && !serviceFilters.has(lane.service)) return false;
        if (statusFilters.size > 0 && !statusFilters.has(lane.effectiveStatus)) return false;
        const days = daysUntil(lane.validTo);
        if (validityFilter === "30d" && (days < 0 || days > 30)) return false;
        if (validityFilter === "60d" && (days < 0 || days > 60)) return false;
        if (validityFilter === "expired" && days >= 0) return false;
        return true;
      })
      .sort((a, b) => new Date(a.validTo).getTime() - new Date(b.validTo).getTime());
  }, [search, originFilters, destFilters, carrierFilters, modeFilters, serviceFilters, statusFilters, validityFilter, deactivated, carrierMap]);

  const hasActiveFilters = search || originFilters.size > 0 || destFilters.size > 0 ||
    carrierFilters.size > 0 || validityFilter !== "all" || moreFiltersActiveCount > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ref, carrier, service type…"
            className="pl-8 text-sm bg-slate-50 border-slate-200 focus:bg-white" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
        <MultiSelectDropdown label="Origin" options={originOptions} selected={originFilters}
          onToggle={toggle(setOriginFilters)} onClear={() => setOriginFilters(new Set())} />
        <MultiSelectDropdown label="Destination" options={destOptions} selected={destFilters}
          onToggle={toggle(setDestFilters)} onClear={() => setDestFilters(new Set())} />
        <MultiSelectDropdown label="Carrier" options={laneCarriers.map(c => ({ value: c.id, label: c.name }))}
          selected={carrierFilters} onToggle={toggle(setCarrierFilters)} onClear={() => setCarrierFilters(new Set())} searchable />
        <ExpiryFilter value={validityFilter} onChange={setValidityFilter} />
        <MoreFilters modeFilters={modeFilters} serviceFilters={serviceFilters} statusFilters={statusFilters}
          serviceTypes={serviceTypes} activeCount={moreFiltersActiveCount}
          onToggleMode={toggle(setModeFilters)} onToggleService={toggle(setServiceFilters)} onToggleStatus={toggle(setStatusFilters)}
          onClear={() => { setModeFilters(new Set()); setServiceFilters(new Set()); setStatusFilters(new Set()); }} />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">
            {filtered.length} lane{filtered.length !== 1 ? "s" : ""}{hasActiveFilters && " matching filters"}
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
                <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">No lanes match the current filters</td></tr>
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

// ─── Upload History Tab ───────────────────────────────────────────────────────

const JOB_STATUS_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  APPROVED:  { icon: CheckCircle2, color: "text-emerald-600", label: "Approved"  },
  REJECTED:  { icon: XCircle,      color: "text-red-500",     label: "Rejected"  },
  CANCELLED: { icon: Ban,          color: "text-slate-400",   label: "Cancelled" },
};

function JobFileList({ files }: { files: string[] }) {
  return (
    <div className="space-y-0.5 mt-1">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-1.5 min-w-0">
          <FileText size={11} className="text-slate-300 shrink-0" />
          <span className="text-xs text-slate-500 truncate">{f}</span>
        </div>
      ))}
    </div>
  );
}


function UploadHistoryTab() {
  const needsReview = uploadJobs.filter(j => j.status === "COMPLETED");
  const inProgress  = uploadJobs.filter(j => j.status === "PROCESSING" || j.status === "PARTIAL");
  const failed      = uploadJobs.filter(j => j.status === "FAILED");
  const history     = uploadJobs.filter(j => ["APPROVED", "REJECTED", "CANCELLED"].includes(j.status));

  const hasActiveItems = needsReview.length > 0 || inProgress.length > 0 || failed.length > 0;
  const [historyOpen, setHistoryOpen] = useState(!hasActiveItems);

  return (
    <div className="space-y-5">

      {/* ── Ready to Review ── */}
      {needsReview.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Ready to Review</span>
            <span className="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-semibold w-5 h-5">
              {needsReview.length}
            </span>
          </div>
          <div className="space-y-2">
            {needsReview.map(job => (
              <div key={job.id} className="flex items-start gap-4 bg-white border border-amber-200 rounded-lg px-4 py-3.5 border-l-[3px] border-l-amber-400">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-semibold text-slate-900">{job.ref}</span>
                    <CopyButton text={job.ref} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{job.carrierName}</span>
                    <span className="font-mono text-[11px] text-slate-400">{job.scac}</span>
                    <ModeBadge mode={job.mode} />
                  </div>
                  <JobFileList files={job.files} />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-xs text-slate-400">{job.rates.toLocaleString()} rates extracted</span>
                    <span className="text-slate-300 text-xs">·</span>
                    <span className="text-xs text-slate-400">{relativeTime(job.uploadedAt)}</span>
                  </div>
                </div>
                <Link
                  to={`/contracts/jobs/${job.id}`}
                  className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary hover:underline whitespace-nowrap mt-0.5"
                >
                  Review <ChevronRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── In Progress ── */}
      {inProgress.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">In Progress</span>
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold w-5 h-5">
              {inProgress.length}
            </span>
          </div>
          <div className="space-y-2">
            {inProgress.map(job => (
              <div key={job.id} className="flex items-start gap-4 bg-white border border-slate-200 rounded-lg px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Loader2 size={13} className="text-blue-500 animate-spin shrink-0" />
                    <span className="font-mono text-sm font-semibold text-slate-900">{job.ref}</span>
                    <CopyButton text={job.ref} />
                    {job.status === "PARTIAL" && (
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">Partial</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{job.carrierName}</span>
                    <span className="font-mono text-[11px] text-slate-400">{job.scac}</span>
                    <ModeBadge mode={job.mode} />
                  </div>
                  <JobFileList files={job.files} />
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={job.progress} className="h-1 w-32" />
                    <span className="text-xs text-slate-400">{job.progress}%</span>
                  </div>
                </div>
                <button className="shrink-0 text-xs text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap mt-0.5">
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Failed ── */}
      {failed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Failed</span>
            <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-600 border border-red-200 text-[10px] font-semibold w-5 h-5">
              {failed.length}
            </span>
          </div>
          <div className="space-y-2">
            {failed.map(job => (
              <div key={job.id} className="flex items-start gap-4 bg-white border border-red-200 rounded-lg px-4 py-3.5 border-l-[3px] border-l-red-400">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-semibold text-slate-900">{job.ref}</span>
                    <CopyButton text={job.ref} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{job.carrierName}</span>
                    <span className="font-mono text-[11px] text-slate-400">{job.scac}</span>
                    <ModeBadge mode={job.mode} />
                  </div>
                  <JobFileList files={job.files} />
                  <span className="text-xs text-red-500 mt-1 block">Extraction failed · {relativeTime(job.uploadedAt)}</span>
                </div>
                <button className="shrink-0 flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-primary transition-colors whitespace-nowrap mt-0.5">
                  <RotateCcw size={12} /> Retry
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <section>
          <button
            onClick={() => setHistoryOpen(o => !o)}
            className="flex items-center gap-2 mb-3 group"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide group-hover:text-slate-700 transition-colors">History</span>
            <span className="text-xs text-slate-400">({history.length})</span>
            <ChevronDown size={12} className={cn("text-slate-400 transition-transform", historyOpen && "rotate-180")} />
          </button>

          {historyOpen && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Carrier</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">File</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Rates</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map(job => {
                    const meta = JOB_STATUS_META[job.status];
                    const Icon = meta.icon;
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-800">{job.carrierName}</span>
                            <span className="font-mono text-[11px] text-slate-400">{job.scac}</span>
                            <ModeBadge mode={job.mode} />
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <Link to={`/contracts/jobs/${job.id}`} className="font-mono text-[10px] text-slate-400 hover:text-primary transition-colors">
                              {job.ref}
                            </Link>
                            <CopyButton text={job.ref} />
                          </div>
                        </td>
                        <td className="px-4 py-3"><JobFileList files={job.files} /></td>
                        <td className="px-4 py-3">
                          <span className={cn("flex items-center gap-1 text-xs font-medium", meta.color)}>
                            <Icon size={12} /> {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-500">
                          {job.rates > 0 ? job.rates.toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-400 whitespace-nowrap">
                          {fmt(job.uploadedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {!hasActiveItems && history.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-400">No uploads yet</div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ViewMode = "carriers" | "lanes" | "upload-history";

export default function ContractsPage() {
  const [viewMode, setViewMode]         = useState<ViewMode>("carriers");
  const [modeFilter, setModeFilter]     = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const pendingCount = useMemo(() =>
    uploadJobs.filter(j => ["COMPLETED", "PROCESSING", "PARTIAL", "FAILED"].includes(j.status)).length,
    []
  );

  const filteredCarriers = useMemo(() =>
    carriers.filter(c => modeFilter === "all" || c.modes.includes(modeFilter as any)),
    [modeFilter]
  );

  const tabs: { id: ViewMode; label: string; badge?: number }[] = [
    { id: "carriers",       label: "By Carrier"      },
    { id: "lanes",          label: "By Lane"         },
    { id: "upload-history", label: "Upload History", badge: pendingCount > 0 ? pendingCount : undefined },
  ];

  function handleUploaded() {
    setViewMode("upload-history");
    toast.success("Upload started", {
      description: "Rates are being extracted — check Upload History for progress.",
      duration: 5000,
    });
  }

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
            <Button size="sm" className="gap-1.5" onClick={() => setShowUploadModal(true)}>
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
                "flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors",
                viewMode === tab.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className={cn(
                  "inline-flex items-center justify-center rounded-full text-[10px] font-semibold w-4 h-4 leading-none",
                  viewMode === tab.id
                    ? "bg-primary text-white"
                    : "bg-amber-100 text-amber-700 border border-amber-200"
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-5">
        {viewMode === "lanes" ? (
          <LanesTab />
        ) : viewMode === "upload-history" ? (
          <UploadHistoryTab />
        ) : (
          <>
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

      <UploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploaded={handleUploaded}
      />
    </div>
  );
}
