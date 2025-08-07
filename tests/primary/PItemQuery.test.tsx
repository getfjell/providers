/* eslint-disable no-undefined */
import { MemoryCacheMap } from '@fjell/cache';
import { ComKey, Dictionary, Item, PriKey, UUID } from '@fjell/core';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PItemAdapterContext, PItemAdapterContextType } from '../../src/primary/PItemAdapterContext';
import { PItemContext, PItemContextType } from '../../src/primary/PItemContext';
import {
  PItemQuery,
} from '../../src/primary/PItemQuery';

interface TestItem extends Item<'test'> {
  name: string;
  key: ComKey<'test'>;
  events: {
    created: { at: Date };
    updated: { at: Date };
    deleted: { at: null };
  };
}

type TestItemAdapterContextType = PItemAdapterContextType<TestItem, 'test'>;
type TestItemContextType = PItemContextType<TestItem, 'test'>;

describe('PItemQueryProvider', () => {
  const priKey: PriKey<'test'> = { pk: '1-1-1-1-1' as UUID, kt: 'test' };
  const testItem: TestItem = {
    key: { kt: priKey.kt, pk: priKey.pk },
    name: 'test',
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  };

  let cacheMap: CacheMap<TestItem, 'test'>;
  let testItemCache: TestItemAdapterContextType;
  let TestItemAdapterContext: PItemAdapterContext<TestItem, 'test'>;
  let TestItemContext: PItemContext<TestItem, 'test'>;

  beforeEach(() => {
    vi.resetAllMocks();

    cacheMap = new MemoryCacheMap<TestItem, 'test'>(['test']);
    (cacheMap as Dictionary<ComKey<'test'>, TestItem>).set(testItem.key, testItem);

    testItemCache = {
      name: 'test',
      pkTypes: ['test'],
      all: vi.fn().mockResolvedValue([testItem]),
      one: vi.fn().mockResolvedValue(testItem),
      create: vi.fn().mockResolvedValue(testItem),
      get: vi.fn().mockResolvedValue(testItem),
      remove: vi.fn().mockResolvedValue(undefined),
      retrieve: vi.fn().mockResolvedValue(testItem),
      update: vi.fn().mockResolvedValue(testItem),
      action: vi.fn().mockResolvedValue(testItem),
      allAction: vi.fn().mockResolvedValue([testItem]),
      set: vi.fn().mockResolvedValue(testItem),
      find: vi.fn().mockResolvedValue([testItem]),
      reset: vi.fn().mockResolvedValue(undefined),
      cacheMap: cacheMap,
    } as unknown as TestItemAdapterContextType;

    TestItemAdapterContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);
    TestItemContext = React.createContext<TestItemContextType | undefined>(undefined);
  });

  it('should retrieve an item with a query', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapterContext.Provider value={testItemCache}>
        <PItemQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemContext}
          contextName="TestItemContext"
          query={{ pk: priKey.pk }}
          optional={false}
        >
          {children}
        </PItemQuery>
      </TestItemAdapterContext.Provider>
    );

    const { result } = renderHook(() =>
      React.useContext<TestItemContextType | undefined>(TestItemContext),
    { wrapper }
    );

    await waitFor(() => {
      expect(result.current?.item).toBeDefined();
    });

    expect(result.current?.item).toEqual(testItem);
  });

  it('should create an item if not found and create is provided', async () => {
    const newItem: TestItem = {
      key: { kt: priKey.kt, pk: '2-2-2-2-2' as UUID },
      name: 'new test',
      events: {
        created: { at: new Date() },
        updated: { at: new Date() },
        deleted: { at: null },
      }
    };

    testItemCache.one = vi.fn().mockResolvedValue(null);
    testItemCache.create = vi.fn().mockImplementation(async () => {
      (cacheMap as Dictionary<ComKey<'test'>, TestItem>).set(newItem.key, newItem);
      return newItem;
    });
    testItemCache.retrieve = vi.fn().mockResolvedValue(newItem);

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapterContext.Provider value={testItemCache}>
        <PItemQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemContext}
          contextName="TestItemContext"
          query={{ pk: priKey.pk }}
          create={newItem}
          optional={false}
        >
          {children}
        </PItemQuery>
      </TestItemAdapterContext.Provider>
    );

    const { result } = renderHook(() =>
      React.useContext<TestItemContextType | undefined>(TestItemContext),
    { wrapper }
    );

    await waitFor(() => {
      expect(result.current?.item).toBeDefined();
    });

    expect(result.current?.item).toEqual(newItem);
  });

  it('should not create an item if not found and create is not provided', async () => {
    testItemCache.one = vi.fn().mockResolvedValue(null);
    testItemCache.retrieve = vi.fn().mockResolvedValue(null);

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapterContext.Provider value={testItemCache}>
        <PItemQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemContext}
          contextName="TestItemContext"
          query={{ pk: priKey.pk }}
          optional={true}
        >
          {children}
        </PItemQuery>
      </TestItemAdapterContext.Provider>
    );

    const { result } = renderHook(() =>
      React.useContext<TestItemContextType | undefined>(TestItemContext),
    { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await waitFor(() => {
      expect(result.current?.item).toBeNull();
    });
  });

  it('should set item', async () => {
    testItemCache.one = vi.fn().mockResolvedValue(testItem);
    testItemCache.retrieve = vi.fn().mockResolvedValue(testItem);

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapterContext.Provider value={testItemCache}>
        <PItemQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemContext}
          contextName="TestItemContext"
          query={{ pk: priKey.pk }}
          loading={<div>Loading...</div>}
        >
          {children}
        </PItemQuery>
      </TestItemAdapterContext.Provider>
    );

    const { result } = renderHook(() =>
      React.useContext<TestItemContextType | undefined>(TestItemContext),
    { wrapper }
    );

    await waitFor(() => {
      expect(result.current?.item).toBeDefined();
    });

    // Set the item
    await act(async () => {
      if (result.current) {
        await result.current.set(testItem);
      }
    });

    // Wait for the item to be set and context to update
    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });
  });
});
