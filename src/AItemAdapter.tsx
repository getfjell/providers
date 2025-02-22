/* eslint-disable no-undefined */
import React from "react";
import { AItemAdapterContextType } from "./AItemAdapterContext";
import { AItemAdapterContext } from "./AItemAdapterContext";
import { Item } from "@fjell/core";

export const useAItemAdapter = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(context: AItemAdapterContext<V, S, L1, L2, L3, L4, L5>): AItemAdapterContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This generic item adapter hook must be used within a ${context.displayName}`,
    );
  }
  return contextInstance;
};