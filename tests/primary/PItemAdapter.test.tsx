/* eslint-disable no-undefined */
import * as React from 'react';
import { PItemAdapter } from '../../src/primary/PItemAdapter';
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

    // Create context
    TestItemContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

    // Create adapter component
    TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
      <PItemAdapter
        name="test"
        cache={testItemCache}
        context={TestItemContext}
        aggregates={{}}
        events={{}}
      >
        {children}
      </PItemAdapter>
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

    expect(testItemCache.get).toHaveBeenCalledTimes(1);
    expect(testItemCache.get).toHaveBeenCalledWith(testItem.key);
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

    expect(testItemCache.create).toHaveBeenCalledTimes(1);
    expect(testItemCache.create).toHaveBeenCalledWith(testItem);
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

    expect(testItemCache.update).toHaveBeenCalledTimes(1);
    expect(testItemCache.update).toHaveBeenCalledWith(testItem.key, testItem);
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

    expect(testItemCache.remove).toHaveBeenCalledTimes(1);
    expect(testItemCache.remove).toHaveBeenCalledWith(testItem.key);
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
      const item = await result.current.action('testAction', testItem.key, { data: 'test' });
      expect(item).toEqual(testItem);
    });

    expect(testItemCache.action).toHaveBeenCalledTimes(1);
    expect(testItemCache.action).toHaveBeenCalledWith('testAction', testItem.key, { data: 'test' });
  });
});
