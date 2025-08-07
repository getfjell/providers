import { AllItemTypeArrays, ComKey, PriKey } from "@fjell/core";

import { Item } from "@fjell/core";

import { LocKeyArray } from "@fjell/core";

import { CacheMap } from "@fjell/cache";
import { ItemQuery } from "@fjell/core";
import React from "react";
import * as AItem from "./AItem";
import * as AItems from "./AItems";
import * as Faceted from "./Faceted";

export type FindMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[] | null>;

export type FindOneMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V | null>;

export type AllActionMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    action: string,
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[] | null>;

export type AllFacetMethod<
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<any | null>;

export type ActionMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    action: string,
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V | null>;

export type FacetMethod<
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<any | null>;

export type AllMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    query?: ItemQuery,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[] | null>;

export type OneMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    query?: ItemQuery,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V | null>;

export type CreateMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V>;

export type GetMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<V | null>;

export type RemoveMethod<
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<void>;

export type RetrieveMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<V | null>;

export type UpdateMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
  ) => Promise<V>;

export type SetMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: V,
  ) => Promise<V>;

export interface ContextType<
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
  pkTypes: AllItemTypeArrays<S, L1, L2, L3, L4, L5>;

  all: AllMethod<V, S, L1, L2, L3, L4, L5>;

  one: OneMethod<V, S, L1, L2, L3, L4, L5>;

  create: CreateMethod<V, S, L1, L2, L3, L4, L5>;

  get: GetMethod<V, S, L1, L2, L3, L4, L5>;

  remove: RemoveMethod<S, L1, L2, L3, L4, L5>;

  retrieve: RetrieveMethod<V, S, L1, L2, L3, L4, L5>;

  update: UpdateMethod<V, S, L1, L2, L3, L4, L5>;

  allAction: AllActionMethod<V, S, L1, L2, L3, L4, L5>;

  allFacet: AllFacetMethod<L1, L2, L3, L4, L5>;

  action: ActionMethod<V, S, L1, L2, L3, L4, L5>;

  facet: FacetMethod<S, L1, L2, L3, L4, L5>;

  find: FindMethod<V, S, L1, L2, L3, L4, L5>;

  findOne: FindOneMethod<V, S, L1, L2, L3, L4, L5>;

  set: SetMethod<V, S, L1, L2, L3, L4, L5>;

  addActions?: (action: AItem.ActionMethod<V, S, L1, L2, L3, L4, L5>) => Record<string, AItem.AddedActionMethod<V, S, L1, L2, L3, L4, L5>>;
  addFacets?: (facet: Faceted.FacetMethod<L1, L2, L3, L4, L5>) => Record<string, Faceted.AddedFacetMethod<L1, L2, L3, L4, L5>>;
  addAllActions?: (allAction: AItems.AllActionMethod<V, S, L1, L2, L3, L4, L5>) => Record<string, AItems.AddedAllActionMethod<V, S, L1, L2, L3, L4, L5>>;
  addAllFacets?: (allFacet: AllFacetMethod<L1, L2, L3, L4, L5>) => Record<string, Faceted.AddedFacetMethod<L1, L2, L3, L4, L5>>;

}

export type Context<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never,
> = React.Context<ContextType<V, S, L1, L2, L3, L4, L5> | undefined>;

export const useAItemAdapter = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  // eslint-disable-next-line indent
  context: Context<V, S, L1, L2, L3, L4, L5>,
  // eslint-disable-next-line indent
  contextName: string
  // eslint-disable-next-line indent
): ContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  // eslint-disable-next-line no-undefined
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};
