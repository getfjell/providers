/* eslint-disable no-undefined */
import { AItemContextType } from "@/AItemContext";
import { ComKey, LocKeyArray } from "@fjell/core";

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
  item: V | null;
  parentItem: Item<L1, L2, L3, L4, L5> | null;
  isLoading: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  pkType: string;
  remove: () => Promise<void>;
  update: (item: TypesProperties<V, S, L1, L2, L3, L4, L5>) => Promise<V | null>;
  action: (
    actionName: string,
    body?: any,
  ) => Promise<V | null>;
  actions?: Record<string, (body?: any) => Promise<V | null>>;
  locations: LocKeyArray<S, L1, L2, L3, L4> | null;
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
>(context: CItemContext<V, S, L1, L2, L3, L4, L5>): CItemContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This generic composite item hook must be used within a ${context.displayName}`,
    );
  }
  return contextInstance;
};

