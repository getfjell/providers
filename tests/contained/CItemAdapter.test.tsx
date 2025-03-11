/* eslint-disable no-undefined */
import { CItemAdapter, useCItemAdapter } from '../../src/contained/CItemAdapter';
import { CItemAdapterContextType } from '../../src/contained/CItemAdapterContext';
import { ComKey, Item, LocKeyArray, PriKey, UUID } from '@fjell/core';
import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { CacheMap } from '@fjell/cache/dist/src/CacheMap';
import { Cache } from '@fjell/cache/dist/src/Cache';
import { AggregateConfig } from '@fjell/cache/dist/src/Aggregator';

interface TestItem extends Item<'test', 'container'> {
  name: string;
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

  let cacheMap: CacheMap<TestItem, 'test', 'container'>;
  let testItemCache: TestItemCache;
  let TestItemContext: React.Context<TestItemAdapterContextType | undefined>;
  let TestItemAdapter: React.FC<{ children: ReactNode }>;
  let useTestItemAdapter: () => TestItemAdapterContextType;

  beforeEach(() => {
    jest.resetAllMocks();

    cacheMap = new CacheMap<TestItem, 'test', 'container'>(['test']);

    testItemCache = {
      pkTypes: ['test', 'container'],
      // @ts-ignore
      all: jest.fn().mockResolvedValue([cacheMap, [testItem]]),
      // @ts-ignore
      one: jest.fn().mockResolvedValue([cacheMap, testItem]),
      // @ts-ignore
      create: jest.fn().mockResolvedValue([cacheMap, testItem]),
      // @ts-ignore
      get: jest.fn().mockResolvedValue([cacheMap, testItem]),
      // @ts-ignore
      remove: jest.fn().mockResolvedValue(cacheMap),
      // @ts-ignore
      retrieve: jest.fn().mockResolvedValue([cacheMap, testItem]),
      // @ts-ignore
      update: jest.fn().mockResolvedValue([cacheMap, testItem]),
      // @ts-ignore
      action: jest.fn().mockResolvedValue([cacheMap, testItem]),
      // @ts-ignore
      allAction: jest.fn().mockResolvedValue([cacheMap, [testItem]]),
      // @ts-ignore
      set: jest.fn().mockResolvedValue([cacheMap, testItem]),
    } as unknown as jest.Mocked<TestItemCache>;

    TestItemContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

    TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
      <CItemAdapter name="test" cache={testItemCache} context={TestItemContext}>
        {children}
      </CItemAdapter>
    );

    useTestItemAdapter = () =>
      useCItemAdapter<TestItem, 'test', 'container'>(TestItemContext);
  });

  it('should provide context value', () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });
    const { pkTypes } = result.current;
    expect(pkTypes).toEqual(['test', 'container']);
  });

  it('should fetch all items', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

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

    await act(async () => {
      await result.current.allAction('someAction', { data: 'test' }, locKeyArray,);
    });
    expect(testItemCache.allAction).toHaveBeenCalledTimes(1);
    expect(testItemCache.allAction).toHaveBeenCalledWith('someAction', { data: 'test' }, locKeyArray);
  });
  
  it('should throw error when used outside of provider', () => {
    expect(() => {
      const {} = renderHook(() => useTestItemAdapter());
    }).toThrow(`This generic item adapter hook must be used within a ${TestItemContext.displayName}`);
  });

  it('should create adapter with aggregates and events', () => {
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
    expect(result.current).toBeDefined();
  });

  it('should set an item', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestItemAdapter>{children}</TestItemAdapter>
    );

    const { result } = renderHook(() => useTestItemAdapter(), { wrapper });

    await act(async () => {
      await result.current.set(itemKey, testItem);
    });
    expect(testItemCache.set).toHaveBeenCalledTimes(1);
    expect(testItemCache.set).toHaveBeenCalledWith(itemKey, testItem);
  });
  
});