// ─── Shared TypeScript types for StudyScene ───
// Used by both client and server (conceptually aligned)

// ─── Bounding Box ───
export interface BoundingBox {
  x: number;      // normalized 0–1, left edge
  y: number;      // normalized 0–1, top edge
  width: number;  // normalized 0–1
  height: number; // normalized 0–1
}

// ─── Region detected in the study image ───
export interface StudyRegion {
  id: string;
  label: string;
  type: 'title' | 'diagram' | 'equation' | 'definition' | 'example' | 'paragraph' | 'list' | 'other';
  description: string;
  bbox: BoundingBox;
}

// ─── Concept extracted from the material ───
export interface Concept {
  id: string;
  name: string;
  description: string;
  related_region_ids: string[];
}

// ─── Relationship between concepts ───
export interface ConceptRelationship {
  from_concept_id: string;
  to_concept_id: string;
  label: string; // e.g. "uses", "produces", "passes through"
}

// ─── Full study analysis from Gemini ───
export interface StudyAnalysis {
  title: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  concepts: Concept[];
  relationships: ConceptRelationship[];
  regions: StudyRegion[];
  suggested_questions: string[];
}

// ─── Explanation returned by Gemini ───
export interface Explanation {
  direct: string;
  intuitive: string;
  why_it_matters: string;
  example: string;
  common_mistake: string;
  quick_check: string;
}

// ─── Quiz question ───
export type QuestionType = 'mcq' | 'short_answer' | 'numerical' | 'true_false' | 'explain_why';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  options: string[];        // populated for MCQ/true_false
  correct_answer: string;
  explanation: string;
  source_region_id: string | null;
}

// ─── Quiz state ───
export interface QuizResult {
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  concept_id: string | null;
}

export interface WeakSpot {
  concept_id: string;
  concept_name: string;
  attempts: number;
  correct: number;
}

// ─── Next step recommendation ───
export interface NextStepRecommendation {
  recommendation: string;
  weak_concepts: string[];
  suggested_action: 'review' | 'practice' | 'advance';
}

// ─── Loading stages ───
export type LoadingStage =
  | 'idle'
  | 'uploading'
  | 'looking'
  | 'finding_concepts'
  | 'building_map'
  | 'preparing_questions'
  | 'explaining'
  | 'generating_challenge'
  | 'generating_similar'
  | 'getting_recommendation';

// ─── App view states ───
export type AppView = 'landing' | 'workspace';
export type PanelView = 'overview' | 'concept' | 'explanation' | 'quiz' | 'feedback' | 'results' | 'next_step';
