import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeRouter } from './routes/analyze.js';
import { explainRouter } from './routes/explain.js';
import { challengeRouter } from './routes/challenge.js';
import { similarRouter } from './routes/similar.js';
import { nextStepRouter } from './routes/nextStep.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createUploadMiddleware } from './middleware/upload.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or localhost origins
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev mode
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '15mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/explain', explainRouter);
app.use('/api/challenge', challengeRouter);
app.use('/api/similar', similarRouter);
app.use('/api/next-step', nextStepRouter);

// Global error handler
app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`StudyScene server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);

    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠ GEMINI_API_KEY is not set. API calls will fail.');
    }
  });
}

export default app;

export { createUploadMiddleware };
