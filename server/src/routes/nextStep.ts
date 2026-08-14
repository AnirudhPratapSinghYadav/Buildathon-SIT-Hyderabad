import { Router } from 'express';
import { generateNextStep } from '../services/gemini.js';
import { validateRequiredFields } from '../utils/validation.js';

export const nextStepRouter = Router();

nextStepRouter.post('/', async (req, res, next) => {
  try {
    const { analysis_context, quiz_results_context } = req.body;

    validateRequiredFields(req.body, ['analysis_context', 'quiz_results_context']);

    console.log('Generating next step recommendation...');

    const nextStep = await generateNextStep(analysis_context, quiz_results_context);

    res.json(nextStep);
  } catch (error) {
    next(error);
  }
});
