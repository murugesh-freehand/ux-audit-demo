export type AuditOverallStatus = 'PASS' | 'INCOMPLETE' | 'FAIL';

export interface AuditRun {
  id: string;
  invoiceId: string;
  status: AuditOverallStatus;
  triggeredBy: string;
  startedAt: string;
  durationMs: number;
  nonRateStatus: AuditOverallStatus;
  rateStatus: AuditOverallStatus;
  matchMode: 'THREE_WAY' | 'TWO_WAY' | 'ONE_WAY';
  summaryPoints: string[];
  contract: {
    status: 'MATCHED' | 'UNMATCHED';
    name: string;
    scac: string;
    specificityScore: number;
    lane: string;
    precedencePolicy: 'MOST_SPECIFIC' | 'FIRST_MATCH' | 'HIGHEST_VERSION';
    evaluatedCount: number;
    topCandidates: { score: number; name: string; version: string; lane: string }[];
  };
}

export const auditRuns: AuditRun[] = [
  {
    id: 'ar-01', invoiceId: 'inv-001',
    status: 'INCOMPLETE',
    triggeredBy: 'cfo@example.com',
    startedAt: '2026-05-06T11:26:45Z',
    durationMs: 9900,
    nonRateStatus: 'PASS',
    rateStatus: 'INCOMPLETE',
    matchMode: 'THREE_WAY',
    summaryPoints: [
      'Invoice for $5,004.67 was matched to the FedEx Freight Pricing Agreement under the Zebra Technologies contract.',
      'All non-rate checks passed — billing details, shipper and receiver info, and service codes were verified.',
      'Rate validation could not be completed because required pricing tier or discount data was not available.',
    ],
    contract: {
      status: 'MATCHED',
      name: 'FedEx Freight Pricing Agreement – Zebra Technologies',
      scac: 'FXFE',
      specificityScore: 35,
      lane: 'DPL → ZONE_D',
      precedencePolicy: 'MOST_SPECIFIC',
      evaluatedCount: 120,
      topCandidates: [
        { score: 35, name: 'FedEx Freight Pricing Agreement – Zebra Technologies', version: 'v1', lane: 'DPL → ZONE_D' },
        { score: 35, name: 'FedEx Freight Pricing Agreement – Zebra Technologies', version: 'v1', lane: 'DPL → ZONE_B' },
        { score: 35, name: 'FedEx Freight Pricing Agreement – Zebra Technologies', version: 'v1', lane: 'DPL → ZONE_C' },
        { score: 25, name: 'FedEx Freight Pricing Agreement – Zebra Technologies', version: 'v2', lane: 'DPL → ZONE_D (Priority)' },
        { score: 20, name: 'FedEx Freight Standard Agreement', version: 'v3', lane: 'US → ZONE_A' },
      ],
    },
  },
  {
    id: 'ar-02', invoiceId: 'inv-001',
    status: 'INCOMPLETE',
    triggeredBy: 'reaudit',
    startedAt: '2026-05-06T11:26:23Z',
    durationMs: 9000,
    nonRateStatus: 'PASS',
    rateStatus: 'INCOMPLETE',
    matchMode: 'THREE_WAY',
    summaryPoints: [
      'Re-audit triggered automatically after rate data update.',
      'Rate validation still incomplete — pricing tier unavailable.',
    ],
    contract: {
      status: 'MATCHED',
      name: 'FedEx Freight Pricing Agreement – Zebra Technologies',
      scac: 'FXFE',
      specificityScore: 35,
      lane: 'DPL → ZONE_D',
      precedencePolicy: 'MOST_SPECIFIC',
      evaluatedCount: 120,
      topCandidates: [],
    },
  },
  {
    id: 'ar-03', invoiceId: 'inv-001',
    status: 'INCOMPLETE',
    triggeredBy: 'reaudit',
    startedAt: '2026-05-06T11:23:22Z',
    durationMs: 6300,
    nonRateStatus: 'PASS',
    rateStatus: 'INCOMPLETE',
    matchMode: 'THREE_WAY',
    summaryPoints: ['Re-audit: rate validation incomplete due to missing discount data.'],
    contract: {
      status: 'MATCHED', name: 'FedEx Freight Pricing Agreement – Zebra Technologies',
      scac: 'FXFE', specificityScore: 35, lane: 'DPL → ZONE_D',
      precedencePolicy: 'MOST_SPECIFIC', evaluatedCount: 120, topCandidates: [],
    },
  },
  {
    id: 'ar-04', invoiceId: 'inv-001',
    status: 'INCOMPLETE',
    triggeredBy: 'reaudit',
    startedAt: '2026-05-06T11:22:56Z',
    durationMs: 9800,
    nonRateStatus: 'PASS',
    rateStatus: 'INCOMPLETE',
    matchMode: 'THREE_WAY',
    summaryPoints: ['Re-audit: rate validation incomplete due to missing discount data.'],
    contract: {
      status: 'MATCHED', name: 'FedEx Freight Pricing Agreement – Zebra Technologies',
      scac: 'FXFE', specificityScore: 35, lane: 'DPL → ZONE_D',
      precedencePolicy: 'MOST_SPECIFIC', evaluatedCount: 120, topCandidates: [],
    },
  },
  {
    id: 'ar-05', invoiceId: 'inv-001',
    status: 'INCOMPLETE',
    triggeredBy: 'cfo@example.com',
    startedAt: '2026-04-30T17:27:05Z',
    durationMs: 9000,
    nonRateStatus: 'PASS',
    rateStatus: 'INCOMPLETE',
    matchMode: 'THREE_WAY',
    summaryPoints: ['Reprocess requested after manual review. Rate data still unavailable.'],
    contract: {
      status: 'MATCHED', name: 'FedEx Freight Pricing Agreement – Zebra Technologies',
      scac: 'FXFE', specificityScore: 35, lane: 'DPL → ZONE_D',
      precedencePolicy: 'MOST_SPECIFIC', evaluatedCount: 120, topCandidates: [],
    },
  },
  {
    id: 'ar-06', invoiceId: 'inv-001',
    status: 'INCOMPLETE',
    triggeredBy: 'cfo@example.com',
    startedAt: '2026-04-30T17:26:51Z',
    durationMs: 11800,
    nonRateStatus: 'PASS',
    rateStatus: 'INCOMPLETE',
    matchMode: 'THREE_WAY',
    summaryPoints: ['Initial reprocess. Rate validation incomplete.'],
    contract: {
      status: 'MATCHED', name: 'FedEx Freight Pricing Agreement – Zebra Technologies',
      scac: 'FXFE', specificityScore: 35, lane: 'DPL → ZONE_D',
      precedencePolicy: 'MOST_SPECIFIC', evaluatedCount: 120, topCandidates: [],
    },
  },
  {
    id: 'ar-07', invoiceId: 'inv-001',
    status: 'INCOMPLETE',
    triggeredBy: 'system',
    startedAt: '2026-04-28T21:43:35Z',
    durationMs: 9300,
    nonRateStatus: 'PASS',
    rateStatus: 'INCOMPLETE',
    matchMode: 'THREE_WAY',
    summaryPoints: ['Initial system audit on invoice receipt. Rate data missing.'],
    contract: {
      status: 'MATCHED', name: 'FedEx Freight Pricing Agreement – Zebra Technologies',
      scac: 'FXFE', specificityScore: 35, lane: 'DPL → ZONE_D',
      precedencePolicy: 'MOST_SPECIFIC', evaluatedCount: 120, topCandidates: [],
    },
  },
];
