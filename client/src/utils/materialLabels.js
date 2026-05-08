export const MATERIAL_LABELS = {
  pla:  'PLA mat',
  petg: 'PETG brillant',
};

export function getMaterialLabel(slug) {
  return MATERIAL_LABELS[slug] ?? slug;
}
