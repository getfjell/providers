import { ComKey, PriKey, TypesProperties } from "@fjell/core";

import { Item } from "@fjell/core";

import { LocKeyArray } from "@fjell/core";

import { CacheMap } from "@fjell/cache";
import { ItemQuery } from "@fjell/core";

export interface AItemAdapterContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never,
> {
  name: string;
  cacheMap: CacheMap<V, S, L1, L2, L3, L4, L5>;
  pkType: string;
  all: (
    query?: ItemQuery,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[] | null>;
  one: (
    query?: ItemQuery,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V | null>;
  create: (
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V>;
  get: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<V | null>;
  remove: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<void>;
  retrieve: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<V | null>;
  update: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
  ) => Promise<V>;
  action: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    action: string,
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V>;
  allAction: (
    action: string,
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[] | null>;
  actions?: Record<string,
    (
      key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
      body?: any,
      locations?: LocKeyArray<L1, L2, L3, L4, L5>
    ) => Promise<V | null>>;
  find?: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[] | null>;
}

export type AItemAdapterContext<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never,
> = React.Context<AItemAdapterContextType<V, S, L1, L2, L3, L4, L5> | undefined>;
