/**
 * Helper function to get the base URL for static files (without /api)
 * This is used for serving uploaded images like payment screenshots
 */
export const getStaticFileUrl = (path: string): string => {
  if (typeof window === 'undefined') {
    return path; // Server-side rendering
  }
  
  // If path is empty or null, return as-is
  if (!path) {
    return path;
  }
  
  // If it's already a full URL (blob storage or external URL), return as-is
  if (path.startsWith('https://') || path.startsWith('http://')) {
    return path;
  }
  
  // If it's a blob storage URL (might be missing protocol), add https://
  if (path.includes('blob.vercel-storage.com')) {
    return path.startsWith('https://') ? path : `https://${path}`;
  }
  
  // Get the API base URL from environment or use default
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  
  // Remove /api suffix if present to get the base server URL
  const baseUrl = apiUrl.replace(/\/api$/, '');
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
};

