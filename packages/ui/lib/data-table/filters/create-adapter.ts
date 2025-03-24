import { BaseFilterProps, FilterAdapter, FilterOperatorDef, FilterTypeDef } from "@repo/ui/types/data-table";
import { ReactNode } from "react";

export function createFilterTypeDef<ComponentProps extends BaseFilterProps, Operator extends FilterOperatorDef>(
    operators: readonly Operator[],
    options: {
        defaultOperator: Operator["value"];
        defaultValue?: NoInfer<ComponentProps extends BaseFilterProps<infer T, any> ? T : never>;
        showInputForEmptyOperators?: boolean;
        props: (componentProps: ComponentProps) => ComponentProps | void;
    },
    componentFn: (opts: { props: ComponentProps; selectedOperator: Operator["value"] }) => ReactNode
): FilterTypeDef<ComponentProps extends BaseFilterProps<infer T, any> ? T : never, ComponentProps extends BaseFilterProps<any, infer M> ? M : never, ComponentProps, Operator> {
    return {
        operators: [...operators],
        defaultOperator: options.defaultOperator,
        defaultValue: options.defaultValue,
        showInputForEmptyOperators: options.showInputForEmptyOperators,
        component: componentFn
    };
}

export function createAdapter<
    Def extends FilterTypeDef<any, any, any, any>,
    Type extends {
        [key: string]: Def;
    },
>(adapterValue: Type): FilterAdapter<Def, Type> {
    return {
        value: adapterValue,
        getFilterTypeDef(type: keyof Type) {
            const filterTypeDef = adapterValue[type];
            if (!filterTypeDef) {
                throw new Error(`Filter type "${String(type)}" not found in adapter`);
            }
            return filterTypeDef;
        }
    };
}
