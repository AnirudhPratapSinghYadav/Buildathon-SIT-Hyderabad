import { useRef, useState, useEffect, useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { RegionOverlay } from './RegionOverlay';
import '../styles/image.css';

export function StudyImage() {
  const { state } = useStudy();
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

  const updateDimensions = useCallback(() => {
    if (imgRef.current) {
      setImgDimensions({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight,
      });
    }
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Update on load
    img.addEventListener('load', updateDimensions);

    // ResizeObserver for responsive scaling
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(img);

    return () => {
      img.removeEventListener('load', updateDimensions);
      observer.disconnect();
    };
  }, [updateDimensions]);

  if (!state.imageDataUrl) return null;

  return (
    <div className="study-image">
      <div className="study-image__container">
        <img
          ref={imgRef}
          src={state.imageDataUrl}
          alt="Uploaded study material"
          className="study-image__img"
          onLoad={updateDimensions}
        />
        {state.analysis && imgDimensions.width > 0 && (
          <RegionOverlay
            regions={state.analysis.regions}
            imageWidth={imgDimensions.width}
            imageHeight={imgDimensions.height}
          />
        )}
      </div>
    </div>
  );
}
