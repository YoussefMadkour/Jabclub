import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './database';

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const googleId = profile.id;
        const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || '';
        const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
        const photo = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        // Check if user exists with this Google ID
        let user = await prisma.user.findUnique({
          where: { googleId },
        });

        if (user) {
          // User exists with Google ID, return them
          return done(null, user);
        }

        // Check if user exists with this email (might be existing user linking Google)
        user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists but doesn't have Google ID - link it
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId },
          });
          return done(null, user);
        }

        // New user - create account
        user = await prisma.user.create({
          data: {
            email,
            googleId,
            firstName,
            lastName,
            passwordHash: null, // OAuth users don't have passwords
            role: 'member',
          },
        });

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, undefined);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        googleId: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
