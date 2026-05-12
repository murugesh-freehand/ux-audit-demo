import type { ExceptionCode, ExceptionStatus } from "../../data/exceptionsData";
import type { FailureAction } from "../../data/agentsData";

export const EXCEPTION_CODE_META: Record<ExceptionCode, { label: string; badgeCls: string; dotCls: string }> = {
  RATE_UNAVAILABLE:   { label: "Rate Unavailable",   badgeCls: "bg-red-50 text-red-700 border-red-200",          dotCls: "bg-red-400"    },
  CROSS_DOC_MISMATCH: { label: "Cross-Doc Mismatch", badgeCls: "bg-amber-50 text-amber-700 border-amber-200",    dotCls: "bg-amber-400"  },
  BUSINESS_RULE:      { label: "Business Rule",      badgeCls: "bg-blue-50 text-blue-700 border-blue-200",       dotCls: "bg-blue-400"   },
  LANE_NOT_FOUND:     { label: "Lane Not Found",     badgeCls: "bg-purple-50 text-purple-700 border-purple-200", dotCls: "bg-purple-400" },
  DUPLICATE_CHARGE:   { label: "Duplicate Charge",   badgeCls: "bg-orange-50 text-orange-700 border-orange-200", dotCls: "bg-orange-400" },
};

export const EXCEPTION_STATUS_CFG: Record<ExceptionStatus, { badgeCls: string; dotCls: string }> = {
  OPEN:     { badgeCls: "bg-red-50 text-red-700 border-red-200",       dotCls: "bg-red-600"    },
  RESOLVED: { badgeCls: "bg-green-50 text-green-700 border-green-200", dotCls: "bg-green-600"  },
  ACCEPTED: { badgeCls: "bg-slate-100 text-slate-600 border-slate-200", dotCls: "bg-slate-400" },
  DISPUTED: { badgeCls: "bg-amber-50 text-amber-700 border-amber-200", dotCls: "bg-amber-600"  },
};

export type ProcessingStatus = "COMPLETED" | "DUPLICATE" | "PROCESSING" | "FAILED";

export const PROCESSING_STATUS_CFG: Record<ProcessingStatus, { label: string; badgeCls: string }> = {
  COMPLETED:  { label: "Completed",  badgeCls: "bg-green-50 text-green-700 border-green-200"  },
  DUPLICATE:  { label: "Duplicate",  badgeCls: "bg-amber-50 text-amber-700 border-amber-200"  },
  PROCESSING: { label: "Processing", badgeCls: "bg-blue-50 text-blue-700 border-blue-200"     },
  FAILED:     { label: "Failed",     badgeCls: "bg-red-50 text-red-700 border-red-200"        },
};

export const FAILURE_ACTION_CFG: Record<FailureAction, { badgeCls: string }> = {
  FLAG:   { badgeCls: "bg-amber-50 text-amber-700 border-amber-200"   },
  WARN:   { badgeCls: "bg-blue-50 text-blue-700 border-blue-200"      },
  HOLD:   { badgeCls: "bg-orange-50 text-orange-700 border-orange-200" },
  REJECT: { badgeCls: "bg-red-50 text-red-700 border-red-200"         },
};

export const EVENT_LABEL_CFG: Record<string, { label: string; badgeCls: string }> = {
  AUDIT_COMPLETED:     { label: "Audit Completed",     badgeCls: "bg-green-50 text-green-700 border-green-200"  },
  REPROCESS_REQUESTED: { label: "Reprocess Requested", badgeCls: "bg-amber-50 text-amber-700 border-amber-200"  },
  EXCEPTION_RESOLVED:  { label: "Exception Resolved",  badgeCls: "bg-blue-50 text-blue-700 border-blue-200"    },
  INVOICE_RECEIVED:    { label: "Invoice Received",     badgeCls: "bg-slate-50 text-slate-600 border-slate-200" },
};
