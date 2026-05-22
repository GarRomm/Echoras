import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportMultiGeometrySTL, computeZLift } from '../utils/stlExporter';
import {
  buildHelixRibbonGeometry,
  buildCentralCylinderGeometry,
  buildBaseGeometry,
  buildEngravingGeometry,
  buildNameplateGeometry,
  loadFont,
} from '../utils/waveformRing';
import { useAuth } from '../context/AuthContext';
import { computePrintCost } from '../utils/printCost';
import { addToCart } from '../services/cartService';
import { createSculpture } from '../services/sculptureService';
import { saveModel } from '../services/modelService';
import { triggerRender } from '../services/renderService';
import './ExportPanel.css';

// Returns { waveformGeos, bodyGeos, plaqueGeos } — three groups for multi-color export.
// waveformGeos → helix ribbon (color 1)
// bodyGeos     → cylinder + base (color 2)
// plaqueGeos   → nameplate + engraving (color 3) — empty array if no base
async function buildSeparatedGeometries(waveformData, params) {
  const waveformGeos = [buildHelixRibbonGeometry(waveformData, params)];

  const bodyGeos = [buildCentralCylinderGeometry(params)];
  const plaqueGeos = [];

  if (params.showBase) {
    bodyGeos.push(buildBaseGeometry(params));
    const nameplate = buildNameplateGeometry(params.artistName, params.songTitle, params);
    if (nameplate) plaqueGeos.push(nameplate);
    const font = await loadFont().catch(() => null);
    const engraving = buildEngravingGeometry(params.artistName, params.songTitle, params, font);
    if (engraving) plaqueGeos.push(engraving);
  }

  return { waveformGeos, bodyGeos, plaqueGeos };
}

function downloadBlob(blob, filename, delayMs = 0) {
  setTimeout(() => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, delayMs);
}

export default function ExportPanel({ waveformData, params, audioFileName, resumedSculptureId, resumedMaterialId, onSaved, getCanvasDataUrl }) {
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
    resumedSculptureId ? { id: resumedSculptureId, materialId: resumedMaterialId, _resumed: true } : null
  );

  // Prix de base par matériau (chargés depuis la DB)
  const [materialBasePrices, setMaterialBasePrices] = useState({});

  useEffect(() => {
    fetch('/api/sculptures/materials')
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        const map = {};
        list.forEach(m => { map[m.name] = parseFloat(m.basePrice); });
        setMaterialBasePrices(map);
      })
      .catch(() => { /* garde les constantes par défaut */ });
  }, []);

  // État ajout panier
  const [cartStatus, setCartStatus] = useState(null); // null | 'adding' | 'added' | 'error'

  const handleExportSTL = useCallback(async () => {
    const { waveformGeos, bodyGeos, plaqueGeos } = await buildSeparatedGeometries(waveformData, params);
    const baseName = (audioFileName ? audioFileName.replace(/\.[^.]+$/, '') : 'echoras-model');
    // All files share the same zLift so they align when imported together in the slicer
    const zLift = computeZLift([...waveformGeos, ...bodyGeos, ...plaqueGeos]);
    downloadBlob(exportMultiGeometrySTL(waveformGeos, zLift), baseName + '_waveform.stl', 0);
    downloadBlob(exportMultiGeometrySTL(bodyGeos, zLift), baseName + '_corps.stl', 300);
    if (plaqueGeos.length > 0) {
      downloadBlob(exportMultiGeometrySTL(plaqueGeos, zLift), baseName + '_plaque.stl', 600);
    }
  }, [waveformData, params, audioFileName]);

  const handleRender = useCallback(async () => {
    try {
      setRenderStatus('saving');

      const helixBlob = exportMultiGeometrySTL([buildHelixRibbonGeometry(waveformData, params)]);
      const helixBuffer = await helixBlob.arrayBuffer();
      const saveRes1 = await saveModel(helixBuffer);

      const cylGeos = [buildCentralCylinderGeometry(params)];
      if (params.showBase) cylGeos.push(buildBaseGeometry(params));
      const cylBlob = exportMultiGeometrySTL(cylGeos);
      const cylBuffer = await cylBlob.arrayBuffer();
      const saveRes2 = await saveModel(cylBuffer);

      setRenderStatus('rendering');
      const renderRes = await triggerRender(saveRes1.id, {
        material:       params.finishMode === 'brillant' ? 'petg' : 'pla',
        color:          params.waveformColor  || null,
        input2:         saveRes2.id,
        color2:         params.cylinderColor  || null,
        artistName:     params.artistName     || null,
        songTitle:      params.songTitle      || null,
        cylinderRadius: params.cylinderRadius,
        baseHeight:     params.baseHeight,
      });

      setRenderUrl(renderRes.renderUrl);
      setRenderStatus('done');
    } catch (err) {
      console.error(err);
      setRenderStatus(null);
    }
  }, [waveformData, params]);

  const handleSaveDraft = useCallback(async () => {
    if (!user) { navigate('/connexion'); return; }
    try {
      setSaveStatus('saving');
      setSavedSculpture(null);
      setCartStatus(null);

      const canvasDataUrl = getCanvasDataUrl?.() ?? null;

      const sculName = audioFileName
        ? audioFileName.replace(/\.[^.]+$/, '')
        : 'Ma sculpture';

      const res = await createSculpture({
        name:           sculName,
        audioFileName:  audioFileName || null,
        waveformData:   waveformData ? Array.from(waveformData) : null,
        materialSlug:   params.finishMode === 'brillant' ? 'petg' : 'pla',
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
        artistName:     params.artistName  || null,
        songTitle:      params.songTitle   || null,
      });

      setSavedSculpture({ id: res.id, materialId: res.materialId, price: res.price });
      setSaveStatus('saved');
      onSaved?.(res.id);

      if (waveformData && res.id) {
        const { waveformGeos, bodyGeos, plaqueGeos } = await buildSeparatedGeometries(waveformData, params);
        const zLift = computeZLift([...waveformGeos, ...bodyGeos, ...plaqueGeos]);
        const uploadStl = (blob, suffix) =>
          blob.arrayBuffer().then(buffer =>
            fetch(`/api/sculptures/${res.id}/stl/${suffix}`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/octet-stream' },
              body: buffer,
            }).catch(err => console.error(`[stl upload ${suffix}]`, err))
          );
        uploadStl(exportMultiGeometrySTL(waveformGeos, zLift), 'waveform');
        uploadStl(exportMultiGeometrySTL(bodyGeos, zLift), 'corps');
        if (plaqueGeos.length > 0) uploadStl(exportMultiGeometrySTL(plaqueGeos, zLift), 'plaque');
      }

      if (canvasDataUrl && res.id) {
        fetch(`/api/sculptures/${res.id}/screenshot`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: canvasDataUrl }),
        }).catch((err) => console.error('[screenshot upload]', err));
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  }, [user, audioFileName, waveformData, params, navigate, getCanvasDataUrl]);

  const handleAddToCart = useCallback(async () => {
    if (!savedSculpture) return;
    try {
      setCartStatus('adding');
      await addToCart(savedSculpture.id, savedSculpture.materialId);
      setCartStatus('added');
      navigate('/panier');
    } catch (err) {
      console.error(err);
      setCartStatus('error');
    }
  }, [savedSculpture, navigate]);

  const disabled = !waveformData || waveformData.length === 0;
  const laborBase = materialBasePrices[params.finishMode === 'brillant' ? 'petg' : 'pla'];
  const cost = computePrintCost(params, laborBase);

  return (
    <div className="export">
      {/* Estimation d'impression */}
      <div className="export__estimate">
        <div className="export__estimate-header">
          <span className="export__estimate-label">Estimation d'impression</span>
          <span className="export__estimate-finish">{cost.finishLabel}</span>
        </div>
        <div className="export__estimate-total">{cost.total} €</div>

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
      {user && (
        <button
          className="export__btn export__btn--secondary"
          disabled={disabled || saveStatus === 'saving'}
          onClick={handleSaveDraft}
        >
          {saveStatus === 'saving' && 'Sauvegarde…'}
          {saveStatus === 'saved' && '✓ Sculpture sauvegardée'}
          {saveStatus === 'error' && 'Erreur — réessayer'}
          {!saveStatus && (resumedSculptureId ? 'Sauvegarder les modifications' : 'Sauvegarder ma sculpture')}
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
