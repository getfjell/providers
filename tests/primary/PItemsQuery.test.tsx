/* eslint-disable no-undefined */
import { PItemAdapter } from '../../src/primary/PItemAdapter';
import { PItemsQuery } from '../../src/primary/PItemsQuery';
import { IQFactory, Item, PriKey, UUID } from '@fjell/core';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { PItemAdapterContextType } from '../../src/primary/PItemAdapterContext';
import { PItemsContextType, usePItems } from '../../src/primary/PItemsContext';
import { Cache } from '@fjell/cache/dist/src/Cache';
import { CacheMap } from '@fjell/cache/dist/src/CacheMap';

interface TestItem extends Item<'test'> {
  name: string;
}

type TestItemAdapterContextType = PItemAdapterContextType<TestItem, 'test'>;
type TestItemsProviderContextType = PItemsContextType<TestItem, 'test'>;
type TestItemCache = Cache<TestItem, 'test'>;

describe('PItemsQuery', () => {
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
  let TestItemAdapterContext: React.Context<TestItemAdapterContextType | undefined>;
  let TestItemsProviderContext: React.Context<TestItemsProviderContextType | undefined>;
  let TestItemsAdapter: React.FC<{ children: React.ReactNode }>;
  let TestItemsQuery: typeof PItemsQuery<
    TestItem,
    'test'
  >;

  beforeEach(() => {
    jest.resetAllMocks();

    cacheMap = new CacheMap<TestItem, 'test'>(['test']);

    testItemCache = {
      pkTypes: ['test'],
      all: jest.fn().mockResolvedValue([cacheMap, [testItem]]),
      one: jest.fn().mockResolvedValue([cacheMap, testItem]),
      create: jest.fn().mockResolvedValue([cacheMap, testItem]),
      get: jest.fn().mockResolvedValue([cacheMap, testItem]),
      remove: jest.fn().mockResolvedValue(cacheMap),
      retrieve: jest.fn().mockResolvedValue([cacheMap, testItem]),
      update: jest.fn().mockResolvedValue([cacheMap, testItem]),
      action: jest.fn().mockResolvedValue([cacheMap, testItem]),
      allAction: jest.fn().mockResolvedValue([cacheMap, [testItem]]),
      set: jest.fn().mockResolvedValue([cacheMap, testItem]),
    } as unknown as jest.Mocked<TestItemCache>;

    TestItemAdapterContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);
    TestItemsProviderContext = React.createContext<TestItemsProviderContextType | undefined>(undefined);

    TestItemsAdapter = (
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

    TestItemsQuery = (
      {
        children,
      }: {
        children: React.ReactNode;
      }
    ) => {
      return PItemsQuery<
        TestItem,
        'test'
      >({
        name: 'test',
        adapter: TestItemAdapterContext,
        context: TestItemsProviderContext,
        children,
        query: IQFactory.all().toQuery(),
      });
    };

  });

  it('should fetch all items', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemsProviderContext}
          query={IQFactory.all().toQuery()}
        >{children}</TestItemsQuery>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => usePItems(TestItemsProviderContext), { wrapper });

    await act(async () => {
      const items = await result.current.all();
      expect(items).toEqual([testItem]);
    });
  });

  it('should perform an allAction', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemsProviderContext}
          query={IQFactory.all().toQuery()}
        >{children}</TestItemsQuery>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => usePItems(TestItemsProviderContext), { wrapper });

    await act(async () => {
      const item = await result.current.allAction('testAction', { data: 'test' });
      expect(item).toEqual([testItem]);
    });
  });

  it('should set an item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsQuery
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemsProviderContext}
          query={IQFactory.all().toQuery()}
        >{children}</TestItemsQuery>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => usePItems(TestItemsProviderContext), { wrapper });

    const key = { pk: '1', kt: 'test' } as PriKey<'test'>;
    const item = { key, name: 'set', events: { created: { at: new Date() } } } as TestItem;

    await act(async () => {
      const retItem = await result.current.set(key, item);
      expect(retItem).toEqual(testItem);
    });
  });

});