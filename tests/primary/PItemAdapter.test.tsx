/* eslint-disable no-undefined */
import * as React from 'react';
import { Adapter, ContextType } from '../../src/primary/PItemAdapter';
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

type TestItemAdapterContextType = ContextType<TestItem, 'test'>;
type TestItemCache = Cache<TestItem, 'test'>;

describe('PItemAdapter', () => {
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
  let testItemCache: TestItemCache;
  let TestItemContext: React.Context<TestItemAdapterContextType | undefined>;
  let TestItemAdapter: React.FC<{ children: ReactNode }>;

  beforeEach(() => {
    vi.resetAllMocks();

    // Initialize cache map with test item
    cacheMap = new CacheMap<TestItem, 'test'>(['test']);
    (cacheMap as any).set(testItem.key, testItem);

    // Create mock cache with all required methods
    testItemCache = {
      coordinate: { kta: ['test'] },
      registry: {},
      api: {},
      cacheMap: cacheMap,
      operations: {
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
        facet: vi.fn().mockResolvedValue([cacheMap, { facetData: 'test' }]),
        allFacet: vi.fn().mockResolvedValue([cacheMap, { allFacetData: 'test' }]),
        reset: vi.fn().mockResolvedValue([cacheMap]),
      }
    } as unknown as TestItemCache;

    // Create context
    TestItemContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

    // Create adapter component
    TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={testItemCache}
        context={TestItemContext}
        aggregates={{}}
        events={{}}
      >
        {children}
      </Adapter>
    );
  });

  it('should get an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    // Wait for cache initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const item = await result.current.get(testItem.key);
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.operations.get).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.get).toHaveBeenCalledWith(testItem.key);
  });

  it('should create an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    // Wait for cache initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const item = await result.current.create(testItem);
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.operations.create).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.create).toHaveBeenCalledWith(testItem);
  });

  it('should update an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    // Wait for cache initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const item = await result.current.update(testItem.key, testItem);
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.operations.update).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.update).toHaveBeenCalledWith(testItem.key, testItem);
  });

  it('should remove an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    // Wait for cache initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.remove(testItem.key);
    });

    expect(testItemCache.operations.remove).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.remove).toHaveBeenCalledWith(testItem.key);
  });

  it('should perform an action', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    // Wait for cache initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const item = await result.current.action(testItem.key, 'testAction', { data: 'test' });
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.operations.action).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.action).toHaveBeenCalledWith(testItem.key, 'testAction', { data: 'test' });
  });

  it('should handle undefined cache and throw error on operations', async () => {
    const UndefinedCacheAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={undefined as any}
        context={TestItemContext}
        aggregates={{}}
        events={{}}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <UndefinedCacheAdapter>{children}</UndefinedCacheAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await expect(async () => {
      await result.current.get(testItem.key);
    }).rejects.toThrow('Cache not initialized in test. Operation "get" failed.');
  });

  it('should perform facet operation', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const facetResult = await result.current.facet(testItem.key, 'testFacet');
      expect(facetResult).toEqual({ facetData: 'test' });
    });

    expect(testItemCache.operations.facet).toHaveBeenCalledWith(testItem.key, 'testFacet');
  });

  it('should perform all facet operation', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const params = { param1: 'value1', param2: 42 };

    await act(async () => {
      const facetResult = await result.current.allFacet('testAllFacet', params);
      expect(facetResult).toEqual({ allFacetData: 'test' });
    });

    expect(testItemCache.operations.allFacet).toHaveBeenCalledWith('testAllFacet', params);
  });
});
