import React from 'react';
import './ControlPanel.css';

const MATERIALS = [
  { value: 'plastic_white', label: 'Plastique blanc' },
  { value: 'plastic_black', label: 'Plastique noir' },
  { value: 'metal_silver', label: 'Metal argent' },
  { value: 'metal_gold', label: 'Metal or' },
  { value: 'wood', label: 'Bois' },
];

export default function ControlPanel({ params, onChange }) {
  return (
    <div className="controls">
      <h3 className="controls__title">Personnalisation</h3>

      <label className="controls__field">
        <span>Hauteur des pics</span>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.05"
          value={params.peakHeight}
          onChange={(e) => onChange('peakHeight', parseFloat(e.target.value))}
        />
        <span className="controls__value">{params.peakHeight.toFixed(2)}</span>
      </label>

      <label className="controls__field">
        <span>Lissage</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={params.smoothing}
          onChange={(e) => onChange('smoothing', parseFloat(e.target.value))}
        />
        <span className="controls__value">{params.smoothing.toFixed(2)}</span>
      </label>

      <label className="controls__field">
        <span>Rayon du cylindre</span>
        <input
          type="range"
          min="0.3"
          max="3"
          step="0.1"
          value={params.cylinderRadius}
          onChange={(e) => onChange('cylinderRadius', parseFloat(e.target.value))}
        />
        <span className="controls__value">{params.cylinderRadius.toFixed(1)}</span>
      </label>

      <label className="controls__field">
        <span>Hauteur du cylindre</span>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={params.cylinderHeight}
          onChange={(e) => onChange('cylinderHeight', parseFloat(e.target.value))}
        />
        <span className="controls__value">{params.cylinderHeight.toFixed(1)}</span>
      </label>

      <label className="controls__field">
        <span>Epaisseur</span>
        <input
          type="range"
          min="0.1"
          max="1.5"
          step="0.05"
          value={params.ringThickness}
          onChange={(e) => onChange('ringThickness', parseFloat(e.target.value))}
        />
        <span className="controls__value">{params.ringThickness.toFixed(2)}</span>
      </label>

      <label className="controls__field">
        <span>Segments</span>
        <input
          type="range"
          min="64"
          max="512"
          step="16"
          value={params.segments}
          onChange={(e) => onChange('segments', parseInt(e.target.value, 10))}
        />
        <span className="controls__value">{params.segments}</span>
      </label>

      <label className="controls__field">
        <span>Tours d'helice</span>
        <input
          type="range"
          min="1"
          max="12"
          step="1"
          value={params.helixTurns}
          onChange={(e) => onChange('helixTurns', parseInt(e.target.value, 10))}
        />
        <span className="controls__value">{params.helixTurns}</span>
      </label>

      <label className="controls__field">
        <span>Largeur du ruban</span>
        <input
          type="range"
          min="0.05"
          max="0.5"
          step="0.01"
          value={params.ribbonWidth}
          onChange={(e) => onChange('ribbonWidth', parseFloat(e.target.value))}
        />
        <span className="controls__value">{params.ribbonWidth.toFixed(2)}</span>
      </label>

      <label className="controls__field">
        <span>Couleur de l'onde</span>
        <input
          type="color"
          value={params.waveformColor}
          onChange={(e) => onChange('waveformColor', e.target.value)}
        />
      </label>

      <label className="controls__field">
        <span>Couleur du cylindre</span>
        <input
          type="color"
          value={params.cylinderColor}
          onChange={(e) => onChange('cylinderColor', e.target.value)}
        />
      </label>

      <label className="controls__field">
        <span>Materiau</span>
        <select
          value={params.material}
          onChange={(e) => onChange('material', e.target.value)}
        >
          {MATERIALS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
