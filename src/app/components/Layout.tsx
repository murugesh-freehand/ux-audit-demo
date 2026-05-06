import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  Home,
  FileText,
  Receipt,
  AlertTriangle,
  TrendingDown,
  Bot,
  BarChart2,
  GitBranch,
  Settings,
  Bell,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "./ui/utils";

const PROCESSING_JOBS_COUNT = 71;

// ─── Flow nav items (main workflow) ──────────────────────────────────────────

const flowItems = [
  {
    label:    "Contracts",
    subtitle: "Upload & parse rate cards",
    icon:     FileText,
    path:     "/contracts",
    circleBg: "bg-amber-100",
    iconCls:  "text-amber-700",
    badge:    undefined as number | undefined,
  },
  {
    label:    "Invoice Audit",
    subtitle: "Ingest & match invoices",
    icon:     Receipt,
    path:     "/invoices",
    circleBg: "bg-blue-100",
    iconCls:  "text-blue-700",
    badge:    PROCESSING_JOBS_COUNT,
  },
  {
    label:    "Exceptions",
    subtitle: "Review & resolve flags",
    icon:     AlertTriangle,
    path:     "/exceptions",
    circleBg: "bg-red-100",
    iconCls:  "text-red-600",
    badge:    undefined,
  },
  {
    label:    "Spend Analysis",
    subtitle: "Patterns & insights",
    icon:     TrendingDown,
    path:     "/spend",
    circleBg: "bg-green-100",
    iconCls:  "text-green-700",
    badge:    undefined,
  },
];

// ─── Bottom utility nav items ─────────────────────────────────────────────────

const utilityItems = [
  { label: "Agents",        icon: Bot,       path: "/agents" },
  { label: "Reports",       icon: BarChart2, path: "/reports" },
  { label: "Context Graph", icon: GitBranch, path: "/graph" },
  { label: "Configuration", icon: Settings,  path: "/config" },
];

// ─── Simple utility nav item ──────────────────────────────────────────────────

function UtilityNavItem({
  label, icon: Icon, path,
}: { label: string; icon: React.ElementType; path: string }) {
  const location = useLocation();
  const isActive =
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  return (
    <Link
      to={path}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors relative",
        isActive
          ? "bg-orange-50 text-primary font-medium"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r bg-primary" />
      )}
      <Icon size={14} className="shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

// ─── Flow nav item ─────────────────────────────────────────────────────────────

function FlowNavItem({
  item,
}: {
  item: typeof flowItems[number];
}) {
  const location = useLocation();
  const isActive =
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.path);

  return (
    <Link
      to={item.path}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors",
        isActive
          ? "bg-orange-50"
          : "hover:bg-slate-50"
      )}
    >
      {/* Colored circle icon — sits on top of the connector line */}
      <div className={cn(
        "relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ring-2 ring-white",
        item.circleBg
      )}>
        <item.icon size={14} className={item.iconCls} />
      </div>

      {/* Label + subtitle */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm leading-tight",
          isActive ? "text-primary font-medium" : "text-slate-800 font-medium"
        )}>
          {item.label}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
      </div>

      {/* Badge */}
      {item.badge !== undefined && item.badge > 0 && (
        <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 shrink-0">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col shrink-0 bg-white border-r border-slate-200 overflow-y-auto transition-all duration-200",
        collapsed ? "w-14" : "w-60"
      )}>

        {/* Logo + controls */}
        <div className="flex items-center justify-between px-3 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {/* Freehand asterisk logo */}
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary shrink-0">
              <span className="text-white text-sm font-bold leading-none select-none">✳</span>
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold text-primary">Freehand</span>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <Bell size={14} />
              </button>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute left-14 top-3.5 p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {!collapsed && (
          <>
            {/* Workspace switcher */}
            <button className="mx-3 mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 hover:bg-slate-100 transition-colors text-left">
              <div>
                <p className="text-xs font-semibold text-slate-950 leading-tight">SLB</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Switch workspace</p>
              </div>
              <ChevronDown size={13} className="text-slate-400 shrink-0" />
            </button>

            {/* Home */}
            <nav className="px-2 pt-3 pb-1">
              <UtilityNavItem label="Home" icon={Home} path="/" />
            </nav>

            {/* Flow nav: Contracts → Invoice Audit → Exceptions → Spend Analysis */}
            <div className="px-2 pb-1">
              {/* Relative wrapper for the connector line */}
              <div className="relative">
                {/* Vertical connector line — runs between circle centers */}
                <div
                  className="absolute left-[1.375rem] top-5 bottom-5 w-px bg-orange-200"
                  style={{ zIndex: 0 }}
                />
                <div className="space-y-0.5 relative">
                  {flowItems.map((item) => (
                    <FlowNavItem key={item.path} item={item} />
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-3 my-1 border-t border-slate-200" />

            {/* Utility nav */}
            <nav className="px-2 pb-2 space-y-0.5">
              {utilityItems.map((item) => (
                <UtilityNavItem key={item.path} {...item} />
              ))}
            </nav>
          </>
        )}

        {/* User */}
        <div className={cn(
          "flex items-center gap-2.5 px-3 py-3 border-t border-slate-200 mt-auto",
          collapsed && "justify-center"
        )}>
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 shrink-0">
            <span className="text-xs font-medium text-slate-600">JD</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-950 truncate">Jane Doe</p>
              <p className="text-[10px] text-slate-500 truncate">Admin</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
