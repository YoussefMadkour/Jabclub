import { put, del } from '@vercel/blob';
import { FileUploadError } from '../utils/errors';

/**
 * Upload a file to Vercel Blob Storage
 * @param fileBuffer - The file buffer
 * @param fileName - The desired file name
 * @param contentType - The MIME type of the file
 * @returns The blob URL
 */
export const uploadToBlob = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> => {
  try {
    // Organize by year/month in blob path
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const blobPath = `payments/${year}/${month}/${fileName}`;

    const blob = await put(blobPath, fileBuffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false
    });

    return blob.url;
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new FileUploadError(
      'Failed to upload file to storage',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
};

/**
 * Delete a file from Vercel Blob Storage
 * @param blobUrl - The blob URL to delete
 */
export const deleteFromBlob = async (blobUrl: string): Promise<void> => {
  try {
    await del(blobUrl);
  } catch (error) {
    console.error('Blob deletion error:', error);
    // Don't throw - deletion failures shouldn't break the app
  }
};

/**
 * Check if a URL is a Vercel Blob URL
 */
export const isBlobUrl = (url: string): boolean => {
  return url.includes('blob.vercel-storage.com') || url.startsWith('https://');
};

