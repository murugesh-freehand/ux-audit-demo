import {
  AdvancedFilterRule,
  FilterFieldDef,
  FilterState,
  FilterValue,
} from "./types";

function asArray(v: string | string[] | null | undefined): string[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function inRangeIso(iso: string, from?: string | null, to?: string | null): boolean {
  if (!iso) return false;
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

function matchesQuickFilter<T>(
  row: T,
  field: FilterFieldDef<T>,
  value: FilterValue | undefined
): boolean {
  if (!value) return true;
  switch (field.type) {
    case "select-multi":
    case "search-multi":
    case "user-multi": {
      if (!value.multi || value.multi.length === 0) return true;
      const rowVals = asArray(field.getValue(row));
      return rowVals.some((v) => value.multi!.includes(v));
    }
    case "date-range": {
      if (!value.dateFrom && !value.dateTo) return true;
      const iso = field.getValue(row);
      if (typeof iso !== "string") return false;
      return inRangeIso(iso, value.dateFrom ?? null, value.dateTo ?? null);
    }
    case "text": {
      if (!value.text) return true;
      const v = field.getValue(row);
      const haystack = (Array.isArray(v) ? v.join(" ") : v ?? "").toLowerCase();
      return haystack.includes(value.text.toLowerCase());
    }
  }
}

function matchesAdvancedRule<T>(
  row: T,
  field: FilterFieldDef<T>,
  rule: AdvancedFilterRule
): boolean {
  if (!rule.operator) return true;
  const rowVal = field.getValue(row);
  switch (rule.operator) {
    case "in": {
      const sel = rule.value.multi ?? [];
      if (sel.length === 0) return true;
      return asArray(rowVal).some((v) => sel.includes(v));
    }
    case "not_in": {
      const sel = rule.value.multi ?? [];
      if (sel.length === 0) return true;
      return !asArray(rowVal).some((v) => sel.includes(v));
    }
    case "between":
      if (typeof rowVal !== "string") return false;
      return inRangeIso(rowVal, rule.value.dateFrom ?? null, rule.value.dateTo ?? null);
    case "before":
      if (typeof rowVal !== "string") return false;
      return !rule.value.dateTo || rowVal <= rule.value.dateTo;
    case "after":
      if (typeof rowVal !== "string") return false;
      return !rule.value.dateFrom || rowVal >= rule.value.dateFrom;
    case "contains": {
      const txt = rule.value.text?.toLowerCase() ?? "";
      if (!txt) return true;
      const haystack = (Array.isArray(rowVal) ? rowVal.join(" ") : rowVal ?? "").toLowerCase();
      return haystack.includes(txt);
    }
    case "equals": {
      const txt = rule.value.text?.toLowerCase() ?? "";
      if (!txt) return true;
      const haystack = (Array.isArray(rowVal) ? rowVal.join(" ") : rowVal ?? "").toLowerCase();
      return haystack === txt;
    }
  }
}

export function applyQuickFilters<T>(
  rows: T[],
  fields: FilterFieldDef<T>[],
  state: FilterState
): T[] {
  return rows.filter((row) =>
    fields.every((f) => matchesQuickFilter(row, f, state[f.id]))
  );
}

export function applyAdvancedRules<T>(
  rows: T[],
  fields: FilterFieldDef<T>[],
  rules: AdvancedFilterRule[]
): T[] {
  const fieldMap = new Map(fields.map((f) => [f.id, f]));
  return rows.filter((row) =>
    rules.every((rule) => {
      if (!rule.fieldId) return true;
      const f = fieldMap.get(rule.fieldId);
      if (!f) return true;
      return matchesAdvancedRule(row, f, rule);
    })
  );
}

export function applySearch<T>(
  rows: T[],
  query: string,
  selectedColumns: string[],
  searchableColumns: { id: string; getText: (row: T) => string }[]
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  const cols = searchableColumns.filter((c) => selectedColumns.includes(c.id));
  if (cols.length === 0) return rows;
  return rows.filter((row) =>
    cols.some((c) => c.getText(row).toLowerCase().includes(q))
  );
}

export function countActiveQuickFilters(state: FilterState): number {
  let n = 0;
  for (const v of Object.values(state)) {
    if (v.multi && v.multi.length > 0) n++;
    else if (v.dateFrom || v.dateTo) n++;
    else if (v.text) n++;
  }
  return n;
}
