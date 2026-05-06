export type AgentStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';

export interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: AgentStatus;
}

export interface VendorPolicy {
  id: string;
  vendorName: string;
  scac: string;
  isGlobal: boolean;
  activeDirectives: number;
  totalDirectives: number;
}

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
    isGlobal: true, activeDirectives: 0, totalDirectives: 0,
  },
  {
    id: 'vp-apex', vendorName: 'Apex Logistics International', scac: 'APXL',
    isGlobal: false, activeDirectives: 1, totalDirectives: 2,
  },
  {
    id: 'vp-avrt', vendorName: 'Averitt Express', scac: 'AVRT',
    isGlobal: false, activeDirectives: 3, totalDirectives: 3,
  },
  {
    id: 'vp-chsl', vendorName: 'C H Robinson', scac: 'CHSL',
    isGlobal: false, activeDirectives: 55, totalDirectives: 55,
  },
  {
    id: 'vp-ceva', vendorName: 'CEVA Logistics', scac: 'CEVA',
    isGlobal: false, activeDirectives: 136, totalDirectives: 136,
  },
  {
    id: 'vp-dtsc', vendorName: 'Direct Traffic Solutions', scac: 'DTSC',
    isGlobal: false, activeDirectives: 20, totalDirectives: 20,
  },
  {
    id: 'vp-fxfe', vendorName: 'FedEx Freight', scac: 'FXFE',
    isGlobal: false, activeDirectives: 58, totalDirectives: 58,
  },
  {
    id: 'vp-slcy', vendorName: 'Schneider National', scac: 'SLCY',
    isGlobal: false, activeDirectives: 18, totalDirectives: 18,
  },
];
