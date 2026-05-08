export type Mode = 'LTL' | 'FTL' | 'AIR' | 'OCEAN' | 'ROAD';
export type CarrierStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE';
export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'SUPERSEDED';
export type InvoiceStatus = 'APPROVED' | 'INCOMPLETE' | 'HELD' | 'REJECTED' | 'COMPLETED' | 'PENDING';
export type AuditStatus = 'PASS' | 'FAIL' | 'WARNING' | 'PENDING';
export type UploadJobStatus = 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'PARTIAL';

export interface Carrier {
  id: string;
  name: string;
  scac: string;
  modes: Mode[];
  status: CarrierStatus;
  totalLanes: number;
  activeLanes: number;
  contractCount: number;
  lastUpdated: string;
}

export interface Contract {
  id: string;
  carrierId: string;
  version: number;
  status: ContractStatus;
  effectiveDate: string;
  expirationDate: string;
  laneCount: number;
  chargeCount: number;
  mode: Mode;
  type: string;
  sourceFiles: string[];
  uploadedAt: string;
  fakRules: FakRule[];
  keyTerms: KeyTerm[];
}

export interface FakRule {
  id: string;
  classes: string[];
  ratedAs: string;
  minWeight: number;
  maxWeight: number;
}

export interface Lane {
  id: string;
  contractId: string;
  mode: Mode;
  type: string;
  ref: string;
  origin: { city: string; state: string; country: string };
  destination: { city: string; state: string; country: string };
  discount: number;
  service: string;
  validFrom: string;
  validTo: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ChargeLaneRate {
  id: string;
  laneRegion: string;
  value: number | null;
  uom: string;
  slab: string;
  currency: string;
  effective: string | null;
}

export interface ChargeDefinition {
  id: string;
  contractId: string;
  code: string;
  name: string;
  type: string;       // ACCESSORIAL | LINE HAUL
  rateType: string;   // FLAT | TABLE | PERCENTAGE
  source: string;     // rate card / schedule reference
  currency: string;
  effectiveDate: string;
  laneRates: ChargeLaneRate[];
}

export interface KeyTerm {
  id: string;
  title: string;
  description: string;
  affectsAudit: boolean;
}

export interface Invoice {
  id: string;
  ref: string;
  vendor: string;
  vendorScac: string;
  type: string;
  mode: Mode;
  service: string;
  status: InvoiceStatus;
  auditStatus: AuditStatus;
  amount: number;
  currency: string;
  billedDate: string;
  receivedDate: string;
  paymentTerms: string;
  bolRef: string;
  poRef: string;
  billTo: { name: string; address: string; city: string; state: string; zip: string };
  billFrom: { name: string; address: string; city: string; state: string; zip: string };
  auditNotes: string[];
  origin:      { city: string; state: string };
  destination: { city: string; state: string };
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  code: string;
  description: string;
  billed: number;
  contracted: number;
  variance: number;
  variancePct: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
}

export interface UploadJob {
  id: string;
  ref: string;
  scac: string;
  mode: Mode;
  status: UploadJobStatus;
  progress: number;
  rates: number;
  files: string[];
  uploadedAt: string;
}

// ─── CARRIERS ────────────────────────────────────────────────────────────────

export const carriers: Carrier[] = [
  {
    id: 'avrt',
    name: 'Averitt Express',
    scac: 'AVRT',
    modes: ['LTL'],
    status: 'ACTIVE',
    totalLanes: 550,
    activeLanes: 550,
    contractCount: 2,
    lastUpdated: '2026-04-01',
  },
  {
    id: 'ceva',
    name: 'CEVA Logistics',
    scac: 'CEVA',
    modes: ['ROAD', 'AIR', 'OCEAN'],
    status: 'ACTIVE',
    totalLanes: 312,
    activeLanes: 289,
    contractCount: 3,
    lastUpdated: '2026-03-15',
  },
  {
    id: 'fxfe',
    name: 'FedEx Freight',
    scac: 'FXFE',
    modes: ['LTL'],
    status: 'ACTIVE',
    totalLanes: 820,
    activeLanes: 820,
    contractCount: 1,
    lastUpdated: '2026-02-28',
  },
  {
    id: 'xpol',
    name: 'XPO Logistics',
    scac: 'XPOL',
    modes: ['LTL', 'FTL'],
    status: 'ACTIVE',
    totalLanes: 440,
    activeLanes: 398,
    contractCount: 2,
    lastUpdated: '2026-03-22',
  },
  {
    id: 'exla',
    name: 'Estes Express Lines',
    scac: 'EXLA',
    modes: ['LTL'],
    status: 'ACTIVE',
    totalLanes: 270,
    activeLanes: 270,
    contractCount: 1,
    lastUpdated: '2026-01-18',
  },
  {
    id: 'hmes',
    name: 'Holland Motor Freight',
    scac: 'HMES',
    modes: ['LTL'],
    status: 'PENDING',
    totalLanes: 0,
    activeLanes: 0,
    contractCount: 1,
    lastUpdated: '2026-05-01',
  },
];

// ─── CONTRACTS ───────────────────────────────────────────────────────────────

export const contracts: Contract[] = [
  {
    id: 'avrt-c1',
    carrierId: 'avrt',
    version: 1,
    status: 'SUPERSEDED',
    effectiveDate: '2025-01-01',
    expirationDate: '2025-12-31',
    laneCount: 451,
    chargeCount: 2,
    mode: 'LTL',
    type: 'Contracted',
    sourceFiles: ['AVRT_2025_LTL_Base.pdf', 'AVRT_2025_FSC_Schedule.xlsx'],
    uploadedAt: '2024-12-15',
    fakRules: [],
    keyTerms: [],
  },
  {
    id: 'avrt-c2',
    carrierId: 'avrt',
    version: 2,
    status: 'ACTIVE',
    effectiveDate: '2026-01-01',
    expirationDate: '2026-12-31',
    laneCount: 550,
    chargeCount: 4,
    mode: 'LTL',
    type: 'Contracted',
    sourceFiles: ['AVRT_2026_LTL_Base.pdf', 'AVRT_2026_Amendment_1.pdf'],
    uploadedAt: '2025-12-20',
    fakRules: [
      { id: 'f1', classes: ['50', '55', '60'], ratedAs: '50', minWeight: 0, maxWeight: 500 },
      { id: 'f2', classes: ['65', '70', '77.5', '85'], ratedAs: '65', minWeight: 501, maxWeight: 2000 },
    ],
    keyTerms: [
      { id: 'kt1', title: 'Minimum Charge', description: 'Minimum charge per shipment is $125.00 regardless of weight or distance.', affectsAudit: true },
      { id: 'kt2', title: 'Fuel Surcharge Methodology', description: 'FSC is calculated weekly based on the DOE national average diesel price, applied as a percentage of the base linehaul using the AVRT published FSC table.', affectsAudit: true },
      { id: 'kt3', title: 'Liability Cap', description: 'Carrier liability is capped at $25.00 per pound per shipment unless additional insurance is purchased.', affectsAudit: false },
      { id: 'kt4', title: 'Dimensional Weight', description: 'Dimensional weight (DIM) applies when the cubic dimension exceeds 10 cubic feet per 100 lbs of actual weight.', affectsAudit: true },
      { id: 'kt5', title: 'Payment Terms', description: 'Net 30 days from receipt of invoice. Late payments accrue interest at 1.5% per month.', affectsAudit: false },
    ],
  },
  {
    id: 'ceva-c1',
    carrierId: 'ceva',
    version: 1,
    status: 'SUPERSEDED',
    effectiveDate: '2024-07-01',
    expirationDate: '2025-06-30',
    laneCount: 201,
    chargeCount: 4,
    mode: 'ROAD',
    type: 'Contracted',
    sourceFiles: ['CEVA_Road_2024-2025.pdf'],
    uploadedAt: '2024-06-10',
    fakRules: [],
    keyTerms: [],
  },
  {
    id: 'ceva-c2',
    carrierId: 'ceva',
    version: 2,
    status: 'ACTIVE',
    effectiveDate: '2025-07-01',
    expirationDate: '2026-06-30',
    laneCount: 289,
    chargeCount: 5,
    mode: 'ROAD',
    type: 'Contracted',
    sourceFiles: ['CEVA_Road_2025-2026.pdf', 'CEVA_Air_2025.pdf'],
    uploadedAt: '2025-06-15',
    fakRules: [],
    keyTerms: [
      { id: 'kt1', title: 'Minimum Charge', description: 'Minimum charge per shipment is $200.00.', affectsAudit: true },
      { id: 'kt2', title: 'Transit Time Guarantee', description: 'Standard road transit is 3–5 business days. No penalty for delays caused by force majeure.', affectsAudit: false },
    ],
  },
  {
    id: 'fxfe-c1',
    carrierId: 'fxfe',
    version: 1,
    status: 'ACTIVE',
    effectiveDate: '2026-01-01',
    expirationDate: '2026-12-31',
    laneCount: 820,
    chargeCount: 3,
    mode: 'LTL',
    type: 'Contracted',
    sourceFiles: ['FXFE_2026_National.pdf'],
    uploadedAt: '2025-12-28',
    fakRules: [
      { id: 'f1', classes: ['50', '55'], ratedAs: '50', minWeight: 0, maxWeight: 999 },
    ],
    keyTerms: [
      { id: 'kt1', title: 'Residential Delivery', description: 'Residential delivery surcharge of $85.00 applies per delivery to non-commercial addresses.', affectsAudit: true },
      { id: 'kt2', title: 'Fuel Surcharge', description: 'FSC is applied per the FedEx Freight weekly published rate table, indexed to DOE diesel price.', affectsAudit: true },
      { id: 'kt3', title: 'Weight Inspection', description: 'Carrier reserves the right to re-weigh shipments. Re-weigh charges of $15.00 apply if actual weight differs by more than 5%.', affectsAudit: true },
    ],
  },
  {
    id: 'hmes-c1',
    carrierId: 'hmes',
    version: 1,
    status: 'PENDING',
    effectiveDate: '2026-06-01',
    expirationDate: '2027-05-31',
    laneCount: 0,
    chargeCount: 0,
    mode: 'LTL',
    type: 'Contracted',
    sourceFiles: ['HMES_2026_Draft.pdf'],
    uploadedAt: '2026-05-01',
    fakRules: [],
    keyTerms: [],
  },
];

// ─── LANES ───────────────────────────────────────────────────────────────────

export const lanes: Lane[] = [
  // ── Averitt Express (avrt-c2) — LTL ────────────────────────────────────────
  { id: 'l1',  contractId: 'avrt-c2', mode: 'LTL', type: 'Contracted', ref: 'AV-001', origin: { city: 'Kenosha',      state: 'WI', country: 'US' }, destination: { city: 'Atlanta',      state: 'GA', country: 'US' }, discount: 68.5, service: 'LTL',          validFrom: '2026-01-01', validTo: '2026-05-14', status: 'ACTIVE'   },
  { id: 'l2',  contractId: 'avrt-c2', mode: 'LTL', type: 'Contracted', ref: 'AV-002', origin: { city: 'Chicago',       state: 'IL', country: 'US' }, destination: { city: 'Nashville',    state: 'TN', country: 'US' }, discount: 71.0, service: 'LTL',          validFrom: '2026-01-01', validTo: '2026-05-25', status: 'ACTIVE'   },
  { id: 'l3',  contractId: 'avrt-c2', mode: 'LTL', type: 'Contracted', ref: 'AV-003', origin: { city: 'Memphis',       state: 'TN', country: 'US' }, destination: { city: 'Dallas',       state: 'TX', country: 'US' }, discount: 65.0, service: 'LTL',          validFrom: '2026-01-01', validTo: '2026-06-20', status: 'ACTIVE'   },
  { id: 'l4',  contractId: 'avrt-c2', mode: 'LTL', type: 'Contracted', ref: 'AV-004', origin: { city: 'Charlotte',     state: 'NC', country: 'US' }, destination: { city: 'Miami',        state: 'FL', country: 'US' }, discount: 72.5, service: 'LTL',          validFrom: '2025-05-01', validTo: '2026-04-30', status: 'INACTIVE' },
  { id: 'l5',  contractId: 'avrt-c2', mode: 'LTL', type: 'Contracted', ref: 'AV-005', origin: { city: 'Indianapolis', state: 'IN', country: 'US' }, destination: { city: 'Louisville',   state: 'KY', country: 'US' }, discount: 69.0, service: 'LTL Priority', validFrom: '2026-01-01', validTo: '2026-07-01', status: 'ACTIVE'   },
  { id: 'l6',  contractId: 'avrt-c2', mode: 'LTL', type: 'Contracted', ref: 'AV-006', origin: { city: 'St. Louis',    state: 'MO', country: 'US' }, destination: { city: 'Kansas City', state: 'MO', country: 'US' }, discount: 70.0, service: 'LTL',          validFrom: '2026-01-01', validTo: '2026-12-31', status: 'ACTIVE'   },
  { id: 'l7',  contractId: 'avrt-c2', mode: 'LTL', type: 'Contracted', ref: 'AV-007', origin: { city: 'Detroit',      state: 'MI', country: 'US' }, destination: { city: 'Columbus',     state: 'OH', country: 'US' }, discount: 67.5, service: 'LTL',          validFrom: '2026-01-01', validTo: '2026-12-31', status: 'ACTIVE'   },
  { id: 'l8',  contractId: 'avrt-c2', mode: 'LTL', type: 'Contracted', ref: 'AV-008', origin: { city: 'Philadelphia', state: 'PA', country: 'US' }, destination: { city: 'Baltimore',    state: 'MD', country: 'US' }, discount: 73.0, service: 'LTL',          validFrom: '2026-01-01', validTo: '2026-12-31', status: 'ACTIVE'   },
  { id: 'l9',  contractId: 'avrt-c2', mode: 'LTL', type: 'Contracted', ref: 'AV-009', origin: { city: 'Cincinnati',   state: 'OH', country: 'US' }, destination: { city: 'Pittsburgh',   state: 'PA', country: 'US' }, discount: 66.0, service: 'LTL',          validFrom: '2026-01-01', validTo: '2026-12-31', status: 'ACTIVE'   },
  { id: 'l10', contractId: 'avrt-c2', mode: 'LTL', type: 'Contracted', ref: 'AV-010', origin: { city: 'Houston',      state: 'TX', country: 'US' }, destination: { city: 'San Antonio', state: 'TX', country: 'US' }, discount: 74.0, service: 'LTL Priority', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'ACTIVE'   },
  // ── FedEx Freight (fxfe-c1) — LTL ──────────────────────────────────────────
  { id: 'l11', contractId: 'fxfe-c1', mode: 'LTL', type: 'Contracted', ref: 'FX-001', origin: { city: 'Memphis',      state: 'TN', country: 'US' }, destination: { city: 'Chicago',      state: 'IL', country: 'US' }, discount: 62.0, service: 'LTL',          validFrom: '2026-01-01', validTo: '2026-06-05', status: 'ACTIVE'   },
  { id: 'l12', contractId: 'fxfe-c1', mode: 'LTL', type: 'Contracted', ref: 'FX-002', origin: { city: 'Los Angeles',  state: 'CA', country: 'US' }, destination: { city: 'Phoenix',      state: 'AZ', country: 'US' }, discount: 58.5, service: 'LTL',          validFrom: '2026-01-01', validTo: '2026-07-01', status: 'ACTIVE'   },
  // ── CEVA Logistics (ceva-c2) — Road / Air ───────────────────────────────────
  { id: 'l13', contractId: 'ceva-c2', mode: 'ROAD', type: 'Contracted', ref: 'CV-001', origin: { city: 'Dallas',      state: 'TX', country: 'US' }, destination: { city: 'Los Angeles', state: 'CA', country: 'US' }, discount: 0,    service: 'FTL',          validFrom: '2025-07-01', validTo: '2026-05-18', status: 'ACTIVE'   },
  { id: 'l14', contractId: 'ceva-c2', mode: 'ROAD', type: 'Contracted', ref: 'CV-002', origin: { city: 'Chicago',     state: 'IL', country: 'US' }, destination: { city: 'Detroit',      state: 'MI', country: 'US' }, discount: 0,    service: 'FTL',          validFrom: '2026-01-01', validTo: '2026-12-31', status: 'ACTIVE'   },
  { id: 'l15', contractId: 'ceva-c2', mode: 'ROAD', type: 'Contracted', ref: 'CV-003', origin: { city: 'Seattle',     state: 'WA', country: 'US' }, destination: { city: 'Portland',     state: 'OR', country: 'US' }, discount: 0,    service: 'FTL',          validFrom: '2025-04-01', validTo: '2026-04-15', status: 'INACTIVE' },
  { id: 'l16', contractId: 'ceva-c2', mode: 'AIR',  type: 'Contracted', ref: 'CV-004', origin: { city: 'New York',    state: 'NY', country: 'US' }, destination: { city: 'Los Angeles', state: 'CA', country: 'US' }, discount: 0,    service: 'Air Express',  validFrom: '2026-01-01', validTo: '2026-08-31', status: 'ACTIVE'   },
];

// ─── CHARGE DEFINITIONS ───────────────────────────────────────────────────────

export const chargeDefinitions: ChargeDefinition[] = [
  // ── Averitt Express (avrt-c2) ───────────────────────────────────────────────
  {
    id: 'ch1', contractId: 'avrt-c2', code: 'BASE', name: 'Base Line Haul',
    type: 'Line Haul', rateType: 'TABLE', source: 'CzarLite 2026 Rate Card',
    currency: 'USD', effectiveDate: '2026-01-01',
    laneRates: [
      { id: 'lr1-1', laneRegion: 'Kenosha, WI → Atlanta, GA',          value: 68.5, uom: 'CWT', slab: 'All weights',    currency: 'USD', effective: '2026-01-01' },
      { id: 'lr1-2', laneRegion: 'Chicago, IL → Nashville, TN',         value: 71.0, uom: 'CWT', slab: 'All weights',    currency: 'USD', effective: '2026-01-01' },
      { id: 'lr1-3', laneRegion: 'Memphis, TN → Dallas, TX',            value: 65.0, uom: 'CWT', slab: 'All weights',    currency: 'USD', effective: '2026-01-01' },
      { id: 'lr1-4', laneRegion: 'Charlotte, NC → Miami, FL',           value: 72.5, uom: 'CWT', slab: 'All weights',    currency: 'USD', effective: '2026-01-01' },
      { id: 'lr1-5', laneRegion: 'Indianapolis, IN → Louisville, KY',   value: 69.0, uom: 'CWT', slab: '0–500 lbs',      currency: 'USD', effective: '2026-01-01' },
      { id: 'lr1-6', laneRegion: 'Indianapolis, IN → Louisville, KY',   value: 71.5, uom: 'CWT', slab: '501–2000 lbs',   currency: 'USD', effective: '2026-01-01' },
      { id: 'lr1-7', laneRegion: 'Houston, TX → San Antonio, TX',       value: 74.0, uom: 'CWT', slab: 'All weights',    currency: 'USD', effective: '2026-01-01' },
    ],
  },
  {
    id: 'ch2', contractId: 'avrt-c2', code: 'FSC', name: 'Fuel Surcharge',
    type: 'Accessorial', rateType: 'TABLE', source: 'AVRT FSC Schedule (DOE weekly index)',
    currency: 'USD', effectiveDate: '2026-01-01',
    laneRates: [
      { id: 'lr2-1', laneRegion: 'All lanes', value: null, uom: '% of Base', slab: 'DOE $3.00–$3.25/gal', currency: 'USD', effective: '2026-01-01' },
      { id: 'lr2-2', laneRegion: 'All lanes', value: null, uom: '% of Base', slab: 'DOE $3.26–$3.50/gal', currency: 'USD', effective: '2026-01-01' },
      { id: 'lr2-3', laneRegion: 'All lanes', value: null, uom: '% of Base', slab: 'DOE $3.51–$3.75/gal', currency: 'USD', effective: '2026-01-01' },
    ],
  },
  {
    id: 'ch3', contractId: 'avrt-c2', code: 'INSURANCE', name: 'Cargo Insurance',
    type: 'Accessorial', rateType: 'FLAT', source: 'AVRT 2026 Accessorial Schedule',
    currency: 'USD', effectiveDate: '2026-01-01',
    laneRates: [
      { id: 'lr3-1', laneRegion: 'All lanes', value: 12.50, uom: 'Per Shipment', slab: 'All weights', currency: 'USD', effective: '2026-01-01' },
    ],
  },
  {
    id: 'ch4', contractId: 'avrt-c2', code: 'RES', name: 'Residential Delivery',
    type: 'Accessorial', rateType: 'FLAT', source: 'AVRT 2026 Accessorial Schedule',
    currency: 'USD', effectiveDate: '2026-01-01',
    laneRates: [
      { id: 'lr4-1', laneRegion: 'All lanes', value: 85.00, uom: 'Per Delivery', slab: 'All weights', currency: 'USD', effective: '2026-01-01' },
    ],
  },

  // ── FedEx Freight (fxfe-c1) ─────────────────────────────────────────────────
  {
    id: 'ch5', contractId: 'fxfe-c1', code: 'BASE', name: 'Base Line Haul',
    type: 'Line Haul', rateType: 'TABLE', source: 'CzarLite 2026 National Rate Card',
    currency: 'USD', effectiveDate: '2026-01-01',
    laneRates: [
      { id: 'lr5-1', laneRegion: 'Memphis, TN → Chicago, IL',   value: 62.0, uom: 'CWT', slab: '0–999 lbs',     currency: 'USD', effective: '2026-01-01' },
      { id: 'lr5-2', laneRegion: 'Memphis, TN → Chicago, IL',   value: 64.5, uom: 'CWT', slab: '1000–2000 lbs', currency: 'USD', effective: '2026-01-01' },
      { id: 'lr5-3', laneRegion: 'Los Angeles, CA → Phoenix, AZ', value: 58.5, uom: 'CWT', slab: 'All weights',  currency: 'USD', effective: '2026-01-01' },
    ],
  },
  {
    id: 'ch6', contractId: 'fxfe-c1', code: 'FSC', name: 'Fuel Surcharge',
    type: 'Accessorial', rateType: 'TABLE', source: 'FXFE FSC Weekly Table (DOE index)',
    currency: 'USD', effectiveDate: '2026-01-01',
    laneRates: [
      { id: 'lr6-1', laneRegion: 'All lanes', value: null, uom: '% of Base', slab: 'DOE $3.00–$3.24/gal', currency: 'USD', effective: '2026-01-01' },
      { id: 'lr6-2', laneRegion: 'All lanes', value: null, uom: '% of Base', slab: 'DOE $3.25–$3.49/gal', currency: 'USD', effective: '2026-01-01' },
    ],
  },
  {
    id: 'ch7', contractId: 'fxfe-c1', code: 'RES', name: 'Residential Delivery',
    type: 'Accessorial', rateType: 'FLAT', source: 'FXFE 2026 Accessorial Tariff',
    currency: 'USD', effectiveDate: '2026-01-01',
    laneRates: [
      { id: 'lr7-1', laneRegion: 'All lanes', value: 85.00, uom: 'Per Delivery', slab: 'All weights', currency: 'USD', effective: '2026-01-01' },
    ],
  },

  // ── CEVA Logistics (ceva-c2) ────────────────────────────────────────────────
  {
    id: 'ch8', contractId: 'ceva-c2', code: 'BASE', name: 'Base Line Haul',
    type: 'Line Haul', rateType: 'FLAT', source: 'CEVA Road Rate Card 2025-2026',
    currency: 'USD', effectiveDate: '2025-07-01',
    laneRates: [
      { id: 'lr8-1', laneRegion: 'Dallas, TX → Los Angeles, CA', value: 2.85, uom: 'Per Mile', slab: '0–500 mi',    currency: 'USD', effective: '2025-07-01' },
      { id: 'lr8-2', laneRegion: 'Dallas, TX → Los Angeles, CA', value: 2.65, uom: 'Per Mile', slab: '501–1000 mi', currency: 'USD', effective: '2025-07-01' },
      { id: 'lr8-3', laneRegion: 'Dallas, TX → Los Angeles, CA', value: 2.45, uom: 'Per Mile', slab: '1001+ mi',    currency: 'USD', effective: '2025-07-01' },
    ],
  },
  {
    id: 'ch9', contractId: 'ceva-c2', code: 'FSC', name: 'Fuel Surcharge',
    type: 'Accessorial', rateType: 'PERCENTAGE', source: 'CEVA Quarterly FSC Schedule',
    currency: 'USD', effectiveDate: '2025-07-01',
    laneRates: [
      { id: 'lr9-1', laneRegion: 'All lanes', value: 18.5, uom: '% of Base', slab: 'Q3 2025', currency: 'USD', effective: '2025-07-01' },
      { id: 'lr9-2', laneRegion: 'All lanes', value: 19.0, uom: '% of Base', slab: 'Q4 2025', currency: 'USD', effective: '2025-10-01' },
      { id: 'lr9-3', laneRegion: 'All lanes', value: 17.5, uom: '% of Base', slab: 'Q1 2026', currency: 'USD', effective: '2026-01-01' },
    ],
  },
  {
    id: 'ch10', contractId: 'ceva-c2', code: 'OHC', name: 'Origin Handling',
    type: 'Accessorial', rateType: 'FLAT', source: 'CEVA Road Rate Card 2025-2026',
    currency: 'USD', effectiveDate: '2025-07-01',
    laneRates: [
      { id: 'lr10-1', laneRegion: 'All lanes', value: 45.00, uom: 'Per Shipment', slab: 'All weights', currency: 'USD', effective: '2025-07-01' },
    ],
  },
];

// ─── UPLOAD JOBS ──────────────────────────────────────────────────────────────

export const uploadJobs: UploadJob[] = [
  { id: 'uj1', ref: 'CJ-20260505054956-43B1A1', scac: 'AVRT', mode: 'LTL', status: 'COMPLETED', progress: 100, rates: 550, files: ['AVRT_2026_LTL_Base.pdf', 'AVRT_2026_Amendment_1.pdf'], uploadedAt: '2026-05-05T05:49:56Z' },
  { id: 'uj2', ref: 'CJ-20260430120211-9E2F44', scac: 'FXFE', mode: 'LTL', status: 'COMPLETED', progress: 100, rates: 820, files: ['FXFE_2026_National.pdf'], uploadedAt: '2026-04-30T12:02:11Z' },
  { id: 'uj3', ref: 'CJ-20260425183344-C7A019', scac: 'CEVA', mode: 'ROAD', status: 'PARTIAL', progress: 78, rates: 226, files: ['CEVA_Road_2025-2026.pdf', 'CEVA_Air_2025.pdf', 'CEVA_Addendum.xlsx'], uploadedAt: '2026-04-25T18:33:44Z' },
  { id: 'uj4', ref: 'CJ-20260422091722-BB8812', scac: 'XPOL', mode: 'LTL', status: 'PROCESSING', progress: 45, rates: 198, files: ['XPOL_2026_LTL.pdf'], uploadedAt: '2026-04-22T09:17:22Z' },
  { id: 'uj5', ref: 'CJ-20260414150837-D3901C', scac: 'EXLA', mode: 'LTL', status: 'FAILED', progress: 0, rates: 0, files: ['EXLA_2026_Draft.xlsx'], uploadedAt: '2026-04-14T15:08:37Z' },
];

// ─── INVOICES ─────────────────────────────────────────────────────────────────

export const invoices: Invoice[] = [
  {
    id: 'inv-001', ref: 'INV-2026-00441', vendor: 'Averitt Express', vendorScac: 'AVRT',
    type: 'Freight', mode: 'LTL', service: 'Standard', status: 'HELD', auditStatus: 'FAIL',
    amount: 4820.50, currency: 'USD', billedDate: '2026-04-28', receivedDate: '2026-04-30', paymentTerms: 'Net 30',
    bolRef: 'BOL-8821947', poRef: 'PO 111761158',
    billTo:   { name: 'Acme Corp',        address: '100 Commerce Blvd',  city: 'Chicago',    state: 'IL', zip: '60601' },
    billFrom: { name: 'Averitt Express',  address: '1415 Vantage Blvd',  city: 'Cookeville', state: 'TN', zip: '38501' },
    auditNotes: ['Base rate overbilled by $310.00 (8.76%)', 'Cargo Insurance charged $150.00 vs contracted $12.50'],
    origin:      { city: 'Cookeville',   state: 'TN' },
    destination: { city: 'Chicago',      state: 'IL' },
  },
  {
    id: 'inv-002', ref: 'INV-2026-00438', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    type: 'Freight', mode: 'LTL', service: 'Priority', status: 'APPROVED', auditStatus: 'PASS',
    amount: 2310.00, currency: 'USD', billedDate: '2026-04-27', receivedDate: '2026-04-29', paymentTerms: 'Net 30',
    bolRef: 'BOL-7741823', poRef: 'PO 111761021',
    billTo:   { name: 'Acme Corp',    address: '100 Commerce Blvd', city: 'Chicago',  state: 'IL', zip: '60601' },
    billFrom: { name: 'FedEx Freight', address: '3900 Turfway Rd', city: 'Erlanger', state: 'KY', zip: '41018' },
    auditNotes: [],
    origin:      { city: 'Memphis',  state: 'TN' },
    destination: { city: 'Chicago',  state: 'IL' },
  },
  {
    id: 'inv-003', ref: 'INV-2026-00435', vendor: 'CEVA Logistics', vendorScac: 'CEVA',
    type: 'Freight', mode: 'ROAD', service: 'Standard', status: 'INCOMPLETE', auditStatus: 'WARNING',
    amount: 8750.00, currency: 'USD', billedDate: '2026-04-25', receivedDate: '2026-04-26', paymentTerms: 'Net 45',
    bolRef: 'BOL-6630912', poRef: 'PO 111760744',
    billTo:   { name: 'Acme Corp',      address: '100 Commerce Blvd', city: 'Chicago', state: 'IL', zip: '60601' },
    billFrom: { name: 'CEVA Logistics', address: '15350 Vickery Dr',  city: 'Houston', state: 'TX', zip: '77032' },
    auditNotes: ['Missing BOL reference for 2 line items', 'FSC rate could not be validated — rate table not found'],
    origin:      { city: 'Dallas',        state: 'TX' },
    destination: { city: 'Los Angeles',   state: 'CA' },
  },
  {
    id: 'inv-004', ref: 'INV-2026-00430', vendor: 'XPO Logistics', vendorScac: 'XPOL',
    type: 'Freight', mode: 'LTL', service: 'Standard', status: 'APPROVED', auditStatus: 'PASS',
    amount: 1890.75, currency: 'USD', billedDate: '2026-04-22', receivedDate: '2026-04-23', paymentTerms: 'Net 30',
    bolRef: 'BOL-5520781', poRef: 'PO 111760501',
    billTo:   { name: 'Acme Corp',    address: '100 Commerce Blvd', city: 'Chicago',   state: 'IL', zip: '60601' },
    billFrom: { name: 'XPO Logistics', address: '5 American Ln',   city: 'Greenwich', state: 'CT', zip: '06831' },
    auditNotes: [],
    origin:      { city: 'New York',  state: 'NY' },
    destination: { city: 'Boston',    state: 'MA' },
  },
  {
    id: 'inv-005', ref: 'INV-2026-00428', vendor: 'Averitt Express', vendorScac: 'AVRT',
    type: 'Freight', mode: 'LTL', service: 'Standard', status: 'REJECTED', auditStatus: 'FAIL',
    amount: 3200.00, currency: 'USD', billedDate: '2026-04-20', receivedDate: '2026-04-22', paymentTerms: 'Net 30',
    bolRef: 'BOL-4410659', poRef: 'PO 111760312',
    billTo:   { name: 'Acme Corp',       address: '100 Commerce Blvd', city: 'Chicago',    state: 'IL', zip: '60601' },
    billFrom: { name: 'Averitt Express', address: '1415 Vantage Blvd', city: 'Cookeville', state: 'TN', zip: '38501' },
    auditNotes: ['Lane not found in active contract — no matching origin/destination pair', 'Invoice rejected and returned to carrier'],
    origin:      { city: 'Indianapolis', state: 'IN' },
    destination: { city: 'Nashville',    state: 'TN' },
  },
  {
    id: 'inv-006', ref: 'INV-2026-00420', vendor: 'Estes Express Lines', vendorScac: 'EXLA',
    type: 'Freight', mode: 'LTL', service: 'Standard', status: 'COMPLETED', auditStatus: 'PASS',
    amount: 1450.25, currency: 'USD', billedDate: '2026-04-15', receivedDate: '2026-04-16', paymentTerms: 'Net 30',
    bolRef: 'BOL-3301548', poRef: 'PO 111760101',
    billTo:   { name: 'Acme Corp',          address: '100 Commerce Blvd', city: 'Chicago',  state: 'IL', zip: '60601' },
    billFrom: { name: 'Estes Express Lines', address: '3901 W Broad St',  city: 'Richmond', state: 'VA', zip: '23230' },
    auditNotes: [],
    origin:      { city: 'Richmond',   state: 'VA' },
    destination: { city: 'Baltimore',  state: 'MD' },
  },
  {
    id: 'inv-007', ref: 'INV-2026-00418', vendor: 'FedEx Freight', vendorScac: 'FXFE',
    type: 'Accessorial', mode: 'LTL', service: 'Standard', status: 'HELD', auditStatus: 'WARNING',
    amount: 650.00, currency: 'USD', billedDate: '2026-04-14', receivedDate: '2026-04-15', paymentTerms: 'Net 30',
    bolRef: 'BOL-2201437', poRef: 'PO 111759900',
    billTo:   { name: 'Acme Corp',    address: '100 Commerce Blvd', city: 'Chicago',  state: 'IL', zip: '60601' },
    billFrom: { name: 'FedEx Freight', address: '3900 Turfway Rd', city: 'Erlanger', state: 'KY', zip: '41018' },
    auditNotes: ['Residential delivery charge of $95.00 exceeds contracted rate of $85.00'],
    origin:      { city: 'Los Angeles', state: 'CA' },
    destination: { city: 'Phoenix',     state: 'AZ' },
  },
  {
    id: 'inv-008', ref: 'INV-2026-00415', vendor: 'CEVA Logistics', vendorScac: 'CEVA',
    type: 'Freight', mode: 'AIR', service: 'Express', status: 'APPROVED', auditStatus: 'PASS',
    amount: 12400.00, currency: 'USD', billedDate: '2026-04-12', receivedDate: '2026-04-14', paymentTerms: 'Net 45',
    bolRef: 'BOL-1101326', poRef: 'PO 111759700',
    billTo:   { name: 'Acme Corp',      address: '100 Commerce Blvd', city: 'Chicago', state: 'IL', zip: '60601' },
    billFrom: { name: 'CEVA Logistics', address: '15350 Vickery Dr',  city: 'Houston', state: 'TX', zip: '77032' },
    auditNotes: [],
    origin:      { city: 'Chicago',  state: 'IL' },
    destination: { city: 'Miami',    state: 'FL' },
  },
  {
    id: 'inv-009', ref: 'INV-2026-00410', vendor: 'XPO Logistics', vendorScac: 'XPOL',
    type: 'Freight', mode: 'FTL', service: 'Standard', status: 'PENDING', auditStatus: 'PENDING',
    amount: 5600.00, currency: 'USD', billedDate: '2026-04-10', receivedDate: '2026-04-11', paymentTerms: 'Net 30',
    bolRef: 'BOL-0001215', poRef: 'PO 111759501',
    billTo:   { name: 'Acme Corp',    address: '100 Commerce Blvd', city: 'Chicago',   state: 'IL', zip: '60601' },
    billFrom: { name: 'XPO Logistics', address: '5 American Ln',   city: 'Greenwich', state: 'CT', zip: '06831' },
    auditNotes: [],
    origin:      { city: 'Denver',        state: 'CO' },
    destination: { city: 'Salt Lake City', state: 'UT' },
  },
  {
    id: 'inv-010', ref: 'INV-2026-00405', vendor: 'Averitt Express', vendorScac: 'AVRT',
    type: 'Freight', mode: 'LTL', service: 'Standard', status: 'COMPLETED', auditStatus: 'PASS',
    amount: 2890.50, currency: 'USD', billedDate: '2026-04-08', receivedDate: '2026-04-09', paymentTerms: 'Net 30',
    bolRef: 'BOL-9991104', poRef: 'PO 111759300',
    billTo:   { name: 'Acme Corp', address: '100 Commerce Blvd', city: 'Chicago', state: 'IL', zip: '60601' },
    billFrom: { name: 'Averitt Express', address: '1415 Vantage Blvd', city: 'Cookeville', state: 'TN', zip: '38501' },
    auditNotes: [],
    origin:      { city: 'Cookeville', state: 'TN' },
    destination: { city: 'Chicago',    state: 'IL' },
  },
  {
    id: 'inv-011', ref: 'INV-2026-00401', vendor: 'Estes Express Lines', vendorScac: 'EXLA',
    type: 'Accessorial', mode: 'LTL', service: 'Standard', status: 'INCOMPLETE', auditStatus: 'FAIL',
    amount: 340.00, currency: 'USD', billedDate: '2026-04-05', receivedDate: '2026-04-07', paymentTerms: 'Net 30',
    bolRef: 'BOL-8880993', poRef: 'PO 111759100',
    billTo:   { name: 'Acme Corp', address: '100 Commerce Blvd', city: 'Chicago', state: 'IL', zip: '60601' },
    billFrom: { name: 'Estes Express Lines', address: '3901 W Broad St', city: 'Richmond', state: 'VA', zip: '23230' },
    auditNotes: ['Charge code LIFTGATE not found in contracted charge definitions'],
    origin:      { city: 'Richmond', state: 'VA' },
    destination: { city: 'Baltimore', state: 'MD' },
  },
];

// ─── INVOICE LINE ITEMS ───────────────────────────────────────────────────────

export const invoiceLineItems: InvoiceLineItem[] = [
  { id: 'li1', invoiceId: 'inv-001', code: 'BASE', description: 'Base Line Haul', billed: 3850.00, contracted: 3540.00, variance: 310.00, variancePct: 8.76, status: 'FAIL' },
  { id: 'li2', invoiceId: 'inv-001', code: 'FSC', description: 'Fuel Surcharge', billed: 820.50, contracted: 820.50, variance: 0, variancePct: 0, status: 'PASS' },
  { id: 'li3', invoiceId: 'inv-001', code: 'INSURANCE', description: 'Cargo Insurance', billed: 150.00, contracted: 12.50, variance: 137.50, variancePct: 1100.0, status: 'FAIL' },
  { id: 'li4', invoiceId: 'inv-002', code: 'BASE', description: 'Base Line Haul', billed: 1890.00, contracted: 1890.00, variance: 0, variancePct: 0, status: 'PASS' },
  { id: 'li5', invoiceId: 'inv-002', code: 'FSC', description: 'Fuel Surcharge', billed: 420.00, contracted: 420.00, variance: 0, variancePct: 0, status: 'PASS' },
];