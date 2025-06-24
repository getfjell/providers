import { AllItemTypeArrays, ComKey, Item, LocKeyArray, PriKey, TypesProperties } from "@fjell/core";
import { FacetMethod } from "./AItemAdapterContext";
import { ActionMethod } from "./AItemAdapterContext";

export interface AItemContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  name: string;
  key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>;
  locations: LocKeyArray<S, L1, L2, L3, L4> | null;
  pkTypes: AllItemTypeArrays<S, L1, L2, L3, L4, L5>;

  item: V | null;
  isLoading: boolean;
  isUpdating: boolean;
  isRemoving: boolean;

  actions?: Record<string, ActionMethod<V, S, L1, L2, L3, L4, L5>>;
  facets?: Record<string, FacetMethod<S, L1, L2, L3, L4, L5>>;

  remove: () => Promise<void>;
  update: (item: TypesProperties<V, S, L1, L2, L3, L4, L5>) => Promise<V>;
  set: (item: V) => Promise<V>;

  action: (
    action: string,
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V>;
  facet: (
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<any>;
}

export type AItemContext<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = React.Context<AItemContextType<V, S, L1, L2, L3, L4, L5> | undefined>;
