# Rate Limiting Configuration

This document explains the rate limiting implementation to protect the API from abuse and brute force attacks.

## Overview

Rate limiting is implemented using `express-rate-limit` package with different limits for different endpoint types.

## Rate Limits by Endpoint

### Authentication Endpoints (`/api/auth/login`, `/api/auth/signup`)
- **Limit**: 5 requests per 15 minutes per IP
- **Purpose**: Prevent brute force password attacks and spam registrations
- **Error Code**: `RATE_LIMIT_EXCEEDED`
- **Error Message**: "Too many login/signup attempts. Please try again in 15 minutes."

### Current User Endpoint (`/api/auth/me`)
- **Limit**: 30 requests per minute per IP
- **Purpose**: Allow frequent auth checks while preventing abuse
- **Error Code**: `RATE_LIMIT_EXCEEDED`
- **Error Message**: "Too many requests. Please slow down."

### Password Reset Endpoints (when implemented)
- **Limit**: 3 requests per hour per IP
- **Purpose**: Prevent password reset abuse
- **Error Code**: `RATE_LIMIT_EXCEEDED`
- **Error Message**: "Too many password reset attempts. Please try again in an hour."

### General API Endpoints (all `/api/*` routes)
- **Limit**: 100 requests per 15 minutes per IP
- **Purpose**: Prevent API abuse while allowing normal usage
- **Error Code**: `RATE_LIMIT_EXCEEDED`
- **Error Message**: "Too many requests. Please try again later."

## Response Format

When rate limit is exceeded, the API returns HTTP 429 (Too Many Requests):

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many login/signup attempts. Please try again in 15 minutes."
  }
}
```

## Response Headers

The following headers are included in responses:

- `RateLimit-Limit`: Maximum number of requests allowed in the time window
- `RateLimit-Remaining`: Number of requests remaining in current window
- `RateLimit-Reset`: Unix timestamp when the rate limit resets

## Testing Rate Limits

### Test Login Rate Limit

Try logging in with incorrect credentials 6 times in a row:

```bash
# Request 1-5: Returns 401 (Unauthorized)
curl -X POST https://api.jabclubegy.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# Request 6: Returns 429 (Too Many Requests)
# You'll see the rate limit error message
```

### Test General API Rate Limit

Make 101 requests to any API endpoint within 15 minutes to trigger the general rate limit.

## Customizing Rate Limits

Rate limits can be adjusted in `backend/src/middleware/rateLimiter.ts`:

```typescript
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window (15 minutes)
  max: 5,                    // Max requests per window
  // ... other options
});
```

## Important Notes

1. **IP-based tracking**: Rate limits are tracked per IP address
2. **Vercel environment**: Works in both local dev and Vercel serverless
3. **No database required**: Rate limits are stored in memory (resets on serverless cold start)
4. **Cascade limits**: Routes can have multiple rate limiters (e.g., general + auth-specific)
5. **Health check excluded**: `/health` endpoint is not rate limited for monitoring

## Production Considerations

For production with high traffic, consider:

1. **Redis-backed rate limiting**: Use `rate-limit-redis` for distributed rate limiting
2. **Custom key generator**: Track by user ID instead of IP for authenticated users
3. **Whitelist IPs**: Exempt trusted IPs (monitoring services, internal tools)
4. **Dynamic limits**: Different limits for free vs premium users

## Monitoring

Monitor rate limit hits in your logs to:
- Detect potential attacks
- Adjust limits based on actual usage patterns
- Identify legitimate users hitting limits

Look for log entries showing HTTP 429 responses in Vercel dashboard.
