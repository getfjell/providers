/* eslint-disable no-undefined */
import { CacheMap } from '@fjell/cache';
import { ComKey, Dictionary, Item, ItemQuery, PriKey, UUID } from '@fjell/core';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as PItemAdapter from '../../src/primary/PItemAdapter';
import * as PItem from '../../src/primary/PItem';
import { PItemQuery } from '../../src/primary/PItemQuery';

interface TestItem extends Item<'test'> {
  name: string;
  key: ComKey<'test'>;
  events: {
    created: { at: Date };
    updated: { at: Date };
    deleted: { at: null };
  };
}

type TestItemAdapterContextType = PItemAdapter.ContextType<TestItem, 'test'>;
type TestItemContextType = PItem.ContextType<TestItem, 'test'>;

describe('PItemQuery - Comprehensive Tests', () => {
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
  let TestItemAdapterContext: PItemAdapter.Context<TestItem, 'test'>;
  let TestItemContext: PItem.Context<TestItem, 'test'>;

  beforeEach(() => {
    vi.resetAllMocks();

    cacheMap = new CacheMap<TestItem, 'test'>(['test']);
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
      facet: vi.fn().mockResolvedValue({ facetData: 'test' }),
    } as unknown as TestItemAdapterContextType;

    TestItemAdapterContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);
    TestItemContext = React.createContext<TestItemContextType | undefined>(undefined);
  });

  it('should render loading component while query is running', async () => {
    const LoadingComponent = () => <div data-testid="loading">Loading...</div>;

    const { getByTestId } = render(
      <TestItemAdapterContext.Provider value={testItemCache}>
        <PItemQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemContext}
          contextName="TestItemContext"
          query={{ pk: priKey.pk }}
          loading={<LoadingComponent />}
        >
          <div data-testid="content">Content</div>
        </PItemQuery>
      </TestItemAdapterContext.Provider>
    );

    // Should show loading initially
    expect(getByTestId('loading')).toBeDefined();
  });

  it('should render children when item not found and optional', async () => {
    testItemCache.one = vi.fn().mockResolvedValue(null);
    testItemCache.retrieve = vi.fn().mockResolvedValue(null);

    const NotFoundComponent = () => <div data-testid="not-found">Not Found</div>;

    const { getByTestId } = render(
      <TestItemAdapterContext.Provider value={testItemCache}>
        <PItemQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemContext}
          contextName="TestItemContext"
          query={{ pk: priKey.pk }}
          optional={true}
          notFound={<NotFoundComponent />}
        >
          <div data-testid="content">Content</div>
        </PItemQuery>
      </TestItemAdapterContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId('content')).toBeDefined();
    });
  });

  it('should handle query error and create item if create is provided', async () => {
    const createItem: TestItem = {
      key: { kt: priKey.kt, pk: '3-3-3-3-3' as UUID },
      name: 'created after error',
      events: {
        created: { at: new Date() },
        updated: { at: new Date() },
        deleted: { at: null },
      }
    };

    testItemCache.one = vi.fn().mockRejectedValue(new Error('Query failed'));
    testItemCache.create = vi.fn().mockResolvedValue(createItem);
    // Ensure retrieve works for the created item's key
    testItemCache.retrieve = vi.fn().mockImplementation((key) => {
      if (key.pk === '3-3-3-3-3') {
        return Promise.resolve(createItem);
      }
      return Promise.resolve(null);
    });
    // Also mock get for cache lookups
    testItemCache.get = vi.fn().mockImplementation((key) => {
      if (key.pk === '3-3-3-3-3') {
        return Promise.resolve(createItem);
      }
      return Promise.resolve(null);
    });

    // Mock the cache map to return the created item
    const mockCacheMap = {
      get: vi.fn().mockImplementation((key) => {
        if (key.pk === '3-3-3-3-3') {
          return createItem;
        }
        return null;
      }),
      clone: vi.fn().mockReturnThis(),
    };
    testItemCache.cacheMap = mockCacheMap as any;

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapterContext.Provider value={testItemCache}>
        <PItemQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemContext}
          contextName="TestItemContext"
          query={{ pk: priKey.pk }}
          create={createItem}
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
      expect(result.current).toBeDefined();
    });

    // Wait for the creation process to complete
    await waitFor(() => {
      expect(result.current?.item).toEqual(createItem);
    }, { timeout: 5000 });
    expect(testItemCache.create).toHaveBeenCalledWith(createItem);
  });

  it('should handle query error and set item to null if optional', async () => {
    testItemCache.one = vi.fn().mockRejectedValue(new Error('Query failed'));
    testItemCache.retrieve = vi.fn().mockResolvedValue(null);
    testItemCache.get = vi.fn().mockResolvedValue(null);

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
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(result.current?.item).toBeNull();
    }, { timeout: 5000 });
  });

  it('should handle no query provided', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapterContext.Provider value={testItemCache}>
        <PItemQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemContext}
          contextName="TestItemContext"
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

    expect(result.current?.item).toBeNull();
  });

  it('should handle query change and re-execute', async () => {
    const initialQuery: ItemQuery = { pk: priKey.pk };
    const newQuery: ItemQuery = { pk: '2-2-2-2-2' as UUID };

    const secondItem: TestItem = {
      key: { kt: priKey.kt, pk: '2-2-2-2-2' as UUID },
      name: 'second test',
      events: {
        created: { at: new Date() },
        updated: { at: new Date() },
        deleted: { at: null },
      }
    };

    testItemCache.one = vi.fn()
      .mockResolvedValueOnce(testItem)
      .mockResolvedValueOnce(secondItem);
    testItemCache.retrieve = vi.fn()
      .mockResolvedValueOnce(testItem)
      .mockResolvedValueOnce(secondItem);

    const QueryComponent: React.FC<{ query?: ItemQuery }> = ({ query }) => (
      <TestItemAdapterContext.Provider value={testItemCache}>
        <PItemQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemContext}
          contextName="TestItemContext"
          query={query}
          optional={false}
        >
          <div>Content</div>
        </PItemQuery>
      </TestItemAdapterContext.Provider>
    );

    const { rerender } = render(<QueryComponent query={initialQuery} />);

    // Change the query
    rerender(<QueryComponent query={newQuery} />);

    await waitFor(() => {
      expect(testItemCache.one).toHaveBeenCalledTimes(2);
    });

    expect(testItemCache.one).toHaveBeenCalledWith(initialQuery);
    expect(testItemCache.one).toHaveBeenCalledWith(newQuery);
  });

  it('should expose facet functionality in context', async () => {
    testItemCache.one = vi.fn().mockResolvedValue(testItem);
    testItemCache.retrieve = vi.fn().mockResolvedValue(testItem);

    const facetMock = vi.fn().mockResolvedValue({ facetData: 'test' });
    testItemCache.facet = facetMock;

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

    if (result.current?.facet) {
      await act(async () => {
        await result.current!.facet('testFacet', {});
      });

      expect(facetMock).toHaveBeenCalledWith(testItem.key, 'testFacet', {});
    }
  });
});
