/* eslint-disable no-undefined */
import * as React from 'react';
import { Adapter, ContextType, usePItemAdapter } from '../../src/primary/PItemAdapter';
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

describe('PItemAdapter', () => {
  const priKey: PriKey<'test'> = { pk: '1-1-1-1-1' as UUID, kt: 'test' };
  const testItem: TestItem = {
    key: { kt: priKey.kt, pk: priKey.pk, loc: [] },
    name: 'test',
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  };

  let testItemCache: TestItemCache;
  let TestItemContext: React.Context<TestItemAdapterContextType | undefined>;
  let TestItemAdapter: React.FC<{ children: ReactNode }>;

  beforeEach(() => {
    vi.resetAllMocks();

    // Create mock cache with all required methods
    testItemCache = {
      coordinate: { kta: ['test'] },
      registry: {},
      api: {},
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
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
        reset: vi.fn().mockResolvedValue(undefined),
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

  it('should get all items', async () => {
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

    const query: ItemQuery = {};
    await act(async () => {
      const items = await result.current.all(query);
      expect(items).toEqual([testItem]);
    });

    expect(testItemCache.operations.all).toHaveBeenCalledWith(query);
  });

  it('should get one item', async () => {
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

    const query: ItemQuery = {};
    await act(async () => {
      const item = await result.current.one(query);
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.operations.one).toHaveBeenCalledWith(query);
  });

  it('should retrieve an item', async () => {
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

  it('should perform all action', async () => {
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

  it('should find items', async () => {
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

    const finderParams = { name: 'test' };
    await act(async () => {
      const items = await result.current.find('testFinder', finderParams);
      expect(items).toEqual([testItem]);
    });

    expect(testItemCache.operations.find).toHaveBeenCalledWith('testFinder', finderParams);
  });

  it('should find one item', async () => {
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

    const finderParams = { name: 'test' };
    await act(async () => {
      const item = await result.current.findOne('testFinder', finderParams);
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.operations.find).toHaveBeenCalledWith('testFinder', finderParams);
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
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      const item = await result.current.set(testItem.key, testItem);
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.operations.set).toHaveBeenCalledWith(testItem.key, testItem);
  });

  it('should handle facet operation with parameters', async () => {
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

    const params = { param1: 'value1', param2: 42, param3: true, param4: new Date(), param5: ['a', 'b'] };
    await act(async () => {
      const facetResult = await result.current.facet(testItem.key, 'testFacet', params);
      expect(facetResult).toEqual({ facetData: 'test' });
    });

    expect(testItemCache.operations.facet).toHaveBeenCalledWith(testItem.key, 'testFacet', params);
  });

  it('should handle usePItemAdapter hook', () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => usePItemAdapter(TestItemContext, 'TestItemAdapter'), { wrapper });

    expect(result.current.name).toBe('test');
    expect(result.current.pkTypes).toEqual(['test']);
  });

  it('should throw error when usePItemAdapter hook is used outside context', () => {
    expect(() => {
      renderHook(() => usePItemAdapter(TestItemContext, 'TestItemAdapter'));
    }).toThrow(
      'usePItemAdapter hook must be used within a TestItemAdapter provider. ' +
      'Make sure to wrap your component with <TestItemAdapter.Provider value={...}> ' +
      'or use the corresponding Provider component.'
    );
  });

  it('should handle cache operations correctly', async () => {
    // Mock cache with standard operations
    const standardCache = {
      ...testItemCache,
      operations: {
        ...testItemCache.operations,
        get: vi.fn().mockResolvedValue(testItem),
        retrieve: vi.fn().mockResolvedValue(testItem),
      }
    } as unknown as TestItemCache;

    const StandardCacheAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={standardCache}
        context={TestItemContext}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <StandardCacheAdapter>{children}</StandardCacheAdapter>
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
      const item = await result.current.get(testItem.key);
      expect(item).toEqual(testItem);
    });
  });

  it('should handle retrieve operation correctly', async () => {
    // Mock cache with standard retrieve operation
    const retrieveCache = {
      ...testItemCache,
      operations: {
        ...testItemCache.operations,
        retrieve: vi.fn().mockResolvedValue(testItem),
      }
    } as unknown as TestItemCache;

    const RetrieveAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={retrieveCache}
        context={TestItemContext}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <RetrieveAdapter>{children}</RetrieveAdapter>
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

    expect(retrieveCache.operations.retrieve).toHaveBeenCalledWith(testItem.key);
  });

  it('should handle invalid cache result for all operation', async () => {
    const invalidCache = {
      ...testItemCache,
      operations: {
        ...testItemCache.operations,
        all: vi.fn().mockResolvedValue('invalid result'),
      }
    } as unknown as TestItemCache;

    const InvalidAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={invalidCache}
        context={TestItemContext}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <InvalidAdapter>{children}</InvalidAdapter>
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
      expect(items).toBeNull();
    });
  });

  it('should handle findOne returning empty array', async () => {
    const emptyFindCache = {
      ...testItemCache,
      operations: {
        ...testItemCache.operations,
        find: vi.fn().mockResolvedValue([]),
      }
    } as unknown as TestItemCache;

    const EmptyFindAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={emptyFindCache}
        context={TestItemContext}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <EmptyFindAdapter>{children}</EmptyFindAdapter>
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
      const item = await result.current.findOne('testFinder', { name: 'test' });
      expect(item).toBeNull();
    });

    // Verify the correct mock was called
    expect(emptyFindCache.operations.find).toHaveBeenCalledWith('testFinder', { name: 'test' });
  });

  it('should handle async cache initialization', async () => {
    const asyncCache = Promise.resolve(testItemCache);

    const AsyncAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={asyncCache as any}
        context={TestItemContext}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <AsyncAdapter>{children}</AsyncAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    // Wait for async cache to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await act(async () => {
      const item = await result.current.get(testItem.key);
      expect(item).toEqual(testItem);
    });
  });

  it('should handle failed async cache initialization', async () => {
    const failedAsyncCache = Promise.reject(new Error('Cache initialization failed'));

    const FailedAsyncAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={failedAsyncCache as any}
        context={TestItemContext}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <FailedAsyncAdapter>{children}</FailedAsyncAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    // Wait for promise rejection to be handled
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await expect(async () => {
      await result.current.get(testItem.key);
    }).rejects.toThrow('Cache not initialized in test. Operation "get" failed.');
  });

  it('should handle cache without coordinate (no pkTypes)', async () => {
    const noPkTypesCache = {
      ...testItemCache,
      coordinate: undefined,
    } as unknown as TestItemCache;

    const NoPkTypesAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={noPkTypesCache}
        context={TestItemContext}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <NoPkTypesAdapter>{children}</NoPkTypesAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should use placeholder type when pkTypes is not available
    expect(result.current.pkTypes).toEqual(['placeholder']);
  });

  it('should handle aggregates configuration', async () => {
    const aggregatesConfig = {
      aggregate1: { cache: testItemCache, optional: false },
      aggregate2: { cache: testItemCache, optional: true }
    };

    const eventsConfig = {
      event1: { cache: testItemCache, optional: false }
    };

    const AggregatesAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={testItemCache}
        context={TestItemContext}
        aggregates={aggregatesConfig}
        events={eventsConfig}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <AggregatesAdapter>{children}</AggregatesAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.name).toBe('test');
  });

  it('should handle addActions functionality', async () => {
    const addActions = vi.fn().mockReturnValue({
      customAction: vi.fn()
    });

    const ActionsAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={testItemCache}
        context={TestItemContext}
        addActions={addActions}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <ActionsAdapter>{children}</ActionsAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    expect(result.current.addActions).toBe(addActions);
  });

  it('should handle addFacets functionality', async () => {
    const addFacets = vi.fn().mockReturnValue({
      customFacet: vi.fn()
    });

    const FacetsAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={testItemCache}
        context={TestItemContext}
        addFacets={addFacets}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <FacetsAdapter>{children}</FacetsAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    expect(result.current.addFacets).toBe(addFacets);
  });

  it('should handle addAllActions functionality', async () => {
    const addAllActions = vi.fn().mockReturnValue({
      customAllAction: vi.fn()
    });

    const AllActionsAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={testItemCache}
        context={TestItemContext}
        addAllActions={addAllActions}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <AllActionsAdapter>{children}</AllActionsAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    expect(result.current.addAllActions).toBe(addAllActions);
  });

  it('should handle addAllFacets functionality', async () => {
    const addAllFacets = vi.fn().mockReturnValue({
      customAllFacet: vi.fn()
    });

    const AllFacetsAdapter = ({ children }: { children: React.ReactNode }) => (
      <Adapter
        name="test"
        cache={testItemCache}
        context={TestItemContext}
        addAllFacets={addAllFacets}
      >
        {children}
      </Adapter>
    );

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <AllFacetsAdapter>{children}</AllFacetsAdapter>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    expect(result.current.addAllFacets).toBe(addAllFacets);
  });

  it('should handle all operations without query parameter', async () => {
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
      const items = await result.current.all();
      expect(items).toEqual([testItem]);
    });

    expect(testItemCache.operations.all).toHaveBeenCalledWith(undefined);
  });

  it('should handle one operation without query parameter', async () => {
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
      const item = await result.current.one();
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.operations.one).toHaveBeenCalledWith(undefined);
  });
});
