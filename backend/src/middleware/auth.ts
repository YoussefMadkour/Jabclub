import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

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

// Session-based authentication middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Debug logging for session
    console.log('🔐 Auth middleware - Session check:', {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      userId: req.session?.userId,
      role: req.session?.role,
      cookie: req.headers.cookie,
      sessionCookie: req.cookies?.['jabclub.sid'],
    });

    // Check if user is logged in via session
    if (!req.session.userId) {
      console.warn('⚠️ No userId in session:', {
        sessionID: req.sessionID,
        sessionKeys: Object.keys(req.session || {}),
      });
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    if (!user) {
      // Clear invalid session
      req.session.destroy(() => {});
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during authentication'
      }
    });
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User is not authenticated'
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource'
        }
      });
      return;
    }

    next();
  };
};
