export type FilterFieldType =
  | "select-multi"
  | "search-multi"
  | "user-multi"
  | "date-range"
  | "text";

export type FilterOption = {
  value: string;
  label: string;
  initials?: string;
  color?: string; // bg-* class for avatar
  dotColor?: string; // bg-* class for status dot
};

export type FilterFieldDef<TRow = unknown> = {
  id: string;
  label: string;
  type: FilterFieldType;
  options?: FilterOption[];
  // Extracts the value(s) for matching from a row.
  // For multi-types: return an array (can be single-element). For date: return ISO string.
  getValue: (row: TRow) => string | string[] | null | undefined;
};

export type FilterValue = {
  multi?: string[]; // for select-multi / search-multi / user-multi
  dateFrom?: string | null; // ISO yyyy-mm-dd
  dateTo?: string | null;
  text?: string;
};

export type FilterState = Record<string, FilterValue>;

export type AdvancedOperator =
  | "in" // is any of  (multi)
  | "not_in" // is not any of (multi)
  | "between" // date between
  | "before" // date before
  | "after" // date after
  | "contains" // text contains
  | "equals"; // text equals

export type AdvancedFilterRule = {
  id: string;
  fieldId: string | null;
  operator: AdvancedOperator | null;
  value: FilterValue;
};

export const OPERATORS_BY_TYPE: Record<
  FilterFieldType,
  { value: AdvancedOperator; label: string }[]
> = {
  "select-multi": [
    { value: "in", label: "is any of" },
    { value: "not_in", label: "is not any of" },
  ],
  "search-multi": [
    { value: "in", label: "is any of" },
    { value: "not_in", label: "is not any of" },
  ],
  "user-multi": [
    { value: "in", label: "is any of" },
    { value: "not_in", label: "is not any of" },
  ],
  "date-range": [
    { value: "between", label: "is between" },
    { value: "before", label: "is before" },
    { value: "after", label: "is after" },
  ],
  text: [
    { value: "contains", label: "contains" },
    { value: "equals", label: "is" },
  ],
};
