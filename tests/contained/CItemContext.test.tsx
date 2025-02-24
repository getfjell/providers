/* eslint-disable no-undefined */
import React, { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { useCItem } from '../../src/contained/CItemContext';
import { CItemContextType } from "../../src/contained/CItemContext";
import { ComKey, Item } from '@fjell/core';

interface TestItem extends Item<'test', 'container'> { }

interface TestItemProviderContextType extends CItemContextType<TestItem, 'test', 'container'> { }

const TestContext = React.createContext<TestItemProviderContextType | undefined>(undefined);

describe('useCItemProvider', () => {

  it('should return the context value if used within its provider', () => {
    const contextValue: TestItemProviderContextType = {
      name: 'test',
      key: null as unknown as ComKey<"test", "container">,
      item: null,
      parentItem: null,
      isLoading: false,
      isUpdating: false,
      isRemoving: false,
      pkTypes: ['test', 'container'],
      remove: jest.fn(),
      update: jest.fn(),
      action: jest.fn(),
      actions: {},
      locations: null,
    };

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={contextValue}>{children}</TestContext.Provider>
    );

    const { result } = renderHook(() => useCItem(TestContext), { wrapper });
    expect(result.current).toBe(contextValue);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const {} = renderHook(() => useCItem(TestContext));
    }).toThrow(`This generic composite item hook must be used within a ${TestContext.displayName}`);
  });
});
