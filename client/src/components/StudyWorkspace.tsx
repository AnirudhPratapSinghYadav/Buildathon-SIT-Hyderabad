import { useStudy } from '../context/StudyContext';
import { ImageUploader } from './ImageUploader';
import { StudyImage } from './StudyImage';
import { LearningPanel } from './LearningPanel';
import '../styles/workspace.css';

export function StudyWorkspace() {
  const { state, dispatch } = useStudy();

  const handleNewStudy = () => {
    dispatch({ type: 'RESET' });
  };

  const handleGoHome = () => {
    dispatch({ type: 'SET_VIEW', view: 'landing' });
  };

  const hasImage = !!state.imageDataUrl;

  return (
    <div className="workspace">
      <header className="workspace__header">
        <button className="workspace__logo" onClick={handleGoHome} aria-label="Go to landing page">
          StudyScene
        </button>
        <button className="btn-secondary" onClick={handleNewStudy} id="new-study">
          New Study
        </button>
      </header>

      <div className="workspace__body">
        <div className="workspace__image-panel">
          {hasImage ? <StudyImage /> : <ImageUploader />}
        </div>

        <div className="workspace__learning-panel">
          {hasImage ? <LearningPanel /> : (
            <div className="learning-panel">
              <div className="loading-state">
                <p className="loading-state__message">Upload an image to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
