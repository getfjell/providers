/* eslint-disable no-undefined */
import { ActionMethod, FacetMethod } from "@/AItemAdapterContext";
import { AItemContextType } from "@/AItemContext";
import { AllItemTypeArrays, Item, PriKey, TypesProperties } from "@fjell/core";
import React from "react";

export interface PItemContextType<
  V extends Item<S>,
  S extends string
> extends AItemContextType<V, S> {
  name: string;
  key: PriKey<S>;
  pkTypes: AllItemTypeArrays<S>;

  actions?: Record<string, ActionMethod<V, S>>;
  facets?: Record<string, FacetMethod<S>>;

  item: V | null;
  isLoading: boolean;
  isUpdating: boolean;
  isRemoving: boolean;

  remove: () => Promise<void>;
  update: (item: TypesProperties<V, S>) => Promise<V>;

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

export type PItemContext<
  V extends Item<S>,
  S extends string
> = React.Context<PItemContextType<V, S> | undefined>;

export const usePItem = <
  V extends Item<S>,
  S extends string
>(context: PItemContext<V, S>, contextName: string): PItemContextType<V, S> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};
