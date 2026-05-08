import { useState, useEffect } from "react";
import { X, Plus, ArrowLeft, Sparkles, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Switch } from "../../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Checkbox } from "../../ui/checkbox";
import {
  AdvancedFilterRule,
  AdvancedOperator,
  FilterFieldDef,
  OPERATORS_BY_TYPE,
} from "./types";

let nextId = 0;
function newRuleId() {
  nextId += 1;
  return `rule-${nextId}`;
}

export function AdvancedFiltersDialog<T>({
  open,
  onOpenChange,
  fields,
  rules,
  onApply,
  onSwitchToQuick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: FilterFieldDef<T>[];
  rules: AdvancedFilterRule[];
  onApply: (next: AdvancedFilterRule[]) => void;
  onSwitchToQuick?: () => void;
}) {
  const [draft, setDraft] = useState<AdvancedFilterRule[]>(rules);
  const [aiMode, setAiMode] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(rules.length > 0 ? rules : [emptyRule()]);
    }
  }, [open, rules]);

  function emptyRule(): AdvancedFilterRule {
    return { id: newRuleId(), fieldId: null, operator: null, value: {} };
  }

  function updateRule(id: string, patch: Partial<AdvancedFilterRule>) {
    setDraft((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRule(id: string) {
    setDraft((prev) => prev.filter((r) => r.id !== id));
  }

  function addRule() {
    setDraft((prev) => [...prev, emptyRule()]);
  }

  function clearAll() {
    setDraft([emptyRule()]);
  }

  function apply() {
    onApply(draft.filter((r) => r.fieldId && r.operator));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[760px] p-0 gap-0">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-semibold text-slate-950">
            Advanced filters
          </DialogTitle>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={aiMode} onCheckedChange={setAiMode} />
            <span className="text-sm text-slate-700 inline-flex items-center gap-1">
              <Sparkles size={13} className="text-blue-500" /> Filter with AI
            </span>
          </label>
        </div>

        <div className="px-5 pb-3 space-y-2">
          {draft.map((rule, idx) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              fields={fields}
              isFirst={idx === 0}
              onChange={(patch) => updateRule(rule.id, patch)}
              onRemove={() => removeRule(rule.id)}
            />
          ))}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={addRule}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus size={13} /> New filter
            </button>
            <button
              disabled
              title="Coming soon"
              className="inline-flex items-center gap-1 text-sm text-slate-300 cursor-not-allowed"
            >
              <Plus size={13} /> New group
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          {onSwitchToQuick ? (
            <button
              onClick={() => {
                onOpenChange(false);
                onSwitchToQuick();
              }}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={13} /> Quick filters
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear all
            </Button>
            <Button size="sm" onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
      <span className="text-sm text-slate-500 w-12 shrink-0">
        {isFirst ? "Where" : "And"}
      </span>

      <Select
        value={rule.fieldId ?? undefined}
        onValueChange={(fieldId) => {
          const f = fields.find((x) => x.id === fieldId)!;
          const ops = OPERATORS_BY_TYPE[f.type];
          onChange({ fieldId, operator: ops[0]?.value ?? null, value: {} });
        }}
      >
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={rule.operator ?? undefined}
        onValueChange={(operator) => onChange({ operator: operator as AdvancedOperator })}
        disabled={!field}
      >
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
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
  if (!field) {
    return (
      <Input
        disabled
        placeholder="Value…"
        className="h-9 flex-1"
      />
    );
  }

  if (
    field.type === "select-multi" ||
    field.type === "search-multi" ||
    field.type === "user-multi"
  ) {
    const opts = field.options ?? [];
    const selected = new Set(rule.value.multi ?? []);
    function toggle(v: string) {
      const next = new Set(selected);
      next.has(v) ? next.delete(v) : next.add(v);
      onChange({ multi: [...next] });
    }
    const summary =
      selected.size === 0
        ? "Value…"
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
              <label
                key={opt.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(opt.value)}
                  onCheckedChange={() => toggle(opt.value)}
                />
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
        <div className="flex items-center gap-2 flex-1">
          <Input
            type="date"
            value={rule.value.dateFrom ?? ""}
            onChange={(e) => onChange({ dateFrom: e.target.value || null })}
            className="h-9 flex-1"
          />
          <span className="text-xs text-slate-400">and</span>
          <Input
            type="date"
            value={rule.value.dateTo ?? ""}
            onChange={(e) => onChange({ dateTo: e.target.value || null })}
            className="h-9 flex-1"
          />
        </div>
      );
    }
    if (rule.operator === "before") {
      return (
        <Input
          type="date"
          value={rule.value.dateTo ?? ""}
          onChange={(e) => onChange({ dateTo: e.target.value || null })}
          className="h-9 flex-1"
        />
      );
    }
    if (rule.operator === "after") {
      return (
        <Input
          type="date"
          value={rule.value.dateFrom ?? ""}
          onChange={(e) => onChange({ dateFrom: e.target.value || null })}
          className="h-9 flex-1"
        />
      );
    }
    return <Input disabled placeholder="Value…" className="h-9 flex-1" />;
  }

  // text
  return (
    <Input
      type="text"
      value={rule.value.text ?? ""}
      onChange={(e) => onChange({ text: e.target.value })}
      placeholder="Value…"
      className="h-9 flex-1"
    />
  );
}
