import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GaleriePage.css';

const MATERIAL_LABELS = { pla: 'PLA mat', petg: 'PETG brillant' };

function IconMusic() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function SculptureCard({ sculpture }) {
  const [imgError, setImgError] = useState(false);
  const showImage = sculpture.renderUrl && !imgError;

  const placeholderStyle = sculpture.waveformColor
    ? { background: `linear-gradient(160deg, ${sculpture.waveformColor}55 0%, #94949455 100%)` }
    : {};

  return (
    <article className="galerie__card">
      {showImage ? (
        <img
          className="galerie__card-img"
          src={sculpture.renderUrl}
          alt={sculpture.name}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="galerie__card-placeholder" style={placeholderStyle} aria-hidden="true" />
      )}
      <div className="galerie__card-info">
        <h2 className="galerie__card-title">{sculpture.name}</h2>
        <p className="galerie__card-subtitle">
          {sculpture.material}
          {sculpture.artistName && ` · ${sculpture.artistName}`}
          {sculpture.songTitle && ` — ${sculpture.songTitle}`}
        </p>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="galerie__card galerie__card--skeleton" aria-hidden="true">
      <div className="galerie__card-placeholder galerie__card-placeholder--pulse" />
      <div className="galerie__card-info">
        <div className="galerie__skeleton-line galerie__skeleton-line--title" />
        <div className="galerie__skeleton-line galerie__skeleton-line--sub" />
      </div>
    </div>
  );
}

export default function GaleriePage() {
  const [sculptures, setSculptures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Galerie d'Échos | Echoras";
    return () => { document.title = 'Echoras'; };
  }, []);

  useEffect(() => {
    fetch('/api/sculptures/gallery')
      .then(r => r.ok ? r.json() : [])
      .then(data => setSculptures(Array.isArray(data) ? data : []))
      .catch(() => setSculptures([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="galerie">

      {/* ── Header ── */}
      <header className="galerie__header">
        <h1 className="galerie__title">Galerie d'Échos</h1>
        <p className="galerie__desc">
          Explorez une collection de sculptures générées à partir de musiques réelles
          ou inspirées de souvenirs sonores. Chaque pièce révèle une interprétation
          singulière du son, entre rythme, matière et émotion.
        </p>
      </header>

      {/* ── Grille ── */}
      <section className="galerie__grid-wrap" aria-label="Sculptures">
        {loading ? (
          <div className="galerie__grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : sculptures.length > 0 ? (
          <div className="galerie__grid">
            {sculptures.map(s => <SculptureCard key={s.id} sculpture={s} />)}
          </div>
        ) : (
          <div className="galerie__empty">
            <p>Aucune sculpture disponible pour le moment.</p>
            <Link to="/createur" className="galerie__empty-cta">
              Créer la première
            </Link>
          </div>
        )}
      </section>

      {/* ── CTA banner ── */}
      <section className="galerie__cta" aria-label="Créer votre sculpture">
        <div className="galerie__cta-text">
          <h2 className="galerie__cta-heading">
            Et si la prochaine sculpture était la vôtre&nbsp;?
          </h2>
          <p className="galerie__cta-body">
            Chaque musique peut devenir une pièce unique. Commencez votre propre
            création et transformez un souvenir sonore en sculpture.
          </p>
        </div>
        <Link to="/createur" className="galerie__cta-btn">
          <IconMusic />
          Créer ma sculpture
        </Link>
      </section>

    </div>
  );
}
