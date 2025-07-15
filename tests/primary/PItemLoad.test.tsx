
import { Cache, CacheMap } from "@fjell/cache";
import { Item, PriKey } from "@fjell/core";
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as PItem from '../../src/primary/PItem';
import * as PItemAdapter from '../../src/primary/PItemAdapter';
import { PItemLoad } from '../../src/primary/PItemLoad';

// Test data
const fixedDate = new Date('2023-01-01T00:00:00.000Z');
const testItem: Item<'test'> = {
  key: { kt: 'test', pk: 'test-key' } as PriKey<'test'>,
  id: 'test-id',
  name: 'Test Item',
  createdAt: fixedDate,
  updatedAt: fixedDate,
};
const priKey = testItem.key;

// Create a shared CacheMap instance for all tests
const sharedCacheMap = new CacheMap<Item<'test'>, 'test'>(['test']);

// Create a mock cache that properly manages its internal cacheMap
const createMockCache = () => {
  return {
    pkTypes: ['test'],
    cacheMap: sharedCacheMap,
    retrieve: vi.fn().mockImplementation(async (key: PriKey<'test'>) => {
      if ((sharedCacheMap as any).includesKey(key)) {
        return [null, (sharedCacheMap as any).get(key)];
      }
      (sharedCacheMap as any).set(key, testItem);
      return [sharedCacheMap.clone(), testItem];
    }),
    get: vi.fn().mockImplementation(async (key: PriKey<'test'>) => {
      (sharedCacheMap as any).set(key, testItem);
      return [sharedCacheMap.clone(), testItem];
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    remove: vi.fn().mockImplementation(async (_key: PriKey<'test'>) => {
      (sharedCacheMap as any).delete(priKey);
      return sharedCacheMap.clone();
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    update: vi.fn().mockImplementation(async (_key: PriKey<'test'>, _item: Partial<Item<'test'>>) => {
      const updatedItem = { ...testItem };
      (sharedCacheMap as any).set(priKey, updatedItem);
      return [sharedCacheMap.clone(), updatedItem];
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    set: vi.fn().mockImplementation(async (_key: PriKey<'test'>, _item: Item<'test'>) => {
      (sharedCacheMap as any).set(priKey, testItem);
      return [sharedCacheMap.clone(), testItem];
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    create: vi.fn().mockImplementation(async (_item: Partial<Item<'test'>>) => {
      (sharedCacheMap as any).set(priKey, testItem);
      return [sharedCacheMap.clone(), testItem];
    }),
  } as unknown as Cache<Item<'test'>, 'test'>;
};

let testItemCache: Cache<Item<'test'>, 'test'>;

// Create contexts for testing
const TestItemAdapterContext = React.createContext<PItemAdapter.ContextType<Item<'test'>, 'test'> | null>(null);
const TestItemProviderContext = React.createContext<PItem.ContextType<Item<'test'>, 'test'> | null>(null);

// Test adapter component
const TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
  <PItemAdapter.Adapter
    name="test"
    cache={testItemCache}
    context={TestItemAdapterContext}
  >
    {children}
  </PItemAdapter.Adapter>
);

// Test provider component
const TestItemProvider = ({ children, ik, item }: { children: React.ReactNode; ik?: PriKey<'test'> | null; item?: Item<'test'> | null }) => (
  <PItemLoad
    name='TestItemProvider'
    adapter={TestItemAdapterContext}
    context={TestItemProviderContext}
    contextName='TestItemProvider'
    ik={ik}
    item={item}
  >
    {children}
  </PItemLoad>
);

describe('PItemLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the shared cache map before each test
    const keys = Array.from((sharedCacheMap as any).keys());
    keys.forEach(key => (sharedCacheMap as any).delete(key));
    testItemCache = createMockCache();
  });

  it('should retrieve an item with an itemKey', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    expect(result.current?.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    expect(result.current?.isLoading).toBe(false);
    expect(testItemCache.retrieve).toHaveBeenCalledWith(priKey);
  });

  it('should remove an item', async () => {
    (sharedCacheMap as any).set(priKey, testItem);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    await act(async () => {
      await result.current?.remove();
    });

    expect(testItemCache.remove).toHaveBeenCalledWith(priKey);
  });

  it('should update an item', async () => {
    (sharedCacheMap as any).set(priKey, testItem);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });
    await waitFor(() => expect(result.current?.item).toEqual(testItem));
    const updatedItem = { ...testItem, name: 'Updated Item' };
    await act(async () => {
      await result.current?.update(updatedItem);
    });
    expect(testItemCache.update).toHaveBeenCalledWith(priKey, updatedItem);
  });

  it('should handle loading states', async () => {
    const delayedCache = {
      ...createMockCache(),
      retrieve: vi.fn().mockImplementation((key: PriKey<'test'>) =>
        new Promise(resolve => {
          setTimeout(() => {
            (sharedCacheMap as any).set(key, testItem);
            resolve([sharedCacheMap.clone(), testItem]);
          }, 100);
        })
      ),
    } as unknown as Cache<Item<'test'>, 'test'>;
    testItemCache = delayedCache;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>{children}</TestItemProvider>
      </TestItemAdapter>
    );
    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });
    expect(result.current?.isLoading).toBe(true);
    await waitFor(() => {
      expect(result.current?.isLoading).toBe(false);
    });
    expect(result.current?.item).toEqual(testItem);
  });

  it('should handle provided item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider item={testItem}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );
    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });
    expect(result.current?.item).toEqual(testItem);
    expect(result.current?.isLoading).toBe(false);
  });

  it('should handle null item key', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={null}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    expect(result.current?.isLoading).toBe(false);
    expect(result.current?.item).toBeNull();
  });

  it('should handle invalid item key', async () => {
    const invalidKey = { pk: '', sk: 'test-sk' } as PriKey<'test'>;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={invalidKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );
    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });
    expect(result.current?.isLoading).toBe(false);
    expect(result.current?.item).toBeNull();
  });
});
