import { useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { analyzeImage, generateChallenge, getNextStep } from '../services/api';
import { ConceptMap } from './ConceptMap';
import { ConceptPanel, ExplanationView } from './ConceptPanel';
import { QuizPanel } from './QuizPanel';
import { WeakSpots } from './WeakSpots';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import type { StudyAnalysis, QuizQuestion, NextStepRecommendation } from '../types/study';
import '../styles/learning.css';

export function LearningPanel() {
  const { state, dispatch } = useStudy();

  // ─── Trigger analysis ───
  const handleAnalyze = useCallback(async () => {
    if (!state.imageFile) return;

    dispatch({ type: 'SET_LOADING', stage: 'looking' });

    try {
      const analysis = await analyzeImage(state.imageFile) as StudyAnalysis;
      dispatch({ type: 'SET_ANALYSIS', analysis });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to analyze image.' });
    }
  }, [state.imageFile, dispatch]);

  // ─── Trigger challenge ───
  const handleChallenge = useCallback(async () => {
    if (!state.analysis || !state.imageBase64 || !state.imageMimeType) return;

    dispatch({ type: 'SET_LOADING', stage: 'generating_challenge' });

    const analysisContext = JSON.stringify({
      title: state.analysis.title,
      subject: state.analysis.subject,
      concepts: state.analysis.concepts.map(c => c.name),
      summary: state.analysis.summary,
    });

    const weakSpotsContext = state.weakSpots.length > 0
      ? state.weakSpots
          .filter(s => s.correct / s.attempts < 0.7)
          .map(s => `${s.concept_name}: ${s.correct}/${s.attempts} correct`)
          .join('\n')
      : undefined;

    try {
      const quiz = await generateChallenge(
        state.imageBase64,
        state.imageMimeType,
        analysisContext,
        weakSpotsContext
      ) as { questions: QuizQuestion[] };

      dispatch({ type: 'SET_QUIZ', quiz: quiz.questions || [] });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to generate challenge.' });
    }
  }, [state.analysis, state.imageBase64, state.imageMimeType, state.weakSpots, dispatch]);

  // ─── Trigger next step ───
  const handleNextStep = useCallback(async () => {
    if (!state.analysis) return;

    dispatch({ type: 'SET_LOADING', stage: 'getting_recommendation' });

    const analysisContext = JSON.stringify({
      title: state.analysis.title,
      concepts: state.analysis.concepts.map(c => ({ name: c.name, description: c.description })),
    });

    const quizResultsContext = JSON.stringify({
      total: state.quizResults.length,
      correct: state.quizResults.filter(r => r.is_correct).length,
      weakSpots: state.weakSpots.map(s => ({
        concept: s.concept_name,
        attempts: s.attempts,
        correct: s.correct,
      })),
    });

    try {
      const nextStep = await getNextStep(analysisContext, quizResultsContext) as NextStepRecommendation;
      dispatch({ type: 'SET_NEXT_STEP', nextStep });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to get recommendation.' });
    }
  }, [state.analysis, state.quizResults, state.weakSpots, dispatch]);

  // ─── Auto-analyze on first image ───
  // Triggered once when image is set but no analysis exists
  if (state.imageFile && !state.analysis && state.loadingStage === 'idle' && !state.error) {
    handleAnalyze();
  }

  // ─── Loading ───
  if (state.loadingStage !== 'idle') {
    return (
      <div className="learning-panel">
        <LoadingState stage={state.loadingStage} />
      </div>
    );
  }

  // ─── Error ───
  if (state.error) {
    return (
      <div className="learning-panel">
        <ErrorState message={state.error} onRetry={handleAnalyze} />
      </div>
    );
  }

  // ─── No analysis yet ───
  if (!state.analysis) {
    return (
      <div className="learning-panel">
        <div className="loading-state">
          <p className="loading-state__message">Upload an image to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-panel">
      {/* Header */}
      <div className="learning-panel__header">
        <h2 className="learning-panel__title">{state.analysis.title}</h2>
        <div className="learning-panel__meta">
          <span className="tag tag--accent">{state.analysis.subject}</span>
          <span className="tag">{state.analysis.difficulty}</span>
        </div>
        <p className="learning-panel__summary">{state.analysis.summary}</p>
      </div>

      {/* Content */}
      <div className="learning-panel__content">
        {state.panelView === 'overview' && (
          <>
            <ConceptMap />
          </>
        )}

        {state.panelView === 'concept' && (
          <ConceptPanel />
        )}

        {state.panelView === 'explanation' && (
          <>
            <ConceptPanel />
            <ExplanationView />
          </>
        )}

        {state.panelView === 'quiz' && (
          <QuizPanel />
        )}

        {state.panelView === 'feedback' && (
          <QuizPanel />
        )}

        {state.panelView === 'results' && (
          <>
            <div className="quiz-panel">
              <h3 className="quiz-panel__title">Results</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                You got {state.quizResults.filter(r => r.is_correct).length} out of {state.quizResults.length} correct.
              </p>
            </div>
            <WeakSpots />
          </>
        )}

        {state.panelView === 'next_step' && state.nextStep && (
          <div className="next-step">
            <h3 className="next-step__header">Recommended Next Step</h3>
            <p className="next-step__recommendation">{state.nextStep.recommendation}</p>
            {state.nextStep.weak_concepts.length > 0 && (
              <div className="next-step__weak-list">
                {state.nextStep.weak_concepts.map((concept, i) => (
                  <span key={i} className="tag tag--error">{concept}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="learning-panel__actions">
        {state.panelView !== 'quiz' && state.panelView !== 'feedback' && (
          <button className="btn-primary" onClick={handleChallenge} id="challenge-me">
            Challenge me
          </button>
        )}

        {(state.panelView === 'results' || state.panelView === 'next_step') && (
          <>
            <button className="btn-accent-soft" onClick={handleNextStep} id="next-step-btn">
              What should I study next?
            </button>
            <button className="btn-secondary" onClick={handleChallenge}>
              Challenge me again
            </button>
          </>
        )}

        {state.panelView === 'concept' || state.panelView === 'explanation' ? (
          <button
            className="btn-ghost"
            onClick={() => dispatch({ type: 'SET_PANEL_VIEW', panelView: 'overview' })}
          >
            ← Back to overview
          </button>
        ) : null}
      </div>
    </div>
  );
}
