// ─── JSON Schemas for Gemini Structured Output ───
// These schemas are passed to responseMimeType: 'application/json' + responseSchema
// to ensure Gemini returns predictable, parseable data.

import type { Schema } from '@google/genai';

// Type helper — Gemini SDK uses string-based type identifiers
const Type = {
  OBJECT: 'OBJECT' as const,
  ARRAY: 'ARRAY' as const,
  STRING: 'STRING' as const,
  NUMBER: 'NUMBER' as const,
  BOOLEAN: 'BOOLEAN' as const,
};

// ─── Study Analysis Schema ───

export const studyAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Main topic title of the study page' },
    subject: { type: Type.STRING, description: 'Academic subject (e.g., Machine Learning, Biology)' },
    difficulty: { type: Type.STRING, enum: ['beginner', 'intermediate', 'advanced'], description: 'Difficulty level of the material' },
    summary: { type: Type.STRING, description: 'One or two sentence summary of what this page teaches' },
    concepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          related_region_ids: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['id', 'name', 'description', 'related_region_ids'],
      },
    },
    relationships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from_concept_id: { type: Type.STRING },
          to_concept_id: { type: Type.STRING },
          label: { type: Type.STRING },
        },
        required: ['from_concept_id', 'to_concept_id', 'label'],
      },
    },
    regions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ['title', 'diagram', 'equation', 'definition', 'example', 'paragraph', 'list', 'other'],
          },
          description: { type: Type.STRING },
          bbox: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER, description: 'Normalized x coordinate (0-1), left edge' },
              y: { type: Type.NUMBER, description: 'Normalized y coordinate (0-1), top edge' },
              width: { type: Type.NUMBER, description: 'Normalized width (0-1)' },
              height: { type: Type.NUMBER, description: 'Normalized height (0-1)' },
            },
            required: ['x', 'y', 'width', 'height'],
          },
        },
        required: ['id', 'label', 'type', 'description', 'bbox'],
      },
    },
    suggested_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['title', 'subject', 'difficulty', 'summary', 'concepts', 'relationships', 'regions', 'suggested_questions'],
};

// ─── Explanation Schema ───

export const explanationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    direct: { type: Type.STRING, description: 'Clear, direct explanation' },
    intuitive: { type: Type.STRING, description: 'Intuitive analogy or mental model' },
    why_it_matters: { type: Type.STRING, description: 'Why this concept is important' },
    example: { type: Type.STRING, description: 'Concrete example' },
    common_mistake: { type: Type.STRING, description: 'Common misconception or mistake' },
    quick_check: { type: Type.STRING, description: 'Self-check question for the student' },
  },
  required: ['direct', 'intuitive', 'why_it_matters', 'example', 'common_mistake', 'quick_check'],
};

// ─── Quiz Schema (array of 5 questions) ───

export const quizSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['mcq', 'short_answer', 'numerical', 'true_false', 'explain_why'] },
          difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correct_answer: { type: Type.STRING },
          explanation: { type: Type.STRING },
          source_region_id: { type: Type.STRING, nullable: true },
        },
        required: ['id', 'type', 'difficulty', 'question', 'options', 'correct_answer', 'explanation'],
      },
    },
  },
  required: ['questions'],
};

// ─── Single Question Schema (for similar problem) ───

export const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['mcq', 'short_answer', 'numerical', 'true_false', 'explain_why'] },
    difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
    question: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correct_answer: { type: Type.STRING },
    explanation: { type: Type.STRING },
    source_region_id: { type: Type.STRING, nullable: true },
  },
  required: ['id', 'type', 'difficulty', 'question', 'options', 'correct_answer', 'explanation'],
};

// ─── Next Step Recommendation Schema ───

export const nextStepSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    recommendation: { type: Type.STRING, description: 'Personalized learning recommendation' },
    weak_concepts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Concept names needing improvement',
    },
    suggested_action: {
      type: Type.STRING,
      enum: ['review', 'practice', 'advance'],
      description: 'What the student should do next',
    },
  },
  required: ['recommendation', 'weak_concepts', 'suggested_action'],
};
