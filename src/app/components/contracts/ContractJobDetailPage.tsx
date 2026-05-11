import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ChevronRight,
  FileText,
  AlertTriangle,
  Ban,
  Send,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { ModeBadge } from "../shared/StatusBadge";
import { cn } from "../ui/utils";
import { uploadJobs } from "../../data/mockData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  COMPLETED:  "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED:   "bg-red-50 text-red-600 border-red-200",
  PROCESSING: "bg-blue-50 text-blue-600 border-blue-200",
  PARTIAL:    "bg-amber-50 text-amber-600 border-amber-200",
  FAILED:     "bg-red-50 text-red-600 border-red-200",
  CANCELLED:  "bg-slate-100 text-slate-500 border-slate-200",
};

function JobStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
      STATUS_STYLES[status] ?? "bg-slate-100 text-slate-500 border-slate-200"
    )}>
      {status === "COMPLETED" ? "Pending Review" : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Tab content: Contract ────────────────────────────────────────────────────

function ContractTab({ job }: { job: typeof uploadJobs[number] }) {
  const details = job.contractDetails;

  if (!details) return (
    <div className="py-12 text-center text-sm text-slate-400">No extraction data available.</div>
  );

  return (
    <div className="space-y-4">
      {/* Contract card */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-slate-950">{details.name}</h3>
              <span className="text-[10px] font-semibold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 uppercase tracking-wide">Draft</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {details.tags.map(tag => (
                <span key={tag} className="text-[11px] font-medium text-slate-600 bg-slate-100 rounded px-2 py-0.5">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* FAK Rules */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">FAK Rules</span>
            <div className="flex items-center gap-2">
              <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Edit</button>
              <button className="text-xs text-primary hover:underline transition-colors">+ Add</button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">No FAK rules</p>
        </div>

        {/* Versions */}
        <div className="px-5 py-3 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Versions</span>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left font-medium pb-1.5">Status</th>
                <th className="text-left font-medium pb-1.5">Version</th>
                <th className="text-left font-medium pb-1.5">Label</th>
                <th className="text-left font-medium pb-1.5">Validity</th>
                <th className="text-left font-medium pb-1.5">Lanes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-slate-700">
                <td className="py-1 pr-4">
                  <span className="text-[10px] font-semibold text-slate-500 border border-slate-200 rounded px-1.5 py-0.5 uppercase">Draft</span>
                </td>
                <td className="py-1 pr-4">v1</td>
                <td className="py-1 pr-4 text-slate-400">—</td>
                <td className="py-1 pr-4 whitespace-nowrap">{fmt(details.validFrom)} – {fmt(details.validTo)}</td>
                <td className="py-1">{details.lanesCount > 0 ? details.lanesCount : <span className="text-slate-400">—</span>}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Source files */}
        <div className="px-5 py-3 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Source Files</span>
          <div className="space-y-1">
            {job.files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400 shrink-0" />
                <span className="text-xs text-slate-700">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Extraction health */}
        <div className="px-5 py-3">
          <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors">
            <AlertTriangle size={12} className="text-slate-400" />
            View extraction health
          </button>
        </div>
      </div>

      {/* Contractual Terms */}
      {details.terms.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-4">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">
            Contractual Terms ({details.terms.length})
          </span>
          <ul className="space-y-1.5">
            {details.terms.map((term, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                <span className="text-slate-300 mt-0.5 shrink-0">·</span>
                {term}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type DetailTab = "contract" | "pricing" | "lanes";

export default function ContractJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]         = useState<DetailTab>("contract");
  const [status, setStatus]               = useState<string | null>(null);
  const [reprocessing, setReprocessing]   = useState(false);
  const [feedback, setFeedback]           = useState("");

  const job = uploadJobs.find(j => j.id === jobId);
  if (!job) return <div className="p-8 text-center text-sm text-slate-500">Job not found.</div>;

  const effectiveStatus = status ?? job.status;
  const details = job.contractDetails;

  const tabs: { id: DetailTab; label: string; count: number | null }[] = [
    { id: "contract", label: "Contract", count: details ? 1 : 0 },
    { id: "pricing",  label: "Pricing",  count: details?.pricingCount ?? 0 },
    { id: "lanes",    label: "Lanes",    count: details?.lanesCount ?? 0 },
  ];

  function handleApprove() {
    setStatus("APPROVED");
    setReprocessing(false);
    toast.success("Contract approved", { description: `${job.ref} is now active.` });
  }

  function handleReject() {
    setStatus("REJECTED");
    setReprocessing(false);
    toast.error("Contract rejected", { description: "Use Reprocess with Feedback to try again." });
  }

  function handleReprocess() {
    if (!feedback.trim()) return;
    setStatus("PROCESSING");
    setReprocessing(false);
    setFeedback("");
    toast.success("Reprocess requested", { description: "Extraction will restart with your feedback." });
  }

  const isPendingReview = effectiveStatus === "COMPLETED";
  const isApproved      = effectiveStatus === "APPROVED";
  const isRejected      = effectiveStatus === "REJECTED";

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link to="/contracts" className="hover:text-slate-600 transition-colors">Contracts</Link>
          <ChevronRight size={12} />
          <Link to="/contracts?tab=upload-history" className="hover:text-slate-600 transition-colors">Upload History</Link>
          <ChevronRight size={12} />
          <span className="text-slate-700 font-mono font-medium">{job.ref}</span>
        </nav>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-mono text-slate-950 text-xl">{job.ref}</h1>
              <JobStatusBadge status={effectiveStatus} />
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-sm text-slate-500">
              <span className="font-medium text-slate-700">{job.carrierName}</span>
              <span className="font-mono text-xs text-slate-400">{job.scac}</span>
              <ModeBadge mode={job.mode} />
              <span className="text-slate-400 text-xs">{job.files.length} file{job.files.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Actions */}
          {!reprocessing && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReprocessing(true)}
                className="text-slate-600"
              >
                Reprocess with Feedback
              </Button>
              {isPendingReview && (
                <>
                  <Button variant="outline" size="sm" onClick={handleReject} className="text-red-600 border-red-200 hover:bg-red-50">
                    Reject
                  </Button>
                  <Button size="sm" onClick={handleApprove}>
                    Approve
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Reprocess input bar */}
        {reprocessing && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <input
              autoFocus
              type="text"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReprocess()}
              placeholder="Describe what needs to change (e.g., 'Rates should be per CWT not per shipment', 'Missing accessorial charges')…"
              className="flex-1 text-sm bg-white border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
            <Button size="sm" onClick={handleReprocess} disabled={!feedback.trim()} className="gap-1.5 shrink-0">
              <Send size={13} /> Submit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setReprocessing(false); setFeedback(""); }} className="shrink-0">
              <X size={14} />
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-0 mt-4 -mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={cn(
                  "text-[10px] font-semibold",
                  activeTab === tab.id ? "text-primary" : "text-slate-400"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 py-5">
        {isRejected ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Ban size={40} className="text-slate-300" />
            <p className="text-base font-medium text-slate-600">Rejected</p>
            <p className="text-sm text-slate-400">Rejected by user</p>
            <p className="text-xs text-slate-400 mt-1">Use Reprocess with Feedback to try again.</p>
          </div>
        ) : activeTab === "contract" ? (
          <ContractTab job={job} />
        ) : (
          <div className="py-12 text-center text-sm text-slate-400">
            {activeTab === "pricing"
              ? details && details.pricingCount > 0
                ? `${details.pricingCount} pricing records extracted`
                : "No pricing data extracted yet"
              : details && details.lanesCount > 0
                ? `${details.lanesCount} lanes extracted`
                : "No lanes extracted yet"
            }
          </div>
        )}
      </div>
    </div>
  );
}
