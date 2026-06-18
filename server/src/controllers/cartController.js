'use strict';

const { Cart, CartItem, Sculpture, Material, SculptureParams } = require('../db/models/index');

// Réplique de la formule printCost.js (client) - source de vérité côté serveur
const PRINT_SPEED_CM3_H = 25;
const INFILL_FACTOR     = 0.15;
const BRILLANT_PREMIUM  = 14;

function computePrice(params, laborBase, isBrillant) {
  const helixLength       = params.helixTurns * 2 * Math.PI * params.cylinderRadius;
  const helixVolume       = helixLength * params.ribbonWidth * params.ringThickness * (1 + params.peakHeight * 0.12);
  const cylVolumeEff      = Math.PI * Math.pow(params.cylinderRadius, 2) * params.cylinderHeight * INFILL_FACTOR;
  const baseVolume        = Math.PI * Math.pow(params.cylinderRadius * 1.1, 2) * 1.2; // baseHeight fixe = 1.2
  const totalVolume       = helixVolume + cylVolumeEff + baseVolume;
  const density           = isBrillant ? 1.27 : 1.24;
  const pricePerKg        = isBrillant ? 30   : 25;
  const materialCost      = (totalVolume * density / 1000) * pricePerKg;
  const machineCost       = totalVolume * 1.2 / PRINT_SPEED_CM3_H * 0.07;
  const laborCost         = laborBase + (isBrillant ? BRILLANT_PREMIUM : 0);
  return Math.ceil(materialCost + machineCost + laborCost);
}

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
      include: [{ model: SculptureParams, as: 'params' }],
    });
    if (!sculpture) return res.status(404).json({ error: 'Sculpture introuvable' });

    const resolvedMaterialId = materialIdFromBody || sculpture.materialId;
    if (!resolvedMaterialId) {
      return res.status(400).json({ error: 'Materiau introuvable pour cette sculpture' });
    }

    const material = await Material.findByPk(resolvedMaterialId);
    if (!material) return res.status(404).json({ error: 'Materiau introuvable' });

    const isBrillant   = material.name === 'petg';
    const laborBase    = parseFloat(material.basePrice);
    const computedPrice = sculpture.params
      ? computePrice(sculpture.params, laborBase, isBrillant)
      : laborBase;

    const [cart] = await Cart.findOrCreate({ where: { userId: req.user.id } });

    const [item, created] = await CartItem.findOrCreate({
      where: { cartId: cart.id, sculptureId },
      defaults: { price: computedPrice, materialId: resolvedMaterialId, quantity: 1 },
    });

    if (!created) {
      await item.update({ materialId: resolvedMaterialId, price: computedPrice });
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
