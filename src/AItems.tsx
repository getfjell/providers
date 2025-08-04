import { AllItemTypeArrays, Item, LocKeyArray } from "@fjell/core";
import * as React from "react";
import * as AItemAdapter from "./AItemAdapter";

export type CreateMethod<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = (
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
  ) => Promise<V>;

export type AllMethod<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = () => Promise<V[] | null>;

export type OneMethod<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = () => Promise<V | null>;

export type AllActionMethod<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = (
    action: string,
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[] | null>;

export type AddedAllActionMethod<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = (
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[] | null>;

export type AllFacetMethod<
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = (
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<any | null>;

export type AddedAllFacetMethod<
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = (
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<any | null>;

export interface ContextType<
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
      /**
   * Results of facet operations, keyed by facet name and parameter hash.
   * First key is the facet name, second key is the parameter hash.
   * This is intentionally not of type Item, as facet results can be arbitrary data
   * returned from the backend, such as aggregations, statistics, or other computed values.
   */
  facetResults?: Record<string, Record<string, any>>;
    locations?: LocKeyArray<S, L1, L2, L3, L4> | null;
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isRemoving: boolean;
    pkTypes: AllItemTypeArrays<S, L1, L2, L3, L4, L5>;

    allActions?: Record<string, AddedAllActionMethod<V, S, L1, L2, L3, L4, L5>>;
    allFacets?: Record<string, AddedAllFacetMethod<L1, L2, L3, L4, L5>>;
    finders?: Record<string, (...params: any[]) => Promise<V[] | V | null>>;

    create: CreateMethod<V, S, L1, L2, L3, L4, L5>;
    all: AllMethod<V, S, L1, L2, L3, L4, L5>;
    one: OneMethod<V, S, L1, L2, L3, L4, L5>;
    allAction: AllActionMethod<V, S, L1, L2, L3, L4, L5>;
    allFacet: AllFacetMethod<L1, L2, L3, L4, L5>;
    set: AItemAdapter.SetMethod<V, S, L1, L2, L3, L4, L5>;
    find: AItemAdapter.FindMethod<V, S, L1, L2, L3, L4, L5>;
    findOne: AItemAdapter.FindOneMethod<V, S, L1, L2, L3, L4, L5>;
    update: AItemAdapter.UpdateMethod<V, S, L1, L2, L3, L4, L5>;
    remove: AItemAdapter.RemoveMethod<S, L1, L2, L3, L4, L5>;
    action: AItemAdapter.ActionMethod<V, S, L1, L2, L3, L4, L5>;
    facet: AItemAdapter.FacetMethod<S, L1, L2, L3, L4, L5>;
  }

export type Context<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = React.Context<ContextType<V, S, L1, L2, L3, L4, L5> | undefined>;

export const useAItems = <
V extends Item<S, L1, L2, L3, L4, L5>,
S extends string,
L1 extends string = never,
L2 extends string = never,
L3 extends string = never,
L4 extends string = never,
L5 extends string = never
>(context: Context<V, S, L1, L2, L3, L4, L5>, contextName: string):
ContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  // eslint-disable-next-line no-undefined
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};
