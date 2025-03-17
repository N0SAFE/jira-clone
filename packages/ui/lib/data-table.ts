import { ReactNode } from "react";

// Base types
export type FilterOperatorDef = {
    value: string;
    label: string;
};

export type FilterValue = string | string[] | number | boolean | Date;

export interface BaseFilterProps<T = any, Meta = any> {
    label: string;
    value: T;
    onChange: (value: T) => void;
    operator: string;
    meta?: Meta;
}

// Filter type definition with generic value type
export interface FilterTypeDef<T = any, Meta = any, ComponentProps extends BaseFilterProps<T, Meta> = BaseFilterProps<T, Meta>, FilterOperator extends FilterOperatorDef = FilterOperatorDef> {
    operators: FilterOperator[];
    defaultOperator: string;
    defaultValue?: T;
    showInputForEmptyOperators?: boolean;
    component: (opts: { props: ComponentProps; selectedOperator: FilterOperator["value"] }) => ReactNode;
}

export interface InferFilterTypeDef<T extends FilterTypeDef<any, any, any, any>> {
  value: T extends FilterTypeDef<infer V, any, any, any> ? V : never;
  meta: T extends FilterTypeDef<any, infer M, any, any> ? M : never;
  componentProps: T extends FilterTypeDef<any, any, infer C, any> ? C : never;
  operator: T extends FilterTypeDef<any, any, any, infer O> ? O : never;
}

// Filter adapter type with generic mapping
export type FilterAdapter<
    Def extends FilterTypeDef<any, any, any, any> = FilterTypeDef<any, any, any, any>,
    Type extends {
        [key: string]: Def;
    } = {
        [key: string]: Def;
    }
> = {
    value: Type;
    getFilterTypeDef: (type: keyof Type) => Def;
};

// Make config type-safe based on adapter keys
export interface FilterConfig<T extends FilterAdapter> {
    id: string;
    type: keyof T["value"] extends string ? keyof T["value"] : never;
    label: string;
    meta?: () => InferFilterTypeDef<T["value"][keyof T["value"]]>['meta'] | InferFilterTypeDef<T["value"][keyof T["value"]]>['meta']
    getDefaultValue?: () => FilterValue;
}

export type FiltersConfig<T extends FilterAdapter = FilterAdapter> = {
    filters: {
        value: FilterConfig<T>[];
        defaultJoinOperator: "and" | "or";
        // getDefaultActiveFiltersId: () => Filter<T>["id"][];
    };
    adapter: T;
};

export type FiltersActions<T extends FilterAdapter = FilterAdapter> = {
    generateFilter: (filter: Partial<Omit<FilterConfig<T>, "type" | "id">> & Pick<FilterConfig<T>, "type" | "id">) => Filter<T>;
};

// Filter instance type that includes runtime state
export interface Filter<T extends FilterAdapter> {
    label: string;
    configId: string;
    id: string;
    type: keyof T["value"] extends string ? keyof T["value"] : never;
    state: {
        value: FilterValue;
        operator: string;
    };
}

// Make FiltersInstance generic based on adapter type
export interface FiltersInstance<T extends FilterAdapter = FilterAdapter> {
    config: FiltersConfig<T>;
    actions: FiltersActions<T>;
    _version: number;
    // callbacks: {
    //   onFilterChange: (cb: (filters: Filter<T>[], joinOperator: "and" | "or") => void) => void;
    //   onJoinOperatorChange: (cb: (operator: "and" | "or") => void) => void;
    // };
}
