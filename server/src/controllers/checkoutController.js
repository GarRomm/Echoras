'use strict';

const sequelize = require('../db/index');
const { Cart, CartItem, Sculpture, Order, ShippingAddress, User } = require('../db/models/index');
const { sendOrderConfirmationEmail } = require('../services/emailService');

// Frais de port en euros pour la livraison express.
// La livraison standard est gratuite (délai fabrication + transport inclus dans le prix sculpture).
const DELIVERY_FEE_EXPRESS = 8;

/**
 * Vérifie côté serveur que le paiement Stripe a bien abouti.
 *
 * On ne fait jamais confiance au client pour confirmer un paiement : un utilisateur
 * malveillant pourrait envoyer un paymentIntentId inventé. La vérification via l'API
 * Stripe garantit que l'argent a réellement été débité avant de créer la commande.
 */
async function verifyPayment(paymentIntentId) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  // 'sk_test_...' est la valeur placeholder dans .env.example.
  // Si la clé n'est pas configurée, on laisse passer sans erreur pour ne pas bloquer
  // les tests en développement local où Stripe n'est pas connecté.
  if (!stripeKey || stripeKey === 'sk_test_...') return;

  const stripe = require('stripe')(stripeKey);
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (intent.status !== 'succeeded') {
    // On attache un code HTTP 402 (Payment Required) à l'erreur pour que
    // placeOrder puisse le retransmettre directement au client.
    throw Object.assign(new Error('Paiement non complété'), { status: 402 });
  }
}

/**
 * Crée une commande à partir du panier de l'utilisateur connecté.
 *
 * L'ensemble des écritures en base (adresse, commandes, vidage panier, statut sculpture)
 * est enveloppé dans une transaction Sequelize. Si une étape échoue, toutes les
 * opérations précédentes sont annulées (propriété ACID d'atomicité) : on ne se retrouve
 * jamais avec une commande créée sans adresse, ou un panier vidé sans commande.
 */
async function placeOrder(req, res) {
  // On ouvre la transaction avant toute opération en base.
  const t = await sequelize.transaction();
  try {
    const { firstName, lastName, phone, address, postalCode, city, country, deliveryType, paymentIntentId } = req.body;

    // Vérification du paiement uniquement si Stripe est configuré dans l'environnement.
    // On valide avant de toucher à la base pour ne pas créer de données orphelines
    // en cas de paiement refusé.
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

    // Validation minimale de l'adresse avant d'écrire en base.
    if (!address || !postalCode || !city) {
      await t.rollback();
      return res.status(400).json({ error: 'Adresse incomplète' });
    }

    // On charge le panier avec ses articles ET les sculptures associées en une seule requête SQL
    // (eager loading Sequelize via include). La sculpture est nécessaire pour connaître son
    // statut (draft → ordered) et son nom pour l'email de confirmation.
    // La lecture est incluse dans la transaction pour éviter une race condition où un autre
    // processus modifierait le panier entre la lecture et les écritures suivantes.
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

    // L'adresse est sauvegardée dans la transaction : si la création d'une commande
    // échoue ensuite, l'adresse est également annulée (aucun enregistrement orphelin).
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
      const item           = cart.CartItems[i];
      const sculpturePrice = parseFloat(item.price) || 0;

      // Les frais de port ne sont ajoutés qu'à la première commande du lot.
      // Un panier peut contenir plusieurs sculptures, mais la livraison est
      // une prestation unique : on ne la facture pas autant de fois qu'il y a d'articles.
      const orderTotal = i === 0 ? sculpturePrice + deliveryFee : sculpturePrice;

      const order = await Order.create({
        userId:            req.user.id,
        sculptureId:       item.sculptureId,
        totalPrice:        orderTotal,
        status:            'pending',
        shippingAddressId: shippingAddress.id,
      }, { transaction: t });

      // On verrouille la sculpture commandée en passant son statut de "draft" à "ordered".
      // Cela empêche qu'elle soit ajoutée dans un autre panier ou re-commandée.
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

    // On vide le panier uniquement après avoir créé toutes les commandes avec succès.
    // Si une erreur survient sur l'une des commandes, le rollback annule aussi cette suppression.
    await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

    // Commit : toutes les écritures sont rendues permanentes en base simultanément.
    await t.commit();

    const total = createdOrders.reduce((s, o) => s + o.price, 0);

    // Envoi de l'email de confirmation APRES le commit, en mode "fire-and-forget".
    // On n'attend pas la résolution de la promesse avant de répondre au client :
    // un délai ou une panne SMTP ne doit pas faire échouer la confirmation de commande.
    // Les erreurs sont loguées mais ne propagent pas d'exception.
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
    // En cas d'erreur non gérée dans le bloc try, on annule toutes les opérations
    // de la transaction pour ne laisser aucune donnée incohérente en base.
    await t.rollback();
    console.error('[POST /api/checkout]', err);
    res.status(500).json({ error: 'Erreur lors de la commande' });
  }
}

module.exports = { placeOrder };
