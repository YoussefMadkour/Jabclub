# Error Handling Guide

This guide explains how to use the error handling utilities in the JabClub frontend application.

## Overview

The application provides comprehensive error handling through:
- **Axios Interceptors**: Automatic API error handling and retry logic
- **Custom Hooks**: `useErrorHandler` and `useForm` for managing errors
- **Validation Utilities**: Client-side form validation
- **UI Components**: Error display components

## API Error Handling

### Using the Enhanced Axios Client

The axios client automatically handles common errors:

```typescript
import apiClient from '@/lib/axios';

// Automatic error handling with interceptors
try {
  const response = await apiClient.get('/members/dashboard');
  // Handle success
} catch (error) {
  // Error is already formatted as ApiRequestError
  console.error(error.message); // User-friendly message
}
```

### Error Types

All API errors are converted to `ApiRequestError` with:
- `statusCode`: HTTP status code
- `code`: Error code (e.g., 'INSUFFICIENT_CREDITS')
- `message`: User-friendly error message
- `details`: Additional error details

### Retry Logic

Use the `retryRequest` helper for automatic retries:

```typescript
import { retryRequest } from '@/lib/axios';

const data = await retryRequest(
  () => apiClient.get('/classes/schedule'),
  3, // max retries
  1000 // delay in ms
);
```

## Form Validation

### Using the useForm Hook

```typescript
import { useForm } from '@/hooks/useForm';
import { validationRules } from '@/utils/validation';

const MyForm = () => {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validationRules: {
      email: validationRules.email,
      password: validationRules.password,
    },
    onSubmit: async (values) => {
      await apiClient.post('/auth/login', values);
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Email"
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
        touched={touched.email}
        required
      />
      {/* More fields... */}
    </form>
  );
};
```

### Custom Validation Rules

```typescript
import { ValidationRule } from '@/utils/validation';

const customRules: ValidationRule[] = [
  {
    validate: (value) => value.length >= 5,
    message: 'Must be at least 5 characters',
  },
  {
    validate: (value) => /^[a-zA-Z]+$/.test(value),
    message: 'Must contain only letters',
  },
];
```

## Error Display Components

### ErrorMessage Component

Display validation or API errors:

```typescript
import { ErrorMessage } from '@/components/shared';

<ErrorMessage 
  message="Failed to load data" 
  errors={['Error 1', 'Error 2']}
/>
```

### FormField Component

Form field with built-in error display:

```typescript
import { FormField } from '@/components/shared';

<FormField
  label="First Name"
  name="firstName"
  value={values.firstName}
  onChange={handleChange}
  onBlur={handleBlur}
  error={errors.firstName}
  touched={touched.firstName}
  required
/>
```

### RetryError Component

Display errors with retry functionality:

```typescript
import { RetryError } from '@/components/shared';

<RetryError
  message="Failed to load classes"
  onRetry={refetch}
  isRetrying={isRefetching}
/>
```

## Error Handling Hook

### useErrorHandler

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

const MyComponent = () => {
  const { getFriendlyMessage, isSpecificError } = useErrorHandler();

  const handleError = (error: unknown) => {
    const message = getFriendlyMessage(error);
    
    if (isSpecificError(error, 'INSUFFICIENT_CREDITS')) {
      // Handle specific error
      router.push('/purchase');
    }
    
    toast.error(message);
  };
};
```

## React Query Integration

Use error handling with React Query:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useToast } from '@/components/shared';

const MyComponent = () => {
  const { getFriendlyMessage } = useErrorHandler();
  const toast = useToast();

  const { data, error, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get('/members/dashboard'),
    onError: (error) => {
      toast.error(getFriendlyMessage(error));
    },
  });

  if (isError) {
    return (
      <RetryError
        message={getFriendlyMessage(error)}
        onRetry={refetch}
      />
    );
  }

  // Render data...
};
```

## Best Practices

1. **Always use try-catch** for async operations
2. **Display user-friendly messages** using `getFriendlyMessage()`
3. **Validate on blur** for better UX
4. **Show loading states** during submissions
5. **Provide retry options** for network errors
6. **Log errors** for debugging (already done by interceptors)
7. **Handle specific error codes** when needed
8. **Clear errors** when user starts typing

## Common Error Codes

- `INSUFFICIENT_CREDITS`: User doesn't have enough credits
- `CLASS_FULL`: Class is at capacity
- `CANCELLATION_WINDOW_PASSED`: Too late to cancel
- `ALREADY_BOOKED`: Duplicate booking attempt
- `CREDITS_EXPIRED`: Package has expired
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Permission denied
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input
- `NETWORK_ERROR`: Connection issue
- `SERVER_ERROR`: Backend error

## Example: Complete Form with Error Handling

```typescript
import { useForm } from '@/hooks/useForm';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { FormField, ErrorMessage } from '@/components/shared';
import { validationRules } from '@/utils/validation';
import { useToast } from '@/components/shared';
import apiClient from '@/lib/axios';

const BookingForm = () => {
  const { getFriendlyMessage } = useErrorHandler();
  const toast = useToast();
  const [apiError, setApiError] = useState('');

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: {
      classInstanceId: '',
      childId: '',
    },
    validationRules: {
      classInstanceId: [
        {
          validate: (value) => !!value,
          message: 'Please select a class',
        },
      ],
    },
    onSubmit: async (values) => {
      try {
        setApiError('');
        await apiClient.post('/members/bookings', values);
        toast.success('Class booked successfully!');
      } catch (error) {
        const message = getFriendlyMessage(error);
        setApiError(message);
        toast.error(message);
      }
    },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && <ErrorMessage message={apiError} />}
      
      <FormField
        label="Select Class"
        name="classInstanceId"
        type="select"
        value={values.classInstanceId}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.classInstanceId}
        touched={touched.classInstanceId}
        required
      >
        <option value="">Choose a class...</option>
        {/* Options... */}
      </FormField>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-red-600 text-white rounded-lg"
      >
        {isSubmitting ? 'Booking...' : 'Book Class'}
      </button>
    </form>
  );
};
```
