import { Router } from 'express';
import { explainRegion } from '../services/gemini.js';
import { validateRequiredFields, validateExplanationMode } from '../utils/validation.js';

export const explainRouter = Router();

explainRouter.post('/', async (req, res, next) => {
  try {
    const { image_base64, mime_type, region_label, region_description, mode } = req.body;

    validateRequiredFields(req.body, ['image_base64', 'mime_type', 'region_label', 'region_description', 'mode']);
    validateExplanationMode(mode);

    const cleanBase64 = image_base64.replace(/^data:image\/[a-z+]+;base64,/, '');
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    console.log(`Explaining region: "${region_label}" (mode: ${mode})`);

    const explanation = await explainRegion(
      imageBuffer,
      mime_type,
      region_label,
      region_description,
      mode
    );

    res.json(explanation);
  } catch (error) {
    next(error);
  }
});
