/* eslint-disable no-undefined */
import { Item, PriKey } from '@fjell/core';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { ContextType, useAItem } from "../src/AItem";
import { vi } from 'vitest';

type TestItem = Item<'test'>;

type TestItemProviderContextType = ContextType<TestItem, 'test'>;

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
      remove: vi.fn(),
      update: vi.fn(),
      action: vi.fn(),
      facet: vi.fn(),
      actions: {},
      locations: null,
      set: vi.fn().mockResolvedValue({} as TestItem),
    };

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TestContext.Provider value={contextValue}>{children}</TestContext.Provider>
    );

    const { result } = renderHook(() => useAItem(TestContext, 'TestContext'), { wrapper });
    expect(result.current).toBe(contextValue);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const { } = renderHook(() => useAItem(TestContext, 'TestContext'));
    }).toThrow(`This hook must be used within a TestContext`);
  });
});
