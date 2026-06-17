import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);
const { Cart, CartItem, Sculpture, Order, ShippingAddress, User } = _require('../../db/models/index');
const sequelizeCJS = _require('../../db/index');
const { placeOrder } = _require('../../controllers/checkoutController');

// Fake transaction returned by sequelize.transaction()
function makeFakeTransaction() {
  return {
    commit:   vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
  };
}

function makeReq(overrides = {}) {
  return {
    user: { id: 1 },
    body: {
      firstName:      'Alice',
      lastName:       'Dupont',
      address:        '1 rue de la Paix',
      postalCode:     '75001',
      city:           'Paris',
      country:        'France',
      deliveryType:   'standard',
      ...overrides,
    },
  };
}

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  // Ensure no Stripe key so the payment check is skipped
  delete process.env.STRIPE_SECRET_KEY;
});

// ---------------------------------------------------------------------------
// placeOrder
// ---------------------------------------------------------------------------

describe('placeOrder', () => {
  it('returns 400 when address is incomplete', async () => {
    const t = makeFakeTransaction();
    vi.spyOn(sequelizeCJS, 'transaction').mockResolvedValue(t);
    const res = makeRes();

    await placeOrder({ user: { id: 1 }, body: { city: 'Paris' } }, res);

    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Adresse incomplète' });
  });

  it('returns 400 when cart is empty', async () => {
    const t = makeFakeTransaction();
    vi.spyOn(sequelizeCJS, 'transaction').mockResolvedValue(t);
    vi.spyOn(Cart, 'findOne').mockResolvedValue(null);

    const res = makeRes();
    await placeOrder(makeReq(), res);

    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Panier vide' });
  });

  it('creates orders and commits transaction on success', async () => {
    const t = makeFakeTransaction();
    vi.spyOn(sequelizeCJS, 'transaction').mockResolvedValue(t);

    const mockCart = {
      id: 1,
      CartItems: [
        { sculptureId: 10, price: '45', Sculpture: { id: 10, name: 'Onde sonore', status: 'draft' } },
      ],
    };
    vi.spyOn(Cart,            'findOne').mockResolvedValue(mockCart);
    vi.spyOn(ShippingAddress, 'create').mockResolvedValue({ id: 5 });
    vi.spyOn(Order,           'create').mockResolvedValue({ id: 1 });
    vi.spyOn(Sculpture,       'update').mockResolvedValue([1]);
    vi.spyOn(CartItem,        'destroy').mockResolvedValue(1);
    vi.spyOn(User,            'findByPk').mockResolvedValue(null); // skip fire-and-forget email

    const res = makeRes();
    await placeOrder(makeReq(), res);

    expect(t.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        orders:      expect.any(Array),
        total:       45,
        orderNumber: '#ECH-0001',
      }),
    );
  });

  it('adds delivery fee to first order only on express delivery', async () => {
    const t = makeFakeTransaction();
    vi.spyOn(sequelizeCJS, 'transaction').mockResolvedValue(t);

    const mockCart = {
      id: 1,
      CartItems: [
        { sculptureId: 10, price: '40', Sculpture: { id: 10, name: 'A', status: 'draft' } },
        { sculptureId: 11, price: '30', Sculpture: { id: 11, name: 'B', status: 'draft' } },
      ],
    };
    vi.spyOn(Cart,            'findOne').mockResolvedValue(mockCart);
    vi.spyOn(ShippingAddress, 'create').mockResolvedValue({ id: 5 });

    const createdOrders = [];
    vi.spyOn(Order, 'create').mockImplementation(({ totalPrice }) => {
      const id = createdOrders.length + 1;
      createdOrders.push(totalPrice);
      return Promise.resolve({ id });
    });
    vi.spyOn(Sculpture, 'update').mockResolvedValue([1]);
    vi.spyOn(CartItem,  'destroy').mockResolvedValue(1);
    vi.spyOn(User,      'findByPk').mockResolvedValue(null);

    const res = makeRes();
    await placeOrder(makeReq({ deliveryType: 'express' }), res);

    // First order = 40 + 8 (express fee), second = 30
    expect(createdOrders[0]).toBe(48);
    expect(createdOrders[1]).toBe(30);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 78 }));
  });

  it('rolls back and returns 500 on unexpected error', async () => {
    const t = makeFakeTransaction();
    vi.spyOn(sequelizeCJS, 'transaction').mockResolvedValue(t);
    vi.spyOn(Cart, 'findOne').mockRejectedValue(new Error('DB error'));

    const res = makeRes();
    await placeOrder(makeReq(), res);

    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
