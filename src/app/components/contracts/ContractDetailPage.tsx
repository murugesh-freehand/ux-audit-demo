import React, { useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronRight, FileText, Plus, Edit2, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge, ModeBadge } from "../shared/StatusBadge";
import {
  carriers,
  contracts,
  lanes,
  chargeDefinitions,
} from "../../data/mockData";

type Tab = "overview" | "pricing" | "lanes";

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ contract }: { contract: ReturnType<typeof contracts.find> }) {
  if (!contract) return null;
  return (
    <div className="space-y-6">
      {/* Contract metadata */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contract Details</h3>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
          {[
            { label: "Status",      value: <StatusBadge status={contract.status} /> },
            { label: "Mode",        value: <ModeBadge mode={contract.mode} /> },
            { label: "Type",        value: <span className="text-sm text-gray-700">{contract.type}</span> },
            { label: "Effective",   value: <span className="text-sm text-gray-700">{contract.effectiveDate}</span> },
            { label: "Expiration",  value: <span className="text-sm text-gray-700">{contract.expirationDate}</span> },
            { label: "Uploaded",    value: <span className="text-sm text-gray-700">{contract.uploadedAt}</span> },
            { label: "Lanes",       value: <span className="text-sm text-gray-700">{contract.laneCount.toLocaleString()}</span> },
            { label: "Charges",     value: <span className="text-sm text-gray-700">{contract.chargeCount}</span> },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              {value}
            </div>
          ))}
        </div>
      </div>

      {/* FAK Rules */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/50">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">FAK Rules</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1 h-7 px-2 text-xs text-gray-500">
              <Edit2 size={11} />
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="gap-1 h-7 px-2 text-xs text-gray-500">
              <Plus size={11} />
              Add
            </Button>
          </div>
        </div>

        {contract.fakRules.length === 0 ? (
          <div className="px-5 py-6 text-sm text-gray-400 text-center">
            No FAK rules defined for this contract
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {contract.fakRules.map((rule) => (
              <div key={rule.id} className="px-5 py-3 flex items-center gap-8 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Classes</p>
                  <div className="flex gap-1">
                    {rule.classes.map((cls) => (
                      <span
                        key={cls}
                        className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-600"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Rated As</p>
                  <span className="font-medium text-gray-800">{rule.ratedAs}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Weight Range</p>
                  <span className="text-gray-700">
                    {rule.minWeight.toLocaleString()} – {rule.maxWeight.toLocaleString()} lbs
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Source Files */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source Files</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {contract.sourceFiles.map((file) => (
            <div key={file} className="flex items-center gap-3 px-5 py-3">
              <FileText size={14} className="text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{file}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pricing Tab ──────────────────────────────────────────────────────────────

function PricingTab({ contractId }: { contractId: string }) {
  const charges = chargeDefinitions.filter((c) => c.contractId === contractId);
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Charge Definitions</h3>
      </div>
      {charges.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          No charge definitions for this contract
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Code</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Basis</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Rate</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Currency</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Effective</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {charges.map((charge) => (
                <tr key={charge.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-700">{charge.code}</td>
                  <td className="px-5 py-3 text-gray-900">{charge.name}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                      {charge.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{charge.basis}</td>
                  <td className="px-5 py-3 text-gray-900 font-medium">{charge.rate}</td>
                  <td className="px-5 py-3 text-gray-600">{charge.currency}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{charge.effectiveDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Lanes Tab ────────────────────────────────────────────────────────────────

function LanesTab({ contractId }: { contractId: string }) {
  const contractLanes = lanes.filter((l) => l.contractId === contractId);
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/50">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Lanes · {contractLanes.length.toLocaleString()} shown
        </h3>
        <span className="text-xs text-gray-400">Showing sample of full lane set</span>
      </div>
      {contractLanes.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          No lanes loaded for this contract
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Mode", "Type", "Ref", "Origin", "Destination", "Discount", "Status"].map((col) => (
                  <th
                    key={col}
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contractLanes.map((lane) => (
                <tr key={lane.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-4 py-3"><ModeBadge mode={lane.mode} /></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{lane.type}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{lane.ref}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                    {lane.origin.city}, {lane.origin.state}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                    {lane.destination.city}, {lane.destination.state}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-900 font-medium">{lane.discount}%</td>
                  <td className="px-4 py-3"><StatusBadge status={lane.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContractDetailPage() {
  const { carrierId, contractId } = useParams<{ carrierId: string; contractId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const carrier = carriers.find((c) => c.id === carrierId);
  const contract = contracts.find((c) => c.id === contractId);

  if (!carrier || !contract) {
    return <div className="p-8 text-center text-gray-500">Contract not found.</div>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "pricing",  label: "Pricing" },
    { id: "lanes",    label: "Lanes" },
  ];

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Link to="/contracts" className="hover:text-gray-600 transition-colors">Contracts</Link>
          <ChevronRight size={12} />
          <Link to={`/contracts/${carrierId}`} className="hover:text-gray-600 transition-colors">{carrier.name}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-600">Version {contract.version}</span>
        </nav>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-gray-900">{carrier.name} — Version {contract.version}</h1>
              <StatusBadge status={contract.status} />
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {contract.effectiveDate} → {contract.expirationDate}
              <span className="mx-2">·</span>
              {contract.laneCount.toLocaleString()} lanes
              <span className="mx-2">·</span>
              {contract.chargeCount} charges
            </p>
          </div>
          <Link
            to={`/contracts/${carrierId}`}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mt-1"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 mt-4 -mb-4 border-b border-transparent">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#F06B00] text-[#F06B00] font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 py-5">
        {activeTab === "overview" && <OverviewTab contract={contract} />}
        {activeTab === "pricing"  && <PricingTab contractId={contract.id} />}
        {activeTab === "lanes"    && <LanesTab contractId={contract.id} />}
      </div>
    </div>
  );
}
