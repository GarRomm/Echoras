// Vitesse volumétrique d'impression en cm³ par heure.
// Valeur mesurée sur imprimantes FDM haut de gamme (Bambu Lab P1S, Prusa MK4)
// en mode qualité standard (hauteur de couche 0,2 mm, buse 0,4 mm).
// Une vitesse trop optimiste sous-estimerait le coût machine ; trop pessimiste,
// le prix serait artificiellement élevé. 25 cm³/h est la médiane constatée sur
// des pièces à géométrie complexe comme notre hélice.
const PRINT_SPEED_CM3_H = 25;

// Taux de remplissage intérieur du cylindre central (15 %).
// L'impression FDM ne produit pas de pièces 100 % pleines par défaut :
// le logiciel de tranchage (slicer) génère des parois extérieures solides
// et un treillis interne (pattern gyroïde) pour économiser la matière.
// À 15 %, le cylindre est rigide mécaniquement sans être massif.
// Le ruban hélicoïdal, lui, est imprimé à 100 % plein (pas d'infill applicable
// sur des parois aussi fines), d'où le calcul séparé pour les deux géométries.
const INFILL_FACTOR = 0.15;

// Coût machine en euros par heure d'impression.
// Ce taux couvre deux postes :
//   - Amortissement de l'imprimante : une Bambu P1S coûte ~1 000 €,
//     durée de vie estimée à 5 000 heures d'impression, soit 0,20 €/h.
//   - Électricité : consommation moyenne 250 W × tarif ~0,20 €/kWh = 0,05 €/h.
//     On arrondit à 0,35 €/h pour inclure une marge de maintenance (buses, plateau).
const MACHINE_RATE = 0.35;

// Frais fixes par pièce, indépendants du volume imprimé.
// Inclut : packaging (boîte + calage mousse), contrôle qualité et emballage
// (~20 min de main d'œuvre), frais de transaction plateforme, et marge Echoras.
const LABOR_BASE = 28;

// Surcoût pour la finition brillant.
// Le PETG (polyéthylène téréphtalate glycol) est plus cher que le PLA (~30 €/kg vs 25 €/kg)
// et nécessite un post-traitement supplémentaire (ponçage + vernis) estimé à 15 min.
const BRILLANT_PREMIUM = 9;

/**
 * Calcule le coût de fabrication d'une sculpture à partir de ses paramètres géométriques.
 *
 * Le prix est décomposé en trois postes :
 *   1. Matière   : volume total × densité du filament × prix au kg
 *   2. Machine   : temps d'impression estimé × taux horaire machine
 *   3. Main d'oeuvre : forfait fixe (packaging + QC + marge) + surcoût finition éventuel
 *
 * Le résultat est arrondi au plafond (Math.ceil) pour ne jamais afficher un prix
 * inférieur au coût réel, même après les approximations volumétriques.
 *
 * @param {object} params - paramètres de sculpture (cylinderRadius, cylinderHeight, etc.)
 * @param {number} [laborBase] - permet de surcharger LABOR_BASE depuis les tests ou l'admin
 * @returns {{ total, materialCost, machineCost, laborCost, printHours, finishLabel }}
 */
export function computePrintCost(params, laborBase) {
  const LABOR_BASE_RESOLVED = laborBase ?? LABOR_BASE;

  // Volume du ruban hélicoïdal.
  // Le ruban est une section rectangulaire (ribbonWidth × ringThickness) qui s'enroule
  // sur une longueur totale = nombre de tours × circonférence.
  // Le facteur (1 + peakHeight × 0.12) corrige le volume supplémentaire dû aux pics
  // audio : plus peakHeight est élevé, plus le ruban s'écarte du cylindre et
  // consomme de matière. 0.12 est un coefficient empirique ajusté sur des impressions réelles.
  const helixLength = params.helixTurns * 2 * Math.PI * params.cylinderRadius;
  const helixVolume =
    helixLength * params.ribbonWidth * params.ringThickness * (1 + params.peakHeight * 0.12);

  // Volume du cylindre central, corrigé par INFILL_FACTOR.
  // On calcule d'abord le volume géométrique plein (πr²h), puis on applique
  // le taux de remplissage pour obtenir le volume réel de matière extrudée.
  const cylVolumeSolid     = Math.PI * Math.pow(params.cylinderRadius, 2) * params.cylinderHeight;
  const cylVolumeEffective = cylVolumeSolid * INFILL_FACTOR;

  // Volume du socle, uniquement s'il est activé par l'utilisateur.
  // Le socle est imprimé à 100 % plein pour garantir la stabilité de la sculpture posée.
  // Le rayon est évasé de 10 % (×1.1) par rapport au cylindre pour créer un débord visible.
  const baseVolume = params.showBase
    ? Math.PI * Math.pow(params.cylinderRadius * 1.1, 2) * params.baseHeight
    : 0;

  const totalVolume = helixVolume + cylVolumeEffective + baseVolume; // en cm³

  // Le PETG (brillant) est légèrement plus dense que le PLA (mat) car sa structure
  // moléculaire est plus compacte. Cela impacte directement le poids de matière consommée.
  const isBrillant = params.finishMode === 'brillant';
  const density    = isBrillant ? 1.27 : 1.24; // g/cm³
  const pricePerKg = isBrillant ? 30   : 25;   // €/kg

  // Coût matière : on convertit le volume en masse (volume × densité = grammes),
  // puis en kilogrammes pour appliquer le tarif au kg.
  const materialCost = (totalVolume * density / 1000) * pricePerKg;

  // Temps d'impression estimé en heures.
  // Le facteur ×1.2 ajoute 20 % pour les déplacements à vide (retract, travel)
  // et le temps de chauffe, non compris dans la vitesse volumétrique pure.
  const printHours  = (cylVolumeEffective + helixVolume + baseVolume) * 1.2 / PRINT_SPEED_CM3_H;
  const machineCost = printHours * MACHINE_RATE;

  // Coût fixe de main d'oeuvre et overhead, auquel s'ajoute le surcoût brillant si applicable.
  const laborCost = LABOR_BASE_RESOLVED + (isBrillant ? BRILLANT_PREMIUM : 0);

  // Prix final arrondi au plafond (entier) pour l'affichage utilisateur.
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
