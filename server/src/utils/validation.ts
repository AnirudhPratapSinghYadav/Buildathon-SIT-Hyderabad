import { createApiError } from '../middleware/errorHandler.js';

export function validateRequiredFields(
  body: Record<string, unknown>,
  fields: string[]
): void {
  const missing = fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw createApiError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      'MISSING_FIELDS'
    );
  }
}

export function validateImageBuffer(file: Express.Multer.File | undefined): void {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw createApiError(
      'No image provided or image is empty.',
      400,
      'MISSING_IMAGE'
    );
  }
}

export function validateExplanationMode(mode: string): void {
  const validModes = ['simple', 'standard', 'deep', 'dont_understand'];
  if (!validModes.includes(mode)) {
    throw createApiError(
      `Invalid explanation mode: ${mode}. Valid: ${validModes.join(', ')}`,
      400,
      'INVALID_MODE'
    );
  }
}
