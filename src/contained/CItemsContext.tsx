/* eslint-disable no-undefined */
import { AItemsContextType } from "@/AItemsContext";
import { AllItemTypeArrays, ComKey, Item, LocKeyArray, TypesProperties } from "@fjell/core";
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
  items: V[];
  parentItem: Item<L1, L2, L3, L4, L5> | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  pkTypes: AllItemTypeArrays<S, L1, L2, L3, L4, L5>;
  locations: LocKeyArray<L1, L2, L3, L4, L5> | null;

  create: (
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
  ) => Promise<V>;
  update: (
    key: ComKey<S, L1, L2, L3, L4, L5>,
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
  ) => Promise<V | null>;
  remove: (key: ComKey<S, L1, L2, L3, L4, L5>) => Promise<void>;
  all: () => Promise<V[] | null>;
  one: () => Promise<V | null>;
  allAction: (
    action: string,
    body: any,
  ) => Promise<V[] | null>;
  find: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<V[] | null>;
  actions?: Record<string, (...params: any[]) => Promise<any>>;
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
>(context: CItemsContext<V, S, L1, L2, L3, L4, L5>): CItemsContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This ${context.displayName} hook must be used within the appropriate provider.`,
    );
  }
  return contextInstance;
};