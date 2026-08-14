import { Router } from 'express';
import { generateChallenge } from '../services/gemini.js';
import { validateRequiredFields } from '../utils/validation.js';

export const challengeRouter = Router();

challengeRouter.post('/', async (req, res, next) => {
  try {
    const { image_base64, mime_type, analysis_context, weak_spots_context } = req.body;

    validateRequiredFields(req.body, ['image_base64', 'mime_type', 'analysis_context']);

    const cleanBase64 = image_base64.replace(/^data:image\/[a-z+]+;base64,/, '');
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    console.log('Generating challenge questions...');

    const quiz = await generateChallenge(
      imageBuffer,
      mime_type,
      analysis_context,
      weak_spots_context
    );

    res.json(quiz);
  } catch (error) {
    next(error);
  }
});
