import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);
const { Cart, CartItem, Sculpture, Material, SculptureParams } = _require('../../db/models/index');
const { getCart, addToCart, removeFromCart } = _require('../../controllers/cartController');

const BASE_PARAMS = {
  helixTurns:     6,
  cylinderRadius: 1.0,
  ribbonWidth:    0.15,
  ringThickness:  0.3,
  peakHeight:     1.5,
  cylinderHeight: 4.0,
};

const BASE_MATERIAL = { id: 1, name: 'pla', basePrice: '8' };

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  };
}

beforeEach(() => vi.restoreAllMocks());

describe('getCart', () => {
  it('returns empty items when no cart exists', async () => {
    vi.spyOn(Cart, 'findOne').mockResolvedValue(null);
    const res = makeRes();
    await getCart({ user: { id: 1 } }, res);
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it('returns cart items when cart exists', async () => {
    const fakeItems = [{ id: 10, price: '35' }];
    vi.spyOn(Cart, 'findOne').mockResolvedValue({ CartItems: fakeItems });
    const res = makeRes();
    await getCart({ user: { id: 1 } }, res);
    expect(res.json).toHaveBeenCalledWith({ items: fakeItems });
  });

  it('returns 500 on unexpected error', async () => {
    vi.spyOn(Cart, 'findOne').mockRejectedValue(new Error('DB down'));
    const res = makeRes();
    await getCart({ user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('addToCart', () => {
  it('returns 400 when sculptureId is missing', async () => {
    const res = makeRes();
    await addToCart({ user: { id: 1 }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'sculptureId requis' });
  });

  it('returns 404 when sculpture is not found', async () => {
    vi.spyOn(Sculpture, 'findOne').mockResolvedValue(null);
    const res = makeRes();
    await addToCart({ user: { id: 1 }, body: { sculptureId: 99 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Sculpture introuvable' });
  });

  it('returns 400 when no material can be resolved', async () => {
    vi.spyOn(Sculpture, 'findOne').mockResolvedValue({ id: 1, materialId: null, params: null });
    const res = makeRes();
    await addToCart({ user: { id: 1 }, body: { sculptureId: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when material record not found', async () => {
    vi.spyOn(Sculpture, 'findOne').mockResolvedValue({ id: 1, materialId: 5, params: null });
    vi.spyOn(Material, 'findByPk').mockResolvedValue(null);
    const res = makeRes();
    await addToCart({ user: { id: 1 }, body: { sculptureId: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Materiau introuvable' });
  });

  it('creates new cart item and returns 201', async () => {
    const sculpture = { id: 1, materialId: 1, params: { ...BASE_PARAMS } };
    vi.spyOn(Sculpture, 'findOne').mockResolvedValue(sculpture);
    vi.spyOn(Material, 'findByPk').mockResolvedValue({ ...BASE_MATERIAL });
    vi.spyOn(Cart, 'findOrCreate').mockResolvedValue([{ id: 42 }]);
    const newItem = { id: 100, price: '35', materialId: 1 };
    vi.spyOn(CartItem, 'findOrCreate').mockResolvedValue([newItem, true]);

    const res = makeRes();
    await addToCart({ user: { id: 1 }, body: { sculptureId: 1 } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ created: true }));
  });

  it('updates existing item and returns 200', async () => {
    const sculpture = { id: 1, materialId: 1, params: { ...BASE_PARAMS } };
    vi.spyOn(Sculpture, 'findOne').mockResolvedValue(sculpture);
    vi.spyOn(Material, 'findByPk').mockResolvedValue({ ...BASE_MATERIAL });
    vi.spyOn(Cart, 'findOrCreate').mockResolvedValue([{ id: 42 }]);
    const existingItem = { id: 100, update: vi.fn().mockResolvedValue(true) };
    vi.spyOn(CartItem, 'findOrCreate').mockResolvedValue([existingItem, false]);

    const res = makeRes();
    await addToCart({ user: { id: 1 }, body: { sculptureId: 1 } }, res);

    expect(existingItem.update).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ created: false }));
  });

  it('computes a higher price for PETG than for PLA with the same params', async () => {
    async function getPriceFor(materialId, materialName) {
      const sculptSpy = vi.spyOn(Sculpture, 'findOne')
        .mockResolvedValue({ id: materialId, materialId, params: { ...BASE_PARAMS } });
      const matSpy = vi.spyOn(Material, 'findByPk')
        .mockResolvedValue({ id: materialId, name: materialName, basePrice: '8' });
      const cartSpy  = vi.spyOn(Cart, 'findOrCreate').mockResolvedValue([{ id: 42 }]);
      let price;
      const itemSpy = vi.spyOn(CartItem, 'findOrCreate').mockImplementation(({ defaults }) => {
        price = defaults.price;
        return Promise.resolve([{ id: 1 }, true]);
      });

      await addToCart({ user: { id: 1 }, body: { sculptureId: materialId } }, makeRes());

      sculptSpy.mockRestore();
      matSpy.mockRestore();
      cartSpy.mockRestore();
      itemSpy.mockRestore();

      return price;
    }

    const plaPrice  = await getPriceFor(1, 'pla');
    const petgPrice = await getPriceFor(2, 'petg');

    expect(petgPrice).toBeGreaterThan(plaPrice);
  });
});

describe('removeFromCart', () => {
  it('returns 404 when cart does not exist', async () => {
    vi.spyOn(Cart, 'findOne').mockResolvedValue(null);
    const res = makeRes();
    await removeFromCart({ user: { id: 1 }, params: { itemId: 5 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Panier introuvable' });
  });

  it('returns 404 when item not found in cart', async () => {
    vi.spyOn(Cart, 'findOne').mockResolvedValue({ id: 42 });
    vi.spyOn(CartItem, 'destroy').mockResolvedValue(0);
    const res = makeRes();
    await removeFromCart({ user: { id: 1 }, params: { itemId: 5 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Article introuvable' });
  });

  it('returns success when item is removed', async () => {
    vi.spyOn(Cart, 'findOne').mockResolvedValue({ id: 42 });
    vi.spyOn(CartItem, 'destroy').mockResolvedValue(1);
    const res = makeRes();
    await removeFromCart({ user: { id: 1 }, params: { itemId: 5 } }, res);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
