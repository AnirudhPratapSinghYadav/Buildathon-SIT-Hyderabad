import { useCallback, useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { generateChallenge, generateSimilarProblem } from '../services/api';
import { QuestionCard } from './QuestionCard';
import { FeedbackCard } from './FeedbackCard';
import type { QuizQuestion } from '../types/study';
import '../styles/quiz.css';

export function QuizPanel() {
  const { state, dispatch } = useStudy();
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const currentQuestion: QuizQuestion | null = state.similarQuestion
    || state.quiz[state.currentQuestionIndex]
    || null;

  const handleSubmitAnswer = useCallback((answer: string) => {
    if (!currentQuestion) return;

    const isCorrect = checkAnswerCorrectness(
      answer,
      currentQuestion.correct_answer,
      currentQuestion.options || []
    );

    // Find related concept
    let conceptId: string | null = null;
    if (currentQuestion.source_region_id && state.analysis) {
      const concept = state.analysis.concepts.find(c =>
        c.related_region_ids.includes(currentQuestion.source_region_id!)
      );
      if (concept) conceptId = concept.id;
    }

    dispatch({
      type: 'SUBMIT_ANSWER',
      result: {
        question_id: currentQuestion.id,
        user_answer: answer,
        is_correct: isCorrect,
        concept_id: conceptId,
      },
    });
  }, [currentQuestion, state.analysis, dispatch]);

  const handleNextQuestion = useCallback(() => {
    dispatch({ type: 'NEXT_QUESTION' });
  }, [dispatch]);

  const handleSimilarProblem = useCallback(async () => {
    if (!currentQuestion || !state.imageBase64 || !state.imageMimeType) return;

    setLoadingSimilar(true);

    // Find concept name
    let conceptName = 'this concept';
    if (currentQuestion.source_region_id && state.analysis) {
      const concept = state.analysis.concepts.find(c =>
        c.related_region_ids.includes(currentQuestion.source_region_id!)
      );
      if (concept) conceptName = concept.name;
    }

    const lastResult = state.quizResults[state.quizResults.length - 1];
    const userAnswer = lastResult?.user_answer || '';

    try {
      const similar = await generateSimilarProblem(
        state.imageBase64,
        state.imageMimeType,
        currentQuestion.question,
        conceptName,
        userAnswer
      ) as QuizQuestion;

      dispatch({ type: 'SET_SIMILAR_QUESTION', question: similar });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to generate similar problem.' });
    } finally {
      setLoadingSimilar(false);
    }
  }, [currentQuestion, state.imageBase64, state.imageMimeType, state.analysis, state.quizResults, dispatch]);

  if (!currentQuestion) return null;

  // Get source region label for feedback
  const sourceRegion = currentQuestion.source_region_id
    ? state.analysis?.regions.find(r => r.id === currentQuestion.source_region_id)
    : null;

  const lastResult = state.quizResults[state.quizResults.length - 1];
  const isShowingFeedback = state.showFeedback && lastResult;

  return (
    <div className="quiz-panel">
      <div className="quiz-panel__header">
        <h3 className="quiz-panel__title">Challenge</h3>
        <span className="quiz-panel__progress">
          {state.currentQuestionIndex + 1} / {state.quiz.length}
        </span>
      </div>

      {isShowingFeedback ? (
        <FeedbackCard
          key={`feedback-${currentQuestion.id}`}
          question={currentQuestion}
          userAnswer={lastResult.user_answer}
          isCorrect={lastResult.is_correct}
          sourceRegionLabel={sourceRegion?.label}
          onNextQuestion={handleNextQuestion}
          onSimilarProblem={handleSimilarProblem}
          isLastQuestion={state.currentQuestionIndex >= state.quiz.length - 1}
          loadingSimilar={loadingSimilar}
        />
      ) : (
        <QuestionCard
          key={`question-${currentQuestion.id}`}
          question={currentQuestion}
          onSubmit={handleSubmitAnswer}
        />
      )}
    </div>
  );
}

function checkAnswerCorrectness(userAns: string, correctAns: string, options: string[]): boolean {
  const normUser = userAns.trim().toLowerCase();
  const normCorrect = correctAns.trim().toLowerCase();

  if (normUser === normCorrect) return true;

  const userOptIdx = options.findIndex(o => o.trim().toLowerCase() === normUser);
  const letters = ['a', 'b', 'c', 'd', 'e', 'f'];

  if (userOptIdx !== -1) {
    const userLetter = letters[userOptIdx];
    if (
      normCorrect === userLetter ||
      normCorrect.startsWith(`${userLetter})`) ||
      normCorrect.startsWith(`option ${userLetter}`) ||
      normCorrect.startsWith(`(${userLetter})`)
    ) {
      return true;
    }
  }

  if (normCorrect.length > 3 && (normCorrect.includes(normUser) || normUser.includes(normCorrect))) {
    return true;
  }

  return false;
}
