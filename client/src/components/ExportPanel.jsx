import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportMultiGeometrySTL } from '../utils/stlExporter';
import {
  buildHelixRibbonGeometry,
  buildCentralCylinderGeometry,
  buildBaseGeometry,
} from '../utils/waveformRing';
import { useAuth } from '../context/AuthContext';
import { computePrintCost } from '../utils/printCost';
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

  // États rendu photoréaliste
  const [renderStatus, setRenderStatus] = useState(null); // null | 'saving' | 'rendering' | 'done'
  const [renderUrl, setRenderUrl] = useState(null);
  const [renderElapsed, setRenderElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (renderStatus === 'rendering') {
      setRenderElapsed(0);
      timerRef.current = setInterval(() => setRenderElapsed((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [renderStatus]);

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

      // STL 1 : hélice/onde (waveformColor)
      const helixBlob = exportMultiGeometrySTL([buildHelixRibbonGeometry(waveformData, params)]);
      const helixBuffer = await helixBlob.arrayBuffer();
      const saveRes1 = await apiFetch('/api/model/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: helixBuffer,
      });

      // STL 2 : cylindre + base (cylinderColor)
      const cylGeos = [buildCentralCylinderGeometry(params)];
      if (params.showBase) cylGeos.push(buildBaseGeometry(params));
      const cylBlob = exportMultiGeometrySTL(cylGeos);
      const cylBuffer = await cylBlob.arrayBuffer();
      const saveRes2 = await apiFetch('/api/model/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: cylBuffer,
      });

      setRenderStatus('rendering');
      const renderRes = await apiFetch(`/api/render/${saveRes1.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material: params.material,
          color: params.waveformColor || null,
          input2: saveRes2.id,
          color2: params.cylinderColor || null,
        }),
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
  const cost = computePrintCost(params);

  return (
    <div className="export">
      {/* Estimation d'impression */}
      <div className="export__estimate">
        <div className="export__estimate-header">
          <span className="export__estimate-label">Estimation d'impression</span>
          <span className="export__estimate-finish">{cost.finishLabel}</span>
        </div>
        <div className="export__estimate-total">~{cost.total} €</div>
        <div className="export__estimate-breakdown">
          <div className="export__estimate-line">
            <span>Matière</span>
            <span>{cost.materialCost.toFixed(2)} €</span>
          </div>
          <div className="export__estimate-line">
            <span>Temps machine ({cost.printHours}h)</span>
            <span>{cost.machineCost.toFixed(2)} €</span>
          </div>
          <div className="export__estimate-line">
            <span>Main d'œuvre + marge</span>
            <span>{cost.laborCost.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Rendu photoréaliste */}
      <button
        className="export__render-btn"
        disabled={disabled || renderStatus === 'saving' || renderStatus === 'rendering'}
        onClick={handleRender}
      >
        {renderStatus === 'saving' && 'Envoi du modèle…'}
        {renderStatus === 'rendering' && `Rendu en cours… ${renderElapsed}s`}
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
          <a
            className="export__download-btn"
            href={renderUrl}
            download="echoras-render.png"
          >
            Télécharger le rendu
          </a>
        </div>
      )}
    </div>
  );
}
