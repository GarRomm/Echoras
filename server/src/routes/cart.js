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

// POST /api/cart — ajoute une sculpture au panier
router.post('/', authJWT, async (req, res) => {
  try {
    const { sculptureId, materialId: materialIdFromBody } = req.body;

    if (!sculptureId) {
      return res.status(400).json({ error: 'sculptureId requis' });
    }

    // Vérifie que la sculpture appartient à l'utilisateur
    const sculpture = await Sculpture.findOne({
      where: { id: sculptureId, userId: req.user.id },
    });
    if (!sculpture) return res.status(404).json({ error: 'Sculpture introuvable' });

    // Utilise le materialId fourni, ou celui déjà associé à la sculpture
    const resolvedMaterialId = materialIdFromBody || sculpture.materialId;
    if (!resolvedMaterialId) {
      return res.status(400).json({ error: 'Matériau introuvable pour cette sculpture' });
    }

    // Récupère le prix du matériau
    const material = await Material.findByPk(resolvedMaterialId);
    if (!material) return res.status(404).json({ error: 'Matériau introuvable' });

    // Crée ou récupère le panier de l'utilisateur
    const [cart] = await Cart.findOrCreate({ where: { userId: req.user.id } });

    // Évite les doublons : si la sculpture est déjà dans le panier, on la met à jour
    const [item, created] = await CartItem.findOrCreate({
      where: { cartId: cart.id, sculptureId },
      defaults: { price: material.basePrice, materialId: resolvedMaterialId, quantity: 1 },
    });

    if (!created) {
      await item.update({ materialId: resolvedMaterialId, price: material.basePrice });
    }

    res.status(created ? 201 : 200).json({ item, created });
  } catch (err) {
    console.error('[POST /api/cart]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
