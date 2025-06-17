/* eslint-disable no-undefined */
import * as React from 'react';
import { PItemsQuery } from '../../src/primary/PItemsQuery';
import { PItemAdapterContextType } from '../../src/primary/PItemAdapterContext';
import { ComKey, Item, PriKey, UUID } from '@fjell/core';
import { vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { CacheMap } from '@fjell/cache';
import { Cache } from '@fjell/cache';
import { beforeEach, describe, expect, it } from 'vitest';

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
type TestItemCache = Cache<TestItem, 'test'>;

describe('PItemsQuery', () => {
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
  let testItemAdapter: TestItemAdapterContextType;
  let cache: TestItemCache;
  let TestItemContext: React.Context<TestItemAdapterContextType | undefined>;
  let TestItemAdapter: React.FC<{ children: ReactNode }>;

  beforeEach(() => {
    vi.resetAllMocks();

    cacheMap = new CacheMap<TestItem, 'test'>(['test']);
    (cacheMap as any).set(testItem.key, testItem);

    cache = {
      pkTypes: ['test'],
      all: vi.fn().mockResolvedValue([cacheMap, [testItem]]),
      one: vi.fn().mockResolvedValue([cacheMap, testItem]),
      create: vi.fn().mockResolvedValue([cacheMap, testItem]),
      get: vi.fn().mockResolvedValue([cacheMap, testItem]),
      remove: vi.fn().mockResolvedValue(cacheMap),
      retrieve: vi.fn().mockResolvedValue([cacheMap, testItem]),
      update: vi.fn().mockResolvedValue([cacheMap, testItem]),
      action: vi.fn().mockResolvedValue([cacheMap, testItem]),
      allAction: vi.fn().mockResolvedValue([cacheMap, [testItem]]),
      set: vi.fn().mockResolvedValue([cacheMap, testItem]),
      find: vi.fn().mockResolvedValue([cacheMap, [testItem]]),
      reset: vi.fn().mockResolvedValue([cacheMap]),
      cacheMap: cacheMap,
    } as unknown as TestItemCache;

    testItemAdapter = {
      name: 'test',
      cacheMap,
      pkTypes: ['test'],
      all: async (query) => {
        const [, items] = await cache.all(query);
        return items;
      },
      one: async (query) => {
        const [, item] = await cache.one(query);
        return item;
      },
      create: async (item) => {
        const [, newItem] = await cache.create(item);
        return newItem;
      },
      get: async (key) => {
        const [, item] = await cache.get(key);
        return item;
      },
      remove: async (key) => {
        await cache.remove(key);
      },
      retrieve: async (key) => {
        const [, item] = await cache.retrieve(key);
        return item;
      },
      update: async (key, item) => {
        const [, updatedItem] = await cache.update(key, item);
        return updatedItem;
      },
      action: async (key, action, body) => {
        const [, result] = await cache.action(key, action, body);
        return result;
      },
      allAction: async (action, body) => {
        const [, items] = await cache.allAction(action, body);
        return items;
      },
      find: async (finder, finderParams) => {
        const [, items] = await cache.find(finder, finderParams);
        return items;
      },
      set: async (key, item) => {
        const [, updatedItem] = await cache.set(key, item);
        return updatedItem;
      },
    };

    TestItemContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

    TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
      <TestItemContext.Provider value={testItemAdapter}>
        <PItemsQuery
          name="test"
          adapter={TestItemContext}
          context={TestItemContext}
          contextName="TestItemContext"
        >
          {children}
        </PItemsQuery>
      </TestItemContext.Provider>
    );
  });

  it('should perform an allAction', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    await act(async () => {
      await result.current.allAction('testAction', { data: 'test' });
    });

    expect(cache.allAction).toHaveBeenCalledTimes(1);
    expect(cache.allAction).toHaveBeenCalledWith('testAction', { data: 'test' });
  });

  it('should set an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    await act(async () => {
      await result.current.set(testItem.key, testItem);
    });

    expect(cache.set).toHaveBeenCalledTimes(1);
    expect(cache.set).toHaveBeenCalledWith(testItem.key, testItem);
  });
});
