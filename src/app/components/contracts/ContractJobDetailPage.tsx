import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ChevronRight,
  FileText,
  AlertCircle,
  Edit2,
  Send,
  X,
  Ban,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge, ModeBadge } from "../shared/StatusBadge";
import { cn } from "../ui/utils";
import { uploadJobs } from "../../data/mockData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEMO_TODAY = new Date("2026-05-11T00:00:00");

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

// ─── Tab: Contract ────────────────────────────────────────────────────────────

function ContractTab({ job }: { job: typeof uploadJobs[number] }) {
  const details = job.contractDetails;
  const [expandedTerm, setExpandedTerm] = useState<number | null>(null);

  if (!details) return (
    <div className="py-12 text-center text-sm text-slate-400">No extraction data available.</div>
  );

  return (
    <div className="space-y-4">

      {/* Summary grid */}
      <div className="bg-white rounded-lg border border-slate-200 px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
        {[
          { label: "Contract name",  value: details.name },
          { label: "Mode",           value: <ModeBadge mode={job.mode} /> },
          { label: "Validity",       value: `${fmt(details.validFrom)} – ${fmt(details.validTo)}` },
          { label: "Type",           value: details.tags.join(", ") || "—" },
          { label: "Rates extracted",value: job.rates > 0 ? job.rates.toLocaleString() : "—" },
          { label: "Lanes",          value: details.lanesCount > 0 ? details.lanesCount : "—" },
          { label: "Source files",   value: job.files.length },
          { label: "Uploaded",       value: fmt(job.uploadedAt) },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <div className="text-sm font-medium text-slate-950">{value}</div>
          </div>
        ))}
      </div>

      {/* Contractual Terms */}
      {details.terms.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-950">Contractual Terms</p>
            <p className="text-xs text-slate-400 mt-0.5">Provisions extracted from the uploaded contract documents</p>
          </div>
          <div className="px-5 py-2 bg-amber-50/60 border-b border-amber-100">
            <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
              <AlertCircle size={11} /> Review before approving
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {details.terms.map((term, i) => (
              <button
                key={i}
                onClick={() => setExpandedTerm(expandedTerm === i ? null : i)}
                className="w-full text-left px-5 py-3 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800 pr-4">{term}</p>
                  <ChevronRight
                    size={14}
                    className={cn("text-slate-300 transition-transform shrink-0", expandedTerm === i && "rotate-90")}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAK Rules */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-950">FAK Rules</p>
          <Button variant="ghost" size="sm" className="gap-1 h-7 px-2 text-xs text-slate-500">
            <Edit2 size={11} /> Add
          </Button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-400">No FAK rules extracted</p>
        </div>
      </div>

      {/* Source Files */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-950">Source Files</p>
        </div>
        <div className="px-5 py-4 space-y-2">
          {job.files.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <FileText size={13} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-700">{f}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type DetailTab = "contract" | "pricing" | "lanes";

export default function ContractJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]       = useState<DetailTab>("contract");
  const [status, setStatus]             = useState<string | null>(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [feedback, setFeedback]         = useState("");

  const job = uploadJobs.find(j => j.id === jobId);
  if (!job) return <div className="p-8 text-center text-sm text-slate-500">Job not found.</div>;

  const effectiveStatus = status ?? job.status;
  const details = job.contractDetails;

  const displayStatus = effectiveStatus === "COMPLETED" ? "Pending Review" : effectiveStatus;
  const statusVariant = effectiveStatus === "COMPLETED" ? ("warning" as const) : undefined;

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "contract", label: "Contract" },
    { id: "pricing",  label: `Pricing (${details?.pricingCount ?? 0})` },
    { id: "lanes",    label: `Lanes (${details?.lanesCount ?? 0})` },
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
  const isRejected      = effectiveStatus === "REJECTED";

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors mb-3"
        >
          <ArrowLeft size={12} />
          Upload History
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-slate-950">{details?.name ?? job.carrierName}</h1>
              <span className="font-mono text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">{job.scac}</span>
              <span className="font-mono text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">{job.ref}</span>
              <StatusBadge status={displayStatus} variant={statusVariant} />
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-xs font-medium text-slate-700">{job.carrierName}</span>
              <ModeBadge mode={job.mode} />
              <span className="text-xs text-slate-400 ml-1">
                · {job.files.length} file{job.files.length !== 1 ? "s" : ""}
                · Uploaded {relativeTime(job.uploadedAt)}
              </span>
            </div>
          </div>

          {/* Actions — only addition over CarrierDetailPage */}
          {!reprocessing && (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setReprocessing(true)} className="text-slate-600">
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
        {isRejected ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Ban size={40} className="text-slate-300" />
            <p className="text-base font-medium text-slate-600">Rejected</p>
            <p className="text-sm text-slate-400">Rejected by user · Use Reprocess with Feedback to try again</p>
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
