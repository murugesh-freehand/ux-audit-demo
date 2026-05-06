export interface SpendDashboard {
  id: string;
  slug: string;
  name: string;
  description: string;
  widgetCount: number;
  lastUpdated: string;
}

export const spendDashboards: SpendDashboard[] = [
  {
    id: 'sd-01', slug: 'accruals',
    name: 'Accruals',
    description: 'Accrual estimates by carrier, mode, and period.',
    widgetCount: 1, lastUpdated: '2026-04-29',
  },
  {
    id: 'sd-02', slug: 'data-analysis',
    name: 'Data Analysis',
    description: 'Raw invoice data exploration across carriers and date ranges.',
    widgetCount: 3, lastUpdated: '2026-04-16',
  },
  {
    id: 'sd-03', slug: 'charge-breakdown',
    name: 'Charge Breakdown',
    description: 'Charge composition — linehaul vs surcharges vs accessorials, trends, and rate variances.',
    widgetCount: 8, lastUpdated: '2026-04-16',
  },
  {
    id: 'sd-04', slug: 'lane-geography',
    name: 'Lane & Geography',
    description: 'Freight flow analysis — top origins, destinations, lane spend, and mode distribution.',
    widgetCount: 4, lastUpdated: '2026-04-16',
  },
  {
    id: 'sd-05', slug: 'carrier-performance',
    name: 'Carrier Performance',
    description: 'Carrier scorecard — billing accuracy, overcharges, compliance rates, and spend trends by carrier.',
    widgetCount: 4, lastUpdated: '2026-04-16',
  },
  {
    id: 'sd-06', slug: 'audit-compliance',
    name: 'Audit & Compliance',
    description: 'Audit savings, exception tracking, compliance rates, and rule performance.',
    widgetCount: 9, lastUpdated: '2026-04-16',
  },
  {
    id: 'sd-07', slug: 'executive-overview',
    name: 'Executive Spend Overview',
    description: 'High-level spend visibility — total spend, carrier mix, mode breakdown, and monthly trends.',
    widgetCount: 8, lastUpdated: '2026-04-16',
  },
  {
    id: 'sd-08', slug: 'recent-audit',
    name: 'Recent Audit',
    description: 'Audit results and exception summary for the most recent billing cycle.',
    widgetCount: 3, lastUpdated: '2026-04-16',
  },
  {
    id: 'sd-09', slug: 'kpi',
    name: 'KPI',
    description: 'Key performance indicators across cost savings, audit accuracy, and payment compliance.',
    widgetCount: 5, lastUpdated: '2026-04-16',
  },
];

// ─── Charge Breakdown Dashboard Data ─────────────────────────────────────────

export const kpiCards = [
  { label: 'Linehaul',         value: '81.9%',  subLabel: 'of total spend' },
  { label: 'Fuel Surcharge',   value: '19.1%',  subLabel: 'of total spend' },
  { label: 'Accessorial',      value: '0.8%',   subLabel: 'of total spend' },
  { label: 'Discount Impact',  value: '−$598',  subLabel: 'total discount amount' },
];

export const spendByChargeType = [
  { name: 'Linehaul',            value: 21400 },
  { name: 'Fuel Surcharge',      value: 4980 },
  { name: 'Layover',             value: 420 },
  { name: 'Delivery Area Surch', value: 310 },
  { name: 'Other Accessorial',   value: 290 },
  { name: 'Discount',            value: -598 },
];

export const chargeComposition = [
  { name: 'Linehaul',       value: 81.9, color: '#F06B00' },
  { name: 'Fuel Surcharge', value: 19.1, color: '#14b8a6' },
  { name: 'Other',          value: -1.0, color: '#e2e8f0' },
];

export const chargeTrend = [
  { month: 'Nov', linehaul: 18200, fuelSurcharge: 3800 },
  { month: 'Dec', linehaul: 19500, fuelSurcharge: 4100 },
  { month: 'Jan', linehaul: 20100, fuelSurcharge: 4400 },
  { month: 'Feb', linehaul: 19800, fuelSurcharge: 4200 },
  { month: 'Mar', linehaul: 21000, fuelSurcharge: 4700 },
  { month: 'Apr', linehaul: 21400, fuelSurcharge: 4980 },
];
