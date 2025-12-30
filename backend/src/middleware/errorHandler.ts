import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { AppError } from '../utils/errors';
import multer from 'multer';

/**
 * Global error handling middleware
 * Catches all errors and formats them into consistent API responses
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Handle custom AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details })
      }
    });
    return;
  }

  // Handle Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(err);
    res.status(prismaError.statusCode).json({
      success: false,
      error: prismaError.error
    });
    return;
  }

  // Handle Prisma validation errors
  if (err instanceof PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data provided',
        details: {
          prismaError: err.message
        }
      }
    });
    return;
  }

  // Handle Multer file upload errors
  if (err instanceof multer.MulterError) {
    const multerError = handleMulterError(err);
    res.status(multerError.statusCode).json({
      success: false,
      error: multerError.error
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      }
    });
    return;
  }

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message
      }
    });
    return;
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          stack: err.stack
        }
      })
    }
  });
};

/**
 * Handle Prisma-specific errors and convert them to user-friendly messages
 */
function handlePrismaError(err: PrismaClientKnownRequestError): {
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: any;
  };
} {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      const target = (err.meta?.target as string[]) || [];
      const field = target[0] || 'field';
      return {
        statusCode: 409,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `A record with this ${field} already exists`,
          details: {
            field,
            constraint: err.meta?.target
          }
        }
      };

    case 'P2025':
      // Record not found
      return {
        statusCode: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested record was not found',
          details: {
            cause: err.meta?.cause
          }
        }
      };

    case 'P2003':
      // Foreign key constraint violation
      return {
        statusCode: 400,
        error: {
          code: 'INVALID_REFERENCE',
          message: 'The referenced record does not exist',
          details: {
            field: err.meta?.field_name
          }
        }
      };

    case 'P2014':
      // Required relation violation
      return {
        statusCode: 400,
        error: {
          code: 'RELATION_VIOLATION',
          message: 'The operation violates a required relation',
          details: {
            relation: err.meta?.relation_name
          }
        }
      };

    case 'P2000':
      // Value too long for column
      return {
        statusCode: 400,
        error: {
          code: 'VALUE_TOO_LONG',
          message: 'The provided value is too long',
          details: {
            column: err.meta?.column_name
          }
        }
      };

    case 'P2001':
      // Record does not exist
      return {
        statusCode: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'The record does not exist',
          details: {
            cause: err.meta?.cause
          }
        }
      };

    case 'P2011':
      // Null constraint violation
      return {
        statusCode: 400,
        error: {
          code: 'NULL_CONSTRAINT_VIOLATION',
          message: 'A required field is missing',
          details: {
            constraint: err.meta?.constraint
          }
        }
      };

    case 'P2012':
      // Missing required value
      return {
        statusCode: 400,
        error: {
          code: 'MISSING_REQUIRED_VALUE',
          message: 'A required value is missing',
          details: {
            path: err.meta?.path
          }
        }
      };

    default:
      // Generic database error
      return {
        statusCode: 500,
        error: {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
          details: process.env.NODE_ENV === 'development'
            ? {
                code: err.code,
                meta: err.meta
              }
            : undefined
        }
      };
  }
}

/**
 * Handle Multer file upload errors
 */
function handleMulterError(err: multer.MulterError): {
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: any;
  };
} {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return {
        statusCode: 400,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'The uploaded file is too large',
          details: {
            maxSize: '5MB',
            field: err.field
          }
        }
      };

    case 'LIMIT_FILE_COUNT':
      return {
        statusCode: 400,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Too many files uploaded',
          details: {
            field: err.field
          }
        }
      };

    case 'LIMIT_UNEXPECTED_FILE':
      return {
        statusCode: 400,
        error: {
          code: 'UNEXPECTED_FILE',
          message: 'Unexpected file field',
          details: {
            field: err.field
          }
        }
      };

    default:
      return {
        statusCode: 400,
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: err.message || 'An error occurred during file upload'
        }
      };
  }
}

/**
 * Async error wrapper to catch errors in async route handlers
 * Usage: asyncHandler(async (req, res) => { ... })
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      details: {
        method: req.method,
        path: req.path
      }
    }
  });
};
