export type ExceptionCode =
  | 'RATE_UNAVAILABLE'
  | 'CROSS_DOC_MISMATCH'
  | 'BUSINESS_RULE'
  | 'LANE_NOT_FOUND'
  | 'DUPLICATE_CHARGE';

export type ExceptionStatus = 'OPEN' | 'RESOLVED' | 'ACCEPTED' | 'DISPUTED';

export interface AuditException {
  id: string;
  invoiceRef: string;
  vendor: string;
  vendorScac: string;
  /** Human-readable description — no internal compiler messages */
  description: string;
  chargeCode: string;
  code: ExceptionCode;
  status: ExceptionStatus;
  variance: number | null;
  billedAmount: number | null;
  contractedAmount: number | null;
  date: string;
  resolvedBy?: string;
}

export interface ActivityEntry {
  id: string;
  invoiceRef: string;
  eventType: 'AUDIT_COMPLETED' | 'REPROCESS_REQUESTED' | 'EXCEPTION_RESOLVED' | 'INVOICE_RECEIVED';
  message: string;
  actor: string; // human-readable name or email
  timestamp: string;
  count?: number; // deduplicated occurrences
}

export const exceptions: AuditException[] = [
  // RATE_UNAVAILABLE — 3 open
  {
    id: 'ex-01', invoiceRef: '8202119914', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'No contracted rate found for charge code DSC (discount)',
    chargeCode: 'DSC', code: 'RATE_UNAVAILABLE', status: 'OPEN',
    variance: null, billedAmount: 125.00, contractedAmount: null, date: '2026-05-05',
  },
  {
    id: 'ex-02', invoiceRef: '8202119914', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'No contracted rate found for charge code ENS (energy surcharge)',
    chargeCode: 'ENS', code: 'RATE_UNAVAILABLE', status: 'OPEN',
    variance: null, billedAmount: 87.50, contractedAmount: null, date: '2026-05-05',
  },
  {
    id: 'ex-03', invoiceRef: '8202119914', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'No contracted rate found for charge code 400 (extended delivery)',
    chargeCode: '400', code: 'RATE_UNAVAILABLE', status: 'OPEN',
    variance: null, billedAmount: 210.00, contractedAmount: null, date: '2026-05-05',
  },
  // RATE_UNAVAILABLE — resolved
  {
    id: 'ex-04', invoiceRef: '8202119914', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'Fuel surcharge rate table not found for this carrier and period',
    chargeCode: 'FSC', code: 'RATE_UNAVAILABLE', status: 'RESOLVED',
    variance: null, billedAmount: 145.00, contractedAmount: null, date: '2026-04-28', resolvedBy: 'cfo@example.com',
  },
  {
    id: 'ex-05', invoiceRef: '8202119914', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'Fuel surcharge rate table not found for this carrier and period',
    chargeCode: 'FSC', code: 'RATE_UNAVAILABLE', status: 'RESOLVED',
    variance: null, billedAmount: 145.00, contractedAmount: null, date: '2026-04-28', resolvedBy: 'cfo@example.com',
  },
  {
    id: 'ex-06', invoiceRef: '395067729176', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'Shipment No. 009200 could not be matched to a contracted lane',
    chargeCode: 'BASE', code: 'RATE_UNAVAILABLE', status: 'RESOLVED',
    variance: null, billedAmount: 1240.00, contractedAmount: null, date: '2026-04-15', resolvedBy: 'cfo@example.com',
  },
  // CROSS_DOC_MISMATCH
  {
    id: 'ex-07', invoiceRef: '6069215036', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'Weight on invoice (700 LB) does not match BOL document (680 LB)',
    chargeCode: 'WT', code: 'CROSS_DOC_MISMATCH', status: 'RESOLVED',
    variance: null, billedAmount: 875.00, contractedAmount: 850.00, date: '2026-04-15', resolvedBy: 'cfo@example.com',
  },
  // BUSINESS_RULE
  {
    id: 'ex-08', invoiceRef: '27565002', vendor: 'CEVA', vendorScac: 'CEVA',
    description: 'Origin handling charge billed twice in the same shipment',
    chargeCode: 'OHC', code: 'BUSINESS_RULE', status: 'RESOLVED',
    variance: 7.00, billedAmount: 14.00, contractedAmount: 7.00, date: '2026-04-15', resolvedBy: 'cfo@example.com',
  },
  // Invoice INV-2026-00441 open exceptions
  {
    id: 'ex-09', invoiceRef: 'INV-2026-00441', vendor: 'Averitt Express', vendorScac: 'AVRT',
    description: 'Base rate billed at $3,850.00 — contracted rate is $3,540.00 (8.76% over)',
    chargeCode: 'BASE', code: 'RATE_UNAVAILABLE', status: 'OPEN',
    variance: 310.00, billedAmount: 3850.00, contractedAmount: 3540.00, date: '2026-04-30',
  },
  {
    id: 'ex-10', invoiceRef: 'INV-2026-00441', vendor: 'Averitt Express', vendorScac: 'AVRT',
    description: 'Cargo insurance billed at $150.00 — contracted flat rate is $12.50',
    chargeCode: 'INSURANCE', code: 'BUSINESS_RULE', status: 'OPEN',
    variance: 137.50, billedAmount: 150.00, contractedAmount: 12.50, date: '2026-04-30',
  },
];

export const activityLog: ActivityEntry[] = [
  {
    id: 'a-01', invoiceRef: 'INV-2026-00441',
    eventType: 'INVOICE_RECEIVED', message: 'Invoice received and queued for extraction',
    actor: 'system', timestamp: '2026-04-30T09:00:00Z',
  },
  {
    id: 'a-02', invoiceRef: 'INV-2026-00441',
    eventType: 'AUDIT_COMPLETED', message: 'Audit completed: INCOMPLETE. 6 checks run, 2 failed.',
    actor: 'Audit Agent', timestamp: '2026-04-30T09:04:12Z',
  },
  {
    id: 'a-03', invoiceRef: 'INV-2026-00441',
    eventType: 'REPROCESS_REQUESTED', message: 'Reprocess requested',
    actor: 'cfo@example.com', timestamp: '2026-04-30T17:26:51Z',
  },
  {
    id: 'a-04', invoiceRef: 'INV-2026-00441',
    eventType: 'AUDIT_COMPLETED', message: 'Audit completed: INCOMPLETE. 6 checks run, 2 failed.',
    actor: 'Audit Agent', timestamp: '2026-04-30T17:27:05Z', count: 3,
  },
];

// ─── Attachment mock ─────────────────────────────────────────────────────────

export interface Attachment {
  id: string;
  invoiceRef: string;
  filename: string;
  sizeKb: number;
  uploadedAt: string;
}

export const attachments: Attachment[] = [
  {
    id: 'att-01', invoiceRef: 'INV-2026-00441',
    filename: 'AVRT_INV2026-00441_BOL.pdf', sizeKb: 84, uploadedAt: '2026-04-30T09:00:00Z',
  },
  {
    id: 'att-02', invoiceRef: '8202119914',
    filename: 'FXFE_886231774530_Priority_Corrected-CPP.txt', sizeKb: 1, uploadedAt: '2026-04-28T21:43:40Z',
  },
];
