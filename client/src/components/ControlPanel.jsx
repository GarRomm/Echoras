import React from 'react';
import './ControlPanel.css';

const MATERIALS = [
  { value: 'plastic_white', label: 'Plastique blanc', color: '#E8E8E8' },
  { value: 'plastic_black', label: 'Plastique noir', color: '#222222' },
  { value: 'metal_silver', label: 'Métal argent', color: '#A8A8B0' },
  { value: 'metal_gold', label: 'Métal or', color: '#C9A84C' },
  { value: 'wood', label: 'Bois', color: '#8B6340' },
];

const SLIDERS = [
  { key: 'peakHeight', label: 'Hauteur des pics', min: 0.1, max: 3, step: 0.05, fmt: (v) => v.toFixed(2) },
  { key: 'smoothing', label: 'Lissage', min: 0, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: 'cylinderRadius', label: 'Rayon du cylindre', min: 0.3, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) },
  { key: 'cylinderHeight', label: 'Hauteur du cylindre', min: 1, max: 10, step: 0.5, fmt: (v) => v.toFixed(1) },
  { key: 'ringThickness', label: 'Épaisseur', min: 0.1, max: 1.5, step: 0.05, fmt: (v) => v.toFixed(2) },
  { key: 'segments', label: 'Segments', min: 64, max: 512, step: 16, fmt: (v) => v },
  { key: 'helixTurns', label: "Tours d'hélice", min: 1, max: 12, step: 1, fmt: (v) => v },
  { key: 'ribbonWidth', label: 'Largeur du ruban', min: 0.05, max: 0.5, step: 0.01, fmt: (v) => v.toFixed(2) },
];

export default function ControlPanel({ params, onChange }) {
  return (
    <div className="controls">
      {/* Section sliders */}
      <div className="controls__section">
        <h3 className="controls__title">Personnalisation</h3>
        <div className="controls__fields">
          {SLIDERS.map(({ key, label, min, max, step, fmt }) => (
            <label key={key} className="controls__field">
              <div className="controls__field-header">
                <span className="controls__field-label">{label}</span>
                <span className="controls__value">{fmt(params[key])}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={params[key]}
                onChange={(e) =>
                  onChange(key, step % 1 === 0 ? parseInt(e.target.value, 10) : parseFloat(e.target.value))
                }
              />
            </label>
          ))}
        </div>
      </div>

      {/* Section matériaux */}
      <div className="controls__section">
        <h3 className="controls__title">Matériau</h3>
        <div className="controls__materials">
          {MATERIALS.map((m) => (
            <button
              key={m.value}
              className={`controls__material${params.material === m.value ? ' controls__material--active' : ''}`}
              onClick={() => onChange('material', m.value)}
              type="button"
            >
              <span className="controls__material-dot" style={{ background: m.color }} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section couleurs */}
      <div className="controls__section">
        <h3 className="controls__title">Couleurs</h3>
        <div className="controls__fields">
          <label className="controls__field">
            <div className="controls__field-header">
              <span className="controls__field-label">Couleur de l'onde</span>
            </div>
            <input type="color" value={params.waveformColor} onChange={(e) => onChange('waveformColor', e.target.value)} />
          </label>
          <label className="controls__field">
            <div className="controls__field-header">
              <span className="controls__field-label">Couleur du cylindre</span>
            </div>
            <input type="color" value={params.cylinderColor} onChange={(e) => onChange('cylinderColor', e.target.value)} />
          </label>
        </div>
      </div>
    </div>
  );
}
