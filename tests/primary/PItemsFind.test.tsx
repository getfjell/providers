/* eslint-disable no-undefined */
import { PItemAdapter } from '../../src/primary/PItemAdapter';
import { PItemsFind } from '../../src/primary/PItemsFind';
import { CacheMap } from '@fjell/cache/dist/src/CacheMap';
import { Item, PriKey, UUID } from '@fjell/core';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { PItemAdapterContextType } from '../../src/primary/PItemAdapterContext';
import { PItemsContextType, usePItems } from '../../src/primary/PItemsContext';
import { Cache } from '@fjell/cache/dist/src/Cache';

interface TestItem extends Item<'test'> {
  name: string;
}

type TestItemAdapterContextType = PItemAdapterContextType<TestItem, 'test'>;
type TestItemsProviderContextType = PItemsContextType<TestItem, 'test'>;
type TestItemCache = Cache<TestItem, 'test'>;

describe('PItemsFind', () => {
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
  let TestItemsFind: typeof PItemsFind<
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
      find: jest.fn().mockResolvedValue([cacheMap, [testItem, testItem]]),
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

    TestItemsFind = (
      {
        children,
      }: {
        children: React.ReactNode;
      }
    ) => {
      return PItemsFind<
        TestItem,
        'test'
      >({
        name: 'test',
        adapter: TestItemAdapterContext,
        context: TestItemsProviderContext,
        children,
        finder: 'testFinder',
        finderParams: {},
      });
    };

  });

  it('should fetch items', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsFind
          name="test"
          adapter={TestItemAdapterContext}
          context={TestItemsProviderContext}
          finder="testFinder"
          finderParams={{}}
        >{children}</TestItemsFind>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => usePItems(TestItemsProviderContext), { wrapper });

    await waitFor(async () => {
      const items = result.current.items;
      expect(items).toEqual([testItem, testItem]);
    });
  });
});