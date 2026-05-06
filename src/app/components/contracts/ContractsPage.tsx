import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Upload,
  Search,
  ChevronRight,
  History,
  X,
  Copy,
  Check,
  ChevronDown,
  Clock,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Progress } from "../ui/progress";
import { StatusBadge, ModeBadge } from "../shared/StatusBadge";
import {
  carriers,
  contracts,
  lanes,
  uploadJobs,
  type Carrier,
  type Lane,
} from "../../data/mockData";

// ─── Upload History Sheet ─────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
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
          <History size={14} />
          Upload History
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[640px] max-w-full flex flex-col overflow-hidden p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-200 shrink-0">
          <SheetTitle className="text-base font-semibold text-slate-950">Upload History</SheetTitle>
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
                        <span className="font-mono text-xs text-slate-700 truncate" title={job.ref}>
                          {shortRef}
                        </span>
                        <CopyButton text={job.ref} />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(job.uploadedAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
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

// ─── Lane Search Results ──────────────────────────────────────────────────────

function LaneSearchResults({ query }: { query: string }) {
  const q = query.toLowerCase();
  const results = lanes.filter(
    (l) =>
      l.origin.city.toLowerCase().includes(q) ||
      l.origin.state.toLowerCase().includes(q) ||
      l.destination.city.toLowerCase().includes(q) ||
      l.destination.state.toLowerCase().includes(q) ||
      l.ref.toLowerCase().includes(q) ||
      l.mode.toLowerCase().includes(q)
  );

  const carrierForContract = (contractId: string) =>
    carriers.find((c) => contracts.find((ct) => ct.id === contractId && ct.carrierId === c.id));

  if (results.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">No lanes match "{query}"</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {results.length} lane{results.length !== 1 ? "s" : ""} found
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Carrier</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Ref</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Mode</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Origin</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Destination</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Discount</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((lane) => {
              const carrier = carrierForContract(lane.contractId);
              return (
                <tr key={lane.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-600">{carrier?.scac ?? "—"}</span>
                    <span className="block text-xs text-slate-400">{carrier?.name}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{lane.ref}</td>
                  <td className="px-4 py-3"><ModeBadge mode={lane.mode} /></td>
                  <td className="px-4 py-3 text-xs text-slate-700">
                    {lane.origin.city}, {lane.origin.state}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">
                    {lane.destination.city}, {lane.destination.state}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">{lane.discount}%</td>
                  <td className="px-4 py-3"><StatusBadge status={lane.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Carrier List ─────────────────────────────────────────────────────────────

function CarrierRow({ carrier }: { carrier: Carrier }) {
  return (
    <Link
      to={`/contracts/${carrier.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors group border-b border-slate-100 last:border-0"
    >
      {/* Carrier identity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-950">{carrier.name}</span>
          <span className="font-mono text-xs text-slate-400">{carrier.scac}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {carrier.modes.map((m) => (
            <ModeBadge key={m} mode={m} />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-8 text-sm">
        <div className="text-right">
          <p className="text-slate-950 font-medium">{carrier.activeLanes.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Active lanes</p>
        </div>
        <div className="text-right">
          <p className="text-slate-950 font-medium">{carrier.contractCount}</p>
          <p className="text-xs text-slate-400">Contract{carrier.contractCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-xs">
            {new Date(carrier.lastUpdated).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </p>
          <p className="text-xs text-slate-400">Last updated</p>
        </div>
      </div>

      {/* Status + arrow */}
      <div className="flex items-center gap-3 ml-4">
        <StatusBadge status={carrier.status} />
        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const showLaneSearch = search.trim().length > 1;

  const filteredCarriers = useMemo(() => {
    return carriers.filter((c) => {
      const matchMode = modeFilter === "all" || c.modes.includes(modeFilter as any);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchMode && matchStatus;
    });
  }, [modeFilter, statusFilter]);

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-950">Contracts</h1>
            <p className="text-sm text-slate-500 mt-0.5">{carriers.length} carriers</p>
          </div>
          <div className="flex items-center gap-2">
            <UploadHistorySheet />
            <Button size="sm" className="gap-1.5">
              <Upload size={14} />
              Upload Contract
            </Button>
          </div>
        </div>

        {/* Lane search */}
        <div className="mt-4 relative max-w-lg">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lanes by origin, destination, or carrier…"
            className="pl-9 text-sm bg-slate-50 border-slate-200 focus:bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        {showLaneSearch ? (
          <LaneSearchResults query={search} />
        ) : (
          <>
            {/* Filters */}
            <div className="flex items-center gap-2 mb-4">
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:border-ring"
              >
                <option value="all">All Modes</option>
                <option value="LTL">LTL</option>
                <option value="FTL">FTL</option>
                <option value="ROAD">Road</option>
                <option value="AIR">Air</option>
                <option value="OCEAN">Ocean</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:border-ring"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Carrier list */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <span className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wide">Carrier</span>
                <div className="hidden md:flex items-center gap-8 mr-4">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-20 text-right">Active Lanes</span>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-16 text-right">Contracts</span>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-24 text-right">Last Updated</span>
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-24 text-right">Status</span>
              </div>
              {filteredCarriers.map((carrier) => (
                <CarrierRow key={carrier.id} carrier={carrier} />
              ))}
              {filteredCarriers.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-slate-400">
                  No carriers match these filters
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}