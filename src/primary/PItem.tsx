/* eslint-disable no-undefined */
import { Item } from "@fjell/types";
import * as React from "react";
import * as AItem from "../AItem";

export interface ContextType<
  V extends Item<S>,
  S extends string
> extends AItem.ContextType<V, S> {
  parentItem: null;
}
export type Context<
  V extends Item<S>,
  S extends string
> = React.Context<ContextType<V, S> | undefined>;

// TODO: Why doesn't this just call AItem.useContext?
export const usePItem = <
  V extends Item<S>,
  S extends string
>(context: Context<V, S>, contextName: string): ContextType<V, S> => {
  const contextInstance = React.useContext(context);

  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};
