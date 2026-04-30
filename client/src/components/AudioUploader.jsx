import React, { useRef, useState } from 'react';
import './AudioUploader.css';

const MAX_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];

function validateFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) return `Format non supporté (${ext}). Acceptés : MP3, WAV, OGG, FLAC, M4A.`;
  if (file.size > MAX_SIZE_BYTES) return `Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum 50 Mo.`;
  return null;
}

export default function AudioUploader({ onFileSelected, isAnalyzing, audioFile }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError(null);
    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError(null);
    onFileSelected(file);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setError(null);
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (audioFile) {
    return (
      <div className="uploader--loaded">
        <span className="uploader__file-name">{audioFile.name}</span>
        <button className="uploader__file-clear" onClick={handleClear}>✕</button>
      </div>
    );
  }

  return (
    <div
      className="uploader"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,.ogg,.flac,.m4a"
        onChange={handleChange}
        hidden
      />
      {isAnalyzing ? (
        <p className="uploader__status">Analyse en cours...</p>
      ) : (
        <>
          <p className="uploader__label">Glissez un fichier ici ou <span>parcourir</span></p>
          <p className="uploader__formats">MP3, WAV, OGG, FLAC, M4A - max 50 Mo</p>
          {error && <p className="uploader__error">{error}</p>}
        </>
      )}
    </div>
  );
}
