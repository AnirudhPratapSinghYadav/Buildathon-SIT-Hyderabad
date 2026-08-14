import { useStudy } from '../context/StudyContext';
import type { StudyRegion } from '../types/study';

interface RegionOverlayProps {
  regions: StudyRegion[];
  imageWidth: number;
  imageHeight: number;
}

export function RegionOverlay({ regions, imageWidth, imageHeight }: RegionOverlayProps) {
  const { state, dispatch } = useStudy();

  const handleRegionClick = (regionId: string) => {
    dispatch({ type: 'SELECT_REGION', regionId });
  };

  return (
    <div className="region-overlay" aria-label="Interactive study regions">
      {regions.map((region, index) => {
        const isSelected = state.selectedRegionId === region.id;
        const style = {
          left: `${region.bbox.x * imageWidth}px`,
          top: `${region.bbox.y * imageHeight}px`,
          width: `${region.bbox.width * imageWidth}px`,
          height: `${region.bbox.height * imageHeight}px`,
        };

        return (
          <button
            key={region.id}
            className={`region-hotspot ${isSelected ? 'region-hotspot--selected' : ''}`}
            style={style}
            onClick={() => handleRegionClick(region.id)}
            aria-label={`${region.label}: ${region.description}`}
            id={`region-${region.id}`}
          >
            <span className="region-hotspot__marker">{index + 1}</span>
            <span className="region-hotspot__tooltip">{region.label}</span>
          </button>
        );
      })}
    </div>
  );
}
