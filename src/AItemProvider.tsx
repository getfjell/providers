/* eslint-disable no-undefined */
import React from "react";
import { AItemContextType } from "./AItemContext";
import { AItemContext } from "./AItemContext";
import { Item } from "@fjell/core";

export const useAItem = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(context: AItemContext<V, S, L1, L2, L3, L4, L5>, contextName: string): AItemContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};