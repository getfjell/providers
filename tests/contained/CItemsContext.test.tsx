/* eslint-disable no-undefined */
import { ComKey, Item, PriKey, UUID } from '@fjell/core';
import { renderHook } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CItemsContextType, useCItems } from '../../src/contained/CItemsContext';

type TestItem = Item<'test', 'container'>;

type TestItemsContextType = CItemsContextType<TestItem, 'test', 'container'>;

const TestContext = React.createContext<TestItemsContextType | undefined>(undefined);

describe('CItemsContext', () => {
  const itemKey: ComKey<'test', 'container'> = {
    pk: '1-1-1-1-1' as UUID,
    kt: 'test',
    loc: [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }]
  };

  const testItem: TestItem = {
    key: itemKey,
  } as TestItem;

  const parentKey: PriKey<'container'> = { pk: '2-2-2-2-2' as UUID, kt: 'container' };

  it('should return the context value if used within its provider', () => {
    const contextValue: TestItemsContextType = {
      name: 'TestItems',
      items: [testItem],
      parentItem: { key: parentKey } as any,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isRemoving: false,
      pkTypes: ['test', 'container'],
      locations: [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }],
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      all: vi.fn(),
      one: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      set: vi.fn(),
      action: vi.fn(),
      facet: vi.fn(),
      allAction: vi.fn(),
      allFacet: vi.fn(),
    };

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={contextValue}>{children}</TestContext.Provider>
    );

    const { result } = renderHook(() => useCItems(TestContext, 'TestContext'), { wrapper });
    expect(result.current).toBe(contextValue);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      renderHook(() => useCItems(TestContext, 'TestContext'));
    }).toThrow('This hook must be used within a TestContext');
  });

  it('should return context with empty items array', () => {
    const contextValue: TestItemsContextType = {
      name: 'TestItems',
      items: [],
      parentItem: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isRemoving: false,
      pkTypes: ['test', 'container'],
      locations: null,
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      all: vi.fn(),
      one: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      set: vi.fn(),
      action: vi.fn(),
      facet: vi.fn(),
      allAction: vi.fn(),
      allFacet: vi.fn(),
    };

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={contextValue}>{children}</TestContext.Provider>
    );

    const { result } = renderHook(() => useCItems(TestContext, 'TestContext'), { wrapper });
    expect(result.current.items).toEqual([]);
  });

  it('should return context with loading state', () => {
    const contextValue: TestItemsContextType = {
      name: 'TestItems',
      items: [],
      parentItem: null,
      isLoading: true,
      isCreating: false,
      isUpdating: false,
      isRemoving: false,
      pkTypes: ['test', 'container'],
      locations: null,
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      all: vi.fn(),
      one: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      set: vi.fn(),
      action: vi.fn(),
      facet: vi.fn(),
      allAction: vi.fn(),
      allFacet: vi.fn(),
    };

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={contextValue}>{children}</TestContext.Provider>
    );

    const { result } = renderHook(() => useCItems(TestContext, 'TestContext'), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('should return context with multiple items', () => {
    const secondItemKey: ComKey<'test', 'container'> = {
      pk: '2-2-2-2-2' as UUID,
      kt: 'test',
      loc: [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }]
    };

    const secondItem: TestItem = {
      key: secondItemKey,
    } as TestItem;

    const contextValue: TestItemsContextType = {
      name: 'TestItems',
      items: [testItem, secondItem],
      parentItem: { key: parentKey } as any,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isRemoving: false,
      pkTypes: ['test', 'container'],
      locations: [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }],
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      all: vi.fn(),
      one: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      set: vi.fn(),
      action: vi.fn(),
      facet: vi.fn(),
      allAction: vi.fn(),
      allFacet: vi.fn(),
    };

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={contextValue}>{children}</TestContext.Provider>
    );

    const { result } = renderHook(() => useCItems(TestContext, 'TestContext'), { wrapper });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]).toBe(testItem);
    expect(result.current.items[1]).toBe(secondItem);
  });
});
