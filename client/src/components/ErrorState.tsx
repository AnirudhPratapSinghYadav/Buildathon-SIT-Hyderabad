import '../styles/feedback.css';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <div className="error-state__icon">!</div>
      <p className="error-state__message">StudyScene couldn't process that.</p>
      <p className="error-state__detail">{message}</p>
      {onRetry && (
        <button className="btn-primary" onClick={onRetry} id="retry-button">
          Try again
        </button>
      )}
    </div>
  );
}
