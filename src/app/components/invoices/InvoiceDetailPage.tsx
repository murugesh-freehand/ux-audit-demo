import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  ChevronRight, ArrowLeft, RefreshCw, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, AlertTriangle, FileText, Clock, X,
} from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge, ModeBadge } from "../shared/StatusBadge";
import {
  invoices, invoiceLineItems, carriers, contracts, chargeDefinitions,
  type Invoice, type InvoiceLineItem,
} from "../../data/mockData";
import { attachments, activityLog } from "../../data/exceptionsData";
import { EVENT_LABEL_CFG } from "../shared/statusConfig";

const usd = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

const fmtDate = (ts: string) =>
  new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const fmtTime = (ts: string) =>
  new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

type Section = "audit" | "details" | "lines" | "documents";

// ─── Audit Check Drawer ──────────────────────────────────────────────────────

function AuditCheckDrawer({
  item, invoice, onClose,
}: {
  item: InvoiceLineItem; invoice: Invoice; onClose: () => void;
}) {
  const carrier   = carriers.find(c => c.scac === invoice.vendorScac);
  const contract  = carrier
    ? contracts.find(c => c.carrierId === carrier.id && (c.status === "ACTIVE" || c.status === "PENDING"))
    : null;
  const chargeDef = contract
    ? chargeDefinitions.find(cd => cd.contractId === contract.id && cd.code === item.code)
    : null;

  const isIssue = item.status !== "PASS";
  const statusCls =
    item.status === "FAIL"    ? "bg-red-50 text-red-700 border-red-200"   :
    item.status === "WARNING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-green-50 text-green-700 border-green-200";
  const Icon =
    item.status === "PASS"    ? CheckCircle2  :
    item.status === "WARNING" ? AlertTriangle : AlertCircle;
  const iconCls =
    item.status === "PASS"    ? "text-green-500"  :
    item.status === "WARNING" ? "text-amber-500"  : "text-red-500";

  return (
    <div className="w-[420px] shrink-0 border-l border-slate-200 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${statusCls}`}>
                <Icon size={11} className={iconCls} />
                {item.status}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">
                {item.code}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900 leading-snug">{item.description}</p>
            <p className="text-xs text-slate-400 mt-0.5">{invoice.vendor} · {invoice.ref}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* ① Amounts */}
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">① Amounts</p>
          <div className="grid grid-cols-3 gap-4">
            {([
              ["Billed",     item.billed,     isIssue ? "text-red-600" : "text-slate-900"],
              ["Contracted", item.contracted, "text-slate-900"],
              ["Variance",   item.variance,   item.variance > 0 ? "text-red-600" : item.variance < 0 ? "text-green-600" : "text-slate-400"],
            ] as [string, number, string][]).map(([label, value, cls]) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                <p className={`text-base font-semibold ${cls}`}>{usd(value)}</p>
              </div>
            ))}
          </div>
          {isIssue && item.variancePct !== 0 && (
            <p className="text-[11px] text-red-500 mt-2">
              {item.variance > 0 ? "+" : ""}{item.variancePct.toFixed(1)}%{" "}
              {item.variance > 0 ? "above" : "below"} contracted rate
            </p>
          )}
        </div>

        {/* ② Contract Source */}
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">② Contract Source</p>
          {chargeDef && carrier && contract ? (
            <>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <dt className="text-[10px] text-slate-400 mb-0.5">Carrier</dt>
                  <dd className="text-sm font-medium text-slate-700">{carrier.name}</dd>
                  <dd className="text-xs text-slate-400 font-mono mt-0.5">{carrier.scac}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-400 mb-0.5">Contract</dt>
                  <dd className="text-sm font-medium text-slate-700">v{contract.version}</dd>
                  <dd className="text-xs text-slate-400 mt-0.5">{contract.effectiveDate} – {contract.expirationDate}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-slate-400 mb-0.5">Source</dt>
                  <dd className="text-sm text-slate-700">{chargeDef.source}</dd>
                </div>
                {chargeDef.laneRates[0] && (
                  <div>
                    <dt className="text-[10px] text-slate-400 mb-0.5">Contracted Rate</dt>
                    <dd className="text-sm font-medium text-slate-700">
                      {chargeDef.laneRates[0].value != null
                        ? `${chargeDef.laneRates[0].value} ${chargeDef.laneRates[0].uom}`
                        : chargeDef.laneRates[0].uom}
                      {chargeDef.laneRates[0].slab && chargeDef.laneRates[0].slab !== "All weights"
                        ? ` (${chargeDef.laneRates[0].slab})`
                        : ""}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Link to={`/contracts/${carrier.id}`} className="text-xs font-medium text-primary hover:underline">
                  View in contract ↗
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5">
              <p className="text-xs text-amber-700">
                No contracted rate found for{" "}
                <span className="font-mono font-semibold">{item.code}</span>.
                This charge may not be in scope for the matched contract.
              </p>
            </div>
          )}
        </div>

        {/* ③ Calculation */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">③ Calculation</p>
          {isIssue ? (
            <div className="space-y-2">
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-1">Applied (Billed)</p>
                <p className="text-lg font-bold text-red-600">{usd(item.billed)}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-1">Contracted (Expected)</p>
                <p className="text-lg font-bold text-green-700">{usd(item.contracted)}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                <span className="text-xs font-medium text-slate-500">Variance</span>
                <span className={`text-sm font-bold ${item.variance > 0 ? "text-red-600" : "text-green-600"}`}>
                  {item.variance > 0 ? "+" : ""}{usd(item.variance)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <p className="text-xs font-medium text-green-700">
                ✓ Billed amount matches contracted rate — no variance
              </p>
              <p className="text-sm font-bold text-green-700 mt-1">{usd(item.billed)}</p>
            </div>
          )}
        </div>

      </div>

      {/* Footer actions */}
      {isIssue && (
        <div className="shrink-0 border-t border-slate-200 px-5 py-3 flex items-center gap-2 bg-white">
          <Button variant="ghost" size="sm" className="h-8 text-slate-600 hover:text-slate-900">
            Accept
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 ml-auto border-red-200 text-red-600 hover:bg-red-50"
          >
            Raise Dispute
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Audit Check Row ─────────────────────────────────────────────────────────

function AuditCheckRow({
  item, invoice, onOpen,
}: {
  item: InvoiceLineItem; invoice: Invoice; onOpen: (item: InvoiceLineItem) => void;
}) {
  const isIssue = item.status !== "PASS";

  const borderCls =
    item.status === "FAIL"    ? "border-l-red-400"   :
    item.status === "WARNING" ? "border-l-amber-400" :
                                "border-l-green-400";
  const Icon =
    item.status === "PASS"    ? CheckCircle2  :
    item.status === "WARNING" ? AlertTriangle : AlertCircle;
  const iconCls =
    item.status === "PASS"    ? "text-green-500"  :
    item.status === "WARNING" ? "text-amber-500"  : "text-red-500";

  return (
    <button
      onClick={() => onOpen(item)}
      className={`w-full text-left border-l-2 ${borderCls} px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Icon size={15} className={`${iconCls} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-slate-950">{item.code}</span>
            <span className="text-sm text-slate-700">{item.description}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 flex-wrap text-xs">
            {isIssue ? (
              <>
                <span className="text-slate-500">
                  Billed <span className="font-medium text-slate-800">{usd(item.billed)}</span>
                </span>
                <span className="text-slate-400">vs contracted</span>
                <span className="font-medium text-slate-800">{usd(item.contracted)}</span>
                <span className={`font-medium ${item.variance > 0 ? "text-red-600" : "text-green-600"}`}>
                  · {item.variance > 0 ? "+" : ""}{usd(item.variance)}
                </span>
              </>
            ) : (
              <span className="text-slate-400">
                {usd(item.billed)} · No variance
              </span>
            )}
          </div>
          <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] text-slate-400">
            View calculation & source <ChevronRight size={10} className="ml-0.5" />
          </span>
        </div>
      </div>

      {isIssue && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium bg-slate-50 border-slate-200 text-slate-500 whitespace-nowrap">
            {item.variancePct > 0 ? "+" : ""}{item.variancePct.toFixed(1)}%
          </span>
        </div>
      )}
    </button>
  );
}

// ─── Audit Checks Section ────────────────────────────────────────────────────

function AuditSection({ invoice, onOpenDrawer }: { invoice: Invoice; onOpenDrawer: (item: InvoiceLineItem) => void }) {
  const lineItems  = invoiceLineItems.filter(li => li.invoiceId === invoice.id);
  const issueCount = lineItems.filter(li => li.status !== "PASS").length;
  const passCount  = lineItems.filter(li => li.status === "PASS").length;

  const sorted = [...lineItems].sort((a, b) => {
    const ord: Record<string, number> = { FAIL: 0, WARNING: 1, PASS: 2 };
    return (ord[a.status] ?? 3) - (ord[b.status] ?? 3);
  });

  return (
    <div id="section-audit" className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-950">Audit Checks</span>
          {lineItems.length > 0 && (
            issueCount === 0
              ? <span className="text-xs text-green-600 font-medium">{passCount} passed</span>
              : <span className="text-xs text-red-600 font-medium">{issueCount} failed · {passCount} passed</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/invoices/${invoice.id}/audit`}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
          >
            View full audit <ChevronRight size={11} />
          </Link>
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500 h-7 px-2.5 text-xs">
            <RefreshCw size={12} /> Re-run
          </Button>
        </div>
      </div>

      {/* List or fallback */}
      {lineItems.length === 0 ? (
        <div className="px-5 py-4">
          {invoice.auditNotes.length === 0 ? (
            <p className="text-sm text-slate-500">All charges validated against contract. No discrepancies found.</p>
          ) : (
            <ul className="space-y-2">
              {invoice.auditNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-slate-300 mt-0.5">·</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {sorted.map(item => (
            <AuditCheckRow key={item.id} item={item} invoice={invoice} onOpen={onOpenDrawer} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sticky Section Nav ───────────────────────────────────────────────────────

function SectionNav({ active, onNav }: { active: Section; onNav: (s: Section) => void }) {
  const items: { id: Section; label: string }[] = [
    { id: "audit",     label: "Audit & Exceptions" },
    { id: "details",   label: "Details" },
    { id: "lines",     label: "Line Items" },
    { id: "documents", label: "Documents" },
  ];
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6">
      <div className="flex items-center -mb-px">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
              active === item.id
                ? "border-primary text-primary font-medium"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Details ──────────────────────────────────────────────────────────────────

function InfoGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs text-slate-400 mb-0.5">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetailsSection({ invoice }: { invoice: Invoice }) {
  return (
    <div id="section-details" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Invoice Details</h3>
        <InfoGrid items={[
          { label: "Reference",     value: <span className="text-sm font-mono text-slate-800">{invoice.ref}</span> },
          { label: "BOL Reference", value: <span className="text-sm text-slate-700">{invoice.bolRef}</span> },
          { label: "PO Reference",  value: <span className="text-sm text-slate-700">{invoice.poRef}</span> },
          { label: "Type",          value: <span className="text-sm text-slate-700">{invoice.type}</span> },
          { label: "Mode",          value: <ModeBadge mode={invoice.mode} /> },
          { label: "Service",       value: <span className="text-sm text-slate-700">{invoice.service}</span> },
          { label: "Billed Date",   value: <span className="text-sm text-slate-700">{invoice.billedDate}</span> },
          { label: "Received Date", value: <span className="text-sm text-slate-700">{invoice.receivedDate}</span> },
        ]} />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Amounts</h3>
        <InfoGrid items={[
          { label: "Billed Amount",  value: <span className="text-sm font-medium text-slate-950">{usd(invoice.amount)}</span> },
          { label: "Currency",       value: <span className="text-sm text-slate-700">{invoice.currency}</span> },
          { label: "Payment Terms",  value: <span className="text-sm text-slate-700">{invoice.paymentTerms}</span> },
          { label: "Payment Status", value: <StatusBadge status={invoice.status} /> },
        ]} />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Billed By</h3>
        <div className="text-sm space-y-0.5">
          <p className="text-slate-950 font-medium">{invoice.billFrom.name}</p>
          <p className="text-slate-500">{invoice.billFrom.address}</p>
          <p className="text-slate-500">{invoice.billFrom.city}, {invoice.billFrom.state} {invoice.billFrom.zip}</p>
          <p className="text-slate-400 font-mono text-xs mt-1">{invoice.vendorScac}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Billed To</h3>
        <div className="text-sm space-y-0.5">
          <p className="text-slate-950 font-medium">{invoice.billTo.name}</p>
          <p className="text-slate-500">{invoice.billTo.address}</p>
          <p className="text-slate-500">{invoice.billTo.city}, {invoice.billTo.state} {invoice.billTo.zip}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Line Items ───────────────────────────────────────────────────────────────

function LineItemsSection({ invoiceId }: { invoiceId: string }) {
  const items = invoiceLineItems.filter((li) => li.invoiceId === invoiceId);
  return (
    <div id="section-lines" className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Line Items</h3>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No line items available for this invoice
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Code", "Description", "Billed", "Contracted", "Variance", "Var %", "Status"].map((col) => (
                  <th key={col} className={`px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap ${["Code","Description","Status"].includes(col) ? "text-left" : "text-right"}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">{item.code}</td>
                  <td className="px-5 py-3 text-slate-800">{item.description}</td>
                  <td className="px-5 py-3 text-right text-slate-950">{usd(item.billed)}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{usd(item.contracted)}</td>
                  <td className={`px-5 py-3 text-right font-medium ${item.variance > 0 ? "text-red-600" : item.variance < 0 ? "text-green-600" : "text-slate-400"}`}>
                    {item.variance !== 0 ? (item.variance > 0 ? "+" : "") + usd(item.variance) : "—"}
                  </td>
                  <td className={`px-5 py-3 text-right font-medium ${item.variancePct > 5 ? "text-red-600" : item.variancePct > 0 ? "text-amber-600" : "text-slate-400"}`}>
                    {item.variancePct !== 0 ? `${item.variancePct > 0 ? "+" : ""}${item.variancePct.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/50">
                <td colSpan={2} className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Total</td>
                <td className="px-5 py-3 text-right font-medium text-slate-950">{usd(items.reduce((s, i) => s + i.billed, 0))}</td>
                <td className="px-5 py-3 text-right font-medium text-slate-600">{usd(items.reduce((s, i) => s + i.contracted, 0))}</td>
                <td className="px-5 py-3 text-right font-medium text-red-600">{usd(items.reduce((s, i) => s + i.variance, 0))}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Documents (Attachments + Activity + Raw Data — all collapsed) ─────────────


function DocumentsSection({ invoice }: { invoice: Invoice }) {
  const [open, setOpen] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const invoiceAttachments = attachments.filter((a) => a.invoiceRef === invoice.ref);
  const invoiceActivity = activityLog.filter((a) => a.invoiceRef === invoice.ref);

  return (
    <div id="section-documents" className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Documents & Activity</h3>
          {invoiceAttachments.length > 0 && (
            <span className="text-xs text-slate-400">({invoiceAttachments.length} attachment{invoiceAttachments.length !== 1 ? "s" : ""})</span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          {/* Attachments */}
          <div className="px-5 py-4">
            <h4 className="text-xs font-medium text-slate-500 mb-3">Attachments</h4>
            {invoiceAttachments.length === 0 ? (
              <p className="text-xs text-slate-400">No attachments</p>
            ) : (
              <div className="space-y-2">
                {invoiceAttachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-slate-400" />
                      <span className="text-xs text-slate-700">{att.filename}</span>
                    </div>
                    <span className="text-xs text-slate-400">{att.sizeKb} KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity log — deduplicated */}
          <div className="px-5 py-4">
            <button
              onClick={() => setShowActivity((v) => !v)}
              className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Clock size={12} />
              Activity log
              {showActivity ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {showActivity && (
              <div className="mt-3 space-y-3 pl-1">
                {invoiceActivity.length === 0 ? (
                  <p className="text-xs text-slate-400">No activity recorded</p>
                ) : (
                  invoiceActivity.map((entry) => {
                    const ev = EVENT_LABEL_CFG[entry.eventType] ?? { label: entry.eventType, badgeCls: "bg-slate-50 text-slate-600 border-slate-200" };
                    return (
                      <div key={entry.id} className="flex items-start gap-3">
                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap mt-0.5 ${ev.badgeCls}`}>
                          {ev.label}
                        </span>
                        <div>
                          <p className="text-xs text-slate-700">
                            {entry.message}
                            {entry.count && entry.count > 1 && (
                              <span className="ml-1.5 text-slate-400">(×{entry.count})</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {fmtDate(entry.timestamp)} at {fmtTime(entry.timestamp)} · {entry.actor}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Raw freight data */}
          <div className="px-5 py-4">
            <h4 className="text-xs font-medium text-slate-500 mb-3">Raw Freight Data</h4>
            <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-3 space-y-3">
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Commodities</p>
                <table className="text-xs w-full">
                  <thead>
                    <tr className="text-slate-400">
                      <th className="text-left pr-4 pb-1">Pieces</th>
                      <th className="text-left pr-4 pb-1">Weight</th>
                      <th className="text-left pr-4 pb-1">Description</th>
                      <th className="text-left pb-1">Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-slate-700"><td className="pr-4">14</td><td className="pr-4">2,840 lbs</td><td className="pr-4">General Merchandise</td><td>65</td></tr>
                    <tr className="text-slate-700"><td className="pr-4">6</td><td className="pr-4">980 lbs</td><td className="pr-4">Automotive Parts</td><td>70</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">EDI Segment (L0)</p>
                <p className="text-xs text-slate-500 font-mono">PRO~8821947~AVRT~~20260428</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>("audit");
  const [drawerItem, setDrawerItem] = useState<InvoiceLineItem | null>(null);

  const invoice = invoices.find((i) => i.id === invoiceId);
  if (!invoice) {
    return <div className="p-8 text-center text-slate-500">Invoice not found.</div>;
  }

  const scrollTo = (section: Section) => {
    setActiveSection(section);
    document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors mb-3"
        >
          <ArrowLeft size={12} />
          Invoice Audit
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-slate-950">{invoice.ref}</h1>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={invoice.status} />
              <StatusBadge status={invoice.auditStatus} />
              <span className="text-xs text-slate-400 border border-slate-200 rounded px-2 py-0.5 bg-slate-50">
                {invoice.service}
              </span>
              <span className="text-xs text-slate-400">{invoice.vendor}</span>
            </div>
          </div>
        </div>
      </div>

      <SectionNav active={activeSection} onNav={scrollTo} />

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <AuditSection invoice={invoice} onOpenDrawer={setDrawerItem} />
          <DetailsSection invoice={invoice} />
          <LineItemsSection invoiceId={invoice.id} />
          <DocumentsSection invoice={invoice} />
        </div>

        {drawerItem && (
          <AuditCheckDrawer
            item={drawerItem}
            invoice={invoice}
            onClose={() => setDrawerItem(null)}
          />
        )}
      </div>
    </div>
  );
}