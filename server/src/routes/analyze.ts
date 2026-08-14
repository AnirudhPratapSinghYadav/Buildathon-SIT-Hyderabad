import { Router } from 'express';
import { createUploadMiddleware } from '../middleware/upload.js';
import { analyzeStudyImage } from '../services/gemini.js';
import { validateImageBuffer } from '../utils/validation.js';

export const analyzeRouter = Router();

const upload = createUploadMiddleware();

analyzeRouter.post('/', upload.single('image'), async (req, res, next) => {
  try {
    validateImageBuffer(req.file);

    const imageBuffer = req.file!.buffer;
    const mimeType = req.file!.mimetype;

    console.log(`Analyzing image: ${req.file!.originalname} (${mimeType}, ${imageBuffer.length} bytes)`);

    const analysis = await analyzeStudyImage(imageBuffer, mimeType);

    res.json(analysis);
  } catch (error) {
    next(error);
  }
});
