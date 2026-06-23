import dotenv from 'dotenv';

dotenv.config();

const isProd = (process.env.NODE_ENV || 'development') === 'production';

// Secrets must be set in production. Fail fast at startup rather than silently
// falling back to a publicly-known default (which would make sessions / QR
// attendance signatures forgeable).
function requireSecret(name: string, devFallback: string): string {
  const val = process.env[name];
  if (val && val.length > 0) return val;
  if (isProd) {
    throw new Error(`Missing required ${name} environment variable in production`);
  }
  return devFallback;
}

export const config = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  databaseUrl: process.env.DATABASE_URL || '',
  sessionSecret: requireSecret('SESSION_SECRET', 'dev-session-secret-not-for-production'),
  qrSecret: requireSecret('QR_SECRET', 'dev-qr-secret-not-for-production'),
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
