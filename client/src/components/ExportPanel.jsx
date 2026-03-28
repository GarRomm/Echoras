import React, { useCallback, useState } from 'react';
import { exportMultiGeometrySTL } from '../utils/stlExporter';
import {
  buildHelixRibbonGeometry,
  buildCentralCylinderGeometry,
  buildBaseGeometry,
} from '../utils/waveformRing';
import axios from 'axios';
import './ExportPanel.css';

function buildAllGeometries(waveformData, params) {
  const geometries = [];
  geometries.push(buildCentralCylinderGeometry(params));
  geometries.push(buildHelixRibbonGeometry(waveformData, params));
  if (params.showBase) {
    geometries.push(buildBaseGeometry(params));
  }
  return geometries;
}

export default function ExportPanel({ waveformData, params, audioFileName }) {
  const [status, setStatus] = useState(null); // null | 'saving' | 'rendering' | 'done'
  const [renderUrl, setRenderUrl] = useState(null);
  const [modelId, setModelId] = useState(null);

  // Derive STL filename from audio file name (strip extension)
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

  const handleSaveAndRender = useCallback(async () => {
    try {
      setStatus('saving');
      const geometries = buildAllGeometries(waveformData, params);
      const blob = exportMultiGeometrySTL(geometries);
      const buffer = await blob.arrayBuffer();

      const saveRes = await axios.post('/api/model/save', buffer, {
        headers: { 'Content-Type': 'application/octet-stream' },
      });

      const id = saveRes.data.id;
      setModelId(id);
      setStatus('rendering');

      const renderRes = await axios.post(`/api/render/${id}`, {
        material: params.material,
      });

      setRenderUrl(renderRes.data.renderUrl);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus(null);
    }
  }, [waveformData, params]);

  const disabled = !waveformData || waveformData.length === 0;

  return (
    <div className="export">
      <h3 className="export__title">Export</h3>

      <button className="export__btn" disabled={disabled} onClick={handleExportSTL}>
        Telecharger STL
      </button>

      <button
        className="export__btn export__btn--render"
        disabled={disabled || status === 'saving' || status === 'rendering'}
        onClick={handleSaveAndRender}
      >
        {status === 'saving' && 'Envoi du modele...'}
        {status === 'rendering' && 'Rendu en cours...'}
        {status === 'done' && 'Nouveau rendu'}
        {!status && 'Rendu photoréaliste'}
      </button>

      {renderUrl && (
        <div className="export__preview">
          <img src={renderUrl} alt="Rendu 3D" />
        </div>
      )}
    </div>
  );
}
