import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyCreationsPage.css';

const MATERIAL_LABELS = {
  plastic_white: 'Plastique blanc',
  plastic_black: 'Plastique noir',
  metal_silver:  'Métal argent',
  metal_gold:    'Métal or',
  wood:          'Bois',
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function IconResume() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5l3 3L12 15H9v-3z"/>
    </svg>
  );
}

function IconCart() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 5h16M6 5V3h6v2M7 9v6M11 9v6M2 5l1 13h12l1-13"/>
    </svg>
  );
}

function SculptureCard({ sculpture, onDelete }) {
  const navigate = useNavigate();
  const [cartStatus, setCartStatus] = useState(null); // null | 'adding' | 'added' | 'error'
  const [confirmDelete, setConfirmDelete] = useState(false);

  const material = sculpture.Material;
  const params   = sculpture.params;

  function buildCreatorParams() {
    return {
      peakHeight:     params?.peakHeight     ?? 1.5,
      smoothing:      params?.smoothing      ?? 0,
      cylinderRadius: params?.cylinderRadius ?? 1.0,
      cylinderHeight: params?.cylinderHeight ?? 4.0,
      ringThickness:  params?.ringThickness  ?? 0.3,
      segments:       params?.segments       ?? 512,
      helixTurns:     params?.helixTurns     ?? 6,
      ribbonWidth:    params?.ribbonWidth    ?? 0.15,
      waveformColor:  params?.waveformColor  || '#40E0D0',
      cylinderColor:  params?.cylinderColor  || '#FFFFFF',
      material:       material?.name         || 'plastic_white',
      baseHeight:     0.2,
      showBase:       true,
    };
  }

  function handleResume() {
    navigate('/createur', {
      state: {
        sculptureId:   sculpture.id,
        sculptureName: sculpture.name,
        audioFileName: sculpture.audioFileName,
        params:        buildCreatorParams(),
        waveformData:  sculpture.analysis?.rmsEnvelope ?? null,
      },
    });
  }

  async function handleAddToCart() {
    try {
      setCartStatus('adding');
      const res = await fetch('/api/cart', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sculptureId: sculpture.id, materialId: material?.id }),
      });
      if (!res.ok) throw new Error();
      setCartStatus('added');
      navigate('/panier');
    } catch {
      setCartStatus('error');
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/sculptures/${sculpture.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      onDelete(sculpture.id);
    } catch {
      setConfirmDelete(false);
    }
  }

  return (
    <article className="creation-card">
      <div className="creation-card__body">
        <div className="creation-card__info">
          <h2 className="creation-card__name">{sculpture.name || 'Sans titre'}</h2>
          <p className="creation-card__date">{formatDate(sculpture.createdAt)}</p>

          <dl className="creation-card__params">
            <div className="creation-card__param">
              <dt>Matériau</dt>
              <dd>{MATERIAL_LABELS[material?.name] ?? material?.name ?? '—'}</dd>
            </div>
            <div className="creation-card__param">
              <dt>Hauteur pics</dt>
              <dd>{params?.peakHeight?.toFixed(2) ?? '—'}</dd>
            </div>
            <div className="creation-card__param">
              <dt>Tours hélice</dt>
              <dd>{params?.helixTurns ?? '—'}</dd>
            </div>
            <div className="creation-card__param">
              <dt>Rayon</dt>
              <dd>{params?.cylinderRadius?.toFixed(1) ?? '—'}</dd>
            </div>
            <div className="creation-card__param">
              <dt>Hauteur</dt>
              <dd>{params?.cylinderHeight?.toFixed(1) ?? '—'}</dd>
            </div>
          </dl>

          {sculpture.audioFileName && (
            <p className="creation-card__audio-note">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {sculpture.analysis?.rmsEnvelope
                ? <>Audio : <em>{sculpture.audioFileName}</em></>
                : <>Audio : <em>{sculpture.audioFileName}</em> — à re-uploader pour reprendre</>
              }
            </p>
          )}
        </div>

        <div className="creation-card__price">
          {material?.basePrice && (
            <span>{parseFloat(material.basePrice).toFixed(2)} €</span>
          )}
        </div>
      </div>

      <div className="creation-card__actions">
        <button className="creation-card__btn creation-card__btn--resume" onClick={handleResume}>
          <IconResume />
          Reprendre
        </button>

        <button
          className="creation-card__btn creation-card__btn--cart"
          onClick={handleAddToCart}
          disabled={cartStatus === 'adding'}
        >
          <IconCart />
          {cartStatus === 'adding' && 'Ajout…'}
          {cartStatus === 'error'  && 'Erreur — réessayer'}
          {!cartStatus             && 'Ajouter au panier'}
        </button>

        {!confirmDelete ? (
          <button className="creation-card__btn creation-card__btn--delete" onClick={() => setConfirmDelete(true)}>
            <IconTrash />
            Supprimer
          </button>
        ) : (
          <div className="creation-card__confirm">
            <span>Confirmer ?</span>
            <button className="creation-card__confirm-yes" onClick={handleDelete}>Oui</button>
            <button className="creation-card__confirm-no" onClick={() => setConfirmDelete(false)}>Non</button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function MyCreationsPage() {
  const [sculptures, setSculptures] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/sculptures', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => { setSculptures(data.sculptures); setLoading(false); })
      .catch(() => { setError('Impossible de charger vos créations.'); setLoading(false); });
  }, []);

  const handleDelete = useCallback((id) => {
    setSculptures((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <div className="creations">
      <div className="creations__header">
        <h1 className="creations__title">Mes<br />créations</h1>
        <div className="creations__divider" />
      </div>

      <div className="creations__body">
        {loading && <p className="creations__state">Chargement…</p>}
        {error   && <p className="creations__state creations__state--error">{error}</p>}

        {!loading && !error && sculptures.length === 0 && (
          <div className="creations__empty">
            <p>Vous n'avez pas encore de sculpture sauvegardée.</p>
            <button className="creations__cta" onClick={() => navigate('/createur')}>
              Créer ma première sculpture
            </button>
          </div>
        )}

        {!loading && !error && sculptures.length > 0 && (
          <div className="creations__list">
            {sculptures.map((s) => (
              <SculptureCard key={s.id} sculpture={s} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
