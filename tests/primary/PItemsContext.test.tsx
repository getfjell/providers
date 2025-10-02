 
import { cPK, Item, PriKey } from '@fjell/core';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import * as PItems from '../../src/primary/PItems';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

interface TestItem extends Item<'test'> {
  name: string;
}

describe('PItemsContext', () => {
  let TestContext: PItems.Context<TestItem, 'test'>;
  let mockContextValue: PItems.ContextType<TestItem, 'test'>;

  beforeEach(() => {
    mockContextValue = {
      name: 'test',
      items: [],
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isRemoving: false,
      create: vi.fn().mockResolvedValue({ name: 'created' } as TestItem),
      update: vi.fn().mockResolvedValue({ name: 'updated' } as TestItem),
      remove: vi.fn().mockResolvedValue(undefined),
      all: vi.fn().mockResolvedValue([{ name: 'item1' }, { name: 'item2' }] as TestItem[]),
      one: vi.fn().mockResolvedValue({ name: 'single' } as TestItem),
      find: vi.fn().mockResolvedValue([{ name: 'found' }] as TestItem[]),
      allAction: vi.fn().mockResolvedValue({ name: 'actioned' } as TestItem),
      allFacet: vi.fn().mockResolvedValue({ name: 'faceted' } as TestItem),
      action: vi.fn().mockResolvedValue({ name: 'customAction' } as TestItem),
      facet: vi.fn().mockResolvedValue('facetResult'),
      actions: {
        testAction: vi.fn().mockResolvedValue({ name: 'customAction' })
      },
      queries: {
        testQuery: vi.fn().mockResolvedValue('queryResult')
      },
      facets: {
        testQuery: vi.fn().mockResolvedValue('queryResult')
      },
      allFacets: {
        testQuery: vi.fn().mockResolvedValue('queryResult')
      },
      set: vi.fn().mockResolvedValue({ name: 'set' } as TestItem),
    } as unknown as PItems.ContextType<TestItem, 'test'>;

    TestContext = React.createContext<PItems.ContextType<TestItem, 'test'> | undefined>(undefined);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const { } = renderHook(() => PItems.usePItems(TestContext, 'TestContext'));
    }).toThrow(`This hook must be used within a TestContext`);
  });

  it('should return context value when used within provider', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    const { result } = renderHook(() => PItems.usePItems(TestContext, 'TestContext'), { wrapper });

    expect(result.current).toBe(mockContextValue);
    expect(result.current.name).toBe('test');
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isCreating).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isRemoving).toBe(false);
  });

  it('should have working CRUD operations', async () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    const { result } = renderHook(() => PItems.usePItems(TestContext, 'TestContext'), { wrapper });

    const createdItem = await result.current.create({ name: 'new' });
    expect(createdItem.name).toBe('created');

    const updatedItem = await result.current.update({ pk: '1', kt: 'test' }, { name: 'updated' });
    expect(updatedItem.name).toBe('updated');

    await result.current.remove({ pk: '1', kt: 'test' });
    expect(result.current.remove).toHaveBeenCalled();

    const allItems = await result.current.all();
    expect(allItems).toHaveLength(2);

    const oneItem = await result.current.one();
    expect(oneItem?.name).toBe('single');

    const foundItems = await result.current.find('test', { param: 'value' });
    expect(foundItems?.[0].name).toBe('found');
  });

  it('should handle actions and queries', async () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    const { result } = renderHook(() => PItems.usePItems(TestContext, 'TestContext'), { wrapper });

    const actionResult = await result.current.allAction('testAction', { data: 'test' });
    expect(actionResult?.name).toBe('actioned');

    const customActionResult = await result.current.action(cPK('test', 'test'), 'testAction', { data: 'test' });
    expect(customActionResult.name).toBe('customAction');

    const queryResult = await result.current.facet(cPK('test', 'test'), 'testQuery', { data: 'test' });
    expect(queryResult).toBe('facetResult');
  });

  it('should have working set operation', async () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    const { result } = renderHook(() => PItems.usePItems(TestContext, 'TestContext'), { wrapper });

    const key = { pk: '1', kt: 'test' } as PriKey<'test'>;
    const item = { key, name: 'set', events: { created: { at: new Date() } } } as TestItem;

    const setItem = await result.current.set(key, item);
    expect(setItem.name).toBe('set');
  });
});
