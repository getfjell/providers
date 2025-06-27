import { CacheMap } from '@fjell/cache';
import { Item, PriKey } from '@fjell/core';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as PItems from '../../src/primary/PItems';
import { PItemsProvider } from '../../src/primary/PItemsProvider';

interface TestItem extends Item<'test'> {
  key: PriKey<S>;
  events: {
    created: { at: Date, by: PriKey<S> };
    updated: { at: Date, by: PriKey<S> };
    deleted: { at: Date | null, by: PriKey<S> | null };
  };
  name: string;
}

const testItem: TestItem = {
  key: { kt: 'test', pk: '1-1-1-1-1' },
  name: 'test item',
  events: {
    created: { at: new Date(), by: { kt: 'test', pk: '1-1-1-1-1' } },
    updated: { at: new Date(), by: { kt: 'test', pk: '1-1-1-1-1' } },
    deleted: { at: null, by: null }
  }
};

// eslint-disable-next-line no-undefined
const TestItemsProviderContext = React.createContext<PItemsContextType<TestItem, 'test'> | undefined>(undefined);
TestItemsProviderContext.displayName = 'TestItemsProviderContext';

// eslint-disable-next-line no-undefined
const TestItemAdapterContext = React.createContext<PItemAdapterContextType<TestItem, 'test'> | undefined>(undefined);
TestItemAdapterContext.displayName = 'TestItemAdapterContext';

const TestItemsAdapter = ({ children }: { children: React.ReactNode }) => {
  const cacheMap = new CacheMap<TestItem, 'test'>();
  const adapter = {
    name: 'test',
    cacheMap,
    pkTypes: ['test'],
    all: vi.fn().mockResolvedValue([testItem]),
    one: vi.fn().mockResolvedValue(testItem),
    create: vi.fn().mockResolvedValue(testItem),
    get: vi.fn().mockResolvedValue(testItem),
    remove: vi.fn(),
    retrieve: vi.fn().mockResolvedValue(testItem),
    update: vi.fn().mockResolvedValue(testItem),
    action: vi.fn().mockResolvedValue(testItem),
    allAction: vi.fn().mockResolvedValue([testItem]),
    find: vi.fn().mockResolvedValue([testItem]),
    set: vi.fn().mockResolvedValue(testItem)
  };

  return (
    <TestItemAdapterContext.Provider value={adapter}>
      {children}
    </TestItemAdapterContext.Provider>
  );
};

const TestItemsProvider = ({ children }: { children: React.ReactNode }) => {
  return PItemsProvider<TestItem, 'test'>({
    name: 'test',
    items: [testItem],
    adapter: TestItemAdapterContext,
    context: TestItemsProviderContext,
    contextName: 'TestItemsProviderContext',
    children
  });
};

describe('PItemsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all items', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    // Wait for cache initialization
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const items = await result.current.all();
      expect(items).toEqual([testItem]);
    });
  });

  it('should create an item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    // Wait for cache initialization
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const newItem: TestItem = {
        key: { kt: 'test', pk: '2-2-2-2-2' },
        name: 'new test',
        events: testItem.events
      };
      const created = await result.current.create(newItem);
      expect(created).toEqual(testItem);
    });
  });

  it('should set an item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    // Wait for cache initialization
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const newItem: TestItem = {
      ...testItem,
      key: { kt: 'test', pk: '3-3-3-3-3' },
      name: 'new name'
    };

    await act(async () => {
      const retItem = await result.current.set(newItem.key, newItem);
      expect(retItem).toEqual(testItem);
    });
  });
});
