import {
  MultiSelectFilter,
  type MultiSelectFilterProps,
} from "@repo/ui/lib/data-table/filters/components/multi-select-filter";
import { TextFilter } from "@repo/ui/lib/data-table/filters/components/text-filter";
import { DateFilter } from "@repo/ui/lib/data-table/filters/components/date-filter";
import { SelectFilterProps, SelectFilter } from "@repo/ui/lib/data-table/filters/components/select-filter";
import {
  BaseFilterProps,
  FilterAdapter,
  FilterTypeDef,
} from "@repo/ui/types/data-table";
import { createAdapter, createFilterTypeDef } from "@repo/ui/lib/data-table/filters/create-adapter";
import BooleanSelectInput from "@repo/ui/lib/data-table/filters/components/boolean-select";

// // Define specific value types for each filter type
// type TextFilterValue = string;
// type NumberFilterValue = number | string; // string included for empty input handling
// type DateFilterValue = Date | null;
// type SelectFilterValue = string;
// type MultiSelectFilterValue = string[];
// type GeometryFilterValue = string;

// type SelectFilterMeta = NonNullable<SelectFilterProps["meta"]>;
// type MultiSelectFilterMeta = NonNullable<MultiSelectFilterProps["meta"]>;

// Create the adapter with specific value types and metadata for each filter type
export const directusFilterAdapter = createAdapter({
  text: createFilterTypeDef(
    [
      { value: "_eq", label: "Equals" },
      { value: "_neq", label: "Doesn't equal" },
      { value: "_contains", label: "Contains" },
      { value: "_ncontains", label: "Doesn't contain" },
      { value: "_icontains", label: "Contains (case-insensitive)" },
      { value: "_starts_with", label: "Starts with" },
      { value: "_nstarts_with", label: "Doesn't start with" },
      { value: "_istarts_with", label: "Starts with (case-insensitive)" },
      { value: "_null", label: "Is null" },
      { value: "_nnull", label: "Isn't null" },
      { value: "_empty", label: "Is empty" },
      { value: "_nempty", label: "Isn't empty" },
    ] as const,
    {
      defaultOperator: "_contains",
      defaultValue: "",
      showInputForEmptyOperators: false, // Set to true if you want to show input for isEmpty/isNotEmpty
      props: (_: Parameters<typeof TextFilter>[0]) => void 0,
    },
    ({ props, selectedOperator }) =>
      ["_null", "_nnull", "_empty", "_nempty"].includes(selectedOperator)? (
        <div
          role="status"
          aria-live="polite"
          className="h-8 w-full rounded border border-dashed"
        />
      ) : (
        <TextFilter {...props} />
      )
  ),
  number: createFilterTypeDef(
    [
      { value: "_eq", label: "Equals" },
      { value: "_neq", label: "Doesn't equal" },
      { value: "_gt", label: "Greater than" },
      { value: "_gte", label: "Greater than or equal to" },
      { value: "_lt", label: "Less than" },
      { value: "_lte", label: "Less than or equal to" },
      { value: "_null", label: "Is null" },
      { value: "_nnull", label: "Isn't null" },
      { value: "_empty", label: "Is empty" },
      { value: "_nempty", label: "Isn't empty" },
    ],
    {
      defaultOperator: "_eq",
      defaultValue: "",
      props: (_: Parameters<typeof TextFilter>[0]) => void 0,
    },
    ({ props, selectedOperator }) =>
      ["_null", "_nnull", "_empty", "_nempty"].includes(selectedOperator)? (
        <div
          role="status"
          aria-live="polite"
          className="h-8 w-full rounded border border-dashed"
        />
      ) : (
        <TextFilter {...props} />
      )
  ),
  boolean: createFilterTypeDef(
    [{ value: "_eq", label: "Equals" }] as const,
    {
      defaultOperator: "_eq",
      defaultValue: false,
      props: (_: Parameters<typeof BooleanSelectInput>[0]) => void 0,
    },
    ({ props }) => <BooleanSelectInput {...props} />
  ),
  date: createFilterTypeDef(
    [
      { value: "_eq", label: "Equals" },
      { value: "_neq", label: "Doesn't equal" },
      { value: "_gt", label: "After" },
      { value: "_gte", label: "After or on" },
      { value: "_lt", label: "Before" },
      { value: "_lte", label: "Before or on" },
      { value: "_null", label: "Is null" },
      { value: "_nnull", label: "Isn't null" },
      { value: "_empty", label: "Is empty" },
      { value: "_nempty", label: "Isn't empty" },
    ] as const,
    {
      defaultOperator: "_eq",
      defaultValue: null,
      props: (_: Parameters<typeof DateFilter>[0]) => void 0,
    },
    ({ props, selectedOperator }) =>
      ["_null", "_nnull", "_empty", "_nempty"].includes(selectedOperator) ? (
        <div
          role="status"
          aria-live="polite"
          className="h-8 w-full rounded border border-dashed"
        />
      ) : (
        <DateFilter {...props} />
      )
  ),
  select: createFilterTypeDef(
    [
      { value: "_eq", label: "Equals" },
      { value: "_neq", label: "Doesn't equal" },
      { value: "_null", label: "Is null" },
      { value: "_nnull", label: "Isn't null" },
      { value: "_empty", label: "Is empty" },
      { value: "_nempty", label: "Isn't empty" },
    ] as const,
    {
      defaultOperator: "_eq",
      defaultValue: "",
      props: (_: Parameters<typeof SelectFilter>[0]) => void 0,
    },
    ({
      props,
      selectedOperator,
    }: {
      props: Parameters<typeof SelectFilter>[0];
      selectedOperator: string;
    }) =>
      ["_null", "_nnull", "_empty", "_nempty"].includes(selectedOperator) ? (
        <div
          role="status"
          aria-live="polite"
          className="h-8 w-full rounded border border-dashed"
        />
      ) : (
        <SelectFilter {...props} />
      )
  ),
  "multi-select": createFilterTypeDef(
    [
      { value: "_in", label: "Is one of" },
      { value: "_nin", label: "Is not one of" },
      { value: "_null", label: "Is null" },
      { value: "_nnull", label: "Isn't null" },
      { value: "_empty", label: "Is empty" },
      { value: "_nempty", label: "Isn't empty" },
    ] as const,
    {
      defaultOperator: "_in",
      defaultValue: [],
      props: (_: Parameters<typeof MultiSelectFilter>[0]) => void 0,
    },
    ({ props, selectedOperator }) =>
      ["_null", "_nnull", "_empty", "_nempty"].includes(selectedOperator) ? (
        <div
          role="status"
          aria-live="polite"
          className="h-8 w-full rounded border border-dashed"
        />
      ) : (
        <MultiSelectFilter {...props} />
      )
  ),
  geometry: createFilterTypeDef(
    [
      { value: "_intersects", label: "Intersects" },
      { value: "_nintersects", label: "Doesn't intersect" },
      { value: "_intersects_bbox", label: "Intersects bounding box" },
      { value: "_nintersects_bbox", label: "Doesn't intersect bounding box" },
      { value: "_null", label: "Is null" },
      { value: "_nnull", label: "Isn't null" },
      { value: "_empty", label: "Is empty" },
      { value: "_nempty", label: "Isn't empty" },
    ] as const,
    {
      defaultOperator: "_intersects",
      defaultValue: "",
      props: (_: Parameters<typeof TextFilter>[0]) => void 0,
    },
    ({ props, selectedOperator }) =>
      ["_null", "_nnull", "_empty", "_nempty"].includes(selectedOperator) ? (
        <div
          role="status"
          aria-live="polite"
          className="h-8 w-full rounded border border-dashed"
        />
      ) : (
        <TextFilter {...props} />
      )
  ),
});

export type DirectusFilterAdapterType = typeof directusFilterAdapter;

// Helper to extend the directus adapter with custom filter types while maintaining type safety
export function extendDirectusFilterAdapter<T extends FilterAdapter>(
  extension: T
): DirectusFilterAdapterType & T {
  return {
    ...directusFilterAdapter,
    ...extension,
  } as DirectusFilterAdapterType & T;
}
