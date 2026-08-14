import { useStudy } from '../context/StudyContext';
import '../styles/landing.css';

export function LandingPage() {
  const { dispatch } = useStudy();

  const handleStartStudying = () => {
    dispatch({ type: 'SET_VIEW', view: 'workspace' });
  };

  const handleTrySample = async () => {
    try {
      const response = await fetch('/samples/neural-networks.svg');
      const blob = await response.blob();
      const file = new File([blob], 'neural-networks.png', { type: 'image/svg+xml' });

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        dispatch({
          type: 'SET_IMAGE',
          file,
          dataUrl,
          base64,
          mimeType: 'image/svg+xml',
        });
      };
      reader.readAsDataURL(file);
    } catch {
      dispatch({ type: 'SET_VIEW', view: 'workspace' });
    }
  };

  return (
    <div className="landing">
      <header className="landing__header">
        <span className="landing__logo">StudyScene</span>
        <button className="btn-ghost" onClick={handleTrySample}>
          Try a sample
        </button>
      </header>

      <main className="landing__main">
        <h1 className="landing__tagline">
          Turn your study page into an interactive teacher.
        </h1>

        <p className="landing__description">
          Upload notes, diagrams, textbook pages, or whiteboards.
          StudyScene understands the material and helps you explore, practice, and learn from it.
        </p>

        <div className="landing__cta">
          <button className="btn-primary" onClick={handleStartStudying} id="start-studying">
            Start studying
          </button>
          <span className="landing__no-account">No account required.</span>
        </div>

        <div className="landing__flow">
          <div className="landing__flow-step">
            <span className="landing__flow-step-icon">1</span>
            <span>Upload</span>
          </div>
          <span className="landing__flow-arrow">→</span>
          <div className="landing__flow-step">
            <span className="landing__flow-step-icon">2</span>
            <span>Concepts</span>
          </div>
          <span className="landing__flow-arrow">→</span>
          <div className="landing__flow-step">
            <span className="landing__flow-step-icon">3</span>
            <span>Challenge</span>
          </div>
          <span className="landing__flow-arrow">→</span>
          <div className="landing__flow-step">
            <span className="landing__flow-step-icon">4</span>
            <span>Feedback</span>
          </div>
        </div>
      </main>
    </div>
  );
}
