import { describe, it, expect } from 'vitest';
import { computePrintCost } from '../../utils/printCost';

const BASE_PARAMS = {
  helixTurns: 5,
  cylinderRadius: 3,
  cylinderHeight: 10,
  ribbonWidth: 0.5,
  ringThickness: 0.2,
  peakHeight: 1.0,
  finishMode: 'mat',
  showBase: false,
  baseHeight: 1,
};

describe('computePrintCost - structure', () => {
  it('returns all expected keys', () => {
    const result = computePrintCost(BASE_PARAMS);
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('materialCost');
    expect(result).toHaveProperty('machineCost');
    expect(result).toHaveProperty('laborCost');
    expect(result).toHaveProperty('printHours');
    expect(result).toHaveProperty('finishLabel');
  });

  it('total is a positive integer (Math.ceil output)', () => {
    const { total } = computePrintCost(BASE_PARAMS);
    expect(Number.isInteger(total)).toBe(true);
    expect(total).toBeGreaterThan(0);
  });
});

describe('computePrintCost - finition', () => {
  it('finishLabel is "PLA mat" for mat mode', () => {
    expect(computePrintCost(BASE_PARAMS).finishLabel).toBe('PLA mat');
  });

  it('finishLabel is "PETG brillant" for brillant mode', () => {
    const result = computePrintCost({ ...BASE_PARAMS, finishMode: 'brillant' });
    expect(result.finishLabel).toBe('PETG brillant');
  });

  it('brillant finish costs more than mat (laborCost +9€, denser material)', () => {
    const mat = computePrintCost(BASE_PARAMS);
    const brillant = computePrintCost({ ...BASE_PARAMS, finishMode: 'brillant' });
    expect(brillant.total).toBeGreaterThan(mat.total);
  });

  it('mat laborCost equals laborBase (default 28€)', () => {
    const { laborCost } = computePrintCost(BASE_PARAMS, 28);
    expect(laborCost).toBe(28);
  });

  it('brillant laborCost = laborBase + 9€ premium', () => {
    const { laborCost } = computePrintCost({ ...BASE_PARAMS, finishMode: 'brillant' }, 28);
    expect(laborCost).toBe(37);
  });
});

describe('computePrintCost - volumes', () => {
  it('adding a base increases total cost', () => {
    const withoutBase = computePrintCost(BASE_PARAMS);
    const withBase = computePrintCost({ ...BASE_PARAMS, showBase: true, baseHeight: 2 });
    expect(withBase.total).toBeGreaterThan(withoutBase.total);
  });

  it('larger cylinder radius and height increase total cost', () => {
    const small = computePrintCost({ ...BASE_PARAMS, cylinderRadius: 1, cylinderHeight: 5 });
    const large = computePrintCost({ ...BASE_PARAMS, cylinderRadius: 6, cylinderHeight: 20 });
    expect(large.total).toBeGreaterThan(small.total);
  });

  it('more helix turns increase total cost', () => {
    const few = computePrintCost({ ...BASE_PARAMS, helixTurns: 2 });
    const many = computePrintCost({ ...BASE_PARAMS, helixTurns: 15 });
    expect(many.total).toBeGreaterThan(few.total);
  });
});

describe('computePrintCost - laborBase override', () => {
  it('custom laborBase of 0 reduces total below default', () => {
    const defaultCost = computePrintCost(BASE_PARAMS);
    const zeroCost = computePrintCost(BASE_PARAMS, 0);
    expect(zeroCost.total).toBeLessThan(defaultCost.total);
  });

  it('uses default laborBase when not provided', () => {
    const withDefault = computePrintCost(BASE_PARAMS);
    const withExplicit = computePrintCost(BASE_PARAMS, 28);
    expect(withDefault.total).toBe(withExplicit.total);
  });
});
