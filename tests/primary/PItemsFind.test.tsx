/* eslint-disable no-undefined */
import * as React from 'react';
import { PItemsFind } from '../../src/primary/PItemsFind';
import { ContextType as PItemAdapterContextType } from '../../src/primary/PItemAdapter';
import { ContextType as PItemsContextType } from '../../src/primary/PItems';
import { ComKey, Item, PriKey, UUID } from '@fjell/core';
import { vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
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
type TestItemsContextType = PItemsContextType<TestItem, 'test'>;

describe('PItemsFind', () => {
  const priKey: PriKey<'test'> = { pk: '1-1-1-1-1' as UUID, kt: 'test' };
  const testItem: TestItem = {
    key: { kt: priKey.kt, pk: priKey.pk, loc: [] },
    name: 'test',
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  };

  let testItemAdapter: TestItemAdapterContextType;
  let testItemsContext: TestItemsContextType;
  let TestItemAdapterContext: React.Context<TestItemAdapterContextType | undefined>;
  let TestItemsContext: React.Context<TestItemsContextType | undefined>;
  let TestItemAdapter: React.FC<{ children: ReactNode }>;

  beforeEach(() => {
    vi.resetAllMocks();

    // Create a comprehensive mock adapter context
    testItemAdapter = {
      name: 'test',
      pkTypes: ['test'],
      all: vi.fn().mockResolvedValue([testItem]),
      one: vi.fn().mockResolvedValue(testItem),
      create: vi.fn().mockResolvedValue(testItem),
      get: vi.fn().mockResolvedValue(testItem),
      remove: vi.fn().mockResolvedValue(undefined),
      retrieve: vi.fn().mockResolvedValue(testItem),
      update: vi.fn().mockResolvedValue(testItem),
      allAction: vi.fn().mockResolvedValue([testItem]),
      allFacet: vi.fn().mockResolvedValue({ allFacetData: 'test' }),
      find: vi.fn().mockResolvedValue([testItem]),
      findOne: vi.fn().mockResolvedValue(testItem),
      set: vi.fn().mockResolvedValue(testItem),
      action: vi.fn().mockResolvedValue(testItem),
      facet: vi.fn().mockResolvedValue({ facetData: 'test' }),
      addFacets: vi.fn(),
      addAllFacets: vi.fn(),
    } as unknown as TestItemAdapterContextType;

    // Create a mock items context
    testItemsContext = {
      name: 'test',
      items: [testItem],
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isRemoving: false,
      pkTypes: ['test'],
      create: vi.fn().mockResolvedValue(testItem),
      all: vi.fn().mockResolvedValue([testItem]),
      one: vi.fn().mockResolvedValue(testItem),
      allAction: vi.fn().mockResolvedValue([testItem]),
      allFacet: vi.fn().mockResolvedValue({ allFacetData: 'test' }),
      facet: vi.fn().mockResolvedValue({ facetData: 'test' }),
      set: vi.fn().mockResolvedValue(testItem),
      find: vi.fn().mockResolvedValue([testItem]),
      findOne: vi.fn().mockResolvedValue(testItem),
      update: vi.fn().mockResolvedValue(testItem),
      remove: vi.fn().mockResolvedValue(undefined),
    } as unknown as TestItemsContextType;

    TestItemAdapterContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);
    TestItemsContext = React.createContext<TestItemsContextType | undefined>(undefined);

    TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
      <PItemsFind
        name="test"
        adapter={TestItemAdapterContext}
        context={TestItemsContext}
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
      <TestItemAdapterContext.Provider value={testItemAdapter}>
        <TestItemsContext.Provider value={testItemsContext}>
          <TestItemAdapter>{children}</TestItemAdapter>
        </TestItemsContext.Provider>
      </TestItemAdapterContext.Provider>
    );

    const { result } = renderHook(() => {
      const context = React.useContext(TestItemAdapterContext);
      if (!context) throw new Error('Context not found');
      return context;
    }, { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // Wait for initial mount effect to complete (PItemsFind component calls find on mount)
    await waitFor(() => {
      expect(testItemAdapter.find).toHaveBeenCalledTimes(1);
    });

    // Test direct call to the find method
    await act(async () => {
      const items = await result.current.find('test', { name: 'test' });
      expect(items).toEqual([testItem]);
    });

    expect(testItemAdapter.find).toHaveBeenCalledTimes(2);
    expect(testItemAdapter.find).toHaveBeenCalledWith('test', { name: 'test' });
  });
});
