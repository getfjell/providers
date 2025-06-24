/* eslint-disable no-undefined */
import { AllActionMethod, AllFacetMethod } from "@/AItemAdapterContext";
import { AItemsContextType } from "@/AItemsContext";
import { AllItemTypeArrays, ComKey, Item, LocKeyArray, PriKey, TypesProperties } from "@fjell/core";
import React from "react";

export interface CItemsContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends AItemsContextType<V, S, L1, L2, L3, L4, L5> {
  name: string;
  parentItem: Item<L1, L2, L3, L4, L5> | null;
  pkTypes: AllItemTypeArrays<S, L1, L2, L3, L4, L5>;
  locations: LocKeyArray<L1, L2, L3, L4, L5> | null;

  items: V[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isRemoving: boolean;

  allActions?: Record<string, AllActionMethod<V, S, L1, L2, L3, L4, L5>>;
  allFacets?: Record<string, AllFacetMethod<L1, L2, L3, L4, L5>>;
  finders?: Record<string, (...params: any[]) => Promise<V[] | V | null>>;

  create: (
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
  ) => Promise<V>;
  update: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
  ) => Promise<V>;
  remove: (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>) => Promise<void>;
  all: () => Promise<V[] | null>;
  one: () => Promise<V | null>;
  find: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<V[] | null>;
  set: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: V,
  ) => Promise<V>;

  action: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    action: string,
    body?: any,
  ) => Promise<V>;
  facet: (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<any>;

  allAction: (
    action: string,
    body?: any,
  ) => Promise<V[] | null>;
  allFacet: (
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<any>;

  queries?: Record<string, (...params: any[]) => Promise<string | boolean | number | null>>;
}

export type CItemsContext<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = React.Context<CItemsContextType<V, S, L1, L2, L3, L4, L5> | undefined>;

export const useCItems = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(context: CItemsContext<V, S, L1, L2, L3, L4, L5>, contextName: string):
  CItemsContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};
