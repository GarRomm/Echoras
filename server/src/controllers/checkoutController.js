'use strict';

const sequelize = require('../db/index');
const { Cart, CartItem, Sculpture, Order, ShippingAddress } = require('../db/models/index');

const DELIVERY_FEE_EXPRESS = 8;

async function placeOrder(req, res) {
  const t = await sequelize.transaction();
  try {
    const { firstName, lastName, phone, address, postalCode, city, country, deliveryType } = req.body;

    if (!address || !postalCode || !city) {
      await t.rollback();
      return res.status(400).json({ error: 'Adresse incomplète' });
    }

    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [{
        model: CartItem,
        include: [{ model: Sculpture, attributes: ['id', 'name', 'status'] }],
      }],
      transaction: t,
    });

    if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Panier vide' });
    }

    const shippingAddress = await ShippingAddress.create({
      name:       `${firstName || ''} ${lastName || ''}`.trim() || 'Client',
      street:     address,
      city,
      postalCode,
      country:    country || 'France',
      phone:      phone   || null,
      userId:     req.user.id,
    }, { transaction: t });

    const isExpress   = deliveryType === 'express';
    const deliveryFee = isExpress ? DELIVERY_FEE_EXPRESS : 0;

    const createdOrders = [];
    for (let i = 0; i < cart.CartItems.length; i++) {
      const item          = cart.CartItems[i];
      const sculpturePrice = parseFloat(item.price) || 0;
      // Delivery fee added to first order only
      const orderTotal    = i === 0 ? sculpturePrice + deliveryFee : sculpturePrice;

      const order = await Order.create({
        userId:            req.user.id,
        sculptureId:       item.sculptureId,
        totalPrice:        orderTotal,
        status:            'pending',
        shippingAddressId: shippingAddress.id,
      }, { transaction: t });

      if (item.Sculpture?.status === 'draft') {
        await Sculpture.update({ status: 'ordered' }, { where: { id: item.sculptureId }, transaction: t });
      }

      createdOrders.push({
        id:            order.id,
        orderNumber:   `#ECH-${order.id.toString().padStart(4, '0')}`,
        sculptureName: item.Sculpture?.name || 'Ma sculpture',
        price:         orderTotal,
      });
    }

    await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

    await t.commit();

    const total = createdOrders.reduce((s, o) => s + o.price, 0);

    res.json({
      orders:        createdOrders,
      total,
      orderNumber:   createdOrders[0].orderNumber,
      sculptureName: createdOrders[0].sculptureName,
    });
  } catch (err) {
    await t.rollback();
    console.error('[POST /api/checkout]', err);
    res.status(500).json({ error: 'Erreur lors de la commande' });
  }
}

module.exports = { placeOrder };
