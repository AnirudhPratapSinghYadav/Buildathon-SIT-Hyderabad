import { useStudy } from '../context/StudyContext';
import '../styles/concepts.css';

export function ConceptMap() {
  const { state, dispatch } = useStudy();

  if (!state.analysis) return null;

  const { concepts, relationships } = state.analysis;

  // Build a linear order using relationships (topological-ish)
  const orderedConcepts = getOrderedConcepts(concepts, relationships);

  const handleConceptClick = (conceptId: string) => {
    dispatch({ type: 'SELECT_CONCEPT', conceptId });
  };

  return (
    <div className="concept-map">
      <h3 className="concept-map__title">Concept Map</h3>
      <div className="concept-map__nodes">
        {orderedConcepts.map((concept, index) => {
          const isSelected = state.selectedConceptId === concept.id;
          // Find edge label to next concept
          const nextConcept = orderedConcepts[index + 1];
          const edge = nextConcept
            ? relationships.find(
                r =>
                  (r.from_concept_id === concept.id && r.to_concept_id === nextConcept.id) ||
                  (r.from_concept_id === nextConcept.id && r.to_concept_id === concept.id)
              )
            : null;

          return (
            <div key={concept.id}>
              <button
                className={`concept-map__node ${isSelected ? 'concept-map__node--selected' : ''}`}
                onClick={() => handleConceptClick(concept.id)}
                aria-label={`Concept: ${concept.name}`}
                id={`concept-${concept.id}`}
              >
                {concept.name}
              </button>
              {nextConcept && (
                <div className="concept-map__edge">
                  <div className="concept-map__edge-line" />
                  {edge && <span className="concept-map__edge-label">{edge.label}</span>}
                  <div className="concept-map__edge-arrow" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simple topological ordering: start from concepts with no incoming edges
function getOrderedConcepts(
  concepts: { id: string; name: string; description: string; related_region_ids: string[] }[],
  relationships: { from_concept_id: string; to_concept_id: string; label: string }[]
) {
  if (concepts.length === 0) return [];

  const incomingCount = new Map<string, number>();
  concepts.forEach(c => incomingCount.set(c.id, 0));

  relationships.forEach(r => {
    const current = incomingCount.get(r.to_concept_id) || 0;
    incomingCount.set(r.to_concept_id, current + 1);
  });

  const ordered: typeof concepts = [];
  const visited = new Set<string>();
  const adjacency = new Map<string, string[]>();

  relationships.forEach(r => {
    const existing = adjacency.get(r.from_concept_id) || [];
    existing.push(r.to_concept_id);
    adjacency.set(r.from_concept_id, existing);
  });

  // Start with roots (no incoming)
  const roots = concepts.filter(c => (incomingCount.get(c.id) || 0) === 0);
  const queue = roots.length > 0 ? [...roots] : [concepts[0]];

  while (queue.length > 0 && ordered.length < concepts.length) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    ordered.push(current);

    const neighbors = adjacency.get(current.id) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        const concept = concepts.find(c => c.id === neighborId);
        if (concept) queue.push(concept);
      }
    }
  }

  // Add any remaining unvisited concepts
  concepts.forEach(c => {
    if (!visited.has(c.id)) {
      ordered.push(c);
    }
  });

  return ordered;
}
