'use strict';

const { Cart, CartItem, Sculpture, Material, SculptureParams } = require('../db/models/index');

async function getCart(req, res) {
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

    if (!cart) return res.json({ items: [] });
    res.json({ items: cart.CartItems });
  } catch (err) {
    console.error('[GET /api/cart]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function addToCart(req, res) {
  try {
    const { sculptureId, materialId: materialIdFromBody } = req.body;

    if (!sculptureId) return res.status(400).json({ error: 'sculptureId requis' });

    const sculpture = await Sculpture.findOne({
      where: { id: sculptureId, userId: req.user.id },
    });
    if (!sculpture) return res.status(404).json({ error: 'Sculpture introuvable' });

    const resolvedMaterialId = materialIdFromBody || sculpture.materialId;
    if (!resolvedMaterialId) {
      return res.status(400).json({ error: 'Materiau introuvable pour cette sculpture' });
    }

    const material = await Material.findByPk(resolvedMaterialId);
    if (!material) return res.status(404).json({ error: 'Materiau introuvable' });

    const [cart] = await Cart.findOrCreate({ where: { userId: req.user.id } });

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
}

async function removeFromCart(req, res) {
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
}

module.exports = { getCart, addToCart, removeFromCart };
