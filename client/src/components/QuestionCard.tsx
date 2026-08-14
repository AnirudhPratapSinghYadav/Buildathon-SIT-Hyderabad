import { useState } from 'react';
import type { QuizQuestion } from '../types/study';
import '../styles/quiz.css';

interface QuestionCardProps {
  question: QuizQuestion;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export function QuestionCard({ question, onSubmit, disabled }: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState('');

  const isOptionBased = question.type === 'mcq' || question.type === 'true_false';
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const handleSubmit = () => {
    if (selectedAnswer.trim()) {
      onSubmit(selectedAnswer);
    }
  };

  return (
    <div className="question-card">
      <span className={`tag ${getDifficultyClass(question.difficulty)}`}>
        {question.difficulty}
      </span>

      <p className="question-card__text">{question.question}</p>

      {isOptionBased && question.options.length > 0 ? (
        <div className="question-card__options">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`question-card__option ${selectedAnswer === option ? 'question-card__option--selected' : ''}`}
              onClick={() => setSelectedAnswer(option)}
              disabled={disabled}
              id={`option-${index}`}
            >
              <span className="question-card__option-letter">
                {letters[index]}
              </span>
              <span>{option}</span>
            </button>
          ))}
        </div>
      ) : (
        <input
          className="question-card__input"
          type="text"
          placeholder="Type your answer…"
          value={selectedAnswer}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          disabled={disabled}
          id="answer-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
      )}

      <button
        className="btn-primary question-card__submit"
        onClick={handleSubmit}
        disabled={!selectedAnswer.trim() || disabled}
        id="submit-answer"
      >
        Submit
      </button>
    </div>
  );
}

function getDifficultyClass(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return 'tag--success';
    case 'hard': return 'tag--error';
    default: return 'tag--accent';
  }
}
