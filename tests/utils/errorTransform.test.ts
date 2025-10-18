import { describe, expect, it, vi } from 'vitest';
import { createContextualError, ErrorTransformer } from '../../src/utils/errorTransform';
import { type ErrorInfo, FjellHttpError } from '../../src';

describe('ErrorTransformer', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'VALIDATION_ERROR',
    message: 'Invalid email format',
    operation: {
      type: 'create',
      name: 'create',
      params: { email: 'invalid' }
    },
    context: {
      itemType: 'user'
    },
    details: {
      suggestedAction: 'Use a valid email format',
      validOptions: ['user@example.com', 'test@example.com'],
      retryable: true
    },
    technical: {
      timestamp: '2025-10-18T14:00:00.000Z',
      requestId: 'req-123'
    }
  };

  describe('transform()', () => {
    it('should transform FjellHttpError to UserError', () => {
      const transformer = new ErrorTransformer();
      const fjellError = new FjellHttpError('Validation failed', mockErrorInfo, 400);

      const userError = transformer.transform(fjellError);

      expect(userError.message).toContain('Invalid email format');
      expect(userError.title).toBe('Validation Error');
      expect(userError.severity).toBe('error');
      expect(userError.details?.code).toBe('VALIDATION_ERROR');
      expect(userError.details?.retryable).toBe(true);
    });

    it('should include suggested action in message', () => {
      const transformer = new ErrorTransformer();
      const fjellError = new FjellHttpError('Test', mockErrorInfo, 400);

      const userError = transformer.transform(fjellError);

      expect(userError.message).toContain('Use a valid email format');
    });

    it('should include valid options in message', () => {
      const transformer = new ErrorTransformer();
      const fjellError = new FjellHttpError('Test', mockErrorInfo, 400);

      const userError = transformer.transform(fjellError);

      expect(userError.message).toContain('Valid options: user@example.com, test@example.com');
    });

    it('should limit valid options display to 5', () => {
      const transformer = new ErrorTransformer();
      const manyOptionsError = {
        ...mockErrorInfo,
        details: {
          validOptions: ['opt1', 'opt2', 'opt3', 'opt4', 'opt5', 'opt6', 'opt7']
        }
      };
      const fjellError = new FjellHttpError('Test', manyOptionsError, 400);

      const userError = transformer.transform(fjellError);

      expect(userError.message).toContain('opt1, opt2, opt3, opt4, opt5 and 2 more');
    });

    it('should include parent location context', () => {
      const transformer = new ErrorTransformer();
      const errorWithLocation = {
        ...mockErrorInfo,
        context: {
          ...mockErrorInfo.context,
          parentLocation: { id: 456, type: 'company' }
        }
      };
      const fjellError = new FjellHttpError('Test', errorWithLocation, 400);

      const userError = transformer.transform(fjellError);

      expect(userError.message).toContain('in company #456');
    });

    it('should include affected items', () => {
      const transformer = new ErrorTransformer();
      const errorWithAffectedItems = {
        ...mockErrorInfo,
        context: {
          ...mockErrorInfo.context,
          affectedItems: [
            { id: 1, type: 'order', displayName: 'Order #1001' },
            { id: 2, type: 'order', displayName: 'Order #1002' }
          ]
        }
      };
      const fjellError = new FjellHttpError('Test', errorWithAffectedItems, 400);

      const userError = transformer.transform(fjellError);

      expect(userError.message).toContain('(Affected: Order #1001, Order #1002)');
    });

    it('should create generic error for non-Fjell errors', () => {
      const transformer = new ErrorTransformer();
      const genericError = new Error('Something went wrong');

      const userError = transformer.transform(genericError);

      expect(userError.message).toBe('Something went wrong');
      expect(userError.title).toBe('Error');
      expect(userError.severity).toBe('error');
      expect(userError.details?.code).toBe('UNKNOWN_ERROR');
      expect(userError.details?.retryable).toBe(false);
    });
  });

  describe('Custom transformers', () => {
    it('should use custom transformer when provided', () => {
      const customTransformer = vi.fn().mockReturnValue({
        message: 'Custom error message',
        title: 'Custom Title',
        severity: 'warning' as const,
        details: { code: 'CUSTOM', retryable: false }
      });

      const transformer = new ErrorTransformer({
        customTransformers: {
          'VALIDATION_ERROR': customTransformer
        }
      });

      const fjellError = new FjellHttpError('Test', mockErrorInfo, 400);
      const userError = transformer.transform(fjellError);

      expect(customTransformer).toHaveBeenCalledWith(mockErrorInfo);
      expect(userError.message).toBe('Custom error message');
      expect(userError.title).toBe('Custom Title');
      expect(userError.severity).toBe('warning');
    });
  });

  describe('Options', () => {
    it('should include error code when enabled', () => {
      const transformer = new ErrorTransformer({ includeErrorCode: true });
      const fjellError = new FjellHttpError('Test', mockErrorInfo, 400);

      const userError = transformer.transform(fjellError);

      expect(userError.message).toContain('(Error: VALIDATION_ERROR)');
    });

    it('should include technical details when enabled', () => {
      const transformer = new ErrorTransformer({ includeTechnicalDetails: true });
      const fjellError = new FjellHttpError('Test', mockErrorInfo, 400);

      const userError = transformer.transform(fjellError);

      expect(userError.details?.technical).toContain('Request ID: req-123');
    });
  });

  describe('Error severity', () => {
    it('should set warning severity for rate limit errors', () => {
      const transformer = new ErrorTransformer();
      const rateLimitError = {
        ...mockErrorInfo,
        code: 'RATE_LIMIT_EXCEEDED'
      };
      const fjellError = new FjellHttpError('Test', rateLimitError, 429);

      const userError = transformer.transform(fjellError);

      expect(userError.severity).toBe('warning');
    });

    it('should set info severity for not found errors', () => {
      const transformer = new ErrorTransformer();
      const notFoundError = {
        ...mockErrorInfo,
        code: 'NOT_FOUND'
      };
      const fjellError = new FjellHttpError('Test', notFoundError, 404);

      const userError = transformer.transform(fjellError);

      expect(userError.severity).toBe('info');
    });

    it('should set error severity for other errors', () => {
      const transformer = new ErrorTransformer();
      const duplicateError = {
        ...mockErrorInfo,
        code: 'DUPLICATE_ERROR'
      };
      const fjellError = new FjellHttpError('Test', duplicateError, 409);

      const userError = transformer.transform(fjellError);

      expect(userError.severity).toBe('error');
    });
  });

  describe('Error titles', () => {
    const transformer = new ErrorTransformer();

    it('should map validation error title', () => {
      const error = new FjellHttpError('Test', { ...mockErrorInfo, code: 'VALIDATION_ERROR' }, 400);
      expect(transformer.transform(error).title).toBe('Validation Error');
    });

    it('should map not found error title', () => {
      const error = new FjellHttpError('Test', { ...mockErrorInfo, code: 'NOT_FOUND' }, 404);
      expect(transformer.transform(error).title).toBe('Not Found');
    });

    it('should map permission error title', () => {
      const error = new FjellHttpError('Test', { ...mockErrorInfo, code: 'PERMISSION_ERROR' }, 403);
      expect(transformer.transform(error).title).toBe('Access Denied');
    });

    it('should map duplicate error title', () => {
      const error = new FjellHttpError('Test', { ...mockErrorInfo, code: 'DUPLICATE_ERROR' }, 409);
      expect(transformer.transform(error).title).toBe('Duplicate Entry');
    });

    it('should use default title for unknown codes', () => {
      const error = new FjellHttpError('Test', { ...mockErrorInfo, code: 'CUSTOM_ERROR' }, 500);
      expect(transformer.transform(error).title).toBe('Error');
    });
  });

  describe('Retry actions', () => {
    it('should include retry action when retryable', () => {
      const transformer = new ErrorTransformer();
      const retryableError = {
        ...mockErrorInfo,
        details: { retryable: true }
      };
      const fjellError = new FjellHttpError('Test', retryableError, 500);

      const userError = transformer.transform(fjellError);

      expect(userError.actions).toBeDefined();
      expect(userError.actions).toHaveLength(1);
      expect(userError.actions?.[0].label).toBe('Try Again');
    });

    it('should not include retry action when not retryable', () => {
      const transformer = new ErrorTransformer();
      const nonRetryableError = {
        ...mockErrorInfo,
        details: { retryable: false }
      };
      const fjellError = new FjellHttpError('Test', nonRetryableError, 400);

      const userError = transformer.transform(fjellError);

      expect(userError.actions).toBeUndefined();
    });
  });

  describe('createContextualError helper', () => {
    it('should create UserError with default transformer', () => {
      const fjellError = new FjellHttpError('Test', mockErrorInfo, 400);

      const userError = createContextualError(fjellError, {
        operation: 'createUser',
        itemType: 'user'
      });

      expect(userError).toBeDefined();
      expect(userError.message).toContain('Invalid email format');
      expect(userError.details?.code).toBe('VALIDATION_ERROR');
    });
  });
});

