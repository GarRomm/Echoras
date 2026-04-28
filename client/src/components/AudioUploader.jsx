import React, { useRef } from 'react';
import './AudioUploader.css';

export default function AudioUploader({ onFileSelected, isAnalyzing, audioFile }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  const handleClear = (e) => {
    e.stopPropagation();
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
          <p className="uploader__formats">MP3, WAV, M4A - max 50 Mo</p>
        </>
      )}
    </div>
  );
}
