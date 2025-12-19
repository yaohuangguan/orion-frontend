
import { fetchClient } from './core';
import { uploadImage } from './media';
import { authService } from './authService';
import { contentService } from './contentService';
import { featureService } from './featureService';

// Re-export specific helpers if needed by other components directly
export { fetchClient, uploadImage };

// Aggregate all services into one object to maintain backward compatibility
export const apiService = {
  ...authService,
  ...contentService,
  ...featureService,
  uploadImage
};
