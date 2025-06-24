import { ComKey, Item, PriKey } from "@fjell/core";

import { ActionMethod, AItemAdapterContextType, AllActionMethod, AllFacetMethod, FacetMethod } from "@/AItemAdapterContext";
import { CacheMap } from "@fjell/cache";
import { AllItemTypeArrays, ItemQuery, LocKeyArray, TypesProperties } from "@fjell/core";
import { CItemsContextType } from "./CItemsContext";
import { CItemContextType } from "./CItemContext";

export interface CItemAdapterContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends AItemAdapterContextType<V, S, L1, L2, L3, L4, L5> {
  name: string;
  cacheMap: CacheMap<V, S, L1, L2, L3, L4, L5>;
  pkTypes: AllItemTypeArrays<S, L1, L2, L3, L4, L5>;

  addActions: (contextValues: CItemContextType<V, S, L1, L2, L3, L4, L5>) => Record<string, ActionMethod<V, S, L1, L2, L3, L4, L5>>;
  addFacets: (contextValues: CItemContextType<V, S, L1, L2, L3, L4, L5>) => Record<string, FacetMethod<S, L1, L2, L3, L4, L5>>;
  addAllActions: (contextValues: CItemsContextType<V, S, L1, L2, L3, L4, L5>) => Record<string, AllActionMethod<V, S, L1, L2, L3, L4, L5>>;
  addAllFacets: (contextValues: CItemsContextType<V, S, L1, L2, L3, L4, L5>) => Record<string, AllFacetMethod<L1, L2, L3, L4, L5>>;

  all: (query?: ItemQuery, locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<V[]>;
  one: (query?: ItemQuery, locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<V>;
  create: (item: TypesProperties<V, S, L1, L2, L3, L4, L5>, locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<V>;
  get: (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>) => Promise<V>;
  remove: (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>) => Promise<void>;
  retrieve: (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>) => Promise<V>;
  update: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>, item: TypesProperties<V, S, L1, L2, L3, L4, L5>) => Promise<V>;

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
  allAction: (action: string, body?: any, locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<V[]>;
  allFacet: (
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<any>;

  find: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[]>;
  findOne: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V>;

  set: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: V,
  ) => Promise<V>;
}

export type CItemAdapterContext<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = React.Context<CItemAdapterContextType<V, S, L1, L2, L3, L4, L5> | undefined>;
