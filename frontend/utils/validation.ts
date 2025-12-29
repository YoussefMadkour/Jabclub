/**
 * Form Validation Utilities
 * Provides client-side validation helpers for forms
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password strength validation
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Phone number validation (flexible format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Required field validation
 */
export const isRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

/**
 * Minimum length validation
 */
export const minLength = (value: string, min: number): boolean => {
  return value.trim().length >= min;
};

/**
 * Maximum length validation
 */
export const maxLength = (value: string, max: number): boolean => {
  return value.trim().length <= max;
};

/**
 * Number range validation
 */
export const inRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Positive number validation
 */
export const isPositiveNumber = (value: number): boolean => {
  return !isNaN(value) && value > 0;
};

/**
 * Integer validation
 */
export const isInteger = (value: number): boolean => {
  return Number.isInteger(value);
};

/**
 * Date validation (checks if date is valid and not in the past)
 */
export const isFutureDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
};

/**
 * Validate form fields against rules
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule[]>
): ValidationResult => {
  const errors: Record<string, string> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];

    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        errors[field] = rule.message;
        break; // Stop at first error for this field
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Common validation rules
 */
export const validationRules = {
  email: [
    {
      validate: isRequired,
      message: 'Email is required',
    },
    {
      validate: isValidEmail,
      message: 'Please enter a valid email address',
    },
  ],
  password: [
    {
      validate: isRequired,
      message: 'Password is required',
    },
    {
      validate: (value: string) => minLength(value, 8),
      message: 'Password must be at least 8 characters long',
    },
    {
      validate: isStrongPassword,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    },
  ],
  firstName: [
    {
      validate: isRequired,
      message: 'First name is required',
    },
    {
      validate: (value: string) => minLength(value, 2),
      message: 'First name must be at least 2 characters',
    },
    {
      validate: (value: string) => maxLength(value, 100),
      message: 'First name must not exceed 100 characters',
    },
  ],
  lastName: [
    {
      validate: isRequired,
      message: 'Last name is required',
    },
    {
      validate: (value: string) => minLength(value, 2),
      message: 'Last name must be at least 2 characters',
    },
    {
      validate: (value: string) => maxLength(value, 100),
      message: 'Last name must not exceed 100 characters',
    },
  ],
  phone: [
    {
      validate: (value: string) => !value || isValidPhone(value),
      message: 'Please enter a valid phone number',
    },
  ],
  age: [
    {
      validate: isRequired,
      message: 'Age is required',
    },
    {
      validate: (value: number) => isInteger(value) && inRange(value, 1, 100),
      message: 'Age must be between 1 and 100',
    },
  ],
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Debounce function for input validation
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
