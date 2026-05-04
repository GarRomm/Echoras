'use strict';

const express = require('express');
const { Cart, CartItem, Sculpture, Material, SculptureParams } = require('../db/models/index');
const { authJWT } = require('../middleware/authJWT');

const router = express.Router();

// GET /api/cart — récupère le panier de l'utilisateur connecté
router.get('/', authJWT, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: Sculpture,
              attributes: ['id', 'name', 'status'],
              include: [
                { model: Material, attributes: ['id', 'name'] },
                { model: SculptureParams, as: 'params' },
              ],
            },
            { model: Material, attributes: ['id', 'name'] },
          ],
        },
      ],
    });

    if (!cart) {
      return res.json({ items: [] });
    }

    res.json({ items: cart.CartItems });
  } catch (err) {
    console.error('[GET /api/cart]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/cart/:itemId — supprime un article du panier
router.delete('/:itemId', authJWT, async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (!cart) return res.status(404).json({ error: 'Panier introuvable' });

    const deleted = await CartItem.destroy({
      where: { id: req.params.itemId, cartId: cart.id },
    });

    if (!deleted) return res.status(404).json({ error: 'Article introuvable' });

    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/cart/:itemId]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
