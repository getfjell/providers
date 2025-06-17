/* eslint-disable no-undefined */
import { Item } from '@fjell/core';
import { renderHook } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { PItemContext, PItemContextType, usePItem } from '../../src/primary/PItemContext';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

interface TestItem extends Item<'test'> {
  name: string;
}

describe('PItemContext', () => {
  let TestContext: PItemContext<TestItem, 'test'>;
  let mockContextValue: PItemContextType<TestItem, 'test'>;

  beforeEach(() => {
    mockContextValue = {
      name: 'test',
      key: { pk: '1-1-1-1-1', kt: 'test' },
      item: null,
      parentItem: null,
      isLoading: false,
      isUpdating: false,
      isRemoving: false,
      pkTypes: ['test'],
      remove: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue({ name: 'updated' } as TestItem),
      action: vi.fn().mockResolvedValue({ name: 'actioned' } as TestItem),
      locations: null,
      set: vi.fn().mockResolvedValue({ name: 'set' } as TestItem),
    };

    TestContext = React.createContext<PItemContextType<TestItem, 'test'> | undefined>(undefined);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const { } = renderHook(() => usePItem(TestContext, 'TestContext'));
    }).toThrow(`This hook must be used within a TestContext`);
  });

  it('should return context value when used within provider', () => {
    const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    const { result } = renderHook(() => usePItem(TestContext, 'TestContext'), { wrapper });

    expect(result.current).toBe(mockContextValue);
    expect(result.current.name).toBe('test');
    expect(result.current.pkTypes).toEqual(['test']);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isRemoving).toBe(false);
    expect(result.current.set).toBe(mockContextValue.set);
  });
});
