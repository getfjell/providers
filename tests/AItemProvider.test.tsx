/* eslint-disable no-undefined */
import React, { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { useAItem } from '../src/AItemProvider';
import { AItemContextType } from "../src/AItemContext";
import { Item, PriKey } from '@fjell/core';

interface TestItem extends Item<'test'> { }

interface TestItemProviderContextType extends AItemContextType<TestItem, 'test'> { }

const TestContext = React.createContext<TestItemProviderContextType | undefined>(undefined);

describe('useAItemProvider', () => {

  it('should return the context value if used within its provider', () => {
    const contextValue: TestItemProviderContextType = {
      name: 'test',
      key: null as unknown as PriKey<"test">,
      item: null,
      isLoading: false,
      isUpdating: false,
      isRemoving: false,
      pkTypes: ['test'],
      remove: jest.fn(),
      update: jest.fn(),
      action: jest.fn(),
      actions: {},
      locations: null,
    };

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={contextValue}>{children}</TestContext.Provider>
    );

    const { result } = renderHook(() => useAItem(TestContext), { wrapper });
    expect(result.current).toBe(contextValue);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const {} = renderHook(() => useAItem(TestContext));
    }).toThrow(`This generic abstract item hook must be used within a ${TestContext.displayName}`);
  });
});