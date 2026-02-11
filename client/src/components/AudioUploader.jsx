import React, { useRef } from 'react';
import './AudioUploader.css';

export default function AudioUploader({ onFileSelected, isAnalyzing }) {
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
          <p className="uploader__label">Glissez un fichier audio</p>
          <p className="uploader__hint">ou cliquez pour parcourir</p>
          <p className="uploader__formats">MP3, WAV, OGG, FLAC, M4A</p>
        </>
      )}
    </div>
  );
}
