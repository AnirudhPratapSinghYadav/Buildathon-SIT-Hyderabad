import React, { createContext, useContext, useReducer } from 'react';
import type {
  StudyAnalysis,
  Explanation,
  QuizQuestion,
  QuizResult,
  WeakSpot,
  NextStepRecommendation,
  LoadingStage,
  AppView,
  PanelView,
} from '../types/study';

// ─── State Shape ───

interface StudyState {
  view: AppView;
  panelView: PanelView;

  // Image
  imageFile: File | null;
  imageDataUrl: string | null;
  imageBase64: string | null;
  imageMimeType: string | null;

  // Analysis
  analysis: StudyAnalysis | null;

  // Selection
  selectedRegionId: string | null;
  selectedConceptId: string | null;

  // Explanation
  explanation: Explanation | null;
  explanationCache: Map<string, Explanation>; // key: `${regionId}_${mode}`

  // Quiz
  quiz: QuizQuestion[];
  currentQuestionIndex: number;
  quizResults: QuizResult[];
  weakSpots: WeakSpot[];
  showFeedback: boolean;
  currentAnswer: string;

  // Similar problem
  similarQuestion: QuizQuestion | null;

  // Next step
  nextStep: NextStepRecommendation | null;

  // UI
  loadingStage: LoadingStage;
  error: string | null;
}

const initialState: StudyState = {
  view: 'landing',
  panelView: 'overview',
  imageFile: null,
  imageDataUrl: null,
  imageBase64: null,
  imageMimeType: null,
  analysis: null,
  selectedRegionId: null,
  selectedConceptId: null,
  explanation: null,
  explanationCache: new Map(),
  quiz: [],
  currentQuestionIndex: 0,
  quizResults: [],
  weakSpots: [],
  showFeedback: false,
  currentAnswer: '',
  similarQuestion: null,
  nextStep: null,
  loadingStage: 'idle',
  error: null,
};

// ─── Actions ───

type StudyAction =
  | { type: 'SET_VIEW'; view: AppView }
  | { type: 'SET_PANEL_VIEW'; panelView: PanelView }
  | { type: 'SET_IMAGE'; file: File; dataUrl: string; base64: string; mimeType: string }
  | { type: 'SET_ANALYSIS'; analysis: StudyAnalysis }
  | { type: 'SELECT_REGION'; regionId: string | null }
  | { type: 'SELECT_CONCEPT'; conceptId: string | null }
  | { type: 'SET_EXPLANATION'; explanation: Explanation; cacheKey: string }
  | { type: 'SET_QUIZ'; quiz: QuizQuestion[] }
  | { type: 'SET_CURRENT_ANSWER'; answer: string }
  | { type: 'SUBMIT_ANSWER'; result: QuizResult }
  | { type: 'NEXT_QUESTION' }
  | { type: 'SET_SIMILAR_QUESTION'; question: QuizQuestion }
  | { type: 'SET_NEXT_STEP'; nextStep: NextStepRecommendation }
  | { type: 'SET_LOADING'; stage: LoadingStage }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

// ─── Reducer ───

function studyReducer(state: StudyState, action: StudyAction): StudyState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view };

    case 'SET_PANEL_VIEW':
      return { ...state, panelView: action.panelView };

    case 'SET_IMAGE':
      return {
        ...state,
        imageFile: action.file,
        imageDataUrl: action.dataUrl,
        imageBase64: action.base64,
        imageMimeType: action.mimeType,
        view: 'workspace',
        error: null,
      };

    case 'SET_ANALYSIS':
      return {
        ...state,
        analysis: action.analysis,
        loadingStage: 'idle',
        panelView: 'overview',
        error: null,
      };

    case 'SELECT_REGION': {
      if (action.regionId === state.selectedRegionId) return state;
      // Find concept linked to this region
      let conceptId = state.selectedConceptId;
      if (action.regionId && state.analysis) {
        const concept = state.analysis.concepts.find(c =>
          c.related_region_ids.includes(action.regionId!)
        );
        if (concept) conceptId = concept.id;
      }
      return {
        ...state,
        selectedRegionId: action.regionId,
        selectedConceptId: conceptId,
        panelView: action.regionId ? 'concept' : 'overview',
        explanation: null,
      };
    }

    case 'SELECT_CONCEPT': {
      if (action.conceptId === state.selectedConceptId) return state;
      // Find region linked to this concept
      let regionId = state.selectedRegionId;
      if (action.conceptId && state.analysis) {
        const concept = state.analysis.concepts.find(c => c.id === action.conceptId);
        if (concept && concept.related_region_ids.length > 0) {
          regionId = concept.related_region_ids[0];
        }
      }
      return {
        ...state,
        selectedConceptId: action.conceptId,
        selectedRegionId: regionId,
        panelView: action.conceptId ? 'concept' : 'overview',
        explanation: null,
      };
    }

    case 'SET_EXPLANATION': {
      const newCache = new Map(state.explanationCache);
      newCache.set(action.cacheKey, action.explanation);
      return {
        ...state,
        explanation: action.explanation,
        explanationCache: newCache,
        panelView: 'explanation',
        loadingStage: 'idle',
      };
    }

    case 'SET_QUIZ':
      return {
        ...state,
        quiz: action.quiz,
        currentQuestionIndex: 0,
        quizResults: [],
        showFeedback: false,
        currentAnswer: '',
        similarQuestion: null,
        panelView: 'quiz',
        loadingStage: 'idle',
      };

    case 'SET_CURRENT_ANSWER':
      return { ...state, currentAnswer: action.answer };

    case 'SUBMIT_ANSWER': {
      const newResults = [...state.quizResults, action.result];
      const newWeakSpots = computeWeakSpots(newResults, state.analysis);
      return {
        ...state,
        quizResults: newResults,
        weakSpots: newWeakSpots,
        showFeedback: true,
        panelView: 'feedback',
      };
    }

    case 'NEXT_QUESTION': {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= state.quiz.length) {
        return {
          ...state,
          panelView: 'results',
          showFeedback: false,
          currentAnswer: '',
          similarQuestion: null,
        };
      }
      return {
        ...state,
        currentQuestionIndex: nextIndex,
        showFeedback: false,
        currentAnswer: '',
        similarQuestion: null,
        panelView: 'quiz',
      };
    }

    case 'SET_SIMILAR_QUESTION':
      return {
        ...state,
        similarQuestion: action.question,
        showFeedback: false,
        currentAnswer: '',
        panelView: 'quiz',
        loadingStage: 'idle',
      };

    case 'SET_NEXT_STEP':
      return {
        ...state,
        nextStep: action.nextStep,
        panelView: 'next_step',
        loadingStage: 'idle',
      };

    case 'SET_LOADING':
      return { ...state, loadingStage: action.stage, error: null };

    case 'SET_ERROR':
      return { ...state, error: action.error, loadingStage: 'idle' };

    case 'RESET':
      return { ...initialState, view: 'workspace' };

    default:
      return state;
  }
}

// ─── Weak Spots Computation ───

function computeWeakSpots(results: QuizResult[], analysis: StudyAnalysis | null): WeakSpot[] {
  if (!analysis) return [];

  const spotMap = new Map<string, { attempts: number; correct: number; name: string }>();

  for (const result of results) {
    const conceptId = result.concept_id;
    if (!conceptId) continue;

    const concept = analysis.concepts.find(c => c.id === conceptId);
    const name = concept?.name || conceptId;

    const existing = spotMap.get(conceptId) || { attempts: 0, correct: 0, name };
    existing.attempts++;
    if (result.is_correct) existing.correct++;
    spotMap.set(conceptId, existing);
  }

  return Array.from(spotMap.entries()).map(([id, data]) => ({
    concept_id: id,
    concept_name: data.name,
    attempts: data.attempts,
    correct: data.correct,
  }));
}

// ─── Context ───

interface StudyContextType {
  state: StudyState;
  dispatch: React.Dispatch<StudyAction>;
}

const StudyContext = createContext<StudyContextType | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(studyReducer, initialState);

  return (
    <StudyContext.Provider value={{ state, dispatch }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}

export type { StudyState, StudyAction };
