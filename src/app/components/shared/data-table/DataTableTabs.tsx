import { cn } from "../../ui/utils";

export type DataTableTab = {
  id: string;
  label: string;
  count?: number;
};

export function DataTableTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: DataTableTab[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-0 rounded-md bg-slate-100 p-1"
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "h-7 px-2 rounded text-xs font-medium leading-4 transition-colors",
              active
                ? "bg-white text-slate-950 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className={cn("ml-1", active ? "text-slate-950" : "text-slate-500")}>
                ({t.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
