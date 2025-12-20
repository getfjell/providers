 
import { Item } from "@fjell/types";
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import * as PItem from '../../src/primary/PItem';
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

interface TestItem extends Item<'test'> {
  name: string;
}

describe('PItemContext', () => {
  let TestContext: PItem.Context<TestItem, 'test'>;
  let mockContextValue: PItem.ContextType<TestItem, 'test'>;

  beforeEach(() => {
    mockContextValue = {
      name: 'test',
      key: { pk: '1-1-1-1-1', kt: 'test' },
      item: null,
      isLoading: false,
      isUpdating: false,
      isRemoving: false,
      pkTypes: ['test'],
      remove: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue({ name: 'updated' } as TestItem),
      action: vi.fn().mockResolvedValue({ name: 'actioned' } as TestItem),
      facet: vi.fn().mockResolvedValue({ name: 'faceted' } as TestItem),
      locations: null,
      set: vi.fn().mockResolvedValue({ name: 'set' } as TestItem),
    };

    TestContext = React.createContext<PItem.ContextType<TestItem, 'test'> | undefined>(undefined);
  });

  it('should throw error when used outside of provider', () => {
    expect(() => {
      const { } = renderHook(() => PItem.usePItem(TestContext, 'TestContext'));
    }).toThrow(`This hook must be used within a TestContext`);
  });

  it('should return context value when used within provider', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TestContext.Provider value={mockContextValue}>
        {children}
      </TestContext.Provider>
    );

    const { result } = renderHook(() => PItem.usePItem(TestContext, 'TestContext'), { wrapper });

    expect(result.current).toBe(mockContextValue);
    expect(result.current.name).toBe('test');
    expect(result.current.pkTypes).toEqual(['test']);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isRemoving).toBe(false);
    expect(result.current.set).toBe(mockContextValue.set);
  });
});
