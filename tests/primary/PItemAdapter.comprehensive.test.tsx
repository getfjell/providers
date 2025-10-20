 
import * as React from 'react';
import { Adapter, ContextType } from '../../src/primary/PItemAdapter';
import { ComKey, Item, ItemQuery, PriKey, UUID } from '@fjell/core';
import { vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

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

describe('PItemAdapter - Core Operations', () => {
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

  let testItemCache: TestItemCache;
  let TestItemContext: React.Context<TestItemAdapterContextType | undefined>;

  beforeEach(() => {
    vi.resetAllMocks();

    testItemCache = {
      coordinate: {
        kta: ['test'],
        scopes: []
      },
      registry: {} as any,
      api: {} as any,

      operations: {
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
        facet: vi.fn().mockResolvedValue({ facetData: 'test' }),
        allFacet: vi.fn().mockResolvedValue({ allFacetData: 'test' }),
        reset: vi.fn().mockResolvedValue(undefined)
      },
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
    } as unknown as TestItemCache;

    TestItemContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);
  });

  it('should get all items with query', async () => {
    const TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
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

    const query: ItemQuery = { limit: 10 };

    await act(async () => {
      const items = await result.current.all(query);
      expect(items).toEqual([testItem]);
    });

    expect(testItemCache.operations.all).toHaveBeenCalledWith(query);
  });

  it('should get one item with query', async () => {
    const TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
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

    const query: ItemQuery = { pk: testItem.key.pk };

    await act(async () => {
      const item = await result.current.one(query);
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.operations.one).toHaveBeenCalledWith(query);
  });

  it('should retrieve an item', async () => {
    const TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
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
      const item = await result.current.retrieve(testItem.key);
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.operations.retrieve).toHaveBeenCalledWith(testItem.key);
  });

  it('should set an item', async () => {
    const TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
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
      const item = await result.current.set(testItem.key, testItem);
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.operations.set).toHaveBeenCalledWith(testItem.key, testItem);
  });

  it('should perform all action', async () => {
    const TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
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
      const items = await result.current.allAction('testAllAction', { data: 'test' });
      expect(items).toEqual([testItem]);
    });

    expect(testItemCache.operations.allAction).toHaveBeenCalledWith('testAllAction', { data: 'test' });
  });

  it('should perform find operation', async () => {
    const TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
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

    const finderParams = { name: 'test', active: true };

    await act(async () => {
      const items = await result.current.find('testFinder', finderParams);
      expect(items).toEqual([testItem]);
    });

    expect(testItemCache.operations.find).toHaveBeenCalledWith('testFinder', finderParams);
  });

  it('should handle all operation returning invalid result', async () => {
    const invalidCache = {
      ...testItemCache,
      operations: {
        ...testItemCache.operations,
        all: vi.fn().mockResolvedValue('invalid-result'),
      }
    } as unknown as TestItemCache;

    const InvalidResultAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={invalidCache}
        context={TestItemContext}
        aggregates={{}}
        events={{}}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <InvalidResultAdapter>{children}</InvalidResultAdapter>
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
      const items = await result.current.all();
      expect(items).toEqual([]);
    });
  });

  it('should handle async cache initialization', async () => {
    const asyncCache = Promise.resolve(testItemCache);

    const AsyncCacheAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={asyncCache as any}
        context={TestItemContext}
        aggregates={{}}
        events={{}}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <AsyncCacheAdapter>{children}</AsyncCacheAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    // Wait for async cache resolution
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await act(async () => {
      const item = await result.current.get(testItem.key);
      expect(item).toEqual(testItem);
    });
  });

  it('should handle async cache initialization failure', async () => {
    // Create a cache that will simulate async initialization failure
    // by not having the expected structure when resolved
    const rejectedCache = Promise.resolve(null);

    const FailedCacheAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={rejectedCache as any}
        context={TestItemContext}
        aggregates={{}}
        events={{}}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <FailedCacheAdapter>{children}</FailedCacheAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    // Wait for async cache rejection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should handle the error gracefully and cache operations should fail
    await expect(async () => {
      await result.current.get(testItem.key);
    }).rejects.toThrow('Cache not initialized in test. Operation "get" failed.');
  });
});
