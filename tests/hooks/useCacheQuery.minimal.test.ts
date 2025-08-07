import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCacheQuery } from '../../src/hooks/useCacheQuery';

describe('useCacheQuery minimal', () => {
  let mockCache: any;

  beforeEach(() => {
    mockCache = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      get: vi.fn(),
      isActive: vi.fn(() => true),
      cacheMap: {
        queryIn: vi.fn(() => [])
      }
    };
  });

  it('should render without crashing', () => {
    const { result } = renderHook(() =>
      useCacheQuery(mockCache, { pk: 'test' })
    );

    expect(result.current).toBeDefined();
  });
});
