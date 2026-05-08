import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { Checkbox } from "../../ui/checkbox";
import { cn } from "../../ui/utils";

export type SearchColumn = {
  id: string;
  label: string;
};

export function SearchWithColumnPicker({
  query,
  onQueryChange,
  placeholder = "Search…",
  columns,
  selectedColumns,
  onSelectedColumnsChange,
  className,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  placeholder?: string;
  columns: SearchColumn[];
  selectedColumns: string[];
  onSelectedColumnsChange: (ids: string[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  function toggle(id: string) {
    if (selectedColumns.includes(id)) {
      onSelectedColumnsChange(selectedColumns.filter((c) => c !== id));
    } else {
      onSelectedColumnsChange([...selectedColumns, id]);
    }
  }

  return (
    <div
      className={cn(
        "relative flex items-center h-9 w-[260px] rounded-md border bg-white pl-3 pr-1.5 transition-colors",
        focused
          ? "border-slate-900 ring-2 ring-slate-900/15"
          : "border-slate-200 hover:border-slate-300",
        className
      )}
    >
      <Search size={14} className="text-slate-400 shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-slate-900 placeholder:text-slate-400 px-2"
      />
      {query && (
        <button
          type="button"
          onClick={() => onQueryChange("")}
          aria-label="Clear search"
          className="inline-flex items-center justify-center size-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-50 mr-0.5"
        >
          <X size={13} />
        </button>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Search columns"
                className="inline-flex items-center justify-center size-7 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              >
                <SlidersHorizontal size={14} />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Search across selected columns</TooltipContent>
        </Tooltip>
        <PopoverContent className="w-[220px] p-2" align="end">
          <p className="px-2 pt-1 pb-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">
            Search columns
          </p>
          <div className="space-y-0.5">
            {columns.map((c) => {
              const checked = selectedColumns.includes(c.id);
              return (
                <label
                  key={c.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(c.id)}
                  />
                  <span className="text-sm text-slate-700">{c.label}</span>
                </label>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
