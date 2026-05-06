import React, { useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronRight, Plus, RefreshCw, Filter, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { spendDashboards, kpiCards, spendByChargeType, chargeComposition, chargeTrend } from "../../data/spendData";

// ─── Format raw field names ───────────────────────────────────────────────────

const fmtLabel = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, subLabel }: { label: string; value: string; subLabel: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <p className="text-2xl font-semibold text-slate-950">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subLabel}</p>
    </div>
  );
}

// ─── More Filters Popover ─────────────────────────────────────────────────────

interface MoreF { mode: string; region: string; bu: string; service: string }

function MoreFilters({ f, onChange, onReset, count }: {
  f: MoreF; onChange: (v: MoreF) => void; onReset: () => void; count: number;
}) {
  const set = (k: keyof MoreF, v: string) => onChange({ ...f, [k]: v });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 relative">
          <Filter size={13} />
          Filters
          {count > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary text-white text-[10px] w-4 h-4 font-medium ml-0.5">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4 space-y-4" align="start">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-800">More Filters</span>
          {count > 0 && <button onClick={onReset} className="text-xs text-primary hover:underline">Reset</button>}
        </div>
        {([
          { label: "Mode",    key: "mode",    opts: ["all:All Modes","LTL:LTL","FTL:FTL","ROAD:Road","AIR:Air"] },
          { label: "Region",  key: "region",  opts: ["all:All Regions","NE:Northeast","SE:Southeast","MW:Midwest","SW:Southwest","W:West"] },
          { label: "BU",      key: "bu",      opts: ["all:All BUs","retail:Retail","industrial:Industrial","pharma:Pharma"] },
          { label: "Service", key: "service", opts: ["all:All Services","standard:Standard","priority:Priority","express:Express"] },
        ] as const).map(({ label, key, opts }) => (
          <div key={key}>
            <label className="text-xs font-medium text-slate-500 block mb-1">{label}</label>
            <select
              value={f[key]}
              onChange={(e) => set(key, e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none"
            >
              {opts.map((o) => { const [v, l] = o.split(":"); return <option key={v} value={v}>{l}</option>; })}
            </select>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="text-slate-500 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {fmtLabel(p.name)}: {typeof p.value === "number" && Math.abs(p.value) > 100 ? usd(p.value) : `${p.value}%`}
        </p>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SpendDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const dashboard = spendDashboards.find((d) => d.slug === slug);

  const [period, setPeriod] = useState("all");
  const [carrier, setCarrier] = useState("all");
  const [moreF, setMoreF] = useState<MoreF>({ mode: "all", region: "all", bu: "all", service: "all" });

  const moreCount = Object.values(moreF).filter((v) => v !== "all").length;

  if (!dashboard) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-slate-400 text-sm">Dashboard not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link to="/spend" className="hover:text-slate-600 transition-colors">Spend Analysis</Link>
          <ChevronRight size={12} />
          <span className="text-slate-600">{dashboard.name}</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-950">{dashboard.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{dashboard.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw size={13} />
              Refresh
            </Button>
            <Button size="sm" className="gap-1.5">
              <Plus size={14} />
              Add Widget
            </Button>
          </div>
        </div>

        {/* Filters: 2 primary + More */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-primary"
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Carrier</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-primary"
            >
              <option value="all">All Carriers</option>
              <option value="AVRT">Averitt Express</option>
              <option value="FXFE">FedEx Freight</option>
              <option value="CEVA">CEVA Logistics</option>
              <option value="XPOL">XPO Logistics</option>
            </select>
          </div>

          <MoreFilters
            f={moreF}
            onChange={setMoreF}
            onReset={() => setMoreF({ mode: "all", region: "all", bu: "all", service: "all" })}
            count={moreCount}
          />

          {(period !== "all" || carrier !== "all" || moreCount > 0) && (
            <button
              onClick={() => { setPeriod("all"); setCarrier("all"); setMoreF({ mode: "all", region: "all", bu: "all", service: "all" }); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 ml-1"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Dashboard content */}
      <div className="px-6 py-5 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Spend by Charge Type — formatted labels */}
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
            <h3 className="text-sm font-medium text-slate-700 mb-4">Spend by Charge Type</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spendByChargeType} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => v === 0 ? "$0" : `${v > 0 ? "+" : ""}${Math.round(v / 1000)}k`}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="value"
                  radius={[0, 3, 3, 0]}
                  fill="#F06B00"
                >
                  {spendByChargeType.map((entry, i) => (
                    <Cell key={i} fill={entry.value < 0 ? "#e2e8f0" : "#F06B00"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Charge Composition donut */}
          <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
            <h3 className="text-sm font-medium text-slate-700 mb-4">Charge Composition</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chargeComposition.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chargeComposition.filter((d) => d.value > 0).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  iconSize={10}
                  iconType="circle"
                />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charge Trend */}
        <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
          <h3 className="text-sm font-medium text-slate-700 mb-4">Charge Trend — Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chargeTrend} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="lgLinehaul" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F06B00" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F06B00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lgFsc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(v: number, name: string) => [usd(v), fmtLabel(name)]} />
              <Area type="monotone" dataKey="linehaul" stroke="#F06B00" strokeWidth={2} fill="url(#lgLinehaul)" name="Linehaul" />
              <Area type="monotone" dataKey="fuelSurcharge" stroke="#14b8a6" strokeWidth={2} fill="url(#lgFsc)" name="Fuel Surcharge" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
