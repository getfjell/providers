import { AItemAdapterContextType } from "@/AItemAdapterContext";
import { CacheMap } from "@fjell/cache";
import { Item, ItemQuery, PriKey, TypesProperties } from "@fjell/core";

export interface PItemAdapterContextType<
  V extends Item<S>,
  S extends string
> extends AItemAdapterContextType<V, S> {
  name: string;
  cacheMap: CacheMap<V, S>;

  pkType: string;
  all: (query?: ItemQuery) => Promise<V[] | null>;
  one: (query?: ItemQuery) => Promise<V | null>;
  create: (item: TypesProperties<V, S>) => Promise<V>;
  get: (key: PriKey<S>) => Promise<V | null>;
  remove: (key: PriKey<S>) => Promise<void>;
  retrieve: (key: PriKey<S>) => Promise<V | null>;
  update: (key: PriKey<S>, item: TypesProperties<V, S>) => Promise<V>;
  action: (key: PriKey<S>, action: string, body?: any) => Promise<V>;
  allAction: (action: string, body?: any) => Promise<V[] | null>;
  actions?: Record<string,
    (
      key: PriKey<S>,
      body?: any,
    ) => Promise<V | null>>;
  find: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<V[] | null>;
}

export type PItemAdapterContext<V extends Item<S>, S extends string> =
  React.Context<PItemAdapterContextType<V, S> | undefined>;
