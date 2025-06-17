/* eslint-disable no-undefined */
import React from "react";
import { AItemsContextType } from "./AItemsContext";
import { AItemsContext } from "./AItemsContext";
import { Item } from "@fjell/core";

export const useAItems = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(context: AItemsContext<V, S, L1, L2, L3, L4, L5>, contextName: string):
  AItemsContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};
