import type { QuizQuestion } from '../types/study';
import '../styles/feedback.css';

interface FeedbackCardProps {
  question: QuizQuestion;
  userAnswer: string;
  isCorrect: boolean;
  sourceRegionLabel?: string;
  onNextQuestion: () => void;
  onSimilarProblem: () => void;
  isLastQuestion: boolean;
  loadingSimilar: boolean;
}

export function FeedbackCard({
  question,
  userAnswer,
  isCorrect,
  sourceRegionLabel,
  onNextQuestion,
  onSimilarProblem,
  isLastQuestion,
  loadingSimilar,
}: FeedbackCardProps) {
  return (
    <div className="feedback-card">
      <div className={`feedback-card__result ${isCorrect ? 'feedback-card__result--correct' : 'feedback-card__result--incorrect'}`}>
        <span className="feedback-card__result-icon">
          {isCorrect ? '✓' : '✗'}
        </span>
        <span className="feedback-card__result-text">
          {isCorrect ? 'Correct' : 'Not quite'}
        </span>
      </div>

      {!isCorrect && (
        <div className="feedback-card__section">
          <div className="feedback-card__section-label">Your answer</div>
          <div className="feedback-card__section-text">{userAnswer}</div>
        </div>
      )}

      <div className="feedback-card__section">
        <div className="feedback-card__section-label">
          {isCorrect ? 'Why this is correct' : 'Why?'}
        </div>
        <div className="feedback-card__section-text">{question.explanation}</div>
      </div>

      {!isCorrect && (
        <div className="feedback-card__section">
          <div className="feedback-card__section-label">Correct answer</div>
          <div className="feedback-card__section-text">{question.correct_answer}</div>
        </div>
      )}

      {sourceRegionLabel && (
        <div className="feedback-card__source">
          📍 From your notes: {sourceRegionLabel}
        </div>
      )}

      <div className="feedback-card__actions">
        {!isCorrect && (
          <button
            className="btn-accent-soft"
            onClick={onSimilarProblem}
            disabled={loadingSimilar}
            id="similar-problem"
          >
            {loadingSimilar ? 'Generating…' : 'Try a similar problem'}
          </button>
        )}
        <button className="btn-secondary" onClick={onNextQuestion} id="next-question">
          {isLastQuestion ? 'See results' : 'Next question'}
        </button>
      </div>
    </div>
  );
}
