import { describe, it, expect } from 'vitest';
import { MATERIAL_LABELS, getMaterialLabel } from '../../utils/materialLabels';

describe('MATERIAL_LABELS', () => {
  it('contains a pla entry', () => {
    expect(MATERIAL_LABELS.pla).toBe('PLA mat');
  });

  it('contains a petg entry', () => {
    expect(MATERIAL_LABELS.petg).toBe('PETG brillant');
  });
});

describe('getMaterialLabel', () => {
  it('returns "PLA mat" for "pla"', () => {
    expect(getMaterialLabel('pla')).toBe('PLA mat');
  });

  it('returns "PETG brillant" for "petg"', () => {
    expect(getMaterialLabel('petg')).toBe('PETG brillant');
  });

  it('returns the slug itself for unknown materials', () => {
    expect(getMaterialLabel('wood')).toBe('wood');
    expect(getMaterialLabel('unknown')).toBe('unknown');
  });

  it('returns an empty string for empty slug', () => {
    expect(getMaterialLabel('')).toBe('');
  });
});
