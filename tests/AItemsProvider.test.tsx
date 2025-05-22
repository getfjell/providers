/* eslint-disable no-undefined */
/// <reference types="vitest/globals" />
import { Item } from '@fjell/core';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { AItemsContextType } from "../src/AItemsContext";
import { useAItems } from '../src/AItemsProvider';
import { vi } from 'vitest';

// @vitest-environment jsdom

type TestItem = Item<'test', 'container'>;

const mockContextValue: AItemsContextType<TestItem, 'test', 'container'> = {
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
  finders: {},
  actions: {},
  set: vi.fn(),
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
      const { } = renderHook(() => useAItems(TestContext));
    }).toThrow(`This generic abstract items hook must be used within a ${TestContext.displayName}`);
  });
});