/* eslint-disable no-undefined */
import * as React from 'react';
import { CItemAdapter, useCItemAdapter } from '../../src/contained/CItemAdapter';
import { CItemAdapterContextType } from '../../src/contained/CItemAdapterContext';
import { ComKey, Item, LocKeyArray, PriKey, UUID } from '@fjell/core';
import { vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { CacheMap } from '@fjell/cache';
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

type TestItemAdapterContextType = CItemAdapterContextType<TestItem, 'test', 'container'>;
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

    cacheMap = new CacheMap<TestItem, 'test', 'container', never, never, never, never>(['test']);
    (cacheMap as any).set(itemKey, testItem);

    testItemCache = {
      pkTypes: ['test', 'container'],
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

    TestItemContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

    TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
      <CItemAdapter
        name="test"
        cache={testItemCache}
        context={TestItemContext}
        aggregates={{}}
        events={{}}
      >
        {children}
      </CItemAdapter>
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
    expect(testItemCache.all).toHaveBeenCalledTimes(1);
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
    expect(testItemCache.one).toHaveBeenCalledTimes(1);
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
    expect(testItemCache.create).toHaveBeenCalledTimes(1);
    expect(testItemCache.create).toHaveBeenCalledWith({ name: 'new test' }, locKeyArray);
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
    expect(testItemCache.get).toHaveBeenCalledTimes(1);
    expect(testItemCache.get).toHaveBeenCalledWith(itemKey);
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
    expect(testItemCache.remove).toHaveBeenCalledWith(itemKey);
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
    expect(testItemCache.retrieve).toHaveBeenCalledTimes(1);
    expect(testItemCache.retrieve).toHaveBeenCalledWith(itemKey);
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
    expect(testItemCache.update).toHaveBeenCalledTimes(1);
    expect(testItemCache.update).toHaveBeenCalledWith(itemKey, { name: 'updated test' });
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
    expect(testItemCache.action).toHaveBeenCalledTimes(1);
    expect(testItemCache.action).toHaveBeenCalledWith(itemKey, 'someAction', { data: 'test' });
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
    expect(testItemCache.allAction).toHaveBeenCalledTimes(1);
    expect(testItemCache.allAction).toHaveBeenCalledWith('someAction', { data: 'test' }, locKeyArray);
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
      <CItemAdapter<TestItem, 'test', 'container'>
        name="test"
        cache={testItemCache}
        context={TestItemContext}
        aggregates={aggregates}
        events={events}
      >
        {children}
      </CItemAdapter>
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
    expect(testItemCache.set).toHaveBeenCalledTimes(1);
    expect(testItemCache.set).toHaveBeenCalledWith(itemKey, testItem);
  });
});
