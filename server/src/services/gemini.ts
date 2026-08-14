import { GoogleGenAI } from '@google/genai';
import { createApiError } from '../middleware/errorHandler.js';
import { getSystemInstruction, getAnalysisPrompt, getExplainPrompt, getDontUnderstandPrompt, getChallengePrompt, getSimilarProblemPrompt, getNextStepPrompt } from './prompts.js';
import { studyAnalysisSchema, explanationSchema, quizSchema, questionSchema, nextStepSchema } from './schemas.js';

// ─────────────────────────────────────────────────
// Singleton Gemini Client
// ─────────────────────────────────────────────────

let genai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!genai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw createApiError(
        'GEMINI_API_KEY environment variable is not set.',
        500,
        'MISSING_API_KEY'
      );
    }
    genai = new GoogleGenAI({ apiKey });
  }
  return genai;
}

// ─────────────────────────────────────────────────
// Model Fallback Chain
// ─────────────────────────────────────────────────
// The order matters. We try the primary (env-configured) model first,
// then cascade through fallbacks. Each model in the chain is a
// production-grade multimodal model that supports:
//   - Image understanding (inline base64)
//   - Structured JSON output (responseSchema)
//
// We do NOT fallback on:
//   - Invalid API key (401) → same key won't work on any model
//   - Malformed schema (400 from bad request body) → same schema fails everywhere
//
// We DO fallback on:
//   - Model not found (404) → model string might be wrong or deprecated
//   - Capacity exhausted / overloaded (503) → specific model is saturated
//   - Rate limit (429) → per-model rate limits
//   - Server error (500/502) → transient infra issue on that model's serving path

const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
] as const;

function getModelChain(): string[] {
  const primary = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  // Build ordered chain: primary first, then fallbacks (excluding duplicates)
  const chain = [primary];
  for (const fallback of FALLBACK_MODELS) {
    if (fallback !== primary) {
      chain.push(fallback);
    }
  }
  return chain;
}

// ─────────────────────────────────────────────────
// Error Classification
// ─────────────────────────────────────────────────
// Classify errors to decide whether to retry same model, cascade to
// next model, or fail immediately. This prevents wasting time on
// errors that will repeat across all models.

type ErrorClass = 'non_retryable' | 'model_specific' | 'transient';

interface ClassifiedError {
  class: ErrorClass;
  statusCode: number;
  code: string;
  message: string;
  raw: any;
}

function classifyError(error: any): ClassifiedError {
  const msg = (error.message || '').toLowerCase();
  const status = error.status || error.statusCode || error.httpStatusCode || 0;

  // ── Non-retryable: same error on every model ──

  // Bad API key
  if (status === 401 || status === 403 || msg.includes('api key') || msg.includes('permission') || msg.includes('forbidden')) {
    return {
      class: 'non_retryable',
      statusCode: 401,
      code: 'INVALID_API_KEY',
      message: 'Invalid or missing Gemini API key.',
      raw: error,
    };
  }

  // Bad request body / schema error (our fault, not the model's)
  if (status === 400 && (msg.includes('schema') || msg.includes('invalid argument') || msg.includes('request payload'))) {
    return {
      class: 'non_retryable',
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: 'Invalid request to Gemini API. This is a bug — please report it.',
      raw: error,
    };
  }

  // Safety filter block — content-level, won't change across models
  if (msg.includes('safety') || msg.includes('blocked') || msg.includes('harm')) {
    return {
      class: 'non_retryable',
      statusCode: 422,
      code: 'CONTENT_BLOCKED',
      message: 'The content was blocked by safety filters. Try a different image.',
      raw: error,
    };
  }

  // ── Model-specific: different model might work ──

  // Model doesn't exist or isn't available for this API key
  if (status === 404 || msg.includes('not found') || msg.includes('not supported') || msg.includes('does not exist')) {
    return {
      class: 'model_specific',
      statusCode: 404,
      code: 'MODEL_NOT_FOUND',
      message: 'Model not available.',
      raw: error,
    };
  }

  // Capacity exhausted on this specific model's serving infrastructure
  if (status === 503 || msg.includes('capacity') || msg.includes('overloaded') || msg.includes('unavailable')) {
    return {
      class: 'model_specific',
      statusCode: 503,
      code: 'MODEL_OVERLOADED',
      message: 'Model capacity exhausted.',
      raw: error,
    };
  }

  // Per-model rate limits
  if (status === 429 || msg.includes('quota') || msg.includes('rate') || msg.includes('too many')) {
    return {
      class: 'model_specific',
      statusCode: 429,
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded.',
      raw: error,
    };
  }

  // ── Transient: retry same model once, then cascade ──

  // Timeouts
  if (msg.includes('timeout') || msg.includes('deadline') || msg.includes('timed out') || error.code === 'ETIMEDOUT') {
    return {
      class: 'transient',
      statusCode: 504,
      code: 'TIMEOUT',
      message: 'Request timed out.',
      raw: error,
    };
  }

  // Generic server errors
  if (status === 500 || status === 502) {
    return {
      class: 'transient',
      statusCode: status,
      code: 'SERVER_ERROR',
      message: 'Gemini server error.',
      raw: error,
    };
  }

  // JSON parse failures from structured output — model returned garbage
  if (error instanceof SyntaxError || msg.includes('json') || msg.includes('parse')) {
    return {
      class: 'transient',
      statusCode: 502,
      code: 'MALFORMED_RESPONSE',
      message: 'Model returned unparseable response.',
      raw: error,
    };
  }

  // Empty response
  if (msg.includes('empty response') || msg.includes('no content')) {
    return {
      class: 'transient',
      statusCode: 502,
      code: 'EMPTY_RESPONSE',
      message: 'Model returned empty response.',
      raw: error,
    };
  }

  // Default: treat as transient (optimistic — try fallback)
  return {
    class: 'transient',
    statusCode: 502,
    code: 'GEMINI_FAILURE',
    message: error.message || 'Unknown Gemini error.',
    raw: error,
  };
}

// ─────────────────────────────────────────────────
// Small delay between fallback attempts
// ─────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────
// Core: Call Gemini with cascading model fallback
// ─────────────────────────────────────────────────
// For each model in the chain:
//   1. Try the call
//   2. On success → return result + which model was used
//   3. On non-retryable error → throw immediately (no point trying other models)
//   4. On model-specific error → skip to next model immediately
//   5. On transient error → retry same model once, then skip to next model
//
// If ALL models fail, throw the most informative error from the chain.

interface GeminiCallResult {
  data: any;
  model: string;
}

async function callGeminiWithFallback(
  contents: any[],
  responseSchema: any,
): Promise<GeminiCallResult> {
  const client = getClient();
  const modelChain = getModelChain();
  const errors: ClassifiedError[] = [];

  for (let modelIndex = 0; modelIndex < modelChain.length; modelIndex++) {
    const modelName = modelChain[modelIndex];
    const isLastModel = modelIndex === modelChain.length - 1;
    const maxRetries = modelIndex === 0 ? 1 : 0; // Retry primary once, fallbacks get one shot

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (modelIndex > 0 || attempt > 0) {
          // Small backoff: 500ms for retry, 300ms between different models
          const backoffMs = attempt > 0 ? 500 : 300;
          await delay(backoffMs);
        }

        const logPrefix = modelIndex > 0
          ? `[Fallback ${modelIndex}/${modelChain.length - 1}]`
          : '[Primary]';
        const retryLabel = attempt > 0 ? ` (retry ${attempt})` : '';
        console.log(`${logPrefix} Calling model: ${modelName}${retryLabel}`);

        const response = await client.models.generateContent({
          model: modelName,
          contents,
          config: {
            responseMimeType: 'application/json',
            responseSchema,
            systemInstruction: getSystemInstruction(),
          },
        });

        const text = response.text;
        if (!text) {
          throw new Error('Empty response from Gemini');
        }

        const parsed = JSON.parse(text);

        if (modelIndex > 0) {
          console.log(`✓ Fallback succeeded on model: ${modelName}`);
        } else {
          console.log(`✓ Primary model succeeded: ${modelName}`);
        }

        return { data: parsed, model: modelName };

      } catch (error: any) {
        const classified = classifyError(error);
        errors.push(classified);

        console.warn(
          `✗ Model ${modelName} failed [${classified.code}]: ${classified.message}` +
          (attempt < maxRetries ? ' — will retry same model' : modelIndex < modelChain.length - 1 ? ' — cascading to next model' : ' — no more models')
        );

        // ── Non-retryable: abort entire chain ──
        if (classified.class === 'non_retryable') {
          throw createApiError(classified.message, classified.statusCode, classified.code);
        }

        // ── Model-specific: skip to next model immediately ──
        if (classified.class === 'model_specific') {
          break; // Exit retry loop, continue model loop
        }

        // ── Transient: retry same model if attempts remain ──
        if (attempt < maxRetries) {
          continue; // Retry same model
        }
        // Otherwise fall through to try next model
      }
    }
  }

  // All models exhausted — throw the most useful error
  // Prefer the last model-specific error, then last transient, then generic
  const lastError = errors[errors.length - 1] || {
    message: 'All Gemini models failed. Please try again.',
    statusCode: 502,
    code: 'ALL_MODELS_FAILED',
  };

  const triedModels = modelChain.slice(0, errors.length).join(', ');
  throw createApiError(
    `All models failed (tried: ${triedModels}). Last error: ${lastError.message}`,
    502,
    'ALL_MODELS_FAILED'
  );
}

// ─────────────────────────────────────────────────
// Safe JSON extraction fallback
// ─────────────────────────────────────────────────
// If structured output fails but the model returned some text,
// try to extract JSON from it. This is the last-resort fallback
// before showing an error to the user.

function extractJsonFromText(text: string): any | null {
  // Try the full text first
  try {
    return JSON.parse(text);
  } catch {}

  // Try to find JSON block in markdown code fence
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // Try to find first { ... } or [ ... ] block
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {}
  }

  return null;
}

// ─────────────────────────────────────────────────
// Public wrapper: callGeminiStructured
// ─────────────────────────────────────────────────
// This is what all API functions call. It:
//   1. Tries structured output with the full model chain
//   2. If ALL structured calls fail with parse errors,
//      tries one more time WITHOUT responseSchema and
//      extracts JSON manually
//   3. Returns { data, model } or throws

async function callGeminiStructured(
  contents: any[],
  responseSchema: any,
): Promise<any> {
  try {
    const result = await callGeminiWithFallback(contents, responseSchema);
    return result.data;
  } catch (outerError: any) {
    // If the failure was a parse/malformed response, try raw text fallback
    if (outerError.code === 'ALL_MODELS_FAILED' && outerError.message?.includes('MALFORMED_RESPONSE')) {
      console.warn('Structured output failed on all models. Trying raw text fallback...');

      const client = getClient();
      const modelChain = getModelChain();

      for (const modelName of modelChain) {
        try {
          const response = await client.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction: getSystemInstruction(),
              // No responseSchema — let the model return free text
            },
          });

          const text = response.text;
          if (!text) continue;

          const extracted = extractJsonFromText(text);
          if (extracted) {
            console.log(`✓ Raw text fallback succeeded on model: ${modelName}`);
            return extracted;
          }
        } catch {
          continue;
        }
      }
    }

    // Re-throw the original error
    throw outerError;
  }
}

// ─────────────────────────────────────────────────
// Helper: Build inline image part
// ─────────────────────────────────────────────────

function buildImagePart(imageBuffer: Buffer, mimeType: string) {
  // Strip header prefix if accidentally included in buffer/base64
  return {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: mimeType || 'image/png',
    },
  };
}

// ─────────────────────────────────────────────────
// Data Normalization & Sanitization
// ─────────────────────────────────────────────────

function sanitizeAnalysis(analysis: any): any {
  if (!analysis || typeof analysis !== 'object') {
    return {
      title: 'Untitled Study Material',
      subject: 'General Study',
      difficulty: 'intermediate',
      summary: 'Study material uploaded for interactive learning.',
      concepts: [],
      relationships: [],
      regions: [],
      suggested_questions: [],
    };
  }

  const regions = Array.isArray(analysis.regions) ? analysis.regions.map((r: any, idx: number) => {
    let bbox = r.bbox || { x: 0.1, y: 0.1 + idx * 0.1, width: 0.8, height: 0.08 };

    // Automatically detect and normalize 0..1000 coordinate scale to 0..1 scale
    let { x = 0, y = 0, width = 0.5, height = 0.1 } = bbox;
    if (x > 1 || y > 1 || width > 1 || height > 1) {
      x = x / 1000;
      y = y / 1000;
      width = width / 1000;
      height = height / 1000;
    }

    // Clamp bounds between 0 and 1
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    width = Math.max(0.05, Math.min(1 - x, width));
    height = Math.max(0.03, Math.min(1 - y, height));

    return {
      id: r.id || `region_${idx + 1}`,
      label: r.label || `Region ${idx + 1}`,
      type: r.type || 'paragraph',
      description: r.description || '',
      bbox: { x, y, width, height },
    };
  }) : [];

  const concepts = Array.isArray(analysis.concepts) ? analysis.concepts.map((c: any, idx: number) => ({
    id: c.id || `concept_${idx + 1}`,
    name: c.name || `Concept ${idx + 1}`,
    description: c.description || '',
    related_region_ids: Array.isArray(c.related_region_ids) ? c.related_region_ids : [],
  })) : [];

  const relationships = Array.isArray(analysis.relationships) ? analysis.relationships.map((rel: any) => ({
    from_concept_id: rel.from_concept_id || '',
    to_concept_id: rel.to_concept_id || '',
    label: rel.label || 'connects to',
  })) : [];

  return {
    title: analysis.title || 'Study Material Analysis',
    subject: analysis.subject || 'General Study',
    difficulty: analysis.difficulty || 'intermediate',
    summary: analysis.summary || '',
    concepts,
    relationships,
    regions,
    suggested_questions: Array.isArray(analysis.suggested_questions) ? analysis.suggested_questions : [],
  };
}

// ─────────────────────────────────────────────────
// Public API Functions
// ─────────────────────────────────────────────────

export async function analyzeStudyImage(imageBuffer: Buffer, mimeType: string) {
  const contents = [
    {
      role: 'user' as const,
      parts: [
        { text: getAnalysisPrompt() },
        buildImagePart(imageBuffer, mimeType),
      ],
    },
  ];

  const rawAnalysis = await callGeminiStructured(contents, studyAnalysisSchema);
  return sanitizeAnalysis(rawAnalysis);
}

export async function explainRegion(
  imageBuffer: Buffer,
  mimeType: string,
  regionLabel: string,
  regionDescription: string,
  mode: string
) {
  const promptText = mode === 'dont_understand'
    ? getDontUnderstandPrompt(regionLabel, regionDescription)
    : getExplainPrompt(regionLabel, regionDescription, mode);

  const contents = [
    {
      role: 'user' as const,
      parts: [
        { text: promptText },
        buildImagePart(imageBuffer, mimeType),
      ],
    },
  ];

  return callGeminiStructured(contents, explanationSchema);
}

export async function generateChallenge(
  imageBuffer: Buffer,
  mimeType: string,
  analysisContext: string,
  weakSpotsContext?: string
) {
  const contents = [
    {
      role: 'user' as const,
      parts: [
        { text: getChallengePrompt(analysisContext, weakSpotsContext) },
        buildImagePart(imageBuffer, mimeType),
      ],
    },
  ];

  return callGeminiStructured(contents, quizSchema);
}

export async function generateSimilarProblem(
  imageBuffer: Buffer,
  mimeType: string,
  originalQuestion: string,
  conceptName: string,
  userAnswer: string
) {
  const contents = [
    {
      role: 'user' as const,
      parts: [
        { text: getSimilarProblemPrompt(originalQuestion, conceptName, userAnswer) },
        buildImagePart(imageBuffer, mimeType),
      ],
    },
  ];

  return callGeminiStructured(contents, questionSchema);
}

export async function generateNextStep(
  analysisContext: string,
  quizResultsContext: string
) {
  const contents = [
    {
      role: 'user' as const,
      parts: [
        { text: getNextStepPrompt(analysisContext, quizResultsContext) },
      ],
    },
  ];

  return callGeminiStructured(contents, nextStepSchema);
}
