/* eslint-disable no-undefined */
import { PItemAdapter } from '../../src/primary/PItemAdapter';
import { PItemLoad } from '../../src/primary/PItemLoad';
import { CacheMap } from '@fjell/cache';
import { Item, PriKey, UUID } from '@fjell/core';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { PItemAdapterContext, PItemAdapterContextType } from '../../src/primary/PItemAdapterContext';
import { PItemContext, PItemContextType, usePItem } from '../../src/primary/PItemContext';
import { Cache } from '@fjell/cache';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

interface TestItem extends Item<'test'> {
  name: string;
}

type TestItemAdapterContextType = PItemAdapterContextType<TestItem, 'test'>;
type TestItemProviderContextType = PItemContextType<TestItem, 'test'>;
type TestItemCache = Cache<TestItem, 'test'>;

describe('PItemProvider', () => {
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
  let TestItemProviderContext: PItemContext<TestItem, 'test'>;
  let TestItemAdapter: React.FC<{ children: React.ReactNode }>;
  let TestItemProvider: React.FC<{
    ik: PriKey<'test'>,
    children: React.ReactNode
  }>;

  beforeEach(() => {
    vi.resetAllMocks();

    emptyCacheMap = new CacheMap<TestItem, 'test'>(['test']);

    cacheMap = new CacheMap<TestItem, 'test'>(['test']);
    cacheMap.set(priKey, testItem);

    testItemCache = {
      pkTypes: ['test'],
      all: vi.fn().mockResolvedValue([cacheMap, [testItem]]),
      one: vi.fn().mockResolvedValue([cacheMap, testItem]),
      create: vi.fn().mockResolvedValue([cacheMap, testItem]),
      get: vi.fn().mockResolvedValue([cacheMap, testItem]),
      remove: vi.fn().mockResolvedValue(emptyCacheMap),
      retrieve: vi.fn().mockResolvedValue([cacheMap, testItem]),
      update: vi.fn().mockResolvedValue([cacheMap, testItem]),
      action: vi.fn().mockResolvedValue([cacheMap, testItem]),
      allAction: vi.fn().mockResolvedValue([cacheMap, [testItem]]),
    } as unknown as jest.Mocked<TestItemCache>;

    TestItemAdapterContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);
    TestItemProviderContext = React.createContext<TestItemProviderContextType | undefined>(undefined);

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

    TestItemProvider = (
      {
        ik,
        children,
      }: {
        ik: PriKey<'test'>;
        children: React.ReactNode;
      }
    ) => {
      return PItemLoad<
        TestItem,
        'test'
      >({
        name: 'test',
        ik,
        adapter: TestItemAdapterContext,
        context: TestItemProviderContext,
        children,
      });
    };

  });

  it('should retrieve an item with an itemKey', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider
          ik={priKey}
        >
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemProviderContext), { wrapper });

    waitFor(() => {
      const item = result.current.item;
      expect(item).toEqual([testItem]);
    });
  });

  it('should remove an item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider
          ik={priKey}
        >
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    await act(async () => {
      await result.current.remove();
    });
    expect(testItemCache.remove).toHaveBeenCalledWith(priKey);
  });

  it('should update an item', async () => {
    const updatedItem = { ...testItem, name: 'updated' };

    // @ts-ignore
    testItemCache.update.mockResolvedValueOnce([cacheMap, updatedItem]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider
          ik={priKey}
        >
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const item = await result.current.update({ name: 'updated' });
      expect(item).toEqual(updatedItem);
    });

    expect(testItemCache.update).toHaveBeenCalledWith(priKey, { name: 'updated' });
  });

  it('should perform an action on an item', async () => {
    const actionName = 'testAction';
    const actionBody = { data: 'testData' };
    const actionResult = { ...testItem, name: 'actionResult' };

    // @ts-ignore
    testItemCache.action.mockResolvedValueOnce([cacheMap, actionResult]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider
          ik={priKey}
        >
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const item = await result.current.action(actionName, actionBody);
      expect(item).toEqual(actionResult);
    });

    expect(testItemCache.action).toHaveBeenCalledWith(priKey, actionName, actionBody);
  });

  it('should handle an invalid ik that is just a string', async () => {
    const invalidKey = '1-1-1-1-1';

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider
          // @ts-ignore - Intentionally passing invalid type for test
          ik={invalidKey}
        >
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.item).toBeNull();
      expect(result.current.isLoading).toBeFalsy();
    });

    expect(testItemCache.retrieve).not.toHaveBeenCalled();
  });

  it('should handle a null ik', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider
          // @ts-ignore - Intentionally passing invalid type for test
          ik={null}
        >
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.item).toBeNull();
      expect(result.current.isLoading).toBeFalsy();
    });

    expect(testItemCache.retrieve).not.toHaveBeenCalled();
  });

  it('should handle a PriKey with null pk', async () => {
    const invalidPriKey: PriKey<'test'> = { pk: null as unknown as UUID, kt: 'test' };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider
          ik={invalidPriKey}
        >
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => usePItem(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.item).toBeNull();
      expect(result.current.isLoading).toBeFalsy();
    });

    expect(testItemCache.retrieve).not.toHaveBeenCalled();
  });

});