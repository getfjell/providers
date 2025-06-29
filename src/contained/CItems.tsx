/* eslint-disable no-undefined */
import * as AItems from "../AItems";
import { Item } from "@fjell/core";
import * as React from "react";

export interface ContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends AItems.ContextType<V, S, L1, L2, L3, L4, L5> {
  parentItem: Item<L1, L2, L3, L4, L5> | null;
}

export type Context<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = React.Context<ContextType<V, S, L1, L2, L3, L4, L5> | undefined>;

export const useCItems = <
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
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};
