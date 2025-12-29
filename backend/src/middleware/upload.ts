import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { FileUploadError } from '../utils/errors';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const paymentsDir = path.join(uploadDir, 'payments');

// Create directories if they don't exist
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  if (!fs.existsSync(paymentsDir)) {
    fs.mkdirSync(paymentsDir, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create upload directories:', error);
  throw new Error('Upload directory initialization failed');
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Organize by year/month
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const monthDir = path.join(paymentsDir, String(year), month);

      // Create month directory if it doesn't exist
      if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir, { recursive: true });
      }

      cb(null, monthDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    try {
      // Generate unique filename: timestamp-userId-originalname
      const userId = (req as any).user?.id || 'unknown';
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 50); // Limit basename length
      const filename = `${timestamp}-${userId}-${basename}${ext}`;
      cb(null, filename);
    } catch (error) {
      cb(error as Error, '');
    }
  }
});

// File filter to validate image types
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allowed mime types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif'
  ];

  // Allowed extensions (as fallback check)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    const error = new FileUploadError(
      'Invalid file type. Only JPEG, PNG, and HEIC images are allowed.',
      {
        receivedType: file.mimetype,
        receivedExtension: ext,
        allowedTypes: allowedMimes,
        allowedExtensions
      }
    );
    cb(error);
  }
};

// Configure multer
export const uploadPaymentScreenshot = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1 // Only allow 1 file per request
  }
});

/**
 * Cleanup uploaded file in case of error
 * Call this in error handlers to remove orphaned files
 */
export const cleanupUploadedFile = (filePath: string): void => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up uploaded file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup file ${filePath}:`, error);
  }
};

/**
 * Validate file exists and is readable
 */
export const validateFileExists = (filePath: string): boolean => {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
};
