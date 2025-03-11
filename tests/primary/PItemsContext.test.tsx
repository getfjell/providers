/* eslint-disable no-undefined */
import { Item, PriKey } from '@fjell/core';
import { renderHook } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { PItemsContext, PItemsContextType, usePItems } from '../../src/primary/PItemsContext';

interface TestItem extends Item<'test'> {
  name: string;
}

describe('PItemsContext', () => {
  let TestContext: PItemsContext<TestItem, 'test'>;
  let mockContextValue: PItemsContextType<TestItem, 'test'>;

  beforeEach(() => {
    mockContextValue = {
      name: 'test',
      items: [],
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isRemoving: false,
      create: jest.fn().mockResolvedValue({ name: 'created' } as TestItem),
      update: jest.fn().mockResolvedValue({ name: 'updated' } as TestItem),
      remove: jest.fn().mockResolvedValue(undefined),
      all: jest.fn().mockResolvedValue([{ name: 'item1' }, { name: 'item2' }] as TestItem[]),
      one: jest.fn().mockResolvedValue({ name: 'single' } as TestItem),
      find: jest.fn().mockResolvedValue([{ name: 'found' }] as TestItem[]),
      allAction: jest.fn().mockResolvedValue({ name: 'actioned' } as TestItem),
      actions: {
        testAction: jest.fn().mockResolvedValue({ name: 'customAction' })
      },
      queries: {
        testQuery: jest.fn().mockResolvedValue('queryResult')
      },
      set: jest.fn().mockResolvedValue({ name: 'set' } as TestItem),
    } as unknown as PItemsContextType<TestItem, 'test'>;

    TestContext = React.createContext<PItemsContextType<TestItem, 'test'> | undefined>(undefined);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const {} = renderHook(() => usePItems(TestContext));
    }).toThrow(`This hook must be used within a undefined`);
  });

  it('should return context value when used within provider', () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    const { result } = renderHook(() => usePItems(TestContext), { wrapper });

    expect(result.current).toBe(mockContextValue);
    expect(result.current.name).toBe('test');
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isCreating).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isRemoving).toBe(false);
  });

  it('should have working CRUD operations', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    const { result } = renderHook(() => usePItems(TestContext), { wrapper });

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
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    const { result } = renderHook(() => usePItems(TestContext), { wrapper });

    const actionResult = await result.current.allAction('testAction', { data: 'test' });
    expect(actionResult?.name).toBe('actioned');

    const customActionResult = await result.current.actions?.testAction();
    expect(customActionResult.name).toBe('customAction');

    const queryResult = await result.current.queries?.testQuery();
    expect(queryResult).toBe('queryResult');
  });

  it('should have working set operation', async () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    const { result } = renderHook(() => usePItems(TestContext), { wrapper });

    const key = { pk: '1', kt: 'test' } as PriKey<'test'>;
    const item = { key, name: 'set', events: { created: { at: new Date() } } } as TestItem;

    const setItem = await result.current.set(key, item);
    expect(setItem.name).toBe('set');
  });
});
