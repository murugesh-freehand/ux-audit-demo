import { X, Zap } from "lucide-react";
import {
  AdvancedFilterRule,
  FilterFieldDef,
  FilterState,
  OPERATORS_BY_TYPE,
} from "./types";

type Chip =
  | { kind: "quick-multi"; fieldId: string; value: string; label: string }
  | { kind: "quick-date"; fieldId: string; label: string }
  | { kind: "quick-text"; fieldId: string; label: string }
  | { kind: "advanced"; ruleId: string; label: string };

function describeRule<T>(field: FilterFieldDef<T>, rule: AdvancedFilterRule): string {
  const opLabel =
    OPERATORS_BY_TYPE[field.type].find((o) => o.value === rule.operator)?.label ?? "";
  let valStr = "";
  if (
    field.type === "select-multi" ||
    field.type === "search-multi" ||
    field.type === "user-multi"
  ) {
    const labels = (rule.value.multi ?? []).map(
      (v) => field.options?.find((o) => o.value === v)?.label ?? v
    );
    valStr = labels.join(", ");
  } else if (field.type === "date-range") {
    if (rule.operator === "between")
      valStr = `${rule.value.dateFrom ?? ""} – ${rule.value.dateTo ?? ""}`;
    else if (rule.operator === "before") valStr = rule.value.dateTo ?? "";
    else if (rule.operator === "after") valStr = rule.value.dateFrom ?? "";
  } else if (field.type === "text") {
    valStr = rule.value.text ?? "";
  }
  return `${field.label} ${opLabel}: ${valStr}`;
}

export function FilterChipsBar<T>({
  fields,
  values,
  rules,
  onChangeValues,
  onChangeRules,
}: {
  fields: FilterFieldDef<T>[];
  values: FilterState;
  rules: AdvancedFilterRule[];
  onChangeValues: (next: FilterState) => void;
  onChangeRules: (next: AdvancedFilterRule[]) => void;
}) {
  const fieldMap = new Map(fields.map((f) => [f.id, f]));

  const chips: Chip[] = [];
  for (const [fieldId, value] of Object.entries(values)) {
    const f = fieldMap.get(fieldId);
    if (!f) continue;
    if (value.multi && value.multi.length > 0) {
      for (const v of value.multi) {
        const label = f.options?.find((o) => o.value === v)?.label ?? v;
        chips.push({ kind: "quick-multi", fieldId, value: v, label });
      }
    } else if (value.dateFrom || value.dateTo) {
      const range = `${value.dateFrom ?? "…"} – ${value.dateTo ?? "…"}`;
      chips.push({ kind: "quick-date", fieldId, label: `${f.label}: ${range}` });
    } else if (value.text) {
      chips.push({ kind: "quick-text", fieldId, label: `${f.label}: ${value.text}` });
    }
  }
  const advChips: Chip[] = rules
    .filter((r) => r.fieldId && r.operator)
    .map((r) => {
      const f = fieldMap.get(r.fieldId!)!;
      return { kind: "advanced" as const, ruleId: r.id, label: describeRule(f, r) };
    });

  if (chips.length === 0 && advChips.length === 0) return null;

  function removeQuickMulti(fieldId: string, value: string) {
    const cur = values[fieldId];
    if (!cur?.multi) return;
    const nextMulti = cur.multi.filter((v) => v !== value);
    onChangeValues({
      ...values,
      [fieldId]:
        nextMulti.length > 0 ? { ...cur, multi: nextMulti } : { ...cur, multi: undefined },
    });
  }
  function removeQuickDate(fieldId: string) {
    const { [fieldId]: _, ...rest } = values;
    void _;
    onChangeValues(rest);
  }
  function removeQuickText(fieldId: string) {
    const cur = values[fieldId];
    if (!cur) return;
    onChangeValues({ ...values, [fieldId]: { ...cur, text: undefined } });
  }
  function removeRule(id: string) {
    onChangeRules(rules.filter((r) => r.id !== id));
  }
  function clearAll() {
    onChangeValues({});
    onChangeRules([]);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap px-5 py-2 border-t border-slate-100">
      <span className="text-xs font-medium text-slate-500">Filters:</span>

      {chips.map((chip, i) =>
        chip.kind === "quick-multi" ? (
          <button
            key={`${chip.fieldId}-${chip.value}-${i}`}
            onClick={() => removeQuickMulti(chip.fieldId, chip.value)}
            className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-slate-100 text-slate-700 text-xs hover:bg-slate-200"
          >
            {chip.label}
            <X size={11} />
          </button>
        ) : chip.kind === "quick-date" ? (
          <button
            key={`${chip.fieldId}-d-${i}`}
            onClick={() => removeQuickDate(chip.fieldId)}
            className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-slate-100 text-slate-700 text-xs hover:bg-slate-200"
          >
            {chip.label}
            <X size={11} />
          </button>
        ) : (
          <button
            key={`${chip.fieldId}-t-${i}`}
            onClick={() => removeQuickText(chip.fieldId)}
            className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-slate-100 text-slate-700 text-xs hover:bg-slate-200"
          >
            {chip.label}
            <X size={11} />
          </button>
        )
      )}

      {advChips.map((chip) =>
        chip.kind === "advanced" ? (
          <button
            key={chip.ruleId}
            onClick={() => removeRule(chip.ruleId)}
            className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-amber-50 text-amber-800 text-xs border border-amber-200 hover:bg-amber-100"
          >
            <Zap size={11} className="text-amber-500 fill-amber-500" />
            {chip.label}
            <X size={11} />
          </button>
        ) : null
      )}

      <button
        onClick={clearAll}
        className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700"
      >
        Clear all <X size={11} />
      </button>
    </div>
  );
}
