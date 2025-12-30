import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { FileUploadError } from '../utils/errors';

// Check if we're in a serverless environment (Vercel)
// Vercel sets VERCEL=1 in all environments, and VERCEL_ENV can be 'production', 'preview', or 'development'
const isServerless = !!process.env.VERCEL || 
                     !!process.env.VERCEL_ENV || 
                     process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
                     process.env.VERCEL_ENV === 'production' ||
                     process.env.VERCEL_ENV === 'preview';

// Use memory storage for serverless (Vercel Blob), disk storage for local dev
// Default to blob storage if VERCEL is set (which it always is in Vercel)
const useBlobStorage = isServerless || process.env.USE_BLOB_STORAGE === 'true';

// For local development, use disk storage
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const paymentsDir = path.join(uploadDir, 'payments');

// Create directories if they don't exist (only for local development)
if (!useBlobStorage) {
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
}

// Configure storage based on environment
const storage = useBlobStorage
  ? multer.memoryStorage() // Use memory storage for blob uploads
  : multer.diskStorage({
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
 * Generate a unique filename for uploads
 */
export const generateFileName = (req: Request, originalName: string): string => {
  const userId = (req as any).user?.id || 'unknown';
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const basename = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50); // Limit basename length
  return `${timestamp}-${userId}-${basename}${ext}`;
};

/**
 * Cleanup uploaded file in case of error
 * Call this in error handlers to remove orphaned files
 * Works for both local files and blob URLs
 */
export const cleanupUploadedFile = async (filePath: string): Promise<void> => {
  try {
    // If it's a blob URL, delete from blob storage
    if (filePath.includes('blob.vercel-storage.com') || filePath.startsWith('https://')) {
      const { deleteFromBlob } = await import('../services/blobService');
      await deleteFromBlob(filePath);
      console.log(`Cleaned up blob file: ${filePath}`);
    } else if (filePath && fs.existsSync(filePath)) {
      // Local file cleanup
      fs.unlinkSync(filePath);
      console.log(`Cleaned up uploaded file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup file ${filePath}:`, error);
  }
};

/**
 * Validate file exists and is readable
 * For blob URLs, always returns true (blob URLs are always accessible)
 */
export const validateFileExists = (filePath: string): boolean => {
  try {
    // Blob URLs are always considered valid
    if (filePath.includes('blob.vercel-storage.com') || filePath.startsWith('https://')) {
      return true;
    }
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
};
