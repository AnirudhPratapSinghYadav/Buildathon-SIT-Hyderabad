import { useCallback, useRef, useState } from 'react';
import { useStudy } from '../context/StudyContext';
import '../styles/uploader.css';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUploader() {
  const { dispatch } = useStudy();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setUploadError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Unsupported format. Please use PNG, JPG, or WEBP.');
      return;
    }

    if (file.size > MAX_SIZE) {
      setUploadError('File is too large. Maximum size is 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      dispatch({
        type: 'SET_IMAGE',
        file,
        dataUrl,
        base64,
        mimeType: file.type,
      });
    };
    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  }, [dispatch]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) processFile(file);
        return;
      }
    }
  }, [processFile]);

  const handleSample = useCallback(async () => {
    try {
      const response = await fetch('/samples/neural-networks.svg');
      const blob = await response.blob();
      const file = new File([blob], 'neural-networks.png', { type: 'image/svg+xml' });
      processFile(file);
    } catch {
      setUploadError('Failed to load sample. Please try uploading a file instead.');
    }
  }, [processFile]);

  return (
    <div className="uploader" onPaste={handlePaste} tabIndex={0}>
      <div
        className={`uploader__dropzone ${isDragging ? 'uploader__dropzone--active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload study material"
        id="dropzone"
      >
        <div className="uploader__icon">📄</div>
        <span className="uploader__text">Drop your study material here</span>
        <span className="uploader__formats">PNG, JPG, WEBP · Max 10MB</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        onChange={handleFileSelect}
        className="uploader__hidden-input"
        id="file-input"
      />

      <div className="uploader__divider">
        <span className="uploader__divider-text">or</span>
      </div>

      <div className="uploader__actions">
        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
          Browse files
        </button>
        <button className="btn-accent-soft" onClick={handleSample} id="use-sample">
          Use sample
        </button>
      </div>

      {uploadError && (
        <div className="uploader__error" role="alert">
          {uploadError}
        </div>
      )}
    </div>
  );
}
