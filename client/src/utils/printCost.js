const PRINT_SPEED_CM3_H = 25;   // Bambu P1S / Prusa MK4 en mode qualité
const INFILL_FACTOR     = 0.15;  // 15 % gyroïde — parois extérieures + remplissage sparse
const MACHINE_RATE      = 0.35;  // €/h — amortissement imprimante + électricité

// Frais fixes par pièce : packaging, main d'œuvre (QC + emballage ~20 min), frais plateforme, marge Echoras
const LABOR_BASE       = 28;  // € — finition mat
const BRILLANT_PREMIUM =  9;  // € — surcoût finition brillant (post-traitement + matière PETG premium)

export function computePrintCost(params, laborBase) {
  const LABOR_BASE_RESOLVED = laborBase ?? LABOR_BASE;

  // Hélix : ruban fin → 100 % plein, correction peakHeight (~12 % de volume par unité)
  const helixLength = params.helixTurns * 2 * Math.PI * params.cylinderRadius;
  const helixVolume =
    helixLength * params.ribbonWidth * params.ringThickness * (1 + params.peakHeight * 0.12);

  // Cylindre : volume brut × infill (parois + treillis intérieur)
  const cylVolumeSolid     = Math.PI * Math.pow(params.cylinderRadius, 2) * params.cylinderHeight;
  const cylVolumeEffective = cylVolumeSolid * INFILL_FACTOR;

  // Socle : 100 % plein pour la stabilité (rayon légèrement évasé ×1.1)
  const baseVolume = params.showBase
    ? Math.PI * Math.pow(params.cylinderRadius * 1.1, 2) * params.baseHeight
    : 0;

  const totalVolume = helixVolume + cylVolumeEffective + baseVolume; // cm³

  const isBrillant = params.finishMode === 'brillant';
  const density    = isBrillant ? 1.27 : 1.24; // g/cm³
  const pricePerKg = isBrillant ? 30   : 25;   // €/kg

  const materialCost = (totalVolume * density / 1000) * pricePerKg;
  const printHours   = (cylVolumeEffective + helixVolume + baseVolume) * 1.2 / PRINT_SPEED_CM3_H;
  const machineCost  = printHours * MACHINE_RATE;

  // Coût fixe : main d'œuvre + overhead + finition
  const laborCost = LABOR_BASE_RESOLVED + (isBrillant ? BRILLANT_PREMIUM : 0);

  const total = Math.ceil(materialCost + machineCost + laborCost);

  return {
    total,
    materialCost: parseFloat(materialCost.toFixed(2)),
    machineCost:  parseFloat(machineCost.toFixed(2)),
    laborCost:    parseFloat(laborCost.toFixed(2)),
    printHours:   parseFloat(printHours.toFixed(1)),
    finishLabel:  isBrillant ? 'PETG brillant' : 'PLA mat',
  };
}
