export function computePrintCost(params) {
  // Hélix : ruban enroulé, correction peakHeight (~12 % de volume par unité de pic)
  const helixLength = params.helixTurns * 2 * Math.PI * params.cylinderRadius;
  const helixVolume =
    helixLength * params.ribbonWidth * params.ringThickness * (1 + params.peakHeight * 0.12);

  // Cylindre central plein
  const cylVolume = Math.PI * Math.pow(params.cylinderRadius, 2) * params.cylinderHeight;

  // Socle (rayon légèrement évasé ×1.1)
  const baseVolume = params.showBase
    ? Math.PI * Math.pow(params.cylinderRadius * 1.1, 2) * params.baseHeight
    : 0;

  const totalVolume = helixVolume + cylVolume + baseVolume; // cm³

  const isBrillant = params.finishMode === 'brillant';
  const density    = isBrillant ? 1.27 : 1.24; // g/cm³
  const pricePerKg = isBrillant ? 30   : 25;   // €/kg

  const materialCost = (totalVolume * density / 1000) * pricePerKg;
  const printHours   = (totalVolume * 1.2) / 3; // 3 cm³/h, ×1.2 déplacements à vide
  const machineCost  = printHours * 0.07;        // amortissement + électricité

  const margin = 3.5;
  const total  = Math.ceil((materialCost + machineCost) * margin);

  return {
    total,
    materialCost: parseFloat(materialCost.toFixed(2)),
    machineCost:  parseFloat(machineCost.toFixed(2)),
    laborCost:    parseFloat((total - materialCost - machineCost).toFixed(2)),
    printHours:   parseFloat(printHours.toFixed(1)),
    finishLabel:  isBrillant ? 'PETG brillant' : 'PLA mat',
  };
}
