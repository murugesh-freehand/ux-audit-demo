import React from "react";
import { Link } from "react-router";
import { Plus, BarChart2 } from "lucide-react";
import { Button } from "../ui/button";
import { spendDashboards } from "../../data/spendData";

function DashboardCard({ dashboard }: { dashboard: typeof spendDashboards[0] }) {
  return (
    <Link
      to={`/spend/${dashboard.slug}`}
      className="group flex flex-col bg-white rounded-lg border border-slate-200 px-5 py-4 hover:border-slate-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-50 border border-orange-100 shrink-0">
          <BarChart2 size={15} className="text-primary" />
        </div>
        <h3 className="text-sm font-medium text-slate-950 group-hover:text-primary transition-colors leading-snug">
          {dashboard.name}
        </h3>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-4">
        {dashboard.description}
      </p>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
        <span>{dashboard.widgetCount} widget{dashboard.widgetCount !== 1 ? "s" : ""}</span>
        <span>
          {new Date(dashboard.lastUpdated).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          })}
        </span>
      </div>
    </Link>
  );
}

export default function SpendPage() {
  return (
    <div className="min-h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-slate-950">Spend Analysis</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              NL-driven dashboards for freight spend analysis
            </p>
          </div>
          <Button size="sm" className="gap-1.5">
            <Plus size={14} />
            New Dashboard
          </Button>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spendDashboards.map((d) => (
            <DashboardCard key={d.id} dashboard={d} />
          ))}
        </div>
      </div>
    </div>
  );
}
