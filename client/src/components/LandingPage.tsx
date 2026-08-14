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

      {/* Transitional Robot Cyan UI */}
      <div className="landing__robot-container">
        <svg className="landing__robot" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1v3a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-3H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2z" />
          <path d="M9 12h.01M15 12h.01" strokeWidth="3" strokeLinecap="round" />
          <path d="M9 16h6" strokeLinecap="round" />
        </svg>
      </div>

      <main className="landing__main">
        <blockquote className="landing__quote">
          "Your notes are static. Your teacher doesn't have to be."
        </blockquote>

        <h1 className="landing__tagline">
          Stop staring at dead pages. Watch them come alive.
        </h1>

        <p className="landing__description">
          Drop your messy scribbles, late-night textbook diagrams, or whiteboard photos here. StudyScene reads your material like a human tutor, highlights the crucial concepts, and interactively challenges you so you actually learn.
        </p>

        <div className="landing__cta">
          <button className="btn-primary" onClick={handleStartStudying} id="start-studying">
            Start exploring your notes
          </button>
          <span className="landing__no-account">No sign-up required. Jump right in.</span>
        </div>

        <div className="landing__flow">
          <div className="landing__flow-step">
            <span className="landing__flow-step-icon">1</span>
            <span>Upload messy notes</span>
          </div>
          <span className="landing__flow-arrow">→</span>
          <div className="landing__flow-step">
            <span className="landing__flow-step-icon">2</span>
            <span>AI maps the concepts</span>
          </div>
          <span className="landing__flow-arrow">→</span>
          <div className="landing__flow-step">
            <span className="landing__flow-step-icon">3</span>
            <span>Get grilled & tested</span>
          </div>
          <span className="landing__flow-arrow">→</span>
          <div className="landing__flow-step">
            <span className="landing__flow-step-icon">4</span>
            <span>Master the topic</span>
          </div>
        </div>
      </main>
    </div>
  );
}
