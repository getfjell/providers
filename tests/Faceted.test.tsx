 
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextType, useFacetResult } from '../src/Faceted';
import * as utils from '../src/utils';

// @vitest-environment jsdom

describe('useFacetResult', () => {
  let mockContext: React.Context<ContextType | undefined>;
  let mockContextValue: ContextType;

  beforeEach(() => {
    vi.resetAllMocks();

    // Create a mock React context
    mockContext = React.createContext<ContextType | undefined>(undefined);

    // Create mock context value
    mockContextValue = {
      facetResults: {
        'testFacet': {
          'stable-hash-1': 'facet-result-1',
          'stable-hash-2': 'facet-result-2'
        },
        'anotherFacet': {
          'stable-hash-1': 'another-result',
          'stable-hash-3': 'another-result-different-params'
        }
      },
      facet: async () => 'facet-result-1',
    };
  });

  describe('error handling', () => {
    it('should throw error when used outside provider', () => {
      // Arrange
      const contextName = 'TestContext';
      const facet = 'testFacet';
      const params = { key: 'value' };

      // Act & Assert
      expect(() => {
        renderHook(() => useFacetResult(mockContext, contextName, facet, params));
      }).toThrow('This hook must be used within a TestContext');
    });

    it('should throw error with correct context name', () => {
      // Arrange
      const contextName = 'MyCustomContext';
      const facet = 'testFacet';

      // Act & Assert
      expect(() => {
        renderHook(() => useFacetResult(mockContext, contextName, facet));
      }).toThrow('This hook must be used within a MyCustomContext');
    });
  });

  describe('successful facet retrieval', () => {
    it('should return facet result when context and facet exist', async () => {
      // Arrange
      const mockCreateStableHash = vi.spyOn(utils, 'createStableHash');
      mockCreateStableHash.mockReturnValue('stable-hash-1');

      const contextName = 'TestContext';
      const facet = 'testFacet';
      const params = { key: 'value' };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <mockContext.Provider value={mockContextValue}>
          {children}
        </mockContext.Provider>
      );

      // Act
      const { result, rerender } = renderHook(
        () => useFacetResult(mockContext, contextName, facet, params),
        { wrapper }
      );

      // Force useEffect to run
      await new Promise(resolve => setTimeout(resolve, 0));
      rerender();

      // Assert
      expect(mockCreateStableHash).toHaveBeenCalledWith(params);
      expect(result.current).toBe('facet-result-1');
    });

    it('should return null when facet does not exist', async () => {
      // Arrange
      const mockCreateStableHash = vi.spyOn(utils, 'createStableHash');
      mockCreateStableHash.mockReturnValue('stable-hash-1');

      const contextName = 'TestContext';
      const facet = 'nonExistentFacet';
      const params = { key: 'value' };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <mockContext.Provider value={mockContextValue}>
          {children}
        </mockContext.Provider>
      );

      // Act
      const { result, rerender } = renderHook(
        () => useFacetResult(mockContext, contextName, facet, params),
        { wrapper }
      );

      // Force useEffect to run
      await new Promise(resolve => setTimeout(resolve, 0));
      rerender();

      // Assert
      expect(result.current).toBeNull();
    });

    it('should return null when facet exists but parameter hash does not match', async () => {
      // Arrange
      const mockCreateStableHash = vi.spyOn(utils, 'createStableHash');
      mockCreateStableHash.mockReturnValue('non-matching-hash');

      const contextName = 'TestContext';
      const facet = 'testFacet';
      const params = { different: 'params' };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <mockContext.Provider value={mockContextValue}>
          {children}
        </mockContext.Provider>
      );

      // Act
      const { result, rerender } = renderHook(
        () => useFacetResult(mockContext, contextName, facet, params),
        { wrapper }
      );

      // Force useEffect to run
      await new Promise(resolve => setTimeout(resolve, 0));
      rerender();

      // Assert
      expect(result.current).toBeNull();
    });
  });

  describe('parameter handling', () => {
    it('should use default empty object when no params provided', async () => {
      // Arrange
      const mockCreateStableHash = vi.spyOn(utils, 'createStableHash');
      mockCreateStableHash.mockReturnValue('stable-hash-1');

      const contextName = 'TestContext';
      const facet = 'testFacet';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <mockContext.Provider value={mockContextValue}>
          {children}
        </mockContext.Provider>
      );

      // Act
      renderHook(
        () => useFacetResult(mockContext, contextName, facet),
        { wrapper }
      );

      // Assert
      expect(mockCreateStableHash).toHaveBeenCalledWith({});
    });

    it('should create stable hash with provided params', async () => {
      // Arrange
      const mockCreateStableHash = vi.spyOn(utils, 'createStableHash');
      mockCreateStableHash.mockReturnValue('stable-hash-2');

      const contextName = 'TestContext';
      const facet = 'testFacet';
      const params = { foo: 'bar', count: 42, active: true };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <mockContext.Provider value={mockContextValue}>
          {children}
        </mockContext.Provider>
      );

      // Act
      const { result, rerender } = renderHook(
        () => useFacetResult(mockContext, contextName, facet, params),
        { wrapper }
      );

      // Force useEffect to run
      await new Promise(resolve => setTimeout(resolve, 0));
      rerender();

      // Assert
      expect(mockCreateStableHash).toHaveBeenCalledWith(params);
      expect(result.current).toBe('facet-result-2');
    });
  });

  describe('hook dependencies and updates', () => {
    it('should update result when facet changes', async () => {
      // Arrange
      const mockCreateStableHash = vi.spyOn(utils, 'createStableHash');

      const contextName = 'TestContext';
      const params = { key: 'value' };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <mockContext.Provider value={mockContextValue}>
          {children}
        </mockContext.Provider>
      );

      // Act - Initial render with first facet
      mockCreateStableHash.mockReturnValue('stable-hash-1');
      const { result, rerender } = renderHook(
        ({ facet }) => useFacetResult(mockContext, contextName, facet, params),
        {
          wrapper,
          initialProps: { facet: 'testFacet' }
        }
      );

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(result.current).toBe('facet-result-1');

      // Act - Change facet (same params, so same hash 'stable-hash-1')
      rerender({ facet: 'anotherFacet' });

      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert
      expect(result.current).toBe('another-result');
    });

    it('should update result when params change', async () => {
      // Arrange
      const mockCreateStableHash = vi.spyOn(utils, 'createStableHash');
      mockCreateStableHash.mockReturnValue('stable-hash-1');

      const contextName = 'TestContext';
      const facet = 'testFacet';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <mockContext.Provider value={mockContextValue}>
          {children}
        </mockContext.Provider>
      );

      // Act - Initial render
      const { result, rerender } = renderHook(
        ({ params }) => useFacetResult(mockContext, contextName, facet, params),
        {
          wrapper,
          initialProps: { params: { key: 'value1' } }
        }
      );

      await new Promise(resolve => setTimeout(resolve, 0));
      rerender({ params: { key: 'value1' } });
      expect(result.current).toBe('facet-result-1');

      // Act - Change params
      mockCreateStableHash.mockReturnValue('stable-hash-2');
      rerender({ params: { key: 'value2' } });

      await new Promise(resolve => setTimeout(resolve, 0));
      rerender({ params: { key: 'value2' } });

      // Assert
      expect(result.current).toBe('facet-result-2');
    });

    it('should handle empty facetResults object', async () => {
      // Arrange
      const mockCreateStableHash = vi.spyOn(utils, 'createStableHash');
      mockCreateStableHash.mockReturnValue('stable-hash-1');

      const emptyContextValue: ContextType = {
        facetResults: {},
        facet: async () => 'facet-result-1',
      };

      const contextName = 'TestContext';
      const facet = 'testFacet';
      const params = { key: 'value' };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <mockContext.Provider value={emptyContextValue}>
          {children}
        </mockContext.Provider>
      );

      // Act
      const { result, rerender } = renderHook(
        () => useFacetResult(mockContext, contextName, facet, params),
        { wrapper }
      );

      await new Promise(resolve => setTimeout(resolve, 0));
      rerender();

      // Assert
      expect(result.current).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined facetResults', async () => {
      // Arrange
      const mockCreateStableHash = vi.spyOn(utils, 'createStableHash');
      mockCreateStableHash.mockReturnValue('stable-hash-1');

      const contextValueWithUndefinedResults: ContextType = {
        facetResults: undefined as any,
        facet: async () => 'facet-result-1',
      };

      const contextName = 'TestContext';
      const facet = 'testFacet';
      const params = { key: 'value' };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <mockContext.Provider value={contextValueWithUndefinedResults}>
          {children}
        </mockContext.Provider>
      );

      // Act
      const { result, rerender } = renderHook(
        () => useFacetResult(mockContext, contextName, facet, params),
        { wrapper }
      );

      await new Promise(resolve => setTimeout(resolve, 0));
      rerender();

      // Assert
      expect(result.current).toBeNull();
    });

    it('should handle empty facet name', async () => {
      // Arrange
      const mockCreateStableHash = vi.spyOn(utils, 'createStableHash');
      mockCreateStableHash.mockReturnValue('stable-hash-1');

      const contextName = 'TestContext';
      const facet = '';
      const params = { key: 'value' };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <mockContext.Provider value={mockContextValue}>
          {children}
        </mockContext.Provider>
      );

      // Act
      const { result, rerender } = renderHook(
        () => useFacetResult(mockContext, contextName, facet, params),
        { wrapper }
      );

      await new Promise(resolve => setTimeout(resolve, 0));
      rerender();

      // Assert - Empty facet name should result in null
      expect(result.current).toBeNull();
    });

    it('should return complex facet result objects', async () => {
      // Arrange
      const complexResult = {
        data: [{ id: 1, name: 'test' }],
        metadata: { total: 1, page: 1 },
        status: 'success'
      };

      const contextValueWithComplexResult: ContextType = {
        facetResults: {
          'complexFacet': {
            'stable-hash-complex': complexResult
          }
        },
        facet: async () => 'facet-result-1',
      };

      const mockCreateStableHash = vi.spyOn(utils, 'createStableHash');
      mockCreateStableHash.mockReturnValue('stable-hash-complex');

      const contextName = 'TestContext';
      const facet = 'complexFacet';
      const params = { complex: 'params' };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <mockContext.Provider value={contextValueWithComplexResult}>
          {children}
        </mockContext.Provider>
      );

      // Act
      const { result, rerender } = renderHook(
        () => useFacetResult(mockContext, contextName, facet, params),
        { wrapper }
      );

      await new Promise(resolve => setTimeout(resolve, 0));
      rerender();

      // Assert
      expect(result.current).toEqual(complexResult);
    });
  });
});
