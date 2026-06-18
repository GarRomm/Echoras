'use strict';

const sequelize = require('../db/index');
const { Cart, CartItem, Sculpture, Order, ShippingAddress, User } = require('../db/models/index');
const { sendOrderConfirmationEmail } = require('../services/emailService');

const DELIVERY_FEE_EXPRESS = 8;

async function verifyPayment(paymentIntentId) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey === 'sk_test_...') return; // pas de clé → on laisse passer en dev
  const stripe = require('stripe')(stripeKey);
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== 'succeeded') {
    throw Object.assign(new Error('Paiement non complété'), { status: 402 });
  }
}

async function placeOrder(req, res) {
  const t = await sequelize.transaction();
  try {
    const { firstName, lastName, phone, address, postalCode, city, country, deliveryType, paymentIntentId } = req.body;

    // Vérification Stripe si une clé est configurée
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && stripeKey !== 'sk_test_...') {
      if (!paymentIntentId) {
        await t.rollback();
        return res.status(400).json({ error: 'Identifiant de paiement manquant' });
      }
      try {
        await verifyPayment(paymentIntentId);
      } catch (err) {
        await t.rollback();
        return res.status(err.status || 402).json({ error: err.message });
      }
    }

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

    // Email de confirmation - fire-and-forget, ne bloque pas la réponse
    const user = await User.findByPk(req.user.id, { attributes: ['email', 'firstName'] });
    if (user) {
      sendOrderConfirmationEmail({
        to:        user.email,
        firstName: user.firstName,
        orders:    createdOrders,
        total,
      }).catch(err => console.error('[email] sendOrderConfirmationEmail:', err));
    }

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
