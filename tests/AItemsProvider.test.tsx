/* eslint-disable no-undefined */
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useAItems } from '../src/AItemsProvider';
import { AItemsContextType } from "../src/AItemsContext";
import { Item } from '@fjell/core';

interface TestItem extends Item<'test', 'container'> { }

const mockContextValue: AItemsContextType<TestItem, 'test', 'container'> = {
  name: 'test',
  items: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isRemoving: false,
  pkTypes: ['test'],
  create: jest.fn(),
  all: jest.fn(),
  one: jest.fn(),
  allAction: jest.fn(),
  finders: {},
  actions: {},
  set: jest.fn(),
};

const TestContext = React.createContext<AItemsContextType<TestItem, 'test', 'container'> | undefined>(undefined);
TestContext.displayName = 'TestContext';

describe('useAItemsProvider', () => {
  it('should return context value if used within a provider', () => {
    const wrapper: React.FC<{ children: any }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>{children}</TestContext.Provider>
    );

    // @ts-ignore
    const { result } = renderHook(() => useAItems(TestContext), { wrapper });
    expect(result.current).toBe(mockContextValue);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const {} = renderHook(() => useAItems(TestContext));
    }).toThrow(`This generic abstract items hook must be used within a ${TestContext.displayName}`);
  });
});