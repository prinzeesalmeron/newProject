import * as Sentry from '@sentry/browser';
import { AuditService } from '../services/auditService';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  CONTRACT = 'contract',
  PAYMENT = 'payment',
  DATABASE = 'database',
  UNKNOWN = 'unknown'
}

export interface AppError extends Error {
  code?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  userMessage?: string;
  recoverable?: boolean;
  retryable?: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private static sentryInitialized = false;

  private constructor() {
    this.initializeSentry();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private initializeSentry() {
    if (ErrorHandler.sentryInitialized) return;

    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn) {
      Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
          return event;
        }
      });
      ErrorHandler.sentryInitialized = true;
    }
  }

  /**
   * Handle and log errors with appropriate severity
   */
  async handleError(error: Error | AppError, context?: Record<string, any>): Promise<void> {
    const appError = this.normalizeError(error, context);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught:', appError);
    }

    // Log to Sentry
    this.logToSentry(appError);

    // Log to database audit trail
    await this.logToDatabase(appError);

    // Notify user if critical
    if (appError.severity === ErrorSeverity.CRITICAL) {
      this.notifyCriticalError(appError);
    }
  }

  /**
   * Normalize any error to AppError format
   */
  private normalizeError(error: Error | AppError, context?: Record<string, any>): AppError {
    if (this.isAppError(error)) {
      return { ...error, context: { ...error.context, ...context } };
    }

    // Convert regular error to AppError
    const category = this.categorizeError(error);
    const severity = this.determineSeverity(error, category);

    return {
      ...error,
      name: error.name || 'Error',
      message: error.message || 'An unexpected error occurred',
      category,
      severity,
      context,
      userMessage: this.getUserMessage(error, category),
      recoverable: this.isRecoverable(category),
      retryable: this.isRetryable(category)
    };
  }

  private isAppError(error: any): error is AppError {
    return 'category' in error && 'severity' in error;
  }

  /**
   * Categorize error based on message and type
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('token')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('contract') || message.includes('transaction')) {
      return ErrorCategory.CONTRACT;
    }
    if (message.includes('payment') || message.includes('stripe')) {
      return ErrorCategory.PAYMENT;
    }
    if (message.includes('database') || message.includes('query')) {
      return ErrorCategory.DATABASE;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    // Critical categories
    if (category === ErrorCategory.PAYMENT || category === ErrorCategory.CONTRACT) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity
    if (category === ErrorCategory.AUTHENTICATION || category === ErrorCategory.DATABASE) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity
    if (category === ErrorCategory.AUTHORIZATION || category === ErrorCategory.NETWORK) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity for validation and unknown
    return ErrorSeverity.LOW;
  }

  /**
   * Get user-friendly error message
   */
  private getUserMessage(error: Error, category: ErrorCategory): string {
    const defaultMessages: Record<ErrorCategory, string> = {
      [ErrorCategory.NETWORK]: 'Connection issue. Please check your internet and try again.',
      [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
      [ErrorCategory.AUTHENTICATION]: 'Please log in again to continue.',
      [ErrorCategory.AUTHORIZATION]: 'You do not have permission to perform this action.',
      [ErrorCategory.CONTRACT]: 'Blockchain transaction failed. Please try again.',
      [ErrorCategory.PAYMENT]: 'Payment processing failed. Please check your payment method.',
      [ErrorCategory.DATABASE]: 'Unable to complete your request. Please try again later.',
      [ErrorCategory.UNKNOWN]: 'Something went wrong. Please try again.'
    };

    return defaultMessages[category];
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverable(category: ErrorCategory): boolean {
    return category !== ErrorCategory.CRITICAL;
  }

  /**
   * Check if operation should be retried
   */
  private isRetryable(category: ErrorCategory): boolean {
    return [
      ErrorCategory.NETWORK,
      ErrorCategory.DATABASE
    ].includes(category);
  }

  /**
   * Log error to Sentry
   */
  private logToSentry(error: AppError): void {
    if (!ErrorHandler.sentryInitialized) return;

    Sentry.withScope((scope) => {
      scope.setLevel(this.getSentryLevel(error.severity));
      scope.setTag('category', error.category);
      scope.setTag('recoverable', error.recoverable ? 'yes' : 'no');

      if (error.context) {
        Object.entries(error.context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }

      Sentry.captureException(error);
    });
  }

  private getSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
    const levelMap: Record<ErrorSeverity, Sentry.SeverityLevel> = {
      [ErrorSeverity.LOW]: 'info',
      [ErrorSeverity.MEDIUM]: 'warning',
      [ErrorSeverity.HIGH]: 'error',
      [ErrorSeverity.CRITICAL]: 'fatal'
    };
    return levelMap[severity];
  }

  /**
   * Log error to database
   */
  private async logToDatabase(error: AppError): Promise<void> {
    try {
      await AuditService.logSecurityEvent({
        eventType: `error_${error.category}`,
        severity: error.severity === ErrorSeverity.CRITICAL ? 'critical' : 'warning',
        description: error.message,
        metadata: {
          code: error.code,
          category: error.category,
          severity: error.severity,
          stack: error.stack,
          context: error.context
        }
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
  }

  /**
   * Notify about critical errors
   */
  private notifyCriticalError(error: AppError): void {
    // In production, this would trigger alerts to ops team
    console.error('CRITICAL ERROR:', error);

    // Could integrate with PagerDuty, Slack, etc.
    if (import.meta.env.PROD) {
      // Send notification to ops team
    }
  }

  /**
   * Create a typed error
   */
  static createError(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context?: Record<string, any>
  ): AppError {
    const error = new Error(message) as AppError;
    error.category = category;
    error.severity = severity;
    error.context = context;
    error.userMessage = ErrorHandler.getInstance().getUserMessage(error, category);
    error.recoverable = ErrorHandler.getInstance().isRecoverable(category);
    error.retryable = ErrorHandler.getInstance().isRetryable(category);
    return error;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
