import path from 'path';

/**
 * Converts an absolute file path to a relative URL path for serving static files
 * Example: /Users/.../backend/uploads/payments/2025/11/file.jpg -> /uploads/payments/2025/11/file.jpg
 * Example: ./uploads/payments/2025/11/file.jpg -> /uploads/payments/2025/11/file.jpg
 * Example: https://blob.vercel-storage.com/... -> returns as-is (blob URL)
 */
export const getRelativeUploadPath = (filePath: string): string => {
  if (!filePath) {
    return '';
  }

  // If it's already a blob URL or HTTPS URL, return as-is
  if (filePath.includes('blob.vercel-storage.com') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Normalize path separators (convert backslashes to forward slashes)
  let normalizedPath = filePath.replace(/\\/g, '/');

  // Find the 'uploads' directory in the path (case-sensitive first)
  let uploadsIndex = normalizedPath.indexOf('/uploads/');
  
  if (uploadsIndex === -1) {
    // Try case-insensitive search
    const lowerPath = normalizedPath.toLowerCase();
    const uploadsIndexLower = lowerPath.indexOf('/uploads/');
    
    if (uploadsIndexLower !== -1) {
      // Extract from the found uploads directory (preserve original case)
      normalizedPath = normalizedPath.substring(uploadsIndexLower);
      uploadsIndex = 0; // Now it starts with /uploads/
    } else {
      // Check if path already starts with /uploads (might be relative already)
      if (normalizedPath.startsWith('/uploads')) {
        return normalizedPath;
      }
      
      // Check if path contains 'uploads' without the leading slash
      const uploadsIndexNoSlash = lowerPath.indexOf('uploads/');
      if (uploadsIndexNoSlash !== -1) {
        // Extract from uploads/ onwards and add leading slash
        return '/' + normalizedPath.substring(uploadsIndexNoSlash);
      }
      
      // If path is relative and starts with ./uploads or just uploads
      if (normalizedPath.startsWith('./uploads/')) {
        return normalizedPath.substring(1); // Remove the . to get /uploads/...
      }
      
      if (normalizedPath.startsWith('uploads/')) {
        return '/' + normalizedPath; // Add leading slash
      }
      
      // Last resort: if path starts with /, return as-is (might be a different format)
      // Otherwise, assume it's relative to uploads
      if (normalizedPath.startsWith('/')) {
        return normalizedPath;
      }
      
      // If nothing matches, return with leading slash
      return '/' + normalizedPath;
    }
  }

  // Extract everything from /uploads/ onwards
  return normalizedPath.substring(uploadsIndex);
};

