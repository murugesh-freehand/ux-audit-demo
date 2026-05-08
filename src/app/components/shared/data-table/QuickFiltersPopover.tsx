import { useState, useEffect } from "react";
import {
  Filter,
  Search,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  ChevronDown,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Checkbox } from "../../ui/checkbox";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { cn } from "../../ui/utils";
import {
  AdvancedFilterRule,
  AdvancedOperator,
  FilterFieldDef,
  FilterState,
  FilterValue,
  OPERATORS_BY_TYPE,
} from "./types";
import { countActiveQuickFilters } from "./applyFilters";

let nextId = 0;
function newRuleId() {
  nextId += 1;
  return `rule-${nextId}`;
}
function emptyRule(): AdvancedFilterRule {
  return { id: newRuleId(), fieldId: null, operator: null, value: {} };
}

// ─── Quick view: per-field column ─────────────────────────────────────────────

function FilterColumn<T>({
  field,
  value,
  onChange,
}: {
  field: FilterFieldDef<T>;
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  const [search, setSearch] = useState("");
  const reset = () => onChange({});

  if (field.type === "date-range") {
    return (
      <div className="flex flex-col gap-2 shrink-0 min-w-[180px] rounded-lg bg-slate-50 border border-slate-100 p-3">
        <ColumnHeader label={field.label} onReset={reset} />
        <label className="text-[11px] text-slate-400">From</label>
        <Input
          type="date"
          value={value.dateFrom ?? ""}
          onChange={(e) => onChange({ ...value, dateFrom: e.target.value || null })}
          className="h-8 text-xs bg-white"
        />
        <label className="text-[11px] text-slate-400">To</label>
        <Input
          type="date"
          value={value.dateTo ?? ""}
          onChange={(e) => onChange({ ...value, dateTo: e.target.value || null })}
          className="h-8 text-xs bg-white"
        />
      </div>
    );
  }

  const showSearch = field.type === "search-multi" || field.type === "user-multi";
  const options = field.options ?? [];
  const filtered =
    showSearch && search
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;
  const selected = new Set(value.multi ?? []);

  function toggle(v: string) {
    const next = new Set(selected);
    next.has(v) ? next.delete(v) : next.add(v);
    onChange({ ...value, multi: [...next] });
  }

  return (
    <div className="flex flex-col gap-2 shrink-0 min-w-[180px] rounded-lg bg-slate-50 border border-slate-100 p-3">
      <ColumnHeader label={field.label} onReset={reset} />
      {showSearch && (
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${field.label.toLowerCase()}…`}
            className="w-full h-7 text-xs pl-6 pr-2 rounded border border-slate-200 bg-white outline-none focus:border-slate-400"
          />
        </div>
      )}
      <div className="space-y-0.5 max-h-60 overflow-y-auto pr-1">
        {filtered.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 px-1 py-1 rounded hover:bg-white cursor-pointer whitespace-nowrap"
          >
            <Checkbox checked={selected.has(opt.value)} onCheckedChange={() => toggle(opt.value)} />
            {opt.initials && (
              <span className="inline-flex items-center justify-center size-5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                {opt.initials}
              </span>
            )}
            {opt.dotColor && <span className={cn("size-2 rounded-full shrink-0", opt.dotColor)} />}
            <span className="text-sm text-slate-700">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ColumnHeader({ label, onReset }: { label: string; onReset: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-slate-950 whitespace-nowrap">{label}</span>
      <button onClick={onReset} className="text-[11px] text-slate-400 hover:text-slate-700">
        Reset
      </button>
    </div>
  );
}

// ─── Advanced view: rule rows ─────────────────────────────────────────────────

function RuleRow<T>({
  rule,
  fields,
  isFirst,
  onChange,
  onRemove,
}: {
  rule: AdvancedFilterRule;
  fields: FilterFieldDef<T>[];
  isFirst: boolean;
  onChange: (patch: Partial<AdvancedFilterRule>) => void;
  onRemove: () => void;
}) {
  const field = fields.find((f) => f.id === rule.fieldId) ?? null;
  const operators = field ? OPERATORS_BY_TYPE[field.type] : [];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500 w-12 shrink-0">{isFirst ? "Where" : "And"}</span>

      <Select
        value={rule.fieldId ?? undefined}
        onValueChange={(fieldId) => {
          const f = fields.find((x) => x.id === fieldId)!;
          const ops = OPERATORS_BY_TYPE[f.type];
          onChange({ fieldId, operator: ops[0]?.value ?? null, value: {} });
        }}
      >
        <SelectTrigger className="h-9 w-[200px]">
          <SelectValue placeholder="Column" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((f) => (
            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={rule.operator ?? undefined}
        onValueChange={(operator) => onChange({ operator: operator as AdvancedOperator })}
        disabled={!field}
      >
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue placeholder="Condition" />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ValueInput
        field={field}
        rule={rule}
        onChange={(value) => onChange({ value: { ...rule.value, ...value } })}
      />

      <button
        onClick={onRemove}
        aria-label="Remove filter"
        className="inline-flex items-center justify-center size-8 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-50 shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ValueInput<T>({
  field,
  rule,
  onChange,
}: {
  field: FilterFieldDef<T> | null;
  rule: AdvancedFilterRule;
  onChange: (patch: Partial<AdvancedFilterRule["value"]>) => void;
}) {
  if (!field) return <Input disabled placeholder="Value" className="h-9 flex-1 min-w-[200px]" />;

  if (field.type === "select-multi" || field.type === "search-multi" || field.type === "user-multi") {
    const opts = field.options ?? [];
    const selected = new Set(rule.value.multi ?? []);
    function toggle(v: string) {
      const next = new Set(selected);
      next.has(v) ? next.delete(v) : next.add(v);
      onChange({ multi: [...next] });
    }
    const summary =
      selected.size === 0
        ? "Value"
        : selected.size === 1
        ? opts.find((o) => o.value === [...selected][0])?.label ?? "1 selected"
        : `${selected.size} selected`;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-9 flex-1 min-w-[200px] inline-flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 hover:bg-slate-50"
          >
            <span className={selected.size === 0 ? "text-slate-400" : ""}>{summary}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-1" align="start">
          <div className="max-h-60 overflow-y-auto">
            {opts.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer">
                <Checkbox checked={selected.has(opt.value)} onCheckedChange={() => toggle(opt.value)} />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  if (field.type === "date-range") {
    if (rule.operator === "between") {
      return (
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Input type="date" value={rule.value.dateFrom ?? ""} onChange={(e) => onChange({ dateFrom: e.target.value || null })} className="h-9 flex-1" />
          <span className="text-xs text-slate-400">and</span>
          <Input type="date" value={rule.value.dateTo ?? ""} onChange={(e) => onChange({ dateTo: e.target.value || null })} className="h-9 flex-1" />
        </div>
      );
    }
    if (rule.operator === "before") {
      return <Input type="date" value={rule.value.dateTo ?? ""} onChange={(e) => onChange({ dateTo: e.target.value || null })} className="h-9 flex-1 min-w-[200px]" />;
    }
    if (rule.operator === "after") {
      return <Input type="date" value={rule.value.dateFrom ?? ""} onChange={(e) => onChange({ dateFrom: e.target.value || null })} className="h-9 flex-1 min-w-[200px]" />;
    }
    return <Input disabled placeholder="Value" className="h-9 flex-1 min-w-[200px]" />;
  }

  return (
    <Input
      type="text"
      value={rule.value.text ?? ""}
      onChange={(e) => onChange({ text: e.target.value })}
      placeholder="Value"
      className="h-9 flex-1 min-w-[200px]"
    />
  );
}

// ─── Combined Quick + Advanced popover ────────────────────────────────────────

export function QuickFiltersPopover<T>({
  fields,
  values,
  rules,
  onApply,
}: {
  fields: FilterFieldDef<T>[];
  values: FilterState;
  rules: AdvancedFilterRule[];
  onApply: (next: { values: FilterState; rules: AdvancedFilterRule[] }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"quick" | "advanced">("quick");
  const [draftQuick, setDraftQuick] = useState<FilterState>(values);
  const [draftRules, setDraftRules] = useState<AdvancedFilterRule[]>(rules);

  // Reset drafts when popover opens
  useEffect(() => {
    if (open) {
      setDraftQuick(values);
      setDraftRules(rules.length > 0 ? rules : [emptyRule()]);
    }
  }, [open, values, rules]);

  const activeCount = countActiveQuickFilters(values) + rules.filter((r) => r.fieldId && r.operator).length;

  function setFieldValue(id: string, v: FilterValue) {
    setDraftQuick((prev) => ({ ...prev, [id]: v }));
  }
  function clearAll() {
    if (view === "quick") setDraftQuick({});
    else setDraftRules([emptyRule()]);
  }
  function apply() {
    onApply({
      values: draftQuick,
      rules: draftRules.filter((r) => r.fieldId && r.operator),
    });
    setOpen(false);
  }
  function updateRule(id: string, patch: Partial<AdvancedFilterRule>) {
    setDraftRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeRule(id: string) {
    setDraftRules((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length > 0 ? next : [emptyRule()];
    });
  }
  function addRule() {
    setDraftRules((prev) => [...prev, emptyRule()]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Filters"
          className={cn(
            "relative inline-flex items-center justify-center size-9 rounded-md border bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors",
            activeCount > 0 ? "border-slate-900 text-slate-900" : "border-slate-200"
          )}
        >
          <Filter size={14} />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-slate-900 text-white text-[10px] font-semibold">
              {activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="end"
        sideOffset={6}
        collisionPadding={{ top: 8, right: 16, bottom: 8, left: 280 }}
      >
        <div className="min-w-[740px] max-w-[calc(100vw_-_300px)] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h3 className="text-base font-semibold text-slate-950">
              {view === "quick" ? "Quick filters" : "Advanced filters"}
            </h3>
            <button
              onClick={clearAll}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Clear all
            </button>
          </div>

          {/* Body */}
          {view === "quick" ? (
            <div className="flex items-start gap-3 px-5 pb-4 overflow-x-auto">
              {fields.map((f) => (
                <FilterColumn
                  key={f.id}
                  field={f}
                  value={draftQuick[f.id] ?? {}}
                  onChange={(v) => setFieldValue(f.id, v)}
                />
              ))}
            </div>
          ) : (
            <div className="px-5 pb-4 space-y-2">
              {draftRules.map((rule, idx) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  fields={fields}
                  isFirst={idx === 0}
                  onChange={(patch) => updateRule(rule.id, patch)}
                  onRemove={() => removeRule(rule.id)}
                />
              ))}
              <button
                onClick={addRule}
                className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900 pt-1"
              >
                <Plus size={13} /> New filter
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <button
              onClick={() => setView(view === "quick" ? "advanced" : "quick")}
              className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900"
            >
              {view === "quick" ? (
                <>
                  Switch to advanced filters <ArrowRight size={13} />
                </>
              ) : (
                <>
                  <ArrowLeft size={13} /> Switch to quick filters
                </>
              )}
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={apply}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
