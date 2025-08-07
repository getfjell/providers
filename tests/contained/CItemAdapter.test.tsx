/* eslint-disable no-undefined */
import * as React from 'react';
import { Adapter, ContextType, useCItemAdapter } from '../../src/contained/CItemAdapter';
import { ComKey, Item, LocKeyArray, PriKey, UUID } from '@fjell/core';
import { vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryCacheMap } from '@fjell/cache';
import { Cache } from '@fjell/cache';
import { AggregateConfig } from '@fjell/cache';
import { beforeEach, describe, expect, it } from 'vitest';

interface TestItem extends Item<'test', 'container'> {
  name: string;
  key: ComKey<'test', 'container'>;
  events: {
    created: { at: Date };
    updated: { at: Date };
    deleted: { at: null };
  };
}

type TestItemAdapterContextType = ContextType<TestItem, 'test', 'container'>;
type TestItemCache = Cache<TestItem, 'test', 'container'>;

describe('CItemAdapter', () => {
  const priKey: PriKey<'test'> = { pk: '1-1-1-1-1' as UUID, kt: 'test' };
  const locKeyArray: LocKeyArray<'container'> = [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }];
  const itemKey: ComKey<'test', 'container'> = { kt: priKey.kt, pk: priKey.pk, loc: locKeyArray };
  const testItem: TestItem = {
    key: itemKey,
    name: 'test',
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  };

  let cacheMap: CacheMap<TestItem, 'test', 'container', never, never, never, never>;
  let testItemCache: TestItemCache;
  let TestItemContext: React.Context<TestItemAdapterContextType | undefined>;
  let TestItemAdapter: React.FC<{ children: ReactNode }>;
  let useTestItemAdapter: () => TestItemAdapterContextType;

  beforeEach(() => {
    vi.resetAllMocks();

    cacheMap = new MemoryCacheMap<TestItem, 'test', 'container', never, never, never, never>(['test']);
    (cacheMap as any).set(itemKey, testItem);

    testItemCache = {
      coordinate: { kta: ['test', 'container'] },
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
        reset: vi.fn().mockResolvedValue([cacheMap]),
      }
    } as unknown as TestItemCache;

    TestItemContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

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

    useTestItemAdapter = () =>
      useCItemAdapter<TestItem, 'test', 'container'>(TestItemContext, 'TestItemContext');
  });

  it('should provide context value', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current.pkTypes).toEqual(['test', 'container']);
    });
  });

  it('should fetch all items', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      await result.current.all({}, locKeyArray);
    });
    expect(testItemCache.operations.all).toHaveBeenCalledTimes(1);
  });

  it('should fetch one item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      await result.current.one({}, locKeyArray);
    });
    expect(testItemCache.operations.one).toHaveBeenCalledTimes(1);
  });

  it('should create an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      await result.current.create({ name: 'new test' }, locKeyArray);
    });
    expect(testItemCache.operations.create).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.create).toHaveBeenCalledWith({ name: 'new test' }, locKeyArray);
  });

  it('should get an item by key', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      await result.current.get(itemKey);
    });
    expect(testItemCache.operations.get).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.get).toHaveBeenCalledWith(itemKey);
  });

  it('should remove an item by key', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      await result.current.remove(itemKey);
    });
    expect(testItemCache.operations.remove).toHaveBeenCalledWith(itemKey);
  });

  it('should retrieve an item by key', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      await result.current.retrieve(itemKey);
    });
    expect(testItemCache.operations.retrieve).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.retrieve).toHaveBeenCalledWith(itemKey);
  });

  it('should update an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      await result.current.update(itemKey, { name: 'updated test' });
    });
    expect(testItemCache.operations.update).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.update).toHaveBeenCalledWith(itemKey, { name: 'updated test' });
  });

  it('should perform an action on an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      await result.current.action(itemKey, 'someAction', { data: 'test' });
    });
    expect(testItemCache.operations.action).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.action).toHaveBeenCalledWith(itemKey, 'someAction', { data: 'test' });
  });

  it('should perform an action on all items', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      await result.current.allAction('someAction', { data: 'test' }, locKeyArray);
    });
    expect(testItemCache.operations.allAction).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.allAction).toHaveBeenCalledWith('someAction', { data: 'test' }, locKeyArray);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      renderHook(() => useTestItemAdapter());
    }).toThrow(`This hook must be used within a TestItemContext`);
  });

  it('should create adapter with aggregates and events', async () => {
    const aggregates = {
      test: {
        cache: testItemCache,
        optional: false,
      },
    } as unknown as AggregateConfig;

    const events = {
      created: {
        cache: testItemCache,
        optional: false,
      },
    } as unknown as AggregateConfig;

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <Adapter<TestItem, 'test', 'container'>
        name="test"
        cache={testItemCache}
        context={TestItemContext}
        aggregates={aggregates}
        events={events}
      >
        {children}
      </Adapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });

  it('should set an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      await result.current.set(itemKey, testItem);
    });
    expect(testItemCache.operations.set).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.set).toHaveBeenCalledWith(itemKey, testItem);
  });

  it('should perform facet operation on an item', async () => {
    const mockFacetResponse = { count: 5, data: 'facet result' };
    testItemCache.operations.facet = vi.fn().mockResolvedValue([cacheMap, mockFacetResponse]);

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    let facetResult: any;
    await act(async () => {
      facetResult = await result.current.facet(itemKey, 'testFacet');
    });

    expect(testItemCache.operations.facet).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.facet).toHaveBeenCalledWith(itemKey, 'testFacet');
    expect(facetResult).toEqual(mockFacetResponse);
  });

  it('should perform allFacet operation', async () => {
    const mockAllFacetResponse = { totalCount: 10, summary: 'all facet result' };
    testItemCache.operations.allFacet = vi.fn().mockResolvedValue([cacheMap, mockAllFacetResponse]);

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const facetParams = { status: 'active', limit: 10 };
    let allFacetResult: any;
    await act(async () => {
      allFacetResult = await result.current.allFacet('summaryFacet', facetParams);
    });

    expect(testItemCache.operations.allFacet).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.allFacet).toHaveBeenCalledWith('summaryFacet', facetParams);
    expect(allFacetResult).toEqual(mockAllFacetResponse);
  });

  it('should perform find operation', async () => {
    const mockFindResults = [testItem];
    testItemCache.operations.find = vi.fn().mockResolvedValue([cacheMap, mockFindResults]);

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const finderParams = { name: 'test', status: 'active' };
    let findResults: TestItem[];
    await act(async () => {
      findResults = await result.current.find('byNameAndStatus', finderParams, locKeyArray);
    });

    expect(testItemCache.operations.find).toHaveBeenCalledTimes(1);
    expect(testItemCache.operations.find).toHaveBeenCalledWith('byNameAndStatus', finderParams, locKeyArray);
    expect(findResults).toEqual(mockFindResults);
  });

  describe('Error handling scenarios', () => {
    it('should throw error when cache is not initialized for all operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.all();
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "all" failed.');
    });

    it('should throw error when cache is not initialized for one operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.one();
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "one" failed.');
    });

    it('should throw error when cache is not initialized for create operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.create({ name: 'test' });
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "create" failed.');
    });

    it('should throw error when cache is not initialized for get operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.get(itemKey);
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "get" failed.');
    });

    it('should throw error when cache is not initialized for remove operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.remove(itemKey);
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "remove" failed.');
    });

    it('should throw error when cache is not initialized for retrieve operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.retrieve(itemKey);
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "retrieve" failed.');
    });

    it('should throw error when cache is not initialized for update operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.update(itemKey, { name: 'updated' });
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "update" failed.');
    });

    it('should throw error when cache is not initialized for action operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.action(itemKey, 'testAction');
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "action" failed.');
    });

    it('should throw error when cache is not initialized for allAction operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.allAction('testAction');
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "allAction" failed.');
    });

    it('should throw error when cache is not initialized for facet operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.facet(itemKey, 'testFacet');
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "facet" failed.');
    });

    it('should throw error when cache is not initialized for allFacet operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.allFacet('testFacet');
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "allFacet" failed.');
    });

    it('should throw error when cache is not initialized for find operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.find('testFinder', {});
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "find" failed.');
    });

    it('should throw error when cache is not initialized for set operation', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.set(itemKey, testItem);
        });
      }).rejects.toThrow('Cache not initialized in test. Operation "set" failed.');
    });
  });

  describe('Promise-based cache initialization', () => {
    it('should handle promise-based cache initialization successfully', async () => {
      // Create a mock cache that has the coordinate property
      const promiseCacheObject = {
        coordinate: { kta: ['test', 'container'] },
        registry: {},
        api: {},
        cacheMap: cacheMap,
        operations: testItemCache.operations,
        then: (resolve: (value: any) => void) => {
          setTimeout(() => resolve(testItemCache), 0);
          return Promise.resolve(testItemCache);
        }
      } as any;

      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={promiseCacheObject}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.pkTypes).toEqual(['test', 'container']);
      });

      // Wait a bit for promise resolution
      await new Promise(resolve => setTimeout(resolve, 10));

      await act(async () => {
        await result.current.all();
      });

      expect(testItemCache.operations.all).toHaveBeenCalled();
    });

    it('should handle promise-based cache initialization failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a mock cache that will reject
      const promiseCacheObject = {
        coordinate: { kta: ['test', 'container'] },
        registry: {},
        api: {},
        cacheMap: cacheMap,
        operations: {},
        then: (resolve: (value: any) => void, reject?: (error: any) => void) => {
          if (reject) {
            setTimeout(() => reject(new Error('Cache initialization failed')), 0);
          }
          return Promise.reject(new Error('Cache initialization failed'));
        },
        catch: (handler: (error: any) => void) => {
          handler(new Error('Cache initialization failed'));
          return Promise.reject(new Error('Cache initialization failed'));
        }
      } as any;

      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={promiseCacheObject}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      // Wait for promise rejection to be handled
      await new Promise(resolve => setTimeout(resolve, 10));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cache map state management', () => {
    it('should update cache map when operations return new cache map', async () => {
      const newCacheMap = new MemoryCacheMap<TestItem, 'test', 'container', never, never, never, never>(['test']);
      const updatedItem = { ...testItem, name: 'updated' };
      newCacheMap.set(itemKey, updatedItem);

      testItemCache.operations.update = vi.fn().mockResolvedValue([newCacheMap, updatedItem]);

      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <TestItemAdapter>{children}</TestItemAdapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      await act(async () => {
        await result.current.update(itemKey, { name: 'updated' });
      });

      // The cache map should be updated with the new one returned from the operation
      expect(result.current.cacheMap).toBeDefined();
    });

    it('should handle retrieve when item exists but newCacheMap is null', async () => {
      // Simulate case where item is cached but newCacheMap is null
      testItemCache.operations.retrieve = vi.fn().mockResolvedValue([null, testItem]);

      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <TestItemAdapter>{children}</TestItemAdapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      let retrievedItem: TestItem;
      await act(async () => {
        retrievedItem = await result.current.retrieve(itemKey);
      });

      expect(retrievedItem).toEqual(testItem);
      expect(testItemCache.operations.retrieve).toHaveBeenCalledWith(itemKey);
    });
  });

  describe('Add actions and facets functionality', () => {
    it('should provide addActions in context when passed as prop', async () => {
      const mockAddActions = vi.fn(() => ({
        customAction: vi.fn().mockResolvedValue(testItem)
      }));

      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={testItemCache}
          context={TestItemContext}
          addActions={mockAddActions}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.addActions).toBe(mockAddActions);
      });
    });

    it('should provide addFacets in context when passed as prop', async () => {
      const mockAddFacets = vi.fn(() => ({
        customFacet: vi.fn().mockResolvedValue({ data: 'facet result' })
      }));

      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={testItemCache}
          context={TestItemContext}
          addFacets={mockAddFacets}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.addFacets).toBe(mockAddFacets);
      });
    });

    it('should provide addAllActions in context when passed as prop', async () => {
      const mockAddAllActions = vi.fn(() => ({
        customAllAction: vi.fn().mockResolvedValue([testItem])
      }));

      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={testItemCache}
          context={TestItemContext}
          addAllActions={mockAddAllActions}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.addAllActions).toBe(mockAddAllActions);
      });
    });

    it('should provide addAllFacets in context when passed as prop', async () => {
      const mockAddAllFacets = vi.fn(() => ({
        customAllFacet: vi.fn().mockResolvedValue({ summary: 'all facet result' })
      }));

      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={testItemCache}
          context={TestItemContext}
          addAllFacets={mockAddAllFacets}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.addAllFacets).toBe(mockAddAllFacets);
      });
    });
  });

  describe('Cache validation', () => {
    it('should handle undefined cache gracefully', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={undefined as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.name).toBe('test');
        expect(result.current.pkTypes).toBeUndefined();
      });

      // Component should handle undefined cache without crashing
      expect(() => result.current.name).not.toThrow();
    });

    it('should handle null cache gracefully', async () => {
      const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Adapter
          name="test"
          cache={null as any}
          context={TestItemContext}
        >
          {children}
        </Adapter>
      );

      const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.name).toBe('test');
        expect(result.current.pkTypes).toBeUndefined();
      });

      // Component should handle null cache without crashing
      expect(() => result.current.name).not.toThrow();
    });
  });
});
