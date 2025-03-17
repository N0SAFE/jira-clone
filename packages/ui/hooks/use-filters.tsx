import { TextFilter } from "@/components/data-table/filter-components/text-filter";
import { Filter, FilterAdapter, FilterConfig, FiltersActions, FiltersInstance, FilterTypeDef, FilterValue, InferFilterTypeDef } from "@/config/data-table";
import { createFilterTypeDef } from "@/lib/adapter/create-adapter";
import { directusFilterAdapter } from "@/lib/adapter/directus-filter-adapter";

export interface UseFiltersOptions<T extends FilterAdapter> {
    onChange?: (filters: Filter<T>[], joinOperator: "and" | "or") => void;
    state: {
        filters: Filter<T>[];
        joinOperator?: "and" | "or";
    };
}

export function useFilters<T extends FilterAdapter>(
    adapter: T,
    configFn: (
        createFilter: <K extends keyof T["value"] & string, Meta extends InferFilterTypeDef<T["value"][K]>['meta']>(config: {
            type: K;
            id?: string;
            label?: string;
            defaultValue?: InferFilterTypeDef<T["value"][K]>['value'];
            meta?: Meta;
        }) => FilterConfig<T>
    ) => FilterConfig<T>[],
    options: UseFiltersOptions<T>
): FiltersInstance<T> {
    const createFilter = <K extends keyof T["value"] & string>(config: {
        type: K;
        id?: string;
        label?: string;
        defaultValue?: InferFilterTypeDef<T["value"][K]>['value'];
        meta?: InferFilterTypeDef<T["value"][K]>['meta'];
    }): FilterConfig<T> => {
        const filterDef = adapter.value[config.type];
        if (!filterDef) {
            throw new Error(`Filter type "${String(config.type)}" not found in adapter`);
        }

        return {
            id: config.id || String(config.type),
            type: config.type as unknown as keyof T["value"] extends string ? string & keyof T["value"] : never,
            label: config.label || String(config.type).charAt(0).toUpperCase() + String(config.type).slice(1),
            meta: config.meta,
            getDefaultValue:
                config.defaultValue !== undefined ? () => config.defaultValue as FilterValue : filterDef.defaultValue !== undefined ? () => filterDef.defaultValue as FilterValue : undefined
        };
    };

    const config = configFn(createFilter);

    const generateFilter = ({ id, type, getDefaultValue, label }: Parameters<FiltersActions<T>["generateFilter"]>[0]): ReturnType<FiltersActions<T>["generateFilter"]> => {
        return {
            configId: id,
            id: Math.random().toString(36).substring(2, 15),
            type: type,
            label: label || config.find((cfg) => cfg.type === type)?.label! || "Error: label not defined",
            state: {
                value: getDefaultValue?.() ?? adapter.getFilterTypeDef(type as string).defaultValue,
                operator: adapter.getFilterTypeDef(type as string).defaultOperator
            }
        };
    };

    return {
        actions: {
            generateFilter
        },
        config: {
            filters: {
                value: config,
                defaultJoinOperator: options?.state?.joinOperator || "and"
            },
            adapter: adapter
        },
        _version: 1
    };
}
