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
  ChevronDown,
  ChevronRight,
  LogOut,
  Check,
  PanelLeft,
} from "lucide-react";
import { cn } from "./ui/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

const freehandLogo = new URL("../../assets/freehand-logo.svg", import.meta.url).href;
const freehandMark = new URL("../../assets/freehand-mark.svg", import.meta.url).href;

type MenuItem = {
  label: string;
  icon: React.ElementType;
  path?: string;
  hasSub?: boolean;
};

const sections: { label?: string; items: MenuItem[] }[] = [
  {
    items: [{ label: "Home", icon: Home, path: "/" }],
  },
  {
    label: "Audit",
    items: [
      { label: "Exceptions", icon: AlertTriangle, path: "/exceptions" },
      { label: "Spend Analysis", icon: TrendingDown, path: "/spend" },
      { label: "Invoices", icon: FileText, path: "/invoices" },
      { label: "Contracts", icon: Receipt, path: "/contracts" },
    ],
  },
  {
    label: "Config",
    items: [
      { label: "Agents", icon: Bot, path: "/agents" },
      { label: "Reports", icon: BarChart2, path: "/reports" },
      { label: "Context Graph", icon: GitBranch, path: "/graph" },
      { label: "Configuration", icon: Settings, path: "/config", hasSub: true },
    ],
  },
];

const workspaces = [
  { id: "pandostaging", name: "Pandostaging" },
  { id: "pando-prod", name: "Pando Production" },
  { id: "pando-dev", name: "Pando Dev" },
];

// ─── Custom toggle button (replaces SidebarTrigger so refs forward correctly for Tooltip) ──

function SidebarToggleButton({
  tooltip,
  className,
  side = "right",
}: {
  tooltip: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const { toggleSidebar } = useSidebar();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={tooltip}
          className={cn(
            "inline-flex items-center justify-center size-7 rounded-md hover:bg-slate-100 transition-colors",
            className
          )}
        >
          <PanelLeft size={16} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

// ─── Menu item ─────────────────────────────────────────────────────────────────

function MenuLink({ item }: { item: MenuItem }) {
  const location = useLocation();
  const isActive =
    !!item.path &&
    (item.path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.path));

  const button = (
    <SidebarMenuButton
      isActive={isActive}
      tooltip={item.label}
      className={cn(
        // Inter, 14/20, regular — applied to both default and active states
        "h-9 text-sm font-normal leading-5 data-[active=true]:font-normal",
        "data-[active=true]:bg-slate-950 data-[active=true]:text-white",
        "data-[active=true]:hover:bg-slate-950 data-[active=true]:hover:text-white"
      )}
    >
      <item.icon />
      <span>{item.label}</span>
      {item.hasSub && <ChevronRight className="ml-auto" />}
    </SidebarMenuButton>
  );

  return (
    <SidebarMenuItem>
      {item.path ? (
        <Link to={item.path} className="contents">
          {button}
        </Link>
      ) : (
        <span className="contents cursor-pointer">{button}</span>
      )}
    </SidebarMenuItem>
  );
}

// ─── Workspace switcher (popover + searchable command + dim backdrop) ─────────

function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(workspaces[0]);

  return (
    <>
      {/* Dim backdrop while open */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-[#234357]/20"
          onClick={() => setOpen(false)}
        />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="mx-3 mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-950 leading-tight truncate">
                {selected.name}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Work space
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-400 shrink-0 ml-2" />
          </button>
        </PopoverTrigger>
        {/* sideOffset negative so the popover overlays the trigger */}
        <PopoverContent
          className="w-[228px] p-0 z-50"
          align="start"
          side="bottom"
          sideOffset={-44}
        >
          <div className="px-3 pt-2.5 pb-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide">
            Workspace
          </div>
          <Command>
            <CommandInput placeholder="Search workspace..." className="h-9" />
            <CommandList>
              <CommandEmpty>No workspace found.</CommandEmpty>
              <CommandGroup>
                {workspaces.map((w) => (
                  <CommandItem
                    key={w.id}
                    value={w.name}
                    onSelect={() => {
                      setSelected(w);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-slate-950 truncate">
                      {w.name}
                    </span>
                    {selected.id === w.id && (
                      <Check size={14} className="text-slate-500 shrink-0 ml-2" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const triggerTooltip = collapsed ? "Open Sidebar" : "Close Sidebar";

  return (
    <Sidebar
      collapsible="icon"
      className="group-data-[side=left]:!border-r-0 group-data-[side=right]:!border-l-0 py-2"
    >
      <SidebarHeader className="gap-0 p-0">
        {/* Row 1: logo + sidebar toggle */}
        {collapsed ? (
          // Mark by default; on hover swap to toggle button (with tooltip)
          <div className="group relative flex items-center justify-center h-12">
            <img
              src={freehandMark}
              alt="Freehand"
              className="w-7 h-7 transition-opacity duration-150 group-hover:opacity-0"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <SidebarToggleButton
                tooltip={triggerTooltip}
                className="text-slate-600"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-3">
            <img src={freehandLogo} alt="Freehand" className="h-6" />
            <SidebarToggleButton
              tooltip={triggerTooltip}
              className="text-slate-400"
            />
          </div>
        )}

        {/* Row 2: workspace switcher (hidden when collapsed) */}
        {!collapsed && <WorkspaceSwitcher />}
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && collapsed && <SidebarSeparator className="my-0" />}
            <SidebarGroup className="py-1">
              {section.label && (
                <SidebarGroupLabel className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                  {section.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <MenuLink key={item.label} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </React.Fragment>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div
          className={cn(
            "flex items-center gap-2.5",
            collapsed && "justify-center"
          )}
        >
          {/* Rounded rectangle dark avatar */}
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-900 shrink-0">
            <span className="text-xs font-medium text-white">JD</span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-950 truncate">
                  Jane Doe
                </p>
                <p className="text-[11px] text-slate-500 truncate">Admin</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Log out"
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <LogOut size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Log out</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#fafafa] overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
