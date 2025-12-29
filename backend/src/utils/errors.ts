/**
 * Custom Error Classes for JabClub API
 * Provides structured error handling with consistent error codes and messages
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, code = 'AUTHENTICATION_ERROR', details?: any) {
    super(message, 401, code, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, details?: any) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(required: number, available: number) {
    super(
      'You do not have enough session credits',
      400,
      'INSUFFICIENT_CREDITS',
      { required, available }
    );
  }
}

export class ClassFullError extends AppError {
  constructor(classId: number) {
    super('This class is fully booked', 400, 'CLASS_FULL', { classId });
  }
}

export class CancellationWindowError extends AppError {
  constructor(classStartTime: Date, minutesUntilClass: number) {
    super(
      'Cancellations must be made at least 1 hour before class start time',
      400,
      'CANCELLATION_WINDOW_PASSED',
      {
        classStartTime: classStartTime.toISOString(),
        minutesUntilClass,
        cancellationDeadline: new Date(
          classStartTime.getTime() - 60 * 60 * 1000
        ).toISOString()
      }
    );
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'FILE_UPLOAD_ERROR', details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details, false);
  }
}

export class ServerError extends AppError {
  constructor(message = 'An unexpected error occurred', details?: any) {
    super(message, 500, 'SERVER_ERROR', details, false);
  }
}
