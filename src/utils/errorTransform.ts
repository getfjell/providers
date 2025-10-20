import { type ErrorInfo, extractErrorInfo, isFjellHttpError } from '@fjell/client-api';

export interface UserError {
  message: string;
  title?: string;
  actions?: Array<{
    label: string;
    action: () => void | Promise<void>;
  }>;
  details?: {
    code: string;
    retryable: boolean;
    technical?: string;
  };
  severity: 'error' | 'warning' | 'info';
}

/**
 * Transform Fjell errors into user-friendly error objects for UI consumption
 */
export class ErrorTransformer {
  constructor(
    private options: {
      includeErrorCode?: boolean;
      includeTechnicalDetails?: boolean;
      customTransformers?: Record<string, (error: ErrorInfo) => UserError>;
    } = {}
  ) {}

  /**
   * Transform any error into UserError
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(error: any, context?: { operation?: string; itemType?: string }): UserError {
    const errorInfo = this.extractErrorInfo(error);

    if (!errorInfo) {
      return this.createGenericError(error);
    }

    // Check for custom transformer
    if (this.options.customTransformers?.[errorInfo.code]) {
      return this.options.customTransformers[errorInfo.code](errorInfo);
    }

    // Use built-in transformers
    return this.transformErrorInfo(errorInfo);
  }

  /**
   * Extract ErrorInfo from various error types
   */
  private extractErrorInfo(error: any): ErrorInfo | null {
    if (isFjellHttpError(error)) {
      return error.fjellError;
    }

    if (error?.fjellError && typeof error.fjellError === 'object') {
      return error.fjellError;
    }

    return extractErrorInfo(error);
  }

  /**
   * Transform ErrorInfo into UserError
   */
  private transformErrorInfo(errorInfo: ErrorInfo): UserError {
    const baseError: UserError = {
      message: this.buildUserMessage(errorInfo),
      severity: this.getSeverity(errorInfo.code),
      details: {
        code: errorInfo.code,
        retryable: errorInfo.details?.retryable ?? false
      }
    };

    // Add title based on error code
    baseError.title = this.getErrorTitle(errorInfo.code);

    // Add actions if applicable
    if (errorInfo.details?.retryable) {
      baseError.actions = [{
        label: 'Try Again',
        action: () => {} // Will be overridden by component
      }];
    }

    // Add technical details if enabled
    if (this.options.includeTechnicalDetails && errorInfo.technical) {
      baseError.details!.technical = `Request ID: ${errorInfo.technical.requestId || 'N/A'}`;
    }

    // Include error code if enabled
    if (this.options.includeErrorCode) {
      baseError.message += ` (Error: ${errorInfo.code})`;
    }

    return baseError;
  }

  /**
   * Build user-friendly message from ErrorInfo
   */
  private buildUserMessage(errorInfo: ErrorInfo): string {
    let message = errorInfo.message;

    // Add context about affected items
    if (errorInfo.context?.affectedItems?.length) {
      const items = errorInfo.context.affectedItems
        .map(item => item.displayName || `${item.type} #${item.id}`)
        .join(', ');
      message = `${message} (Affected: ${items})`;
    }

    // Add parent location context
    if (errorInfo.context?.parentLocation) {
      const loc = errorInfo.context.parentLocation;
      message = `${message} in ${loc.type} #${loc.id}`;
    }

    // Add suggestions
    if (errorInfo.details?.suggestedAction) {
      message += `\n\n${errorInfo.details.suggestedAction}`;
    }

    // Add valid options
    if (errorInfo.details?.validOptions?.length) {
      const options = errorInfo.details.validOptions;
      if (options.length <= 5) {
        message += `\n\nValid options: ${options.join(', ')}`;
      } else {
        message += `\n\nValid options: ${options.slice(0, 5).join(', ')} and ${options.length - 5} more`;
      }
    }

    return message;
  }

  /**
   * Create generic error for non-Fjell errors
   */
  private createGenericError(error: any): UserError {
    return {
      message: error.message || 'An unexpected error occurred',
      title: 'Error',
      severity: 'error',
      details: {
        code: 'UNKNOWN_ERROR',
        retryable: false
      }
    };
  }

  /**
   * Get error title based on code
   */
  private getErrorTitle(code: string): string {
    const titles: Record<string, string> = {
      'VALIDATION_ERROR': 'Validation Error',
      'NOT_FOUND': 'Not Found',
      'PERMISSION_ERROR': 'Access Denied',
      'UNAUTHORIZED': 'Unauthorized',
      'BUSINESS_LOGIC_ERROR': 'Operation Failed',
      'DUPLICATE_ERROR': 'Duplicate Entry',
      'RATE_LIMIT_EXCEEDED': 'Rate Limit Exceeded',
      'NETWORK_ERROR': 'Network Error',
      'TIMEOUT': 'Request Timeout',
      'INTERNAL_ERROR': 'Server Error'
    };

    return titles[code] || 'Error';
  }

  /**
   * Get severity based on error code
   */
  private getSeverity(code: string): UserError['severity'] {
    const warningSeverityCodes = ['RATE_LIMIT_EXCEEDED'];
    const infoSeverityCodes = ['NOT_FOUND'];

    if (warningSeverityCodes.includes(code)) return 'warning';
    if (infoSeverityCodes.includes(code)) return 'info';
    return 'error';
  }
}

// Default error transformer instance
export const defaultErrorTransformer = new ErrorTransformer();

/**
 * Helper function to create contextual error
 */
export function createContextualError(
  error: any,
  context?: { operation?: string; itemType?: string }
): UserError {
  return defaultErrorTransformer.transform(error, context);
}

