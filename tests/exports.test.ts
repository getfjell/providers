import { describe, expect, it } from 'vitest';

describe('Export Fixes', () => {
  describe('Missing component exports', () => {
    it('should export PItemFacet component', async () => {
      const module = await import('../src/index');
      expect(module.PItemFacet).toBeDefined();
      expect(typeof module.PItemFacet).toBe('function');
    });

    it('should export CItemFacet component', async () => {
      const module = await import('../src/index');
      expect(module.CItemFacet).toBeDefined();
      expect(typeof module.CItemFacet).toBe('function');
    });

    it('should export all existing components', async () => {
      const module = await import('../src/index');

      // Test that main components are still exported
      expect(module.PItemsProvider).toBeDefined();
      expect(module.CItemsProvider).toBeDefined();
      expect(module.PItemsFacet).toBeDefined();
      expect(module.CItemsFacet).toBeDefined();
    });

    it('should export type utilities', async () => {
      const module = await import('../src/index');

      expect(module.createStableHash).toBeDefined();
      expect(module.createStableMemo).toBeDefined();
      expect(module.deepEqual).toBeDefined();
      expect(module.isPromise).toBeDefined();
    });

    it('should export type aliases', async () => {
      // This test ensures the types are exported and available for import
      const types = await import('../src/types');

      // We can't directly test type exports, but we can test that the module loads
      expect(types).toBeDefined();
    });

    it('should export error handling utilities', async () => {
      const module = await import('../src/index');

      expect(module.useAsyncError).toBeDefined();
      expect(module.withAsyncErrorHandling).toBeDefined();
    });
  });

  describe('Component availability after fixes', () => {
    it('should allow importing PItemFacet directly', async () => {
      const { PItemFacet } = await import('../src/index');
      expect(PItemFacet).toBeDefined();
      expect(PItemFacet.name).toBe('PItemFacet');
    });

    it('should allow importing CItemFacet directly', async () => {
      const { CItemFacet } = await import('../src/index');
      expect(CItemFacet).toBeDefined();
      expect(CItemFacet.name).toBe('CItemFacet');
    });

    it('should maintain backward compatibility', async () => {
      const module = await import('../src/index');

      // These should still be available as namespace imports
      expect(module.AItem).toBeDefined();
      expect(module.AItems).toBeDefined();
      expect(module.PItem).toBeDefined();
      expect(module.PItems).toBeDefined();
      expect(module.CItem).toBeDefined();
      expect(module.CItems).toBeDefined();
    });
  });
});
