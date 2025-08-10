/* eslint-disable no-undefined */
import { Item } from "@fjell/core";
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useAItemAdapter } from '../src/AItemAdapter';
import { AItemAdapterContextType } from "../src/AItemAdapterContext";
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

type TestItem = Item<"test", "container">;

describe('useAItemAdapter', () => {

  let mockContextValue: AItemAdapterContextType<TestItem, "test", "container">;

  const TestContext =
    React.createContext<AItemAdapterContextType<TestItem, "test", "container"> | undefined>(undefined);
  TestContext.displayName = 'TestContext';

  beforeEach(() => {
    vi.resetAllMocks();

    mockContextValue = {
      name: 'test',
      pkTypes: ['test', 'container'],
      all: vi.fn().mockResolvedValue([]),
      one: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({} as TestItem),
      get: vi.fn().mockResolvedValue(null),
      remove: vi.fn().mockResolvedValue({} as TestItem),
      retrieve: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({} as TestItem),
      action: vi.fn().mockResolvedValue({} as TestItem),
      allAction: vi.fn().mockResolvedValue({} as TestItem),
      actions: {
        customAction: vi.fn().mockResolvedValue(null),
      },
      set: vi.fn().mockResolvedValue({} as TestItem),
    };
  });

  it('should return context value when used within a provider', () => {
    const wrapper: React.FC<{ children: any }> = ({ children }: { children: any }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    // @ts-ignore
    const { result } = renderHook(() => useAItemAdapter(TestContext, "TestContext"), { wrapper });
    expect(result.current).toBe(mockContextValue);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const { } = renderHook(() => useAItemAdapter(TestContext, 'TestContext'));
    }).toThrow(`This hook must be used within a TestContext`);
  });
});
