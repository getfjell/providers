/* eslint-disable no-undefined */
import { ActionMethod, FacetMethod } from "@/AItemAdapterContext";
import { AItemContextType } from "@/AItemContext";
import { AllItemTypeArrays, ComKey, LocKeyArray } from "@fjell/core";

import { TypesProperties } from "@fjell/core";

import { Item } from "@fjell/core";
import React from "react";

export interface CItemContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends AItemContextType<V, S, L1, L2, L3, L4, L5> {
  name: string;
  key: ComKey<S, L1, L2, L3, L4, L5>;
  pkTypes: AllItemTypeArrays<S, L1, L2, L3, L4, L5>;
  parentItem: Item<L1, L2, L3, L4, L5> | null;
  locations: LocKeyArray<S, L1, L2, L3, L4> | null;

  actions?: Record<string, ActionMethod<V, S, L1, L2, L3, L4, L5>>;
  facets?: Record<string, FacetMethod<S, L1, L2, L3, L4, L5>>;

  item: V | null;
  isLoading: boolean;
  isUpdating: boolean;
  isRemoving: boolean;

  remove: () => Promise<void>;
  update: (item: TypesProperties<V, S, L1, L2, L3, L4, L5>) => Promise<V>;

  action: (
    actionName: string,
    body?: any,
  ) => Promise<V>;
  facet: (
    facetName: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<any>;

  set: (item: V) => Promise<V>;
}

export type CItemContext<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = React.Context<CItemContextType<V, S, L1, L2, L3, L4, L5> | undefined>;

export const useCItem = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(context: CItemContext<V, S, L1, L2, L3, L4, L5>, contextName: string): CItemContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};

