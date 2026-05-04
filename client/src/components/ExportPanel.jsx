import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportMultiGeometrySTL } from '../utils/stlExporter';
import {
  buildHelixRibbonGeometry,
  buildCentralCylinderGeometry,
  buildBaseGeometry,
} from '../utils/waveformRing';
import { useAuth } from '../context/AuthContext';
import './ExportPanel.css';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status });
  }
  return res.json();
}

function buildAllGeometries(waveformData, params) {
  const geometries = [];
  geometries.push(buildCentralCylinderGeometry(params));
  geometries.push(buildHelixRibbonGeometry(waveformData, params));
  if (params.showBase) {
    geometries.push(buildBaseGeometry(params));
  }
  return geometries;
}

export default function ExportPanel({ waveformData, params, audioFileName, resumedSculptureId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  // États rendu photoéaliste
  const [renderStatus, setRenderStatus] = useState(null); // null | 'saving' | 'rendering' | 'done'
  const [renderUrl, setRenderUrl] = useState(null);

  // États sauvegarde draft
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  // Si on reprend une sculpture existante, on la pré-charge comme "déjà sauvegardée"
  const [savedSculpture, setSavedSculpture] = useState(
    resumedSculptureId ? { id: resumedSculptureId, _resumed: true } : null
  );

  // État ajout panier
  const [cartStatus, setCartStatus] = useState(null); // null | 'adding' | 'added' | 'error'

  const stlFileName = audioFileName
    ? audioFileName.replace(/\.[^.]+$/, '') + '.stl'
    : 'echoras-model.stl';

  const handleExportSTL = useCallback(() => {
    const geometries = buildAllGeometries(waveformData, params);
    const blob = exportMultiGeometrySTL(geometries);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = stlFileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [waveformData, params, stlFileName]);

  const handleRender = useCallback(async () => {
    try {
      setRenderStatus('saving');
      const geometries = buildAllGeometries(waveformData, params);
      const blob = exportMultiGeometrySTL(geometries);
      const buffer = await blob.arrayBuffer();

      const saveRes = await apiFetch('/api/model/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buffer,
      });

      setRenderStatus('rendering');
      const renderRes = await apiFetch(`/api/render/${saveRes.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material: params.material }),
      });

      setRenderUrl(renderRes.renderUrl);
      setRenderStatus('done');
    } catch (err) {
      console.error(err);
      setRenderStatus(null);
    }
  }, [waveformData, params]);

  // Sauvegarde la sculpture en draft en base de données
  const handleSaveDraft = useCallback(async () => {
    if (!user) { navigate('/connexion'); return; }
    try {
      setSaveStatus('saving');
      setSavedSculpture(null);
      setCartStatus(null);

      const sculName = audioFileName
        ? audioFileName.replace(/\.[^.]+$/, '')
        : 'Ma sculpture';

      const res = await apiFetch('/api/sculptures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           sculName,
          audioFileName:  audioFileName || null,
          waveformData:   waveformData ? Array.from(waveformData) : null,
          materialSlug:   params.material,
          peakHeight:     params.peakHeight,
          smoothing:      params.smoothing,
          cylinderRadius: params.cylinderRadius,
          cylinderHeight: params.cylinderHeight,
          ringThickness:  params.ringThickness,
          segments:       params.segments,
          helixTurns:     params.helixTurns,
          ribbonWidth:    params.ribbonWidth,
          waveformColor:  params.waveformColor,
          cylinderColor:  params.cylinderColor,
        }),
      });

      setSavedSculpture({ id: res.id, materialId: res.materialId, price: res.price });
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  }, [user, audioFileName, waveformData, params, navigate]);

  // Ajoute la sculpture sauvegardée au panier
  const handleAddToCart = useCallback(async () => {
    if (!savedSculpture) return;
    try {
      setCartStatus('adding');
      await apiFetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sculptureId: savedSculpture.id,
          materialId:  savedSculpture.materialId,
        }),
      });

      setCartStatus('added');
      navigate('/panier');
    } catch (err) {
      console.error(err);
      setCartStatus('error');
    }
  }, [savedSculpture, navigate]);

  const disabled = !waveformData || waveformData.length === 0;

  return (
    <div className="export">
      {/* Rendu photoréaliste */}
      <button
        className="export__render-btn"
        disabled={disabled || renderStatus === 'saving' || renderStatus === 'rendering'}
        onClick={handleRender}
      >
        {renderStatus === 'saving' && 'Envoi du modèle…'}
        {renderStatus === 'rendering' && 'Rendu en cours…'}
        {renderStatus === 'done' && 'Nouveau rendu'}
        {!renderStatus && 'Rendu photoréaliste'}
      </button>

      {/* Téléchargement STL (admin uniquement) */}
      {isAdmin && (
        <button className="export__btn export__btn--primary" disabled={disabled} onClick={handleExportSTL}>
          Télécharger STL
        </button>
      )}

      {/* Sauvegarde draft */}
      {user && !resumedSculptureId && (
        <button
          className="export__btn export__btn--secondary"
          disabled={disabled || saveStatus === 'saving'}
          onClick={handleSaveDraft}
        >
          {saveStatus === 'saving' && 'Sauvegarde…'}
          {saveStatus === 'saved' && '✓ Sculpture sauvegardée'}
          {saveStatus === 'error' && 'Erreur — réessayer'}
          {!saveStatus && 'Sauvegarder ma sculpture'}
        </button>
      )}

      {/* Ajouter au panier (disponible après sauvegarde, ou si reprise) */}
      {(saveStatus === 'saved' || (resumedSculptureId && savedSculpture)) && (
        <button
          className="export__btn export__btn--cart"
          disabled={cartStatus === 'adding'}
          onClick={handleAddToCart}
        >
          {cartStatus === 'adding' && 'Ajout en cours…'}
          {cartStatus === 'error' && 'Erreur — réessayer'}
          {!cartStatus && (savedSculpture?.price ? `Ajouter au panier — ${savedSculpture.price} €` : 'Ajouter au panier')}
        </button>
      )}

      {renderUrl && (
        <div className="export__preview">
          <img src={renderUrl} alt="Rendu 3D" />
        </div>
      )}
    </div>
  );
}
