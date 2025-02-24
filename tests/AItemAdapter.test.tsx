/* eslint-disable no-undefined */
import { CacheMap } from "@fjell/cache/dist/src/CacheMap";
import { Item } from "@fjell/core";
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useAItemAdapter } from '../src/AItemAdapter';
import { AItemAdapterContextType } from "../src/AItemAdapterContext";

interface TestItem extends Item<"test", "container"> { }

describe('useAItemAdapter', () => {

  let mockContextValue: AItemAdapterContextType<TestItem, "test", "container">;

  const TestContext =
    React.createContext<AItemAdapterContextType<TestItem, "test", "container"> | undefined>(undefined);
  TestContext.displayName = 'TestContext';

  beforeEach(() => {
    jest.resetAllMocks();

    mockContextValue = {
      name: 'test',
      cacheMap: new CacheMap<TestItem, 'test', 'container'>(['test', 'container']),
      pkTypes: ['test', 'container'],
      all: jest.fn().mockResolvedValue([]),
      one: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({} as TestItem),
      get: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue({} as TestItem),
      retrieve: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({} as TestItem),
      action: jest.fn().mockResolvedValue({} as TestItem),
      allAction: jest.fn().mockResolvedValue({} as TestItem),
      actions: {
        customAction: jest.fn().mockResolvedValue(null),
      },
    };
  });

  it('should return context value when used within a provider', () => {
    const wrapper: React.FC<{ children: any }> = ({ children }: { children: any }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    // @ts-ignore
    const { result } = renderHook(() => useAItemAdapter(TestContext), { wrapper });
    expect(result.current).toBe(mockContextValue);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const {} = renderHook(() => useAItemAdapter(TestContext));
    }).toThrow(`This generic item adapter hook must be used within a TestContext`);
  });
});