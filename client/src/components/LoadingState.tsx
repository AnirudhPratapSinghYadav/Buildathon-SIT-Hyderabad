import { useEffect, useState } from 'react';
import type { LoadingStage } from '../types/study';
import '../styles/feedback.css';

const STAGE_MESSAGES: Record<string, string> = {
  uploading: 'Preparing your image…',
  looking: 'Looking at your page…',
  finding_concepts: 'Finding the important concepts…',
  building_map: 'Building your study map…',
  preparing_questions: 'Preparing questions…',
  explaining: 'Thinking about this…',
  generating_challenge: 'Creating your challenge…',
  generating_similar: 'Crafting a similar problem…',
  getting_recommendation: 'Analyzing your performance…',
};

interface LoadingStateProps {
  stage: LoadingStage;
}

export function LoadingState({ stage }: LoadingStateProps) {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (stage === 'idle') return;

    // For analysis stages, cycle through staged messages
    if (stage === 'looking') {
      const stages = ['looking', 'finding_concepts', 'building_map'];
      let index = 0;
      setCurrentMessage(STAGE_MESSAGES[stages[0]]);

      const interval = setInterval(() => {
        index = Math.min(index + 1, stages.length - 1);
        setCurrentMessage(STAGE_MESSAGES[stages[index]]);
      }, 3000);

      return () => clearInterval(interval);
    }

    setCurrentMessage(STAGE_MESSAGES[stage] || 'Working on it…');
  }, [stage]);

  if (stage === 'idle') return null;

  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-state__spinner" />
      <p className="loading-state__message">{currentMessage}</p>
    </div>
  );
}
