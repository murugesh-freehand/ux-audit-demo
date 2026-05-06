export type AgentStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';
export type FailureAction = 'FLAG' | 'REJECT' | 'WARN' | 'HOLD';
export type DirectiveStatus = 'ACTIVE' | 'INACTIVE';

export interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: AgentStatus;
}

// One mode + the service types that apply within it.
// serviceTypes: [] means "all service types for this mode"
export interface ModeServiceScope {
  mode: string;
  serviceTypes: string[];
}

export interface AgentDirective {
  id: string;
  name: string;
  scope: ModeServiceScope[]; // [] means all modes / all services
  failureAction: FailureAction;
  definition: string;
  status: DirectiveStatus;
  createdAt: string;
}

export interface VendorPolicy {
  id: string;
  vendorName: string;
  scac: string;
  isGlobal: boolean;
  directives: AgentDirective[];
}

// Service types available per mode. Empty array = no service type concept for this mode.
export const SERVICE_TYPES_BY_MODE: Record<string, string[]> = {
  AIR:    [],
  OCEAN:  ['FCL', 'LCL'],
  ROAD:   ['Less than Truckload', 'Full Truckload', 'Ground'],
  PARCEL: [],
};

export const MODES = Object.keys(SERVICE_TYPES_BY_MODE);

export const FAILURE_ACTIONS: { value: FailureAction; label: string; description: string }[] = [
  { value: 'FLAG',   label: 'Flag for review',  description: 'Mark invoice for manual review' },
  { value: 'WARN',   label: 'Warn only',        description: 'Log a warning, do not block' },
  { value: 'HOLD',   label: 'Hold payment',     description: 'Block payment until resolved' },
  { value: 'REJECT', label: 'Reject invoice',   description: 'Reject and return to carrier' },
];

export const agents: Agent[] = [
  {
    id: 'ag-01', slug: 'invoice-extraction',
    name: 'Invoice Extraction',
    description: 'Extracts structured data from uploaded invoice files — charges, documents, freight details, and line items.',
    status: 'ACTIVE',
  },
  {
    id: 'ag-02', slug: 'contract-parser',
    name: 'Contract Parser',
    description: 'Parses contracts and rate cards into structured pricing — charge definitions, lanes, rates, and surcharges.',
    status: 'ACTIVE',
  },
  {
    id: 'ag-03', slug: 'audit-agent',
    name: 'Audit Agent',
    description: 'Validates invoices against configured agent directives and contracted rates. Detects overcharges, unauthorized charges, and data inconsistencies.',
    status: 'ACTIVE',
  },
];

export const vendorPolicies: VendorPolicy[] = [
  {
    id: 'vp-global', vendorName: 'Global Directives', scac: '',
    isGlobal: true,
    directives: [],
  },
  {
    id: 'vp-bwss', vendorName: 'Blue Water Shipping', scac: 'BWSS',
    isGlobal: false,
    directives: [],
  },
  {
    id: 'vp-apex', vendorName: 'Apex Logistics International', scac: 'APXL',
    isGlobal: false,
    directives: [
      {
        id: 'd-apex-1',
        name: 'Fuel Surcharge Range Check',
        scope: [{ mode: 'LTL', serviceTypes: [] }, { mode: 'FTL', serviceTypes: [] }],
        failureAction: 'FLAG',
        definition: 'Verify that the fuel surcharge percentage applied to this invoice falls within the DOE diesel band published for the invoice week. Flag if FSC exceeds the contracted ceiling by more than 0.5%.',
        status: 'ACTIVE',
        createdAt: '2026-03-10',
      },
      {
        id: 'd-apex-2',
        name: 'Duplicate Charge Detection',
        scope: [],
        failureAction: 'REJECT',
        definition: 'Check that no charge code appears more than once on the same shipment unless explicitly permitted by the contract accessorial schedule.',
        status: 'INACTIVE',
        createdAt: '2026-02-01',
      },
    ],
  },
  {
    id: 'vp-avrt', vendorName: 'Averitt Express', scac: 'AVRT',
    isGlobal: false,
    directives: [
      {
        id: 'd-avrt-1',
        name: 'Minimum Charge Enforcement',
        scope: [{ mode: 'LTL', serviceTypes: ['Standard', 'Priority'] }],
        failureAction: 'FLAG',
        definition: 'Verify that the total billed amount is not less than the $125.00 minimum charge per shipment as defined in the contract key terms.',
        status: 'ACTIVE',
        createdAt: '2026-01-15',
      },
      {
        id: 'd-avrt-2',
        name: 'Dimensional Weight Validation',
        scope: [{ mode: 'LTL', serviceTypes: [] }],
        failureAction: 'FLAG',
        definition: 'If the shipment cubic density exceeds 10 cubic feet per 100 lbs, validate that the dimensional weight has been applied and billed instead of actual weight.',
        status: 'ACTIVE',
        createdAt: '2026-01-15',
      },
      {
        id: 'd-avrt-3',
        name: 'Cargo Insurance Cap',
        scope: [],
        failureAction: 'HOLD',
        definition: 'Cargo insurance charges must not exceed the contracted flat rate of $12.50 per shipment unless the customer has opted into additional coverage on the BOL.',
        status: 'ACTIVE',
        createdAt: '2026-02-20',
      },
    ],
  },
  {
    id: 'vp-chsl', vendorName: 'C H Robinson', scac: 'CHSL',
    isGlobal: false,
    directives: Array.from({ length: 55 }, (_, i) => ({
      id: `d-chsl-${i + 1}`,
      name: `Directive ${i + 1}`,
      scope: [],
      failureAction: 'FLAG' as FailureAction,
      definition: '',
      status: 'ACTIVE' as DirectiveStatus,
      createdAt: '2026-01-01',
    })),
  },
  {
    id: 'vp-ceva', vendorName: 'CEVA Logistics', scac: 'CEVA',
    isGlobal: false,
    directives: Array.from({ length: 136 }, (_, i) => ({
      id: `d-ceva-${i + 1}`,
      name: `Directive ${i + 1}`,
      scope: [],
      failureAction: 'FLAG' as FailureAction,
      definition: '',
      status: 'ACTIVE' as DirectiveStatus,
      createdAt: '2026-01-01',
    })),
  },
  {
    id: 'vp-dtsc', vendorName: 'Direct Traffic Solutions', scac: 'DTSC',
    isGlobal: false,
    directives: Array.from({ length: 20 }, (_, i) => ({
      id: `d-dtsc-${i + 1}`,
      name: `Directive ${i + 1}`,
      scope: [],
      failureAction: 'WARN' as FailureAction,
      definition: '',
      status: 'ACTIVE' as DirectiveStatus,
      createdAt: '2026-01-01',
    })),
  },
  {
    id: 'vp-fxfe', vendorName: 'FedEx Freight', scac: 'FXFE',
    isGlobal: false,
    directives: Array.from({ length: 58 }, (_, i) => ({
      id: `d-fxfe-${i + 1}`,
      name: `Directive ${i + 1}`,
      scope: [],
      failureAction: 'FLAG' as FailureAction,
      definition: '',
      status: 'ACTIVE' as DirectiveStatus,
      createdAt: '2026-01-01',
    })),
  },
  {
    id: 'vp-slcy', vendorName: 'Schneider National', scac: 'SLCY',
    isGlobal: false,
    directives: Array.from({ length: 18 }, (_, i) => ({
      id: `d-slcy-${i + 1}`,
      name: `Directive ${i + 1}`,
      scope: [],
      failureAction: 'FLAG' as FailureAction,
      definition: '',
      status: 'ACTIVE' as DirectiveStatus,
      createdAt: '2026-01-01',
    })),
  },
];
