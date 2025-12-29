import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

/**
 * Middleware to check validation results and throw error if validation fails
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : undefined,
      message: err.msg,
      value: err.type === 'field' ? err.value : undefined
    }));

    throw new ValidationError('Validation failed', {
      errors: formattedErrors
    });
  }
  
  next();
};

// ============================================================================
// Authentication Validation Rules
// ============================================================================

export const signupValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please provide a valid phone number')
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// ============================================================================
// Booking Validation Rules
// ============================================================================

export const createBookingValidation = [
  body('classInstanceId')
    .notEmpty()
    .withMessage('Class instance ID is required')
    .isInt({ min: 1 })
    .withMessage('Class instance ID must be a positive integer'),
  body('childId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Child ID must be a positive integer')
];

export const cancelBookingValidation = [
  param('id')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer')
];

// ============================================================================
// Child Profile Validation Rules
// ============================================================================

export const createChildValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('age')
    .notEmpty()
    .withMessage('Age is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Age must be between 1 and 100')
];

export const updateChildValidation = [
  param('id')
    .notEmpty()
    .withMessage('Child ID is required')
    .isInt({ min: 1 })
    .withMessage('Child ID must be a positive integer'),
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('age')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Age must be between 1 and 100')
];

export const deleteChildValidation = [
  param('id')
    .notEmpty()
    .withMessage('Child ID is required')
    .isInt({ min: 1 })
    .withMessage('Child ID must be a positive integer')
];

// ============================================================================
// Package Purchase Validation Rules
// ============================================================================

export const purchasePackageValidation = [
  body('packageId')
    .notEmpty()
    .withMessage('Package ID is required')
    .isInt({ min: 1 })
    .withMessage('Package ID must be a positive integer')
];

// ============================================================================
// Admin Validation Rules
// ============================================================================

export const approvePaymentValidation = [
  param('id')
    .notEmpty()
    .withMessage('Payment ID is required')
    .isInt({ min: 1 })
    .withMessage('Payment ID must be a positive integer')
];

export const rejectPaymentValidation = [
  param('id')
    .notEmpty()
    .withMessage('Payment ID is required')
    .isInt({ min: 1 })
    .withMessage('Payment ID must be a positive integer'),
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Rejection reason must not exceed 500 characters')
];

export const createClassValidation = [
  body('classTypeId')
    .notEmpty()
    .withMessage('Class type ID is required')
    .isInt({ min: 1 })
    .withMessage('Class type ID must be a positive integer'),
  body('coachId')
    .notEmpty()
    .withMessage('Coach ID is required')
    .isInt({ min: 1 })
    .withMessage('Coach ID must be a positive integer'),
  body('locationId')
    .notEmpty()
    .withMessage('Location ID is required')
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Capacity must be between 1 and 100')
];

export const updateClassValidation = [
  param('id')
    .notEmpty()
    .withMessage('Class ID is required')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  body('classTypeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Class type ID must be a positive integer'),
  body('coachId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Coach ID must be a positive integer'),
  body('locationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Capacity must be between 1 and 100')
];

export const createLocationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Location name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Location name must be between 2 and 100 characters'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isInt({ min: 1, max: 200 })
    .withMessage('Capacity must be between 1 and 200')
];

export const updateLocationValidation = [
  param('id')
    .notEmpty()
    .withMessage('Location ID is required')
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Location name must be between 2 and 100 characters'),
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address cannot be empty')
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Capacity must be between 1 and 200')
];

export const createPackageValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Package name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Package name must be between 2 and 100 characters'),
  body('sessionCount')
    .notEmpty()
    .withMessage('Session count is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Session count must be between 1 and 100'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('expiryDays')
    .notEmpty()
    .withMessage('Expiry days is required')
    .isInt({ min: 1, max: 365 })
    .withMessage('Expiry days must be between 1 and 365')
];

export const updatePackageValidation = [
  param('id')
    .notEmpty()
    .withMessage('Package ID is required')
    .isInt({ min: 1 })
    .withMessage('Package ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Package name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Package name must be between 2 and 100 characters'),
  body('sessionCount')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Session count must be between 1 and 100'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('expiryDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Expiry days must be between 1 and 365')
];

// ============================================================================
// Coach Validation Rules
// ============================================================================

export const markAttendanceValidation = [
  param('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),
  body('status')
    .notEmpty()
    .withMessage('Attendance status is required')
    .isIn(['attended', 'no_show'])
    .withMessage('Status must be either "attended" or "no_show"')
];

// ============================================================================
// Query Parameter Validation Rules
// ============================================================================

export const classScheduleQueryValidation = [
  query('locationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  query('coachId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Coach ID must be a positive integer')
];

export const reportDateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];
