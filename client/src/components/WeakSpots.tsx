import { useStudy } from '../context/StudyContext';
import '../styles/feedback.css';

export function WeakSpots() {
  const { state } = useStudy();

  if (state.weakSpots.length === 0) return null;

  return (
    <div className="weak-spots">
      <h4 className="weak-spots__title">Your weak spots</h4>
      <div className="weak-spots__list">
        {state.weakSpots.map((spot) => {
          const accuracy = spot.attempts > 0 ? spot.correct / spot.attempts : 0;
          const strengthClass = accuracy >= 0.8 ? 'weak-spot--strong'
            : accuracy >= 0.5 ? 'weak-spot--improving'
            : 'weak-spot--weak';

          return (
            <div key={spot.concept_id} className={`weak-spot ${strengthClass}`}>
              <span className="weak-spot__name">{spot.concept_name}</span>
              <span className="weak-spot__stats">
                {spot.attempts} attempt{spot.attempts !== 1 ? 's' : ''} · {spot.correct} correct
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
