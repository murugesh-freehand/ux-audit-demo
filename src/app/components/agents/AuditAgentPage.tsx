import React, { useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronRight, Plus, Search, Globe } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { agents, vendorPolicies, type VendorPolicy } from "../../data/agentsData";

// ─── Active Directives count badge ────────────────────────────────────────────
// Unified: always the same neutral-to-success color — count is just a number,
// not a status signal. No orange for "0" (which was a false warning signal).

function DirectiveCount({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-400">
        0 active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      {count} active
    </span>
  );
}

// ─── Policy Card ──────────────────────────────────────────────────────────────

function PolicyCard({ policy, isSelected }: { policy: VendorPolicy; isSelected: boolean }) {
  return (
    <Link
      to={`?policy=${policy.id}`}
      className={`flex flex-col bg-white rounded-lg border px-4 py-4 hover:border-gray-300 hover:shadow-sm transition-all group ${
        isSelected ? "border-[#F06B00] ring-1 ring-[#F06B00]/20" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          {/* Title Case name — no ALL CAPS */}
          <h3 className={`text-sm font-medium truncate ${isSelected ? "text-[#F06B00]" : "text-gray-900"}`}>
            {policy.isGlobal ? (
              <span className="flex items-center gap-1.5">
                <Globe size={13} className="text-gray-400 shrink-0" />
                {policy.vendorName}
              </span>
            ) : (
              policy.vendorName
            )}
          </h3>
          {/* SCAC without redundant "SCAC:" prefix — just the code */}
          {policy.scac && (
            <span className="font-mono text-xs text-gray-400 mt-0.5">{policy.scac}</span>
          )}
        </div>
        {isSelected && (
          <span className="text-xs text-[#F06B00] font-medium ml-2 shrink-0">Configure →</span>
        )}
      </div>

      <div className="mt-2">
        <DirectiveCount count={policy.activeDirectives} />
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5">
        {policy.totalDirectives} directive{policy.totalDirectives !== 1 ? "s" : ""} total
      </p>
    </Link>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AuditAgentPage() {
  const { slug } = useParams<{ slug: string }>();
  const agent = agents.find((a) => a.slug === slug) ?? agents.find((a) => a.slug === "audit-agent");

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = vendorPolicies.filter((p) =>
    !search || p.vendorName.toLowerCase().includes(search.toLowerCase()) || p.scac.toLowerCase().includes(search.toLowerCase())
  );

  const globalPolicy = filtered.find((p) => p.isGlobal);
  const vendorList = filtered.filter((p) => !p.isGlobal);

  const totalDirectives = vendorPolicies.reduce((s, p) => s + p.activeDirectives, 0);
  const policyCount = vendorPolicies.filter((p) => !p.isGlobal).length;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Link to="/agents" className="hover:text-gray-600 transition-colors">Agents</Link>
          <ChevronRight size={12} />
          <span className="text-gray-600">{agent?.name ?? "Audit Agent"}</span>
        </nav>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-gray-900">{agent?.name ?? "Audit Agent"}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {agent?.description ?? "Configure validation agent directives and rate matching per carrier"}
            </p>
          </div>
          <Button size="sm" className="gap-1.5">
            <Plus size={14} />
            Create Vendor Policy
          </Button>
        </div>

        {/* Summary strip */}
        <div className="flex items-center gap-0 mt-3">
          <div className="pr-4">
            <span className="text-sm font-medium text-gray-900">{totalDirectives}</span>
            <span className="text-sm text-gray-400 ml-1.5">agent directives</span>
          </div>
          <span className="text-gray-200 mr-4 select-none">·</span>
          <div className="pr-4">
            <span className="text-sm font-medium text-gray-900">{policyCount}</span>
            <span className="text-sm text-gray-400 ml-1.5">vendor policies</span>
          </div>
          <span className="text-gray-200 mr-4 select-none">·</span>
          <p className="text-sm text-gray-400">
            Global directives always run. Vendor-specific directives run additionally for matching invoices.
          </p>
        </div>
      </div>

      {/* Search + grid */}
      <div className="px-6 py-5">
        {/* Search */}
        <div className="relative max-w-xs mb-4">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors or SCAC…"
            className="pl-8 text-sm bg-gray-50 border-gray-200"
          />
        </div>

        {/* Global policy — always first */}
        {globalPolicy && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Global</p>
            <div className="max-w-xs">
              <PolicyCard
                policy={globalPolicy}
                isSelected={selectedId === globalPolicy.id}
              />
            </div>
          </div>
        )}

        {/* Vendor policies */}
        {vendorList.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Vendor Policies</p>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {vendorList.map((policy) => (
                <div key={policy.id} onClick={() => setSelectedId(selectedId === policy.id ? null : policy.id)}>
                  <PolicyCard policy={policy} isSelected={selectedId === policy.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-100 px-5 py-10 text-center text-sm text-gray-400">
            No vendor policies match "{search}"
          </div>
        )}
      </div>
    </div>
  );
}