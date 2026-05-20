import React, { useEffect } from 'react';
import './ControlPanel.css';

const SLIDERS = [
  { key: 'peakHeight', label: 'Hauteur des pics', min: 0.1, max: 3, step: 0.05, fmt: (v) => `${v.toFixed(2)} cm` },
  { key: 'smoothing', label: 'Lissage', min: 0, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: 'cylinderRadius', label: 'Rayon du cylindre', min: 0.3, max: 5, step: 0.5, fmt: (v) => `${v.toFixed(1)} cm` },
  { key: 'cylinderHeight', label: 'Hauteur du cylindre', min: 1, max: 15, step: 1.0, fmt: (v) => `${v.toFixed(1)} cm` },
  { key: 'ringThickness', label: 'Épaisseur', min: 0.1, max: 1.5, step: 0.05, fmt: (v) => `${v.toFixed(2)} cm` },
  { key: 'segments', label: 'Segments', min: 64, max: 512, step: 16, fmt: (v) => v },
  { key: 'helixTurns', label: "Tours d'hélice", min: 1, max: 12, step: 1, fmt: (v) => v },
  { key: 'ribbonWidth', label: 'Largeur du ruban', min: 0.05, max: 0.5, step: 0.01, fmt: (v) => `${v.toFixed(2)} cm` },
];

const PLA_COLORS = [
  { label: 'Blanc casse',     hex: '#F2EDE4' },
  { label: 'Noir mat',        hex: '#1C1C1C' },
  { label: 'Gris beton',      hex: '#7A7A7A' },
  { label: 'Gris anthracite', hex: '#3D3D3D' },
  { label: 'Beige sable',     hex: '#C9A97A' },
  { label: 'Terracotta',      hex: '#C4623A' },
  { label: 'Vert sauge',      hex: '#7A9B76' },
  { label: 'Vert foret',      hex: '#3A5A40' },
  { label: 'Bleu marine',     hex: '#1B3A5C' },
  { label: 'Bleu ardoise',    hex: '#4A6580' },
  { label: 'Bordeaux',        hex: '#7C2535' },
  { label: 'Mauve doux',      hex: '#7B6080' },
];

const PETG_COLORS = [
  { label: 'Blanc pur',       hex: '#F8F8F8' },
  { label: 'Noir brillant',   hex: '#111111' },
  { label: 'Argent',          hex: '#B8BEC7' },
  { label: 'Or',              hex: '#C9A84C' },
  { label: 'Rouge vif',       hex: '#D42B2B' },
  { label: 'Orange',          hex: '#E8622A' },
  { label: 'Jaune',           hex: '#E8C22A' },
  { label: 'Vert emeraude',   hex: '#00A878' },
  { label: 'Turquoise',       hex: '#3ECFCF' },
  { label: 'Bleu electrique', hex: '#1A6FD4' },
  { label: 'Violet',          hex: '#7B3FBE' },
  { label: 'Rose fuchsia',    hex: '#D42B8A' },
];

function ColorPicker({ label, value, onChange, colors }) {
  return (
    <div className="controls__field">
      <div className="controls__field-header">
        <span className="controls__field-label">{label}</span>
      </div>
      <div className="controls__color-picker" role="radiogroup" aria-label={label}>
        {colors.map((color) => (
          <button
            key={color.hex}
            role="radio"
            aria-checked={value === color.hex}
            aria-label={color.label}
            className={`controls__color-swatch${value === color.hex ? ' controls__color-swatch--selected' : ''}`}
            style={{ backgroundColor: color.hex }}
            title={color.label}
            onClick={() => onChange(color.hex)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

export default function ControlPanel({ params, onChange }) {
  const palette = params.finishMode === 'brillant' ? PETG_COLORS : PLA_COLORS;

  useEffect(() => {
    const current = params.finishMode === 'brillant' ? PETG_COLORS : PLA_COLORS;
    const hexSet = new Set(current.map((c) => c.hex));
    if (!hexSet.has(params.waveformColor))   onChange('waveformColor',   current[0].hex);
    if (!hexSet.has(params.cylinderColor))   onChange('cylinderColor',   current[0].hex);
    if (!hexSet.has(params.nameplateColor))  onChange('nameplateColor',  current[0].hex);
    if (!hexSet.has(params.engravingColor))  onChange('engravingColor',  current[0].hex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.finishMode]);

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
                aria-valuetext={fmt(params[key])}
                onChange={(e) =>
                  onChange(key, step % 1 === 0 ? parseInt(e.target.value, 10) : parseFloat(e.target.value))
                }
              />
            </label>
          ))}
        </div>
      </div>

      {/* Section couleurs */}
      <div className="controls__section">
        <h3 className="controls__title">Couleurs</h3>
        <div className="controls__fields">
          <div className="controls__field">
            <div className="controls__field-header">
              <span className="controls__field-label">Finition</span>
            </div>
            <div className="controls__finish-toggle">
              <button
                className={`controls__finish-btn${params.finishMode === 'mat' ? ' controls__finish-btn--active' : ''}`}
                onClick={() => onChange('finishMode', 'mat')}
                type="button"
              >Mat</button>
              <button
                className={`controls__finish-btn${params.finishMode === 'brillant' ? ' controls__finish-btn--active' : ''}`}
                onClick={() => onChange('finishMode', 'brillant')}
                type="button"
              >Brillant</button>
            </div>
          </div>
          <ColorPicker
            label="Couleur de l'onde"
            value={params.waveformColor}
            onChange={(hex) => onChange('waveformColor', hex)}
            colors={palette}
          />
          <ColorPicker
            label="Couleur du cylindre"
            value={params.cylinderColor}
            onChange={(hex) => onChange('cylinderColor', hex)}
            colors={palette}
          />
        </div>
      </div>

      {/* Section gravure */}
      <div className="controls__section">
        <h3 className="controls__title">Gravure sur socle</h3>
        <div className="controls__fields">
          <label className="controls__field">
            <div className="controls__field-header">
              <span className="controls__field-label">Nom de l'artiste</span>
            </div>
            <input
              className="controls__text-input"
              type="text"
              value={params.artistName || ''}
              onChange={(e) => onChange('artistName', e.target.value)}
              placeholder="Optionnel"
              maxLength={50}
            />
          </label>
          <label className="controls__field">
            <div className="controls__field-header">
              <span className="controls__field-label">Titre de la chanson</span>
            </div>
            <input
              className="controls__text-input"
              type="text"
              value={params.songTitle || ''}
              onChange={(e) => onChange('songTitle', e.target.value)}
              placeholder="Optionnel"
              maxLength={50}
            />
          </label>
          <ColorPicker
            label="Fond de l'encart"
            value={params.nameplateColor}
            onChange={(hex) => onChange('nameplateColor', hex)}
            colors={palette}
          />
          <ColorPicker
            label="Couleur du texte"
            value={params.engravingColor}
            onChange={(hex) => onChange('engravingColor', hex)}
            colors={palette}
          />
        </div>
      </div>
    </div>
  );
}
