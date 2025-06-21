import { ComKey, Item, PriKey } from "@fjell/core";

import { AItemAdapterContextType } from "@/AItemAdapterContext";
import { CacheMap } from "@fjell/cache";
import { AllItemTypeArrays, ItemQuery, LocKeyArray, TypesProperties } from "@fjell/core";

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
  all: (query?: ItemQuery, locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<V[] | null>;
  one: (query?: ItemQuery, locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<V | null>;
  create: (item: TypesProperties<V, S, L1, L2, L3, L4, L5>, locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<V>;
  get: (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>) => Promise<V | null>;
  remove: (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>) => Promise<void>;
  retrieve: (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>) => Promise<V | null>;
  update: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>, item: TypesProperties<V, S, L1, L2, L3, L4, L5>) => Promise<V>;
  action: (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>, action: string, body?: any) => Promise<V>;
  allAction: (action: string, body?: any, locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<V[] | null>;
  actions: Record<string,
    (
      key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
      body?: any,
      locations?: LocKeyArray<L1, L2, L3, L4, L5>
    ) => Promise<V | null>>;
  facet: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    facet: string,
  ) => Promise<any | null>;
  facets: Record<string,
    (
      key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    ) => Promise<any | null>>;
  find: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[] | null>;
  findOne: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<V | null>;
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
