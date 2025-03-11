/* eslint-disable no-undefined */
import {
  PItemQuery,
} from '../../src/primary/PItemQuery';
import { PItemAdapter } from '../../src/primary/PItemAdapter';
import { CacheMap } from '@fjell/cache/dist/src/CacheMap';
import { IQFactory, Item, ItemQuery, PriKey, TypesProperties, UUID } from '@fjell/core';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { PItemAdapterContext, PItemAdapterContextType } from '../../src/primary/PItemAdapterContext';
import { PItemContext, PItemContextType, usePItem } from '../../src/primary/PItemContext';
import { Cache } from '@fjell/cache/dist/src/Cache';

interface TestItem extends Item<'test'> {
  name: string;
}

type TestItemAdapterContextType = PItemAdapterContextType<TestItem, 'test'>;
type TestItemContextType = PItemContextType<TestItem, 'test'>;
type TestItemCache = Cache<TestItem, 'test'>;

describe('PItemQueryProvider', () => {
  const priKey: PriKey<'test'> = { pk: '1-1-1-1-1' as UUID, kt: 'test' };
  const testItem: TestItem = {
    key: priKey,
    name: 'test',
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  };

  let emptyCacheMap: CacheMap<TestItem, 'test'>;
  let cacheMap: CacheMap<TestItem, 'test'>;
  let testItemCache: TestItemCache;
  let TestItemAdapterContext: PItemAdapterContext<TestItem, 'test'>;
  let TestItemContext: PItemContext<TestItem, 'test'>;
  let TestItemAdapter: React.FC<{ children: React.ReactNode }>;
  let TestItemQueryProvider: React.FC<{
    query?: ItemQuery,
    create?: TypesProperties<TestItem, 'test'>,
    optional?: boolean,
    children: React.ReactNode
  }>;

  beforeEach(() => {
    jest.resetAllMocks();

    emptyCacheMap = new CacheMap<TestItem, 'test'>(['test']);

    cacheMap = new CacheMap<TestItem, 'test'>(['test']);
    cacheMap.set(priKey, testItem);

    testItemCache = {
      pkTypes: ['test'],
      all: jest.fn().mockResolvedValue([cacheMap, [testItem]]),
      one: jest.fn().mockResolvedValue([cacheMap, testItem]),
      create: jest.fn().mockResolvedValue([cacheMap, testItem]),
      get: jest.fn().mockResolvedValue([cacheMap, testItem]),
      remove: jest.fn().mockResolvedValue(emptyCacheMap),
      retrieve: jest.fn().mockResolvedValue([cacheMap, testItem]),
      update: jest.fn().mockResolvedValue([cacheMap, testItem]),
      action: jest.fn().mockResolvedValue([cacheMap, testItem]),
      allAction: jest.fn().mockResolvedValue([cacheMap, [testItem]]),
      set: jest.fn().mockResolvedValue([cacheMap, testItem]),
    } as unknown as jest.Mocked<TestItemCache>;

    TestItemAdapterContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);
    TestItemContext = React.createContext<TestItemContextType | undefined>(undefined);

    TestItemAdapter = (
      {
        children,
      }: {
        children: React.ReactNode;
      }
    ) => {
      return PItemAdapter<TestItemCache, TestItem, 'test'>({
        name: 'test',
        cache: testItemCache,
        context: TestItemAdapterContext,
        children,
      });
    }

    TestItemQueryProvider = (
      {
        query,
        create,
        optional,
        children,
      }: {
        query?: ItemQuery;
        create?: TypesProperties<TestItem, 'test'>;
        optional?: boolean;
        children: React.ReactNode;
      }
    ) => {
      return PItemQuery<
        TestItem,
        'test'
      >({
        name: 'test',
        query,
        create,
        optional,
        adapter: TestItemAdapterContext,
        context: TestItemContext,
        children,
      });
    };

  });

  it('should retrieve an item with a query', async () => {
    const query = IQFactory.condition('name', 'test').toQuery();
    // @ts-ignore
    testItemCache.one.mockResolvedValueOnce([cacheMap, testItem]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemQueryProvider
          query={query}
        >
          {children}
        </TestItemQueryProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await waitFor(() => {
      const item = result.current.item;
      expect(item).toEqual(testItem);
    });
  });

  it('should create an item if not found and create is provided', async () => {
    const newItem = { ...testItem, name: 'newItem' };

    const newCacheMap = cacheMap.clone();
    newCacheMap.set(newItem.key, newItem);

    // @ts-ignore
    testItemCache.one.mockResolvedValueOnce([cacheMap, null]);
    // @ts-ignore
    testItemCache.create.mockResolvedValueOnce([newCacheMap, newItem]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemQueryProvider
          query={IQFactory.condition('name', 'nonExistent').toQuery()}
          create={{ name: 'newItem' }}
        >
          {children}
        </TestItemQueryProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await waitFor(() => {
      const item = result.current.item;
      expect(item).toEqual(newItem);
    });

    expect(testItemCache.create).toHaveBeenCalledWith({ name: 'newItem' });
  });

  it('should not create an item if not found and create is not provided', async () => {
    // @ts-ignore
    testItemCache.one.mockResolvedValueOnce([cacheMap, null]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemQueryProvider
          query={IQFactory.condition('name', 'nonExistent').toQuery()}
          optional={true}
        >
          {children}
        </TestItemQueryProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await waitFor(() => {
      const item = result.current.item;
      expect(item).toBeNull();
    });

    expect(testItemCache.create).not.toHaveBeenCalled();
  });

  it('should return null if no query is provided', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemQueryProvider
          optional={true}
        >
          {children}
        </TestItemQueryProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await waitFor(() => {
      const item = result.current.item;
      expect(item).toBeNull();
    });

    expect(testItemCache.one).not.toHaveBeenCalled();
    expect(testItemCache.create).not.toHaveBeenCalled();
  });

  it('should set item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemQueryProvider
          optional={true}
        >
          {children}
        </TestItemQueryProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const newItem = {
      ...testItem,
      name: 'new name',
    };

    await result.current.set(newItem);

    expect(testItemCache.set).toHaveBeenCalledWith(newItem.key, newItem);
  });

});
