import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { sendNotification, NotificationTemplates } from '../services/notificationService';

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId: number;
    role: string;
  }
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
      return;
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'A user with this email already exists'
        }
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        role: 'member' // Default role for signup
      }
    });

    // Store user in session
    req.session.userId = user.id;
    req.session.role = user.role;
    
    // Force session to be sent by resetting the cookie maxAge
    // This ensures express-session ALWAYS sends the Set-Cookie header
    req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Save session explicitly (required for serverless/PostgreSQL store)
    req.session.save((err) => {
      if (err) {
        console.error('Failed to save session during signup:', err);
        res.status(500).json({
          success: false,
          error: {
            code: 'SESSION_ERROR',
            message: 'Failed to create session'
          }
        });
        return;
      }

      // Log session info for debugging
      console.log('Session saved:', {
        sessionId: req.sessionID,
        userId: req.session.userId,
        cookieName: 'jabclub.sid',
        cookieConfig: {
          domain: req.session.cookie.domain,
          secure: req.session.cookie.secure,
          sameSite: req.session.cookie.sameSite,
          httpOnly: req.session.cookie.httpOnly,
          path: req.session.cookie.path,
          maxAge: req.session.cookie.maxAge,
        },
      });

      // Send signup success notification (non-blocking)
      const template = NotificationTemplates.signupSuccess(user.firstName);
      sendNotification(
        {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        },
        template.emailSubject,
        template.emailHtml
      ).catch((err) => {
        console.error('Failed to send signup notification:', err);
        // Don't fail the signup if notification fails
      });

      // Return user data without password
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role
          }
        }
      });
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during registration'
      }
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
      return;
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    // Store user in session
    req.session.userId = user.id;
    req.session.role = user.role;
    
    // Force session to be sent by resetting the cookie maxAge
    // This ensures express-session ALWAYS sends the Set-Cookie header
    req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Save session explicitly (required for serverless/PostgreSQL store)
    req.session.save((err) => {
      if (err) {
        console.error('Failed to save session during login:', err);
        res.status(500).json({
          success: false,
          error: {
            code: 'SESSION_ERROR',
            message: 'Failed to create session'
          }
        });
        return;
      }

      // Log session info for debugging
      console.log('Session saved:', {
        sessionId: req.sessionID,
        userId: req.session.userId,
        cookieName: 'jabclub.sid',
        cookieConfig: {
          domain: req.session.cookie.domain,
          secure: req.session.cookie.secure,
          sameSite: req.session.cookie.sameSite,
          httpOnly: req.session.cookie.httpOnly,
          path: req.session.cookie.path,
          maxAge: req.session.cookie.maxAge,
        },
      });

      // Return user data without password
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role
          }
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during login'
      }
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        res.status(500).json({
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'An error occurred during logout'
          }
        });
        return;
      }
      
      res.clearCookie('jabclub.sid'); // Match the custom session cookie name
      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during logout'
      }
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Debug logging
    console.log('👤 getCurrentUser - Session check:', {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      userId: req.session?.userId,
      role: req.session?.role,
      cookie: req.headers.cookie,
      sessionCookie: req.cookies?.['jabclub.sid'],
    });

    if (!req.session.userId) {
      console.warn('⚠️ getCurrentUser - No userId in session:', {
        sessionID: req.sessionID,
        sessionKeys: Object.keys(req.session || {}),
      });
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId }
    });

    if (!user) {
      req.session.destroy(() => {});
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching user data'
      }
    });
  }
};
