import { AllItemTypeArrays, Item, TypesProperties } from "@fjell/core";

export interface AItemsContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  name: string;
  items: V[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  pkTypes: AllItemTypeArrays<S, L1, L2, L3, L4, L5>;
  create: (
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
  ) => Promise<V>;
  all: () => Promise<V[] | null>;
  one: () => Promise<V | null>;
  allAction: (
    action: string,
    body: any,
  ) => Promise<V[] | V | null>;
  finders?: Record<string, (...params: any[]) =>
    Promise<V[] | V | null>>;
  actions?: Record<string, (...params: any[]) => Promise<any>>;
}

export type AItemsContext<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = React.Context<AItemsContextType<V, S, L1, L2, L3, L4, L5> | undefined>;
