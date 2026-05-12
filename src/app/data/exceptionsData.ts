export type ExceptionCode =
  | 'RATE_UNAVAILABLE'
  | 'CROSS_DOC_MISMATCH'
  | 'BUSINESS_RULE'
  | 'LANE_NOT_FOUND'
  | 'DUPLICATE_CHARGE';

export type ExceptionStatus = 'OPEN' | 'RESOLVED' | 'ACCEPTED' | 'DISPUTED';

export interface RateSlab {
  label: string;
  rate: number;
  rateLabel: string;
  flag?: "applied" | "contracted";
}

export interface RateTrace {
  origin: string;
  destination: string;
  serviceType: string;
  shipmentWeight: number;
  weightUnit: string;
  appliedWeightClass: string;
  correctWeightClass: string;
  rateSlabs: RateSlab[];
  appliedRateCalc: string;
  contractedRateCalc: string;
  appliedTotal: number;
  contractedTotal: number;
  mismatchReason: string;
}

export const CHARGE_NAMES: Record<string, string> = {
  DSC:       "Discount",
  ENS:       "Energy Surcharge",
  "400":     "Extended Delivery",
  FSC:       "Fuel Surcharge",
  BASE:      "Base Rate",
  WT:        "Weight",
  OHC:       "Origin Handling",
  INSURANCE: "Cargo Insurance",
};

export const chargeName = (code: string): string => CHARGE_NAMES[code] ?? code;

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
  /** Invoice / audit date */
  date: string;
  /** Date the underlying shipment was picked up */
  shipmentDate: string;
  resolvedBy?: string;
  rateTrace?: RateTrace;
}

export interface ActivityEntry {
  id: string;
  invoiceRef: string;
  eventType: 'AUDIT_COMPLETED' | 'REPROCESS_REQUESTED' | 'EXCEPTION_RESOLVED' | 'INVOICE_RECEIVED';
  message: string;
  actor: string;
  timestamp: string;
  count?: number;
}

export const exceptions: AuditException[] = [
  // RATE_UNAVAILABLE — 3 open  (FedEx, invoiced 2026-05-05, shipped 2026-04-18)
  {
    id: 'ex-01', invoiceRef: '8202119914', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'No contracted rate found for charge code DSC (discount)',
    chargeCode: 'DSC', code: 'RATE_UNAVAILABLE', status: 'OPEN',
    variance: null, billedAmount: 125.00, contractedAmount: null,
    date: '2026-05-05', shipmentDate: '2026-04-18',
  },
  {
    id: 'ex-02', invoiceRef: '8202119914', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'No contracted rate found for charge code ENS (energy surcharge)',
    chargeCode: 'ENS', code: 'RATE_UNAVAILABLE', status: 'OPEN',
    variance: null, billedAmount: 87.50, contractedAmount: null,
    date: '2026-05-05', shipmentDate: '2026-04-18',
  },
  {
    id: 'ex-03', invoiceRef: '8202119914', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'No contracted rate found for charge code 400 (extended delivery)',
    chargeCode: '400', code: 'RATE_UNAVAILABLE', status: 'OPEN',
    variance: null, billedAmount: 210.00, contractedAmount: null,
    date: '2026-05-05', shipmentDate: '2026-04-18',
  },
  // RATE_UNAVAILABLE — resolved  (FedEx FSC, shipped 2026-04-10)
  {
    id: 'ex-04', invoiceRef: '8202119914', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'Fuel surcharge rate table not found for this carrier and period',
    chargeCode: 'FSC', code: 'RATE_UNAVAILABLE', status: 'RESOLVED',
    variance: null, billedAmount: 145.00, contractedAmount: null,
    date: '2026-04-28', shipmentDate: '2026-04-10', resolvedBy: 'cfo@example.com',
  },
  {
    id: 'ex-05', invoiceRef: '8202119914', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'Fuel surcharge rate table not found for this carrier and period',
    chargeCode: 'FSC', code: 'RATE_UNAVAILABLE', status: 'RESOLVED',
    variance: null, billedAmount: 145.00, contractedAmount: null,
    date: '2026-04-28', shipmentDate: '2026-04-10', resolvedBy: 'cfo@example.com',
  },
  // RATE_UNAVAILABLE — resolved  (FedEx lane, aged: shipped 2026-02-12 = 88 days ago)
  {
    id: 'ex-06', invoiceRef: '395067729176', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'Shipment No. 009200 could not be matched to a contracted lane',
    chargeCode: 'BASE', code: 'RATE_UNAVAILABLE', status: 'RESOLVED',
    variance: null, billedAmount: 1240.00, contractedAmount: null,
    date: '2026-04-15', shipmentDate: '2026-02-12', resolvedBy: 'cfo@example.com',
  },
  // CROSS_DOC_MISMATCH — resolved  (FedEx weight, aged: shipped 2026-02-14 = 86 days ago)
  {
    id: 'ex-07', invoiceRef: '6069215036', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    description: 'Weight on invoice (700 LB) does not match BOL document (680 LB)',
    chargeCode: 'WT', code: 'CROSS_DOC_MISMATCH', status: 'RESOLVED',
    variance: null, billedAmount: 875.00, contractedAmount: 850.00,
    date: '2026-04-15', shipmentDate: '2026-02-14', resolvedBy: 'cfo@example.com',
  },
  // BUSINESS_RULE — resolved  (CEVA duplicate, very aged: shipped 2026-01-22 = 109 days ago)
  {
    id: 'ex-08', invoiceRef: '27565002', vendor: 'CEVA', vendorScac: 'CEVA',
    description: 'Origin handling charge billed twice in the same shipment',
    chargeCode: 'OHC', code: 'BUSINESS_RULE', status: 'RESOLVED',
    variance: 7.00, billedAmount: 14.00, contractedAmount: 7.00,
    date: '2026-04-15', shipmentDate: '2026-01-22', resolvedBy: 'cfo@example.com',
  },
  // Averitt OPEN — long-standing: shipped 2026-02-28 = 72 days ago
  {
    id: 'ex-09', invoiceRef: 'INV-2026-00441', vendor: 'Averitt Express', vendorScac: 'AVRT',
    description: 'Base rate billed at $3,850.00 — contracted rate is $3,540.00 (8.76% over)',
    chargeCode: 'BASE', code: 'RATE_UNAVAILABLE', status: 'OPEN',
    variance: 310.00, billedAmount: 3850.00, contractedAmount: 3540.00,
    date: '2026-04-30', shipmentDate: '2026-02-28',
    rateTrace: {
      origin: 'Memphis, TN',
      destination: 'Dallas, TX',
      serviceType: 'LTL Standard',
      shipmentWeight: 1000,
      weightUnit: 'LB',
      appliedWeightClass: 'Class 70',
      correctWeightClass: 'Class 85',
      rateSlabs: [
        { label: 'Class 50',   rate: 420, rateLabel: '$420.00/CWT' },
        { label: 'Class 65',   rate: 396, rateLabel: '$396.00/CWT' },
        { label: 'Class 70',   rate: 385, rateLabel: '$385.00/CWT', flag: 'applied'    },
        { label: 'Class 85',   rate: 354, rateLabel: '$354.00/CWT', flag: 'contracted' },
        { label: 'Class 92.5', rate: 328, rateLabel: '$328.00/CWT' },
        { label: 'Class 100',  rate: 295, rateLabel: '$295.00/CWT' },
      ],
      appliedRateCalc: '10 CWT × $385.00/CWT',
      contractedRateCalc: '10 CWT × $354.00/CWT',
      appliedTotal: 3850.00,
      contractedTotal: 3540.00,
      mismatchReason:
        'Freight Class 70 was applied instead of the contracted Class 85. The commodity ' +
        '(NMFC 144540, machinery parts) qualifies for Class 85 per the rate contract. ' +
        'The shipment appears to have been miscoded at pickup, causing the system to select the Class 70 rate slab.',
    },
  },
  {
    id: 'ex-10', invoiceRef: 'INV-2026-00441', vendor: 'Averitt Express', vendorScac: 'AVRT',
    description: 'Cargo insurance billed at $150.00 — contracted flat rate is $12.50',
    chargeCode: 'INSURANCE', code: 'BUSINESS_RULE', status: 'OPEN',
    variance: 137.50, billedAmount: 150.00, contractedAmount: 12.50,
    date: '2026-04-30', shipmentDate: '2026-02-28',
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
