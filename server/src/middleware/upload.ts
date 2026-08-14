import multer from 'multer';
import { createApiError } from './errorHandler.js';

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function createUploadMiddleware() {
  const storage = multer.memoryStorage();

  return multer({
    storage,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          createApiError(
            `Unsupported file type: ${file.mimetype}. Accepted: PNG, JPG, WEBP.`,
            400,
            'INVALID_FILE_TYPE'
          )
        );
      }
    },
  });
}
