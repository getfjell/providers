import { AllItemTypeArrays, ComKey, Item, LocKeyArray, PriKey, TypesProperties } from "@fjell/core";
import { AllActionMethod, AllFacetMethod } from "./AItemAdapterContext";

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

  allActions?: Record<string, AllActionMethod<V, S, L1, L2, L3, L4, L5>>;
  allFacets?: Record<string, AllFacetMethod<L1, L2, L3, L4, L5>>;
  finders?: Record<string, (...params: any[]) => Promise<V[] | V | null>>;

  create: (
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
  ) => Promise<V>;
  all: () => Promise<V[] | null>;
  one: () => Promise<V | null>;
  allAction: ( action: string,
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[] | null>;
  allFacet: (
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<any>;
  set: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: V,
  ) => Promise<V>;
  find: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[] | null>;
  findOne: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V | null>;
  update: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
  ) => Promise<V>;
  remove: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<void>;
  action: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    action: string,
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V>;
  facet: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<any>;
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
