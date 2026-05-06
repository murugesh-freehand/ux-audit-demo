import React, { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router";
import {
  ChevronRight, Plus, Search, Globe, ArrowLeft, X,
  AlertTriangle, XCircle, Clock, Trash2, Edit2, ChevronDown, Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  agents, vendorPolicies as initialPolicies,
  MODES, SERVICE_TYPES_BY_MODE, FAILURE_ACTIONS,
  type VendorPolicy, type AgentDirective, type ModeServiceScope, type FailureAction,
} from "../../data/agentsData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function activeCount(p: VendorPolicy) {
  return p.directives.filter(d => d.status === "ACTIVE").length;
}

function scopeLabel(scope: ModeServiceScope[]): string {
  if (scope.length === 0) return "All modes · All service types";
  return scope
    .map(s =>
      s.serviceTypes.length === 0
        ? `${s.mode} · All`
        : `${s.mode} · ${s.serviceTypes.join(", ")}`
    )
    .join(" | ");
}

const FAILURE_ACTION_STYLES: Record<FailureAction, string> = {
  FLAG:   "bg-amber-50 text-amber-700 border-amber-200",
  WARN:   "bg-blue-50 text-blue-700 border-blue-200",
  HOLD:   "bg-orange-50 text-orange-700 border-orange-200",
  REJECT: "bg-red-50 text-red-700 border-red-200",
};

const FAILURE_ACTION_ICON: Record<FailureAction, React.ElementType> = {
  FLAG:   AlertTriangle,
  WARN:   Clock,
  HOLD:   Clock,
  REJECT: XCircle,
};

// ─── Directive Count Badge ────────────────────────────────────────────────────

function DirectiveCount({ count }: { count: number }) {
  if (count === 0) return (
    <span className="inline-flex items-center rounded-sm border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-400">
      0 active
    </span>
  );
  return (
    <span className="inline-flex items-center rounded-sm border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      {count} active
    </span>
  );
}

// ─── Policy Card ──────────────────────────────────────────────────────────────

function PolicyCard({
  policy, isSelected, onClick,
}: {
  policy: VendorPolicy; isSelected: boolean; onClick: () => void;
}) {
  const count = activeCount(policy);
  return (
    <div
      onClick={onClick}
      className={`flex flex-col bg-white rounded-lg border px-4 py-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all ${
        isSelected ? "border-primary ring-1 ring-primary/20" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium truncate ${isSelected ? "text-primary" : "text-slate-950"}`}>
            {policy.isGlobal ? (
              <span className="flex items-center gap-1.5">
                <Globe size={13} className="text-slate-400 shrink-0" />
                {policy.vendorName}
              </span>
            ) : policy.vendorName}
          </h3>
          {policy.scac && (
            <span className="font-mono text-xs text-slate-400 mt-0.5">{policy.scac}</span>
          )}
        </div>
        {isSelected && (
          <span className="text-xs text-primary font-medium ml-2 shrink-0">Configure →</span>
        )}
      </div>
      <div className="mt-2">
        <DirectiveCount count={count} />
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5">
        {policy.directives.length} directive{policy.directives.length !== 1 ? "s" : ""} total
      </p>
    </div>
  );
}

// ─── Service Type Multi-select Dropdown ──────────────────────────────────────

function ServiceTypeDropdown({
  mode,
  selected,
  onChange,
}: {
  mode: string;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = SERVICE_TYPES_BY_MODE[mode] ?? [];
  const allSelected = selected.length === 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggle = (svc: string) => {
    const has = selected.includes(svc);
    onChange(has ? selected.filter(s => s !== svc) : [...selected, svc]);
  };

  const toggleAll = () => onChange([]);

  // Trigger label
  const label = allSelected
    ? "All service types"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 rounded-md border bg-white px-3 h-8 text-xs transition-colors ${
          open
            ? "border-primary ring-1 ring-primary/20"
            : "border-slate-200 hover:border-gray-300"
        }`}
      >
        <span className={allSelected ? "text-slate-400" : "text-slate-800 font-medium"}>
          {label}
        </span>
        <ChevronDown size={12} className={`text-slate-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[160px] bg-white border border-slate-200 rounded-lg shadow-md py-1 overflow-hidden">
          {/* All service types */}
          <button
            type="button"
            onClick={toggleAll}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 transition-colors"
          >
            <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
              allSelected ? "bg-primary border-primary" : "border-gray-300 bg-white"
            }`}>
              {allSelected && <Check size={9} strokeWidth={3} className="text-white" />}
            </span>
            <span className={allSelected ? "font-medium text-slate-950" : "text-slate-600"}>
              All service types
            </span>
          </button>

          <div className="h-px bg-slate-100 mx-2 my-1" />

          {options.map(svc => {
            const checked = selected.includes(svc);
            return (
              <button
                key={svc}
                type="button"
                onClick={() => toggle(svc)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 transition-colors"
              >
                <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                  checked ? "bg-primary border-primary" : "border-gray-300 bg-white"
                }`}>
                  {checked && <Check size={9} strokeWidth={3} className="text-white" />}
                </span>
                <span className={checked ? "font-medium text-slate-950" : "text-slate-600"}>{svc}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Compound Scope Builder ───────────────────────────────────────────────────
// Each row = one mode dropdown + one service-type multi-select dropdown.
// No service types selected on a row = "all service types for this mode".

interface ScopeRow {
  rowId: string;
  mode: string;
  serviceTypes: string[];
}

function ScopeBuilder({
  rows, onChange,
}: {
  rows: ScopeRow[];
  onChange: (rows: ScopeRow[]) => void;
}) {
  const addRow = () => {
    const usedModes = rows.map(r => r.mode);
    const next = MODES.find(m => !usedModes.includes(m));
    if (!next) return;
    onChange([...rows, { rowId: crypto.randomUUID(), mode: next, serviceTypes: [] }]);
  };

  const removeRow = (rowId: string) =>
    onChange(rows.filter(r => r.rowId !== rowId));

  const updateMode = (rowId: string, mode: string) =>
    onChange(rows.map(r => r.rowId === rowId ? { ...r, mode, serviceTypes: [] } : r));

  const updateServices = (rowId: string, serviceTypes: string[]) =>
    onChange(rows.map(r => r.rowId === rowId ? { ...r, serviceTypes } : r));

  const usedModes = rows.map(r => r.mode);

  return (
    <div className="space-y-2">
      {/* Column labels — only shown when there are rows */}
      {rows.length > 0 && (
        <div className="flex items-center gap-2 px-0.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide w-[88px] shrink-0">Mode</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide flex-1">Service Type</span>
        </div>
      )}

      {rows.map(row => (
        <div key={row.rowId} className="flex items-center gap-2">
          {/* Mode dropdown */}
          <select
            value={row.mode}
            onChange={e => updateMode(row.rowId, e.target.value)}
            className="h-8 w-[88px] shrink-0 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:border-ring"
          >
            {MODES.map(m => (
              <option key={m} value={m} disabled={usedModes.includes(m) && m !== row.mode}>
                {m}
              </option>
            ))}
          </select>

          {/* Service type multi-select — hidden for modes with no service type concept */}
          {(SERVICE_TYPES_BY_MODE[row.mode]?.length ?? 0) > 0 ? (
            <ServiceTypeDropdown
              mode={row.mode}
              selected={row.serviceTypes}
              onChange={svc => updateServices(row.rowId, svc)}
            />
          ) : (
            <div className="flex-1 flex items-center h-8 px-3 rounded-md border border-dashed border-slate-200 bg-slate-50">
              <span className="text-xs text-slate-400">No service type for this mode</span>
            </div>
          )}

          {/* Remove row */}
          <button
            type="button"
            onClick={() => removeRow(row.rowId)}
            className="shrink-0 p-1 rounded text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      ))}

      {rows.length === 0 && (
        <p className="text-xs text-slate-400 py-1">
          No scope set — directive applies to all modes and service types.
        </p>
      )}

      {usedModes.length < MODES.length && (
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium mt-1"
        >
          <Plus size={11} /> Add mode
        </button>
      )}
    </div>
  );
}

// ─── Add Directive Modal ──────────────────────────────────────────────────────

interface AddDirectiveModalProps {
  policyName: string;
  onClose: () => void;
  onCreate: (d: Omit<AgentDirective, "id" | "createdAt">) => void;
}

function AddDirectiveModal({ policyName, onClose, onCreate }: AddDirectiveModalProps) {
  const [name, setName]               = useState("");
  const [scopeRows, setScopeRows]     = useState<ScopeRow[]>([]);
  const [failureAction, setFA]        = useState<FailureAction>("FLAG");
  const [definition, setDefinition]   = useState("");

  const canSubmit = name.trim().length > 0 && definition.trim().length > 0;

  const handleCreate = () => {
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      scope: scopeRows.map(r => ({ mode: r.mode, serviceTypes: r.serviceTypes })),
      failureAction,
      definition: definition.trim(),
      status: "ACTIVE",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-950">Add Agent Directive</h2>
          <p className="text-xs text-slate-400 mt-0.5">to {policyName}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Fuel Surcharge Range Check"
              className="text-sm"
            />
          </div>

          {/* Mode & Service Type — compound scope builder */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Mode & Service Type</label>
            <ScopeBuilder rows={scopeRows} onChange={setScopeRows} />
          </div>

          {/* Failure Action */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Failure Action</label>
            <div className="relative">
              <select
                value={failureAction}
                onChange={e => setFA(e.target.value as FailureAction)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:border-ring appearance-none"
              >
                {FAILURE_ACTIONS.map(fa => (
                  <option key={fa.value} value={fa.value}>{fa.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Directive Definition */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Agent Directive Definition
            </label>
            <textarea
              value={definition}
              onChange={e => setDefinition(e.target.value)}
              placeholder="Describe what this agent directive checks in natural language…"
              rows={5}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:border-ring resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={handleCreate}
            className="bg-primary hover:bg-[#d85f00] text-white"
          >
            Create Agent Directive
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Vendor Policy Detail ─────────────────────────────────────────────────────

function VendorPolicyDetail({
  policy,
  onBack,
  onDirectiveAdded,
}: {
  policy: VendorPolicy;
  onBack: () => void;
  onDirectiveAdded: (policyId: string, d: Omit<AgentDirective, "id" | "createdAt">) => void;
}) {
  const [tab, setTab]         = useState<"directives" | "rateEngine">("directives");
  const [showModal, setModal] = useState(false);

  const active   = policy.directives.filter(d => d.status === "ACTIVE");
  const inactive = policy.directives.filter(d => d.status === "INACTIVE");

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors mb-3"
        >
          <ArrowLeft size={13} /> Back to policies
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-slate-950">{policy.vendorName}</h1>
              {policy.scac && (
                <span className="inline-flex items-center rounded-sm border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-mono font-medium text-slate-500">
                  {policy.scac}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              {policy.isGlobal
                ? "Global directives run on every invoice regardless of vendor"
                : `Vendor-specific policy for ${policy.vendorName}`}
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 bg-primary hover:bg-[#d85f00] text-white"
            onClick={() => setModal(true)}
          >
            <Plus size={14} /> Add Agent Directive
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex items-center -mb-px">
          {[
            { id: "directives",  label: `Agent Directives (${active.length})` },
            { id: "rateEngine",  label: "Rate Engine" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
                tab === t.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 py-5 flex-1">
        {tab === "directives" && (
          <DirectivesTab
            active={active}
            inactive={inactive}
            onAdd={() => setModal(true)}
          />
        )}
        {tab === "rateEngine" && (
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-10 text-center text-sm text-slate-400">
            Rate engine configuration coming soon
          </div>
        )}
      </div>

      {showModal && (
        <AddDirectiveModal
          policyName={policy.vendorName}
          onClose={() => setModal(false)}
          onCreate={d => {
            onDirectiveAdded(policy.id, d);
            setModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Directives Tab ───────────────────────────────────────────────────────────

function DirectivesTab({
  active, inactive, onAdd,
}: {
  active: AgentDirective[];
  inactive: AgentDirective[];
  onAdd: () => void;
}) {
  if (active.length === 0 && inactive.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-dashed border-slate-200 px-5 py-12 text-center">
        <p className="text-sm text-slate-500 mb-3">No agent directives configured.</p>
        <Button
          size="sm"
          className="gap-1.5 bg-primary hover:bg-[#d85f00] text-white"
          onClick={onAdd}
        >
          <Plus size={14} /> Add Agent Directive
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {active.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Active · {active.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {active.map(d => <DirectiveRow key={d.id} directive={d} />)}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Inactive · {inactive.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {inactive.map(d => <DirectiveRow key={d.id} directive={d} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Directive Row ─────────────────────────────────────────────────────────────

function DirectiveRow({ directive }: { directive: AgentDirective }) {
  const [expanded, setExpanded] = useState(false);
  const fa = FAILURE_ACTIONS.find(f => f.value === directive.failureAction);
  const Icon = FAILURE_ACTION_ICON[directive.failureAction];

  return (
    <div className={`px-5 py-3.5 ${directive.status === "INACTIVE" ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-950">{directive.name}</span>
            <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium ${FAILURE_ACTION_STYLES[directive.failureAction]}`}>
              <Icon size={10} />
              {fa?.label}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-0.5">{scopeLabel(directive.scope)}</p>

          {directive.definition && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="mt-1 text-xs text-slate-400 hover:text-primary transition-colors"
            >
              {expanded ? "Hide definition ↑" : "Show definition ↓"}
            </button>
          )}
          {expanded && directive.definition && (
            <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-md px-3 py-2 border border-slate-200">
              {directive.definition}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <Edit2 size={13} />
          </button>
          <button className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditAgentPage() {
  const { slug } = useParams<{ slug: string }>();
  const agent = agents.find(a => a.slug === slug) ?? agents.find(a => a.slug === "audit-agent");

  const [policies, setPolicies] = useState(initialPolicies);
  const [search, setSearch]     = useState("");
  const [selectedId, setSelected] = useState<string | null>(null);

  const selectedPolicy = selectedId ? policies.find(p => p.id === selectedId) ?? null : null;

  const filtered = policies.filter(p =>
    !search ||
    p.vendorName.toLowerCase().includes(search.toLowerCase()) ||
    p.scac.toLowerCase().includes(search.toLowerCase())
  );

  const globalPolicy = filtered.find(p => p.isGlobal);
  const vendorList   = filtered.filter(p => !p.isGlobal);

  const totalDirectives = policies.reduce((s, p) => s + activeCount(p), 0);
  const policyCount     = policies.filter(p => !p.isGlobal).length;

  const handleDirectiveAdded = (
    policyId: string,
    d: Omit<AgentDirective, "id" | "createdAt">
  ) => {
    setPolicies(prev => prev.map(p => {
      if (p.id !== policyId) return p;
      return {
        ...p,
        directives: [
          ...p.directives,
          { ...d, id: `d-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) },
        ],
      };
    }));
  };

  // Show vendor policy detail view when a policy is selected
  if (selectedPolicy) {
    return (
      <VendorPolicyDetail
        policy={selectedPolicy}
        onBack={() => setSelected(null)}
        onDirectiveAdded={handleDirectiveAdded}
      />
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link to="/agents" className="hover:text-slate-600 transition-colors">Agents</Link>
          <ChevronRight size={12} />
          <span className="text-slate-600">{agent?.name ?? "Audit Agent"}</span>
        </nav>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-slate-950">{agent?.name ?? "Audit Agent"}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {agent?.description ?? "Configure validation agent directives and rate matching per carrier"}
            </p>
          </div>
          <Button size="sm" className="gap-1.5">
            <Plus size={14} /> Create Vendor Policy
          </Button>
        </div>

        {/* Summary strip */}
        <div className="flex items-center gap-0 mt-3">
          <div className="pr-4">
            <span className="text-sm font-medium text-slate-950">{totalDirectives}</span>
            <span className="text-sm text-slate-400 ml-1.5">agent directives</span>
          </div>
          <span className="text-slate-200 mr-4 select-none">·</span>
          <div className="pr-4">
            <span className="text-sm font-medium text-slate-950">{policyCount}</span>
            <span className="text-sm text-slate-400 ml-1.5">vendor policies</span>
          </div>
          <span className="text-slate-200 mr-4 select-none">·</span>
          <p className="text-sm text-slate-400">
            Global directives always run. Vendor-specific directives run additionally for matching invoices.
          </p>
        </div>
      </div>

      {/* Search + grid */}
      <div className="px-6 py-5">
        <div className="relative max-w-xs mb-4">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors or SCAC…"
            className="pl-8 text-sm bg-slate-50 border-slate-200"
          />
        </div>

        {globalPolicy && (
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Global</p>
            <div className="max-w-xs">
              <PolicyCard
                policy={globalPolicy}
                isSelected={false}
                onClick={() => setSelected(globalPolicy.id)}
              />
            </div>
          </div>
        )}

        {vendorList.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Vendor Policies</p>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {vendorList.map(policy => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  isSelected={false}
                  onClick={() => setSelected(policy.id)}
                />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-10 text-center text-sm text-slate-400">
            No vendor policies match "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
