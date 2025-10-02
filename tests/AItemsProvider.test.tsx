 
/// <reference types="vitest/globals" />
import { Item } from '@fjell/core';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { ContextType, useAItems } from "../src/AItems";
import { vi } from 'vitest';

// @vitest-environment jsdom

type TestItem = Item<'test', 'container'>;

const mockContextValue: ContextType<TestItem, 'test', 'container'> = {
  name: 'test',
  items: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isRemoving: false,
  pkTypes: ['test'],
  create: vi.fn(),
  all: vi.fn(),
  one: vi.fn(),
  allAction: vi.fn(),
  allFacet: vi.fn(),
  finders: {},
  actions: {},
  set: vi.fn(),
  find: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  action: vi.fn(),
  facet: vi.fn(),
};

const TestContext = React.createContext<ContextType<TestItem, 'test', 'container'> | undefined>(undefined);
TestContext.displayName = 'TestContext';

describe('useAItemsProvider', () => {
  it('should return context value if used within a provider', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>{children}</TestContext.Provider>
    );

    const { result } = renderHook(() => useAItems(TestContext, "TestContext"), { wrapper });
    expect(result.current).toBe(mockContextValue);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const { } = renderHook(() => useAItems(TestContext, 'TestContext'));
    }).toThrow(`This hook must be used within a TestContext`);
  });
});
