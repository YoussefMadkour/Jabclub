import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Error interface matching backend error format
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

// Custom error class for API errors
export class ApiRequestError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(statusCode: number, error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.code = error.code;
    this.details = error.details;
  }
}

// Get API URL from environment, with fallback
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use the env variable
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  }
  // Server-side fallback
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
};

const apiClient = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

// Debug: Log the base URL being used
if (typeof window !== 'undefined') {
  console.log('🔗 API Base URL:', apiClient.defaults.baseURL);
  console.log('🔗 NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL);
}

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Debug logging
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      withCredentials: config.withCredentials,
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Debug logging
    console.log('✅ API Response:', {
      status: response.status,
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    // Debug logging
    console.log('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });
    
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(
          new ApiRequestError(408, {
            code: 'REQUEST_TIMEOUT',
            message: 'Request timed out. Please check your connection and try again.',
          })
        );
      }

      return Promise.reject(
        new ApiRequestError(0, {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your internet connection.',
        })
      );
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized - redirect to login
    if (status === 401) {
      if (typeof window !== 'undefined') {
        // Only redirect if not already on login/signup page
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
          window.location.href = '/login';
        }
      }

      return Promise.reject(
        new ApiRequestError(status, data?.error || {
          code: 'UNAUTHORIZED',
          message: 'Your session has expired. Please log in again.',
        })
      );
    }

    // Handle 403 Forbidden
    if (status === 403) {
      return Promise.reject(
        new ApiRequestError(status, data?.error || {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
        })
      );
    }

    // Handle 404 Not Found
    if (status === 404) {
      return Promise.reject(
        new ApiRequestError(status, data?.error || {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.',
        })
      );
    }

    // Handle 409 Conflict
    if (status === 409) {
      return Promise.reject(
        new ApiRequestError(status, data?.error || {
          code: 'CONFLICT',
          message: 'A conflict occurred with the current state.',
        })
      );
    }

    // Handle 500 Server Error
    if (status >= 500) {
      return Promise.reject(
        new ApiRequestError(status, data?.error || {
          code: 'SERVER_ERROR',
          message: 'A server error occurred. Please try again later.',
        })
      );
    }

    // Handle other errors with backend error format
    if (data?.error) {
      return Promise.reject(new ApiRequestError(status, data.error));
    }

    // Fallback for unexpected error format
    return Promise.reject(
      new ApiRequestError(status, {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred.',
      })
    );
  }
);

/**
 * Helper function to extract user-friendly error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
};

/**
 * Helper function to check if error is a specific error code
 */
export const isErrorCode = (error: unknown, code: string): boolean => {
  return error instanceof ApiRequestError && error.code === code;
};

/**
 * Retry helper for failed requests
 */
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
      if (error instanceof ApiRequestError) {
        const shouldRetry =
          error.statusCode === 0 || // Network error
          error.statusCode === 408 || // Timeout
          error.statusCode === 429 || // Rate limit
          error.statusCode >= 500; // Server error

        if (!shouldRetry) {
          throw error;
        }
      }

      // Don't delay on last attempt
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
};

export default apiClient;
