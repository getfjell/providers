/* eslint-disable no-undefined */
import { CacheMap } from '@fjell/cache';
import { Item, PriKey, UUID } from '@fjell/core';
import { act, renderHook } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { PItemAdapter, usePItemAdapter } from '../../src/primary/PItemAdapter';
import { PItemAdapterContextType } from '../../src/primary/PItemAdapterContext';
import { Cache } from '@fjell/cache';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

interface TestItem extends Item<'test'> {
  name: string;
}

type TestItemAdapterContextType = PItemAdapterContextType<TestItem, 'test'>;
type TestItemCache = Cache<TestItem, 'test'>;

describe('PItemAdapter', () => {

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

  let cacheMap: CacheMap<TestItem, 'test'>;
  let testItemCache: TestItemCache;
  let TestItemContext: React.Context<TestItemAdapterContextType | undefined>;
  let TestItemAdapter: React.FC<{ children: ReactNode }>;
  let useTestItemAdapter: () => TestItemAdapterContextType;

  beforeEach(() => {
    vi.resetAllMocks();

    cacheMap = new CacheMap<TestItem, 'test'>(['test']);

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
    } as unknown as jest.Mocked<TestItemCache>;

    TestItemContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

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
        context: TestItemContext,
        children,
      });
    }

    useTestItemAdapter = () => usePItemAdapter<
      TestItem,
      "test"
    >(TestItemContext);

  });

  it('should provide context value', () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>
        {children}
      </TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });
    const { pkTypes } = result.current;
    expect(pkTypes).toEqual(['test']);
  });

  it('should fetch all items', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>
        {children}
      </TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await act(async () => {
      const items = await result.current.all();
      expect(items).toEqual([testItem]);
    });
    expect(testItemCache.all).toHaveBeenCalledTimes(1);
  });

  it('should fetch one item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>
        {children}
      </TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await act(async () => {
      const item = await result.current.one();
      expect(item).toEqual(testItem);
    });
    expect(testItemCache.one).toHaveBeenCalledTimes(1);
  });

  it('should create an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>
        {children}
      </TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await act(async () => {
      const newItem = await result.current.create({ name: 'new test' });
      expect(newItem).toEqual(testItem);
    });
    expect(testItemCache.create).toHaveBeenCalledTimes(1);
    expect(testItemCache.create).toHaveBeenCalledWith({ name: 'new test' });
  });

  it('should get an item by key', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>
        {children}
      </TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await act(async () => {
      const item = await result.current.get(priKey);
      expect(item).toEqual(testItem);
    });
    expect(testItemCache.get).toHaveBeenCalledTimes(1);
    expect(testItemCache.get).toHaveBeenCalledWith(priKey);
  });

  it('should remove an item by key', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>
        {children}
      </TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await act(async () => {
      await result.current.remove(priKey);
      expect(testItemCache.remove).toHaveBeenCalledTimes(1)
    });
    expect(testItemCache.remove).toHaveBeenCalledWith(priKey);
  });
  it('should retrieve an item by key', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>
        {children}
      </TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await act(async () => {
      const item = await result.current.retrieve(priKey);
      expect(item).toEqual(testItem)
    });
    expect(testItemCache.retrieve).toHaveBeenCalledTimes(1);
    expect(testItemCache.retrieve).toHaveBeenCalledWith(priKey);
  });

  it('should update an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>
        {children}
      </TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await act(async () => {
      const updatedItem = await result.current.update(priKey, { name: 'updated test' });
      expect(updatedItem).toEqual(testItem)
    });
    expect(testItemCache.update).toHaveBeenCalledTimes(1);
    expect(testItemCache.update).toHaveBeenCalledWith(priKey, { name: 'updated test' });
  });

  it('should perform an action on an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>
        {children}
      </TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await act(async () => {
      const actionResult = await result.current.action(priKey, 'testAction', { data: 'testData' });
      expect(actionResult).toEqual(testItem);
    });
    expect(testItemCache.action).toHaveBeenCalledTimes(1);
    expect(testItemCache.action).toHaveBeenCalledWith(priKey, 'testAction', { data: 'testData' });
  });

  it('should perform an action on all items', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>
        {children}
      </TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await act(async () => {
      const actionResult = await result.current.allAction('testAllAction', { data: 'testData' });
      expect(actionResult).toEqual([testItem])
    });
    expect(testItemCache.allAction).toHaveBeenCalledTimes(1);
    expect(testItemCache.allAction).toHaveBeenCalledWith('testAllAction', { data: 'testData' });
  });

  it('should handle error when calling usePItemAdapter', async () => {
    expect(() =>
      // @ts-ignore
      usePItemAdapter<TestItem, 'test'>(null)).toThrow("Cannot read properties of null (reading '_context')");
  });
});
