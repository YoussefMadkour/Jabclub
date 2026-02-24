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
      req.user = cached;
      return next();
    }

    // 2. Cache miss — fetch from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });

    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
      return;
    }

    // 3. Store in cache for next requests
    await cacheSet(cacheKey.userProfile(userId), user, TTL.USER_PROFILE);

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
