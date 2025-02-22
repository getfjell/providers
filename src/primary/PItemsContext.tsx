/* eslint-disable no-undefined */
import { AItemsContextType } from "@/AItemsContext";
import { Item, PriKey, TypesProperties } from "@fjell/core";
import React from "react";

export interface PItemsContextType<
  V extends Item<S>,
  S extends string
> extends AItemsContextType<V, S> {
  name: string;
  items: V[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  create: (
    item: TypesProperties<V, S>,
  ) => Promise<V>;
  update: (
    key: PriKey<S>,
    item: TypesProperties<V, S>,
  ) => Promise<V>;
  remove: (
    key: PriKey<S>,
  ) => Promise<void>;
  all: () => Promise<V[] | null>;
  one: () => Promise<V | null>;
  find: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<V[] | null>;
  
  // TODO: Again, this allAction should return either an object or an array
  allAction: (action: string,
    body: any) => Promise<V | null>;
  actions?: Record<string, (...params: any[]) => Promise<any>>;
  queries?: Record<string, (...params: any[]) => Promise<string | boolean | number | null>>;
}

export type PItemsContext<
  V extends Item<S>,
  S extends string
> = React.Context<PItemsContextType<V, S> | undefined>;

export const usePItems = <
  V extends Item<S>,
  S extends string
>(context: PItemsContext<V, S>): PItemsContextType<V, S> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${context.displayName}`,
    );
  }
  return contextInstance;
};