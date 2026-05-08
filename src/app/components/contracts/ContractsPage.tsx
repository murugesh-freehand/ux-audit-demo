import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Upload,
  History,
  Copy,
  Check,
  Clock,
  AlertCircle,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Progress } from "../ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { StatusBadge, ModeBadge } from "../shared/StatusBadge";
import {
  DataTableHeader,
  DataTableTabs,
  SearchWithColumnPicker,
  QuickFiltersPopover,
  FilterChipsBar,
  applyQuickFilters,
  applyAdvancedRules,
  applySearch,
  type FilterFieldDef,
  type FilterState,
  type AdvancedFilterRule,
  type SearchColumn,
} from "../shared/data-table";
import { cn } from "../ui/utils";
import {
  carriers,
  contracts,
  lanes,
  uploadJobs,
  type Carrier,
  type Mode,
} from "../../data/mockData";

// ─── Demo reference date ──────────────────────────────────────────────────────
const DEMO_TODAY = new Date("2026-05-08T00:00:00");
function daysUntil(dateStr: string): number {
  return Math.ceil(
    (new Date(dateStr).getTime() - DEMO_TODAY.getTime()) / 86_400_000
  );
}
function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function fmtLong(date: string) {
  const d = new Date(date);
  return `${d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })} - ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
}

// ─── Synthetic "Last Updated by" data ─────────────────────────────────────────
const CARRIER_USERS = [
  { id: "ID002", name: "Jessi Smith" },
  { id: "ID098", name: "David Bruno" },
  { id: "ID104", name: "Riley Chen" },
  { id: "ID057", name: "Amelia Park" },
];
function userForCarrier(carrierId: string) {
  let h = 0;
  for (let i = 0; i < carrierId.length; i++) h = (h * 31 + carrierId.charCodeAt(i)) >>> 0;
  return CARRIER_USERS[h % CARRIER_USERS.length];
}
function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Avatar (neutral, monochrome) ─────────────────────────────────────────────
function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium shrink-0"
      style={{ width: size, height: size, fontSize: size <= 20 ? 10 : 11 }}
    >
      {initials(name)}
    </span>
  );
}
function UserCell({ user }: { user: { name: string; id: string } }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar name={user.name} />
      <span className="text-sm text-slate-900 whitespace-nowrap">
        {user.id} - {user.name}
      </span>
    </div>
  );
}

// ─── Upload History sheet ─────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
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
        <button className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
          <History size={14} />
          Upload History
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[640px] max-w-full flex flex-col overflow-hidden p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-200 shrink-0">
          <SheetTitle className="text-base font-semibold text-slate-950">
            Upload History
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[210px]" />
              <col className="w-[90px]" />
              <col className="w-[110px]" />
              <col className="w-[auto]" />
              <col className="w-[60px]" />
            </colgroup>
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-slate-50/60">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Job Ref</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Carrier</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Files</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Rates</th>
              </tr>
            </thead>
            <tbody>
              {uploadJobs.map((job) => {
                const shortRef =
                  job.ref.length > 26 ? job.ref.slice(0, 26) + "…" : job.ref;
                return (
                  <tr key={job.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-mono text-xs text-slate-700 truncate" title={job.ref}>{shortRef}</span>
                        <CopyButton text={job.ref} />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {fmt(job.uploadedAt)}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-xs text-slate-800 block">{job.scac}</span>
                      <ModeBadge mode={job.mode} className="mt-1" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <StatusBadge status={job.status} />
                        {job.status === "PROCESSING" && (
                          <Progress value={job.progress} className="h-1 w-16" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-slate-700 truncate block max-w-full">
                        {job.files[0]}
                      </span>
                      {job.files.length > 1 && (
                        <span className="text-[11px] text-slate-400">
                          +{job.files.length - 1} more
                        </span>
                      )}
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

// ─── Validity cell ────────────────────────────────────────────────────────────
function ValidityCell({
  validFrom,
  validTo,
}: {
  validFrom: string;
  validTo: string;
}) {
  const days = daysUntil(validTo);
  const range = `${fmt(validFrom)} – ${fmt(validTo)}`;
  if (days < 0)
    return (
      <div>
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-medium text-red-700 whitespace-nowrap">
          <AlertCircle size={9} /> Expired
        </span>
        <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{range}</p>
      </div>
    );
  if (days <= 30)
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 whitespace-nowrap">
          <AlertCircle size={11} /> {days}d left
        </span>
        <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{range}</p>
      </div>
    );
  if (days <= 60)
    return (
      <div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 whitespace-nowrap">
          <Clock size={11} /> {days}d left
        </span>
        <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">{range}</p>
      </div>
    );
  return <p className="text-xs text-slate-500 whitespace-nowrap">{range}</p>;
}

// ─── Sortable header cell ─────────────────────────────────────────────────────
function ColHeader({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 leading-5 whitespace-nowrap">
      {children}
      <ChevronsUpDown size={14} className="text-slate-400" />
    </span>
  );
}

// ─── Pagination footer ────────────────────────────────────────────────────────
function PaginationFooter({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-slate-200 bg-white">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSize(Number(v))}
        >
          <SelectTrigger className="h-8 w-[72px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-slate-500">
        {start}–{end} of {total}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center justify-center size-8 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs text-slate-600 px-2 min-w-[54px] text-center">
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center justify-center size-8 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "LTL", label: "LTL" },
  { value: "FTL", label: "FTL" },
  { value: "ROAD", label: "Road" },
  { value: "AIR", label: "Air" },
  { value: "OCEAN", label: "Ocean" },
];

// ─── Carriers logic ───────────────────────────────────────────────────────────
function useCarrierTable() {
  const [search, setSearch] = useState("");
  const [searchCols, setSearchCols] = useState<string[]>(["scac", "name"]);
  const [quick, setQuick] = useState<FilterState>({});
  const [advanced, setAdvanced] = useState<AdvancedFilterRule[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fields: FilterFieldDef<Carrier>[] = useMemo(
    () => [
      {
        id: "mode",
        label: "Mode",
        type: "select-multi",
        options: MODE_OPTIONS,
        getValue: (c) => c.modes as string[],
      },
      {
        id: "lastUpdatedBy",
        label: "Last Updated by",
        type: "user-multi",
        options: CARRIER_USERS.map((u) => ({
          value: u.id,
          label: `${u.id} - ${u.name}`,
          initials: initials(u.name),
        })),
        getValue: (c) => userForCarrier(c.id).id,
      },
      {
        id: "lastUpdatedAt",
        label: "Last Updated at",
        type: "date-range",
        getValue: (c) => c.lastUpdated,
      },
    ],
    []
  );

  const searchColumns: SearchColumn[] = [
    { id: "scac", label: "SCAC" },
    { id: "name", label: "Carrier Name" },
  ];
  const searchable = [
    { id: "scac", getText: (c: Carrier) => c.scac },
    { id: "name", getText: (c: Carrier) => c.name },
  ];

  const filtered = useMemo(() => {
    let rows: Carrier[] = carriers;
    rows = applySearch(rows, search, searchCols, searchable);
    rows = applyQuickFilters(rows, fields, quick);
    rows = applyAdvancedRules(rows, fields, advanced);
    return rows;
  }, [search, searchCols, quick, advanced, fields]);

  // Reset to page 1 when filters change
  useEffect(() => setPage(1), [search, searchCols, quick, advanced]);

  const start = (page - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  return {
    fields,
    searchColumns,
    search,
    setSearch,
    searchCols,
    setSearchCols,
    quick,
    setQuick,
    advanced,
    setAdvanced,
    visible,
    total: filtered.length,
    page,
    setPage,
    pageSize,
    setPageSize,
  };
}

// ─── Lanes logic ──────────────────────────────────────────────────────────────
function useLanesTable() {
  const [search, setSearch] = useState("");
  const [searchCols, setSearchCols] = useState<string[]>([
    "ref",
    "carrier",
    "service",
    "origin",
    "destination",
  ]);
  const [quick, setQuick] = useState<FilterState>({});
  const [advanced, setAdvanced] = useState<AdvancedFilterRule[]>([]);
  const [deactivated, setDeactivated] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const carrierMap = useMemo(() => {
    const m = new Map<string, Carrier>();
    lanes.forEach((lane) => {
      const contract = contracts.find((c) => c.id === lane.contractId);
      if (contract) {
        const carrier = carriers.find((c) => c.id === contract.carrierId);
        if (carrier) m.set(lane.id, carrier);
      }
    });
    return m;
  }, []);

  const enriched = useMemo(
    () =>
      lanes.map((l) => ({
        ...l,
        carrier: carrierMap.get(l.id),
        effectiveStatus: (deactivated.has(l.id) ? "INACTIVE" : l.status) as
          | "ACTIVE"
          | "INACTIVE",
      })),
    [carrierMap, deactivated]
  );
  type EnrichedLane = (typeof enriched)[number];

  const services = useMemo(() => [...new Set(lanes.map((l) => l.service))].sort(), []);
  const origins = useMemo(
    () => [...new Set(lanes.map((l) => `${l.origin.city}, ${l.origin.state}`))].sort(),
    []
  );
  const dests = useMemo(
    () => [...new Set(lanes.map((l) => `${l.destination.city}, ${l.destination.state}`))].sort(),
    []
  );
  const carrierOpts = useMemo(() => {
    const seen = new Set<string>();
    const out: Carrier[] = [];
    for (const lane of lanes) {
      const c = carrierMap.get(lane.id);
      if (c && !seen.has(c.id)) {
        seen.add(c.id);
        out.push(c);
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [carrierMap]);

  const fields: FilterFieldDef<EnrichedLane>[] = useMemo(
    () => [
      {
        id: "mode",
        label: "Mode",
        type: "select-multi",
        options: MODE_OPTIONS,
        getValue: (l) => l.mode,
      },
      {
        id: "service",
        label: "Service Type",
        type: "select-multi",
        options: services.map((s) => ({ value: s, label: s })),
        getValue: (l) => l.service,
      },
      {
        id: "origin",
        label: "Origin",
        type: "select-multi",
        options: origins.map((o) => ({ value: o, label: o })),
        getValue: (l) => `${l.origin.city}, ${l.origin.state}`,
      },
      {
        id: "destination",
        label: "Destination",
        type: "select-multi",
        options: dests.map((d) => ({ value: d, label: d })),
        getValue: (l) => `${l.destination.city}, ${l.destination.state}`,
      },
      {
        id: "carrier",
        label: "Carrier",
        type: "search-multi",
        options: carrierOpts.map((c) => ({ value: c.id, label: c.name })),
        getValue: (l) => l.carrier?.id ?? "",
      },
      {
        id: "status",
        label: "Status",
        type: "select-multi",
        options: [
          { value: "ACTIVE", label: "Active", dotColor: "bg-emerald-500" },
          { value: "INACTIVE", label: "Inactive", dotColor: "bg-slate-400" },
        ],
        getValue: (l) => l.effectiveStatus,
      },
      {
        id: "validTo",
        label: "Valid To",
        type: "date-range",
        getValue: (l) => l.validTo,
      },
    ],
    [services, origins, dests, carrierOpts]
  );

  const searchColumns: SearchColumn[] = [
    { id: "ref", label: "Ref" },
    { id: "carrier", label: "Carrier" },
    { id: "service", label: "Service Type" },
    { id: "origin", label: "Origin" },
    { id: "destination", label: "Destination" },
  ];
  const searchable = [
    { id: "ref", getText: (l: EnrichedLane) => l.ref },
    { id: "carrier", getText: (l: EnrichedLane) => `${l.carrier?.name ?? ""} ${l.carrier?.scac ?? ""}` },
    { id: "service", getText: (l: EnrichedLane) => l.service },
    { id: "origin", getText: (l: EnrichedLane) => `${l.origin.city}, ${l.origin.state}` },
    { id: "destination", getText: (l: EnrichedLane) => `${l.destination.city}, ${l.destination.state}` },
  ];

  const filtered = useMemo(() => {
    let rows: EnrichedLane[] = enriched;
    rows = applySearch(rows, search, searchCols, searchable);
    rows = applyQuickFilters(rows, fields, quick);
    rows = applyAdvancedRules(rows, fields, advanced);
    return rows.sort(
      (a, b) => new Date(a.validTo).getTime() - new Date(b.validTo).getTime()
    );
  }, [enriched, search, searchCols, quick, advanced, fields]);

  useEffect(() => setPage(1), [search, searchCols, quick, advanced]);

  const start = (page - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  function toggleDeactivate(laneId: string) {
    setDeactivated((prev) => {
      const next = new Set(prev);
      next.has(laneId) ? next.delete(laneId) : next.add(laneId);
      return next;
    });
  }

  return {
    fields,
    searchColumns,
    search,
    setSearch,
    searchCols,
    setSearchCols,
    quick,
    setQuick,
    advanced,
    setAdvanced,
    visible,
    total: filtered.length,
    page,
    setPage,
    pageSize,
    setPageSize,
    toggleDeactivate,
  };
}

// ─── Carrier table (rendered area only) ───────────────────────────────────────
function CarriersTable({ rows }: { rows: Carrier[] }) {
  const navigate = useNavigate();
  return (
    <table className="min-w-full text-sm">
      <thead className="sticky top-0 bg-white z-10">
        <tr className="border-y border-slate-200">
          <th className="text-left px-4 py-3 min-w-[120px]"><ColHeader>SCAC</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[260px]"><ColHeader>Carrier Name</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[200px]"><ColHeader>Mode</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[180px]"><ColHeader>Active Lanes</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[240px]"><ColHeader>Last Updated by</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[200px]"><ColHeader>Last Updated at</ColHeader></th>
          <th className="w-12" />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
              No carriers match the current filters
            </td>
          </tr>
        ) : (
          rows.map((c) => {
            const user = userForCarrier(c.id);
            return (
              <tr
                key={c.id}
                onClick={() => navigate(`/contracts/${c.id}`)}
                className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-950">{c.scac}</span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">{c.name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {c.modes.map((m) => <ModeBadge key={m} mode={m} />)}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-slate-900">{c.activeLanes}</span>{" "}
                  <span className="text-xs text-slate-500">out of {c.totalLanes}</span>
                </td>
                <td className="px-4 py-3"><UserCell user={user} /></td>
                <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">{fmtLong(c.lastUpdated)}</td>
                <td className="px-4 py-3" />
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

// ─── Lanes table (rendered area only) ─────────────────────────────────────────
function LanesTable({
  rows,
  onToggleDeactivate,
}: {
  rows: ReturnType<typeof useLanesTable>["visible"];
  onToggleDeactivate: (id: string) => void;
}) {
  return (
    <table className="min-w-full text-sm">
      <thead className="sticky top-0 bg-white z-10">
        <tr className="border-y border-slate-200">
          <th className="text-left px-4 py-3 min-w-[160px]"><ColHeader>Origin</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[160px]"><ColHeader>Destination</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[200px]"><ColHeader>Carrier</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[100px]"><ColHeader>Mode</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[140px]"><ColHeader>Service Type</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[160px]"><ColHeader>Ref</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[200px]"><ColHeader>Validity</ColHeader></th>
          <th className="text-left px-4 py-3 min-w-[120px]"><ColHeader>Status</ColHeader></th>
          <th className="w-32" />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
              No lanes match the current filters
            </td>
          </tr>
        ) : (
          rows.map((lane) => {
            const isActive = lane.effectiveStatus === "ACTIVE";
            return (
              <tr
                key={lane.id}
                className={cn(
                  "group transition-colors border-b border-slate-100",
                  isActive
                    ? "hover:bg-slate-50/40"
                    : "bg-slate-50/30 opacity-60 hover:opacity-100"
                )}
              >
                <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap font-medium">
                  {lane.origin.city}, {lane.origin.state}
                </td>
                <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                  {lane.destination.city}, {lane.destination.state}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-slate-900 block">{lane.carrier?.name ?? "—"}</span>
                  <span className="font-mono text-[11px] text-slate-400">{lane.carrier?.scac}</span>
                </td>
                <td className="px-4 py-3"><ModeBadge mode={lane.mode} /></td>
                <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{lane.service}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{lane.ref}</td>
                <td className="px-4 py-3"><ValidityCell validFrom={lane.validFrom} validTo={lane.validTo} /></td>
                <td className="px-4 py-3"><StatusBadge status={lane.effectiveStatus} /></td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onToggleDeactivate(lane.id)}
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
          })
        )}
      </tbody>
    </table>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ContractsPage() {
  const [tab, setTab] = useState<"carriers" | "lanes">("carriers");
  const carrier = useCarrierTable();
  const laneState = useLanesTable();
  const active = tab === "carriers" ? carrier : laneState;

  return (
    <div className="h-full flex flex-col py-2 pr-2">
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col flex-1 overflow-hidden">
        <DataTableHeader
          title="Contracts"
          description="Vendor agreements, rate cards, and active lanes. Upload a new contract or review extraction status across jobs."
          actions={
            <>
              <UploadHistorySheet />
              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5"
              >
                <Upload size={14} /> Upload
              </Button>
            </>
          }
        />

        {/* Tab | Search | Filter — single row, left-aligned, contiguous */}
        <div className="px-5 pt-1 pb-3 flex items-center gap-2 flex-wrap">
          <DataTableTabs
            tabs={[
              { id: "carriers", label: "Carrier", count: carriers.length },
              { id: "lanes", label: "Lanes", count: lanes.length },
            ]}
            value={tab}
            onChange={(id) => setTab(id as "carriers" | "lanes")}
          />
          <SearchWithColumnPicker
            query={active.search}
            onQueryChange={active.setSearch}
            placeholder={tab === "carriers" ? "Search vendor" : "Search ref, carrier, service…"}
            columns={active.searchColumns}
            selectedColumns={active.searchCols}
            onSelectedColumnsChange={active.setSearchCols}
          />
          <QuickFiltersPopover
            fields={active.fields as FilterFieldDef<unknown>[]}
            values={active.quick}
            rules={active.advanced}
            onApply={({ values, rules }) => {
              active.setQuick(values);
              active.setAdvanced(rules);
            }}
          />
        </div>

        {/* Active filter chips */}
        <FilterChipsBar
          fields={active.fields as FilterFieldDef<unknown>[]}
          values={active.quick}
          rules={active.advanced}
          onChangeValues={active.setQuick}
          onChangeRules={active.setAdvanced}
        />

        {/* Table region — scrolls vertically AND horizontally */}
        <div className="flex-1 overflow-auto px-4">
          {tab === "carriers" ? (
            <CarriersTable rows={carrier.visible} />
          ) : (
            <LanesTable rows={laneState.visible} onToggleDeactivate={laneState.toggleDeactivate} />
          )}
        </div>

        <PaginationFooter
          total={active.total}
          page={active.page}
          pageSize={active.pageSize}
          onPage={active.setPage}
          onPageSize={(s) => {
            active.setPageSize(s);
            active.setPage(1);
          }}
        />
      </div>
    </div>
  );
}
