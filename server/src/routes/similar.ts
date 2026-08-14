import { Router } from 'express';
import { generateSimilarProblem } from '../services/gemini.js';
import { validateRequiredFields } from '../utils/validation.js';

export const similarRouter = Router();

similarRouter.post('/', async (req, res, next) => {
  try {
    const { image_base64, mime_type, original_question, concept_name, user_answer } = req.body;

    validateRequiredFields(req.body, ['image_base64', 'mime_type', 'original_question', 'concept_name', 'user_answer']);

    const cleanBase64 = image_base64.replace(/^data:image\/[a-z+]+;base64,/, '');
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    console.log(`Generating similar problem for concept: "${concept_name}"`);

    const question = await generateSimilarProblem(
      imageBuffer,
      mime_type,
      original_question,
      concept_name,
      user_answer
    );

    res.json(question);
  } catch (error) {
    next(error);
  }
});
