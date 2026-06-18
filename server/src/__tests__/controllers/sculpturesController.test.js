import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);
const { Sculpture, SculptureParams, Material, AudioAnalysis, Order, CartItem } = _require('../../db/models/index');
const fsCJS = _require('fs');
const {
  createSculpture,
  getSculptures,
  deleteSculpture,
  getMaterials,
  getPublicGallery,
} = _require('../../controllers/sculpturesController');

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  };
}

const BASE_BODY = {
  name:          'Test sculpture',
  materialSlug:  'pla',
  peakHeight:    1.5,
  cylinderRadius: 1.0,
  cylinderHeight: 4.0,
  ringThickness:  0.3,
  segments:       512,
  helixTurns:     6,
  ribbonWidth:    0.15,
};

beforeEach(() => vi.restoreAllMocks());

describe('createSculpture', () => {
  it('returns 400 when material slug is not found', async () => {
    vi.spyOn(Material, 'findOne').mockResolvedValue(null);
    const res = makeRes();
    await createSculpture({ user: { id: 1 }, body: { materialSlug: 'unknown' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Materiau invalide' });
  });

  it('creates sculpture without waveform data and returns 201', async () => {
    vi.spyOn(Material, 'findOne').mockResolvedValue({ id: 1, name: 'pla', basePrice: '8' });
    vi.spyOn(SculptureParams, 'create').mockResolvedValue({ id: 10 });
    vi.spyOn(Sculpture, 'create').mockResolvedValue({ id: 5, name: 'Test sculpture' });

    const res = makeRes();
    await createSculpture({ user: { id: 1 }, body: { ...BASE_BODY } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, hasWaveform: false }),
    );
  });

  it('creates AudioAnalysis when waveformData is provided', async () => {
    vi.spyOn(Material, 'findOne').mockResolvedValue({ id: 1, name: 'pla', basePrice: '8' });
    vi.spyOn(SculptureParams, 'create').mockResolvedValue({ id: 10 });
    const audioCreateSpy = vi.spyOn(AudioAnalysis, 'create').mockResolvedValue({ id: 3 });
    vi.spyOn(Sculpture, 'create').mockResolvedValue({ id: 5, name: 'Test' });

    const res = makeRes();
    await createSculpture(
      { user: { id: 1 }, body: { ...BASE_BODY, waveformData: [0.1, 0.2, 0.3] } },
      res,
    );

    expect(audioCreateSpy).toHaveBeenCalledOnce();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ hasWaveform: true }));
  });

  it('uses default name "Ma sculpture" when name is not provided', async () => {
    vi.spyOn(Material, 'findOne').mockResolvedValue({ id: 1, name: 'pla', basePrice: '8' });
    vi.spyOn(SculptureParams, 'create').mockResolvedValue({ id: 10 });
    const createSpy = vi.spyOn(Sculpture, 'create').mockResolvedValue({ id: 5, name: 'Ma sculpture' });

    const res = makeRes();
    const { name: _unused, ...bodyWithoutName } = BASE_BODY;
    await createSculpture({ user: { id: 1 }, body: bodyWithoutName }, res);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ma sculpture' }),
    );
  });
});

describe('getSculptures', () => {
  it('returns the list of sculptures for the user', async () => {
    const fakeSculptures = [{ id: 1 }, { id: 2 }];
    vi.spyOn(Sculpture, 'findAll').mockResolvedValue(fakeSculptures);

    const res = makeRes();
    await getSculptures({ user: { id: 1 } }, res);

    expect(res.json).toHaveBeenCalledWith({ sculptures: fakeSculptures });
  });

  it('returns 500 on error', async () => {
    vi.spyOn(Sculpture, 'findAll').mockRejectedValue(new Error('DB error'));
    const res = makeRes();
    await getSculptures({ user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('deleteSculpture', () => {
  it('returns 404 when sculpture not found', async () => {
    vi.spyOn(Sculpture, 'findOne').mockResolvedValue(null);
    const res = makeRes();
    await deleteSculpture({ user: { id: 1 }, params: { id: 99 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Sculpture introuvable' });
  });

  it('cascades cleanup and returns success', async () => {
    const destroySpy = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(Sculpture, 'findOne').mockResolvedValue({ id: 5, destroy: destroySpy });
    const cartItemDestroySpy = vi.spyOn(CartItem, 'destroy').mockResolvedValue(1);
    const orderUpdateSpy    = vi.spyOn(Order,    'update').mockResolvedValue([1]);

    const res = makeRes();
    await deleteSculpture({ user: { id: 1 }, params: { id: 5 } }, res);

    expect(cartItemDestroySpy).toHaveBeenCalled();
    expect(orderUpdateSpy).toHaveBeenCalledWith({ sculptureId: null }, expect.any(Object));
    expect(destroySpy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});

describe('getMaterials', () => {
  it('returns the list of materials', async () => {
    const fakeMaterials = [
      { id: 1, name: 'pla',  basePrice: '8' },
      { id: 2, name: 'petg', basePrice: '8' },
    ];
    vi.spyOn(Material, 'findAll').mockResolvedValue(fakeMaterials);

    const res = makeRes();
    await getMaterials({}, res);

    expect(res.json).toHaveBeenCalledWith(fakeMaterials);
  });
});

describe('getPublicGallery', () => {
  it('returns mapped gallery with renderUrl when render file exists', async () => {
    const fakeSculptures = [
      {
        id: 1,
        name: 'Onde sonore',
        Material: { name: 'pla' },
        params:   { waveformColor: '#40E0D0', artistName: 'Daft Punk', songTitle: 'Around The World' },
      },
    ];
    vi.spyOn(Sculpture, 'findAll').mockResolvedValue(fakeSculptures);
    vi.spyOn(fsCJS, 'existsSync').mockReturnValue(true);

    const res = makeRes();
    await getPublicGallery({}, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        id:        1,
        name:      'Onde sonore',
        material:  'PLA mat',
        renderUrl: '/renders/1.png',
      }),
    ]);
  });

  it('sets renderUrl to null when no render file exists', async () => {
    const fakeSculptures = [
      { id: 2, name: 'Test', Material: { name: 'petg' }, params: null },
    ];
    vi.spyOn(Sculpture, 'findAll').mockResolvedValue(fakeSculptures);
    vi.spyOn(fsCJS, 'existsSync').mockReturnValue(false);

    const res = makeRes();
    await getPublicGallery({}, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ renderUrl: null, material: 'PETG brillant' }),
    ]);
  });
});
