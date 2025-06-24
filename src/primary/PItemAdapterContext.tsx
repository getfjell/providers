import { ActionMethod, AItemAdapterContextType, AllActionMethod, AllFacetMethod, FacetMethod } from "@/AItemAdapterContext";
import { AllItemTypeArrays, Item, ItemQuery, PriKey, TypesProperties } from "@fjell/core";
import { CacheMap } from "@fjell/cache";
import { PItemContextType } from "./PItemContext";
import { PItemsContextType } from "./PItemsContext";

export interface PItemAdapterContextType<
  V extends Item<S>,
  S extends string
> extends AItemAdapterContextType<V, S> {
  name: string;
  cacheMap: CacheMap<V, S>;
  pkTypes: AllItemTypeArrays<S>;

  addActions: (contextValues: PItemContextType<V, S>) => Record<string, ActionMethod<V, S>>;
  addFacets: (contextValues: PItemContextType<V, S>) => Record<string, FacetMethod<S>>;
  addAllActions: (contextValues: PItemsContextType<V, S>) => Record<string, AllActionMethod<V, S>>;
  addAllFacets: (contextValues: PItemsContextType<V, S>) => Record<string, AllFacetMethod>;

  all: (query?: ItemQuery) => Promise<V[] | null>;
  one: (query?: ItemQuery) => Promise<V | null>;
  create: (item: TypesProperties<V, S>) => Promise<V>;
  get: (key: PriKey<S>) => Promise<V | null>;
  remove: (key: PriKey<S>) => Promise<void>;
  retrieve: (key: PriKey<S>) => Promise<V | null>;
  update: (key: PriKey<S>, item: TypesProperties<V, S>) => Promise<V>;

  action: (key: PriKey<S>, action: string, body?: any) => Promise<V>;
  facet: (key: PriKey<S>, facet: string, params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>) => Promise<V | null>;
  allAction: (action: string, body?: any) => Promise<V[] | null>;
  allFacet: (facet: string, params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>) => Promise<V[] | null>;

  find: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<V[] | null>;
  findOne: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<V | null>;

  set: (key: PriKey<S>, item: V) => Promise<V>;

}

export type PItemAdapterContext<V extends Item<S>, S extends string> =
  React.Context<PItemAdapterContextType<V, S> | undefined>;
