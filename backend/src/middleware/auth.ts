import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { cacheGet, cacheSet, cacheDel, cacheKey, TTL } from '../config/redis';

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId: number;
    role: string;
  }
}

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

type CachedUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isPaused: boolean;
  isFrozen: boolean;
  deletedAt: Date | string | null;
};

// Reject requests from suspended/deleted accounts. Returns true if the request was
// handled (caller should stop). Used on both cache-hit and DB-fetch paths so that a
// freeze/pause/delete takes effect within the (short) cache TTL even if an
// invalidation was missed.
const enforceAccountStatus = (
  req: AuthRequest,
  res: Response,
  user: CachedUser
): boolean => {
  if (user.deletedAt) {
    req.session.destroy(() => {});
    res.status(401).json({
      success: false,
      error: { code: 'ACCOUNT_DELETED', message: 'This account no longer exists.' }
    });
    return true;
  }
  if (user.isFrozen || user.isPaused) {
    res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account is currently suspended. Please contact the gym for assistance.'
      }
    });
    return true;
  }
  return false;
};

// Session-based authentication middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' }
      });
      return;
    }

    const userId = req.session.userId;

    // 1. Try Redis cache first (avoids DB hit on every request)
    const cached = await cacheGet<CachedUser>(cacheKey.userProfile(userId));
    if (cached) {
      if (enforceAccountStatus(req, res, cached)) return;
      req.user = cached;
      return next();
    }

    // 2. Cache miss — fetch from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true,
        isPaused: true, isFrozen: true, deletedAt: true
      }
    });

    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
      return;
    }

    // 3. Store in cache for next requests (short TTL so status changes self-heal)
    await cacheSet(cacheKey.userProfile(userId), user, TTL.USER_PROFILE);

    if (enforceAccountStatus(req, res, user)) return;

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'An error occurred during authentication' }
    });
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'NOT_AUTHENTICATED', message: 'User is not authenticated' }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' }
      });
      return;
    }

    next();
  };
};

// Call this when a user's profile is updated so the cache is invalidated
export const invalidateUserCache = async (userId: number): Promise<void> => {
  await cacheDel(cacheKey.userProfile(userId));
};
