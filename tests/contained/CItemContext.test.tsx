/* eslint-disable no-undefined */
import { ComKey, Item } from '@fjell/core';
import { renderHook } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { CItemContextType, useCItem } from '../../src/contained/CItemContext';
import { vi } from 'vitest';

type TestItem = Item<'test', 'container'>;

type TestItemProviderContextType = CItemContextType<TestItem, 'test', 'container'>;

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
      remove: vi.fn(),
      update: vi.fn(),
      action: vi.fn(),
      actions: {},
      locations: null,
      set: vi.fn(),
    };

    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={contextValue}>{children}</TestContext.Provider>
    );

    const { result } = renderHook(() => useCItem(TestContext, "TestContext"), { wrapper });
    expect(result.current).toBe(contextValue);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const { } = renderHook(() => useCItem(TestContext, 'TestContext'));
    }).toThrow(`This hook must be used within a TestContext`);
  });
});
