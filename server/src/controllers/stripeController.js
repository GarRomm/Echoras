'use strict';

const { Cart, CartItem } = require('../db/models/index');

const DELIVERY_FEE_EXPRESS = 8;

async function createPaymentIntent(req, res) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey === 'sk_test_...') {
    return res.status(503).json({ error: 'Paiement non configuré (clé Stripe manquante)' });
  }

  try {
    const stripe = require('stripe')(stripeKey);
    const { deliveryType } = req.body;

    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [{ model: CartItem }],
    });

    if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
      return res.status(400).json({ error: 'Panier vide' });
    }

    const subtotal = cart.CartItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    const deliveryFee = deliveryType === 'express' ? DELIVERY_FEE_EXPRESS : 0;
    const total = subtotal + deliveryFee;
    const amountInCents = Math.round(total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        userId: String(req.user.id),
        deliveryType: deliveryType || 'standard',
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('[POST /api/checkout/create-payment-intent]', err);
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
}

module.exports = { createPaymentIntent };
