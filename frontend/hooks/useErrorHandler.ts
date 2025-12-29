import { useCallback } from 'react';
import { ApiRequestError, getErrorMessage, isErrorCode } from '@/lib/axios';

/**
 * Custom hook for handling API errors with user-friendly messages
 */
export const useErrorHandler = () => {
  /**
   * Handle API error and return user-friendly message
   */
  const handleError = useCallback((error: unknown): string => {
    const message = getErrorMessage(error);
    console.error('API Error:', error);
    return message;
  }, []);

  /**
   * Get specific error details if available
   */
  const getErrorDetails = useCallback((error: unknown): any => {
    if (error instanceof ApiRequestError) {
      return error.details;
    }
    return null;
  }, []);

  /**
   * Check if error is a specific type
   */
  const isSpecificError = useCallback((error: unknown, code: string): boolean => {
    return isErrorCode(error, code);
  }, []);

  /**
   * Get user-friendly message for common error codes
   */
  const getFriendlyMessage = useCallback((error: unknown): string => {
    if (!(error instanceof ApiRequestError)) {
      return getErrorMessage(error);
    }

    // Map error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      INSUFFICIENT_CREDITS: 'You don\'t have enough credits to book this class. Please purchase a package.',
      CLASS_FULL: 'This class is fully booked. Please try another time slot.',
      CANCELLATION_WINDOW_PASSED: 'It\'s too late to cancel this booking. Cancellations must be made at least 1 hour before class.',
      ALREADY_BOOKED: 'You\'re already booked for this class.',
      CREDITS_EXPIRED: 'Your credits have expired. Please purchase a new package.',
      DUPLICATE_ENTRY: 'This record already exists.',
      VALIDATION_ERROR: 'Please check your input and try again.',
      UNAUTHORIZED: 'Please log in to continue.',
      FORBIDDEN: 'You don\'t have permission to perform this action.',
      NOT_FOUND: 'The requested item was not found.',
      NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
      REQUEST_TIMEOUT: 'Request timed out. Please try again.',
      SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    };

    return errorMessages[error.code] || error.message;
  }, []);

  return {
    handleError,
    getErrorDetails,
    isSpecificError,
    getFriendlyMessage,
  };
};

export default useErrorHandler;
