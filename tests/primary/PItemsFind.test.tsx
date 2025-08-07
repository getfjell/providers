/* eslint-disable no-undefined */
import * as React from 'react';
import { PItemsFind } from '../../src/primary/PItemsFind';
import { PItemAdapterContextType } from '../../src/primary/PItemAdapterContext';
import { ComKey, Item, PriKey, UUID } from '@fjell/core';
import { vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryCacheMap } from '@fjell/cache';
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

describe('PItemsFind', () => {
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
  let TestItemContext: React.Context<TestItemAdapterContextType | undefined>;
  let TestItemAdapter: React.FC<{ children: ReactNode }>;

  beforeEach(() => {
    vi.resetAllMocks();

    cacheMap = new MemoryCacheMap<TestItem, 'test'>(['test']);
    (cacheMap as any).set(testItem.key, testItem);

    testItemCache = {
      name: 'test',
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
      cacheMap: cacheMap,
    } as unknown as TestItemAdapterContextType;

    TestItemContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

    TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
      <PItemsFind
        name="test"
        adapter={TestItemContext}
        context={TestItemContext}
        contextName="TestItemContext"
        finder="test"
        finderParams={{ name: 'test' }}
      >
        {children}
      </PItemsFind>
    );
  });

  it('should find items', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemContext.Provider value={testItemCache}>
        <TestItemAdapter>{children}</TestItemAdapter>
      </TestItemContext.Provider>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // Wait for initial mount effect to complete
    await waitFor(() => {
      expect(testItemCache.find).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      const [, items] = await result.current.find('test', { name: 'test' });
      expect(items).toEqual([testItem]);
    });

    expect(testItemCache.find).toHaveBeenCalledTimes(2);
    expect(testItemCache.find).toHaveBeenCalledWith('test', { name: 'test' });
  });
});
