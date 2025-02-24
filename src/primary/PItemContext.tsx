/* eslint-disable no-undefined */
import { AItemContextType } from "@/AItemContext";
import { AllItemTypeArrays, Item, LocKeyArray, PriKey, TypesProperties } from "@fjell/core";
import React from "react";

export interface PItemContextType<
  V extends Item<S>,
  S extends string
> extends AItemContextType<V, S> {
  name: string;
  key: PriKey<S>;
  item: V | null;
  parentItem: null;
  isLoading: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  pkTypes: AllItemTypeArrays<S>;
  remove: () => Promise<void>;
  update: (item: TypesProperties<V, S>) => Promise<V>;
  action: (
    actionName: string,
    body?: any
  ) => Promise<V>;
  actions?: Record<string, (body?: any) => Promise<V | null>>;
  locations: LocKeyArray<S> | null;
}

export type PItemContext<
  V extends Item<S>,
  S extends string
> = React.Context<PItemContextType<V, S> | undefined>;

export const usePItem = <
  V extends Item<S>,
  S extends string
>(context: PItemContext<V, S>): PItemContextType<V, S> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${context.displayName}`,
    );
  }
  return contextInstance;
};