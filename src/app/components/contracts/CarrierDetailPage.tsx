import React, { useState, useMemo } from "react";
import { Link, useParams } from "react-router";
import {
  ChevronRight,
  Search,
  FileText,
  Edit2,
  AlertCircle,
  CheckCircle2,
  X,
  LayoutList,
  Table2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { StatusBadge, ModeBadge } from "../shared/StatusBadge";
import { cn } from "../ui/utils";
import {
  carriers,
  contracts,
  lanes,
  chargeDefinitions,
  type ChargeDefinition,
} from "../../data/mockData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function route(lane: typeof lanes[number]) {
  const o = `${lane.origin.city}, ${lane.origin.state}`;
  const d = `${lane.destination.city}, ${lane.destination.state}`;
  return `${o} → ${d}`;
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ carrierId }: { carrierId: string }) {
  const carrierContracts = contracts.filter((c) => c.carrierId === carrierId);
  const active = carrierContracts.find((c) => c.status === "ACTIVE") ?? carrierContracts[0];
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  if (!active) return (
    <div className="py-12 text-center text-sm text-slate-400">No contracts on file yet.</div>
  );

  function toggleTerm(id: string) {
    setExpandedTerms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const auditTerms    = active.keyTerms.filter((t) => t.affectsAudit);
  const generalTerms  = active.keyTerms.filter((t) => !t.affectsAudit);

  return (
    <div className="space-y-4">

      {/* Agreement summary */}
      <div className="bg-white rounded-lg border border-slate-200 px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
        {[
          { label: "Agreement type",  value: active.type },
          { label: "Mode",            value: <ModeBadge mode={active.mode} /> },
          { label: "Validity",        value: `${fmt(active.effectiveDate)} – ${fmt(active.expirationDate)}` },
          { label: "Status",          value: <StatusBadge status={active.status} /> },
          { label: "Active lanes",    value: active.laneCount.toLocaleString() },
          { label: "Charge types",    value: active.chargeCount },
          { label: "FAK rules",       value: active.fakRules.length || "None" },
          { label: "Last uploaded",   value: fmt(active.uploadedAt) },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <div className="text-sm font-medium text-slate-950">{value}</div>
          </div>
        ))}
      </div>

      {/* Key Terms */}
      {active.keyTerms.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-950">Key Terms</p>
            <p className="text-xs text-slate-400 mt-0.5">Contract provisions that affect pricing and audit outcomes</p>
          </div>

          {auditTerms.length > 0 && (
            <div>
              <div className="px-5 py-2 bg-amber-50/60 border-b border-amber-100">
                <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertCircle size={11} /> Affects audit
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {auditTerms.map((term) => (
                  <button
                    key={term.id}
                    onClick={() => toggleTerm(term.id)}
                    className="w-full text-left px-5 py-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">{term.title}</p>
                      <ChevronRight
                        size={14}
                        className={cn("text-slate-300 transition-transform shrink-0 ml-2", expandedTerms.has(term.id) && "rotate-90")}
                      />
                    </div>
                    {expandedTerms.has(term.id) && (
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed pr-4">{term.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {generalTerms.length > 0 && (
            <div>
              <div className="px-5 py-2 bg-slate-50/80 border-b border-slate-200 border-t border-t-slate-200">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 size={11} /> General terms
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {generalTerms.map((term) => (
                  <button
                    key={term.id}
                    onClick={() => toggleTerm(term.id)}
                    className="w-full text-left px-5 py-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">{term.title}</p>
                      <ChevronRight
                        size={14}
                        className={cn("text-slate-300 transition-transform shrink-0 ml-2", expandedTerms.has(term.id) && "rotate-90")}
                      />
                    </div>
                    {expandedTerms.has(term.id) && (
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed pr-4">{term.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAK Rules */}
      {active.fakRules.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-950">FAK Rules</p>
            <Button variant="ghost" size="sm" className="gap-1 h-7 px-2 text-xs text-slate-500">
              <Edit2 size={11} /> Edit
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Classes", "Rated As", "Weight Range"].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {active.fakRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/40">
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {rule.classes.map((cls) => (
                          <span key={cls} className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">{cls}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{rule.ratedAs}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{rule.minWeight.toLocaleString()} – {rule.maxWeight.toLocaleString()} lbs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Charge Card (used in By Charge view) ────────────────────────────────────

function ChargeCard({ charge }: { charge: ChargeDefinition }) {
  const [editingRow, setEditingRow] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Charge group header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200">
        <span className="font-mono text-sm font-semibold text-slate-950">{charge.code}</span>
        <span className="text-sm text-slate-500">{charge.name}</span>
        <span className="text-xs text-slate-400 flex-1 truncate">{charge.source}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs text-slate-500 gap-1 shrink-0"
        >
          <Edit2 size={11} /> Edit
        </Button>
      </div>

      {/* Lane-level rate sub-table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Lane / Region</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Value</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">UOM</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Slab</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Currency</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Effective</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {charge.laneRates.map((lr) => (
              <tr key={lr.id} className="hover:bg-slate-50/40 transition-colors group">
                {editingRow === lr.id ? (
                  /* Inline edit row */
                  <>
                    <td className="px-5 py-2 text-xs text-slate-700">{lr.laneRegion}</td>
                    <td className="px-4 py-2">
                      <input
                        defaultValue={lr.value ?? ""}
                        className="w-20 rounded border border-orange-300 bg-orange-50 px-2 py-1 text-xs text-slate-950 focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600">{lr.uom}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{lr.slab}</td>
                    <td className="px-4 py-2 text-xs text-slate-600">{lr.currency}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{lr.effective ? fmt(lr.effective) : "—"}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="h-6 px-2 text-xs gap-1 bg-primary hover:bg-orange-600 text-white"
                          onClick={() => setEditingRow(null)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-xs text-slate-400"
                          onClick={() => setEditingRow(null)}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  /* Read row */
                  <>
                    <td className="px-5 py-2.5 text-xs text-slate-700 font-medium">{lr.laneRegion}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-950">
                      {lr.value !== null ? lr.value : <span className="text-slate-400 font-normal">See table</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{lr.uom}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{lr.slab || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{lr.currency}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{lr.effective ? fmt(lr.effective) : <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-2.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                        onClick={() => setEditingRow(lr.id)}
                      >
                        <Edit2 size={10} /> Edit
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Details (Lane ↔ Charge toggle) ─────────────────────────────────────

type DetailsView = "lane" | "charge";

function DetailsTab({ carrierId }: { carrierId: string }) {
  const [view, setView]       = useState<DetailsView>("lane");
  const [search, setSearch]   = useState("");

  const carrierContracts = contracts.filter((c) => c.carrierId === carrierId);
  const contractIds      = carrierContracts.map((c) => c.id);
  const activeContractId = carrierContracts.find((c) => c.status === "ACTIVE")?.id;

  const allLanes   = lanes.filter((l) => contractIds.includes(l.contractId));
  const allCharges = chargeDefinitions.filter((c) => contractIds.includes(c.contractId));

  // Charge codes present across all contracts for this carrier
  const chargeCodes = [...new Set(allCharges.map((c) => c.code))];

  const q = search.trim().toLowerCase();

  const filteredLanes = useMemo(() => {
    if (!q) return allLanes;
    return allLanes.filter((l) =>
      route(l).toLowerCase().includes(q) ||
      l.ref.toLowerCase().includes(q) ||
      l.service.toLowerCase().includes(q) ||
      l.mode.toLowerCase().includes(q)
    );
  }, [allLanes, q]);

  const filteredCharges = useMemo(() => {
    if (!q) return allCharges;
    return allCharges.filter((c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q)
    );
  }, [allCharges, q]);

  function chargeForLane(laneContractId: string, code: string) {
    return allCharges.find((c) => c.contractId === laneContractId && c.code === code);
  }

  return (
    <div className="space-y-3">

      {/* Search + toggle row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={view === "lane" ? "Search by route, ref, mode…" : "Search by charge code or name…"}
            className="pl-8 text-sm bg-slate-50 border-slate-200 focus:bg-white h-8"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={12} />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5 shrink-0">
          <button
            onClick={() => { setView("lane"); setSearch(""); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              view === "lane" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutList size={12} /> By Lane
          </button>
          <button
            onClick={() => { setView("charge"); setSearch(""); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              view === "charge" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Table2 size={12} /> By Charge
          </button>
        </div>
      </div>

      {/* ── By Lane view ─────────────────────────────────────────────────── */}
      {view === "lane" && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
            <p className="text-xs text-slate-400">{filteredLanes.length.toLocaleString()} lane{filteredLanes.length !== 1 ? "s" : ""} {q && `matching "${search}"`}</p>
            <p className="text-xs text-slate-400">Showing sample — full set has {carrierContracts.find((c) => c.status === "ACTIVE")?.laneCount.toLocaleString() ?? "—"} lanes</p>
          </div>
          {filteredLanes.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No lanes match "{search}"</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Route</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Mode</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Ref</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Service</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">Validity</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    {chargeCodes.map((code) => (
                      <th key={code} className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {code}
                      </th>
                    ))}
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLanes.map((lane) => (
                    <tr key={lane.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-800 whitespace-nowrap font-medium">
                        {lane.origin.city}, {lane.origin.state}
                        <span className="text-slate-400 mx-1.5">→</span>
                        {lane.destination.city}, {lane.destination.state}
                      </td>
                      <td className="px-4 py-3"><ModeBadge mode={lane.mode} /></td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{lane.ref}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{lane.service}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {fmt(lane.validFrom)} – {fmt(lane.validTo)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={lane.status} /></td>
                      {chargeCodes.map((code) => {
                        const ch = chargeForLane(lane.contractId, code);
                        const laneRate = ch?.laneRates.find((r) =>
                          r.laneRegion === "All lanes" ||
                          r.laneRegion.toLowerCase().includes(lane.origin.city.toLowerCase())
                        );
                        return (
                          <td key={code} className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                            {ch ? (
                              code === "BASE"
                                ? <span className="font-semibold text-slate-950">{lane.discount}%</span>
                                : laneRate?.value !== null && laneRate?.value !== undefined
                                  ? <span>{laneRate.value}</span>
                                  : <span className="text-slate-400 italic">Table</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                        >
                          <Edit2 size={10} /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── By Charge view ───────────────────────────────────────────────── */}
      {view === "charge" && (
        <div className="space-y-2">
          {filteredCharges.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 py-10 text-center text-sm text-slate-400">
              No charges match "{search}"
            </div>
          ) : (
            filteredCharges.map((ch) => (
              <ChargeCard key={ch.id} charge={ch} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Versions ────────────────────────────────────────────────────────────

function VersionsTab({ carrierId }: { carrierId: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const carrierContracts = contracts
    .filter((c) => c.carrierId === carrierId)
    .sort((a, b) => b.version - a.version);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {carrierContracts.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">No contract versions on file.</div>
      ) : (
        <div className="divide-y divide-slate-200">
          {carrierContracts.map((c, idx) => (
            <div key={c.id}>
              <button
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
              >
                {/* Version + status */}
                <div className="flex items-center gap-2 min-w-[120px]">
                  <span className="text-sm font-semibold text-slate-950">v{c.version}</span>
                  {idx === 0 && c.status === "ACTIVE" && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Current</span>
                  )}
                  {c.status !== "ACTIVE" && <StatusBadge status={c.status} />}
                </div>

                {/* Validity */}
                <div className="flex-1 text-xs text-slate-500">
                  {fmt(c.effectiveDate)} – {fmt(c.expirationDate)}
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 text-xs text-slate-500 mr-4">
                  <span><span className="font-medium text-slate-800">{c.laneCount.toLocaleString()}</span> lanes</span>
                  <span><span className="font-medium text-slate-800">{c.chargeCount}</span> charges</span>
                  <span>Uploaded {fmt(c.uploadedAt)}</span>
                </div>

                <ChevronRight size={14} className={cn("text-slate-300 shrink-0 transition-transform", expanded === c.id && "rotate-90")} />
              </button>

              {expanded === c.id && (
                <div className="px-5 pb-4 bg-slate-50/40 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 pt-3">Source files</p>
                  <div className="space-y-1.5">
                    {c.sourceFiles.map((file) => (
                      <div key={file} className="flex items-center gap-2.5">
                        <FileText size={13} className="text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-700">{file}</span>
                      </div>
                    ))}
                  </div>
                  {c.fakRules.length > 0 && (
                    <p className="text-xs text-slate-400 mt-3">
                      {c.fakRules.length} FAK rule{c.fakRules.length !== 1 ? "s" : ""} applied in this version
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "overview" | "details" | "versions";

export default function CarrierDetailPage() {
  const { carrierId } = useParams<{ carrierId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const carrier = carriers.find((c) => c.id === carrierId);

  if (!carrier) return <div className="p-8 text-center text-slate-500">Carrier not found.</div>;

  const carrierContracts = contracts.filter((c) => c.carrierId === carrierId);
  const active = carrierContracts.find((c) => c.status === "ACTIVE");

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "details",  label: "Details" },
    { id: "versions", label: `Versions (${carrierContracts.length})` },
  ];

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link to="/contracts" className="hover:text-slate-600 transition-colors">Contracts</Link>
          <ChevronRight size={12} />
          <span className="text-slate-700 font-medium">{carrier.name}</span>
        </nav>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-slate-950">{carrier.name}</h1>
              <span className="font-mono text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">{carrier.scac}</span>
              <StatusBadge status={carrier.status} />
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {carrier.modes.map((m) => <ModeBadge key={m} mode={m} />)}
              {active && (
                <span className="text-xs text-slate-400 ml-1">
                  · Valid {fmt(active.effectiveDate)} – {fmt(active.expirationDate)}
                  · {carrier.activeLanes.toLocaleString()} active lanes
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 mt-4 -mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 py-5">
        {activeTab === "overview" && <OverviewTab carrierId={carrierId!} />}
        {activeTab === "details"  && <DetailsTab  carrierId={carrierId!} />}
        {activeTab === "versions" && <VersionsTab carrierId={carrierId!} />}
      </div>
    </div>
  );
}
