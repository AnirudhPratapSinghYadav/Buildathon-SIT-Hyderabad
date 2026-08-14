import { useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { explainRegion as apiExplainRegion } from '../services/api';
import type { Explanation } from '../types/study';
import '../styles/learning.css';

export function ConceptPanel() {
  const { state, dispatch } = useStudy();

  const selectedRegion = state.analysis?.regions.find(r => r.id === state.selectedRegionId);
  const selectedConcept = state.analysis?.concepts.find(c => c.id === state.selectedConceptId);

  const displayName = selectedConcept?.name || selectedRegion?.label || 'Unknown';
  const displayDescription = selectedConcept?.description || selectedRegion?.description || '';

  const handleExplain = useCallback(async (mode: string) => {
    if (!state.imageBase64 || !state.imageMimeType || !selectedRegion) return;

    const cacheKey = `${selectedRegion.id}_${mode}`;

    // Check cache first
    const cached = state.explanationCache.get(cacheKey);
    if (cached) {
      dispatch({ type: 'SET_EXPLANATION', explanation: cached, cacheKey });
      return;
    }

    dispatch({ type: 'SET_LOADING', stage: 'explaining' });

    try {
      const explanation = await apiExplainRegion(
        state.imageBase64,
        state.imageMimeType,
        selectedRegion.label,
        selectedRegion.description,
        mode
      ) as Explanation;

      dispatch({ type: 'SET_EXPLANATION', explanation, cacheKey });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', error: error.message || 'Failed to get explanation.' });
    }
  }, [state.imageBase64, state.imageMimeType, selectedRegion, state.explanationCache, dispatch]);

  if (!selectedRegion && !selectedConcept) return null;

  return (
    <div className="concept-panel">
      <div className="concept-panel__header">
        <div>
          <h3 className="concept-panel__name">{displayName}</h3>
          <p className="concept-panel__description">{displayDescription}</p>
          {selectedRegion && (
            <span className="tag" style={{ marginTop: '0.5rem' }}>{selectedRegion.type}</span>
          )}
        </div>
      </div>

      <div className="concept-panel__levels">
        <button
          className="concept-panel__level-btn"
          onClick={() => handleExplain('simple')}
          id="explain-simple"
        >
          Simple
        </button>
        <button
          className="concept-panel__level-btn"
          onClick={() => handleExplain('standard')}
          id="explain-standard"
        >
          Standard
        </button>
        <button
          className="concept-panel__level-btn"
          onClick={() => handleExplain('deep')}
          id="explain-deep"
        >
          Deep
        </button>
      </div>

      <div className="concept-panel__action-buttons">
        <button className="btn-accent-soft" onClick={() => handleExplain('dont_understand')} id="dont-understand">
          I don't understand this
        </button>
        <button className="btn-secondary" onClick={() => handleExplain('simple')}>
          Explain simply
        </button>
        <button className="btn-secondary" onClick={() => handleExplain('deep')}>
          Go deeper
        </button>
      </div>
    </div>
  );
}

export function ExplanationView() {
  const { state } = useStudy();

  if (!state.explanation) return null;

  const sections = [
    { key: 'direct', label: 'Explanation', highlight: true },
    { key: 'intuitive', label: 'Think of it this way', highlight: false },
    { key: 'why_it_matters', label: 'Why it matters', highlight: false },
    { key: 'example', label: 'Example', highlight: false },
    { key: 'common_mistake', label: 'Common mistake', highlight: false },
    { key: 'quick_check', label: 'Quick check', highlight: true },
  ];

  return (
    <div className="explanation">
      {sections.map(({ key, label, highlight }) => {
        const text = state.explanation![key as keyof typeof state.explanation];
        if (!text) return null;
        return (
          <div
            key={key}
            className={`explanation__section ${highlight ? 'explanation__section--highlight' : ''}`}
          >
            <div className="explanation__section-label">{label}</div>
            <div className="explanation__section-text">{text}</div>
          </div>
        );
      })}
    </div>
  );
}
