'use strict';

const { Order, Sculpture, SculptureParams, Material } = require('../db/models/index');

async function getUserOrders(req, res) {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Sculpture,
          attributes: ['id', 'name'],
          include: [
            { model: SculptureParams, as: 'params', attributes: ['waveformColor', 'artistName', 'songTitle'] },
            { model: Material, attributes: ['name'] },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const result = orders.map(o => ({
      id:                    o.id,
      orderNumber:           `#ECH-${o.id.toString().padStart(4, '0')}`,
      status:                o.status,
      totalPrice:            parseFloat(o.totalPrice),
      trackingNumber:        o.trackingNumber   || null,
      estimatedDeliveryDate: o.estimatedDeliveryDate || null,
      createdAt:             o.createdAt,
      sculpture: o.Sculpture ? {
        id:           o.Sculpture.id,
        name:         o.Sculpture.name,
        artistName:   o.Sculpture.params?.artistName   || null,
        songTitle:    o.Sculpture.params?.songTitle     || null,
        waveformColor: o.Sculpture.params?.waveformColor || null,
        material:     o.Sculpture.Material?.name        || null,
      } : null,
    }));

    res.json({ orders: result });
  } catch (err) {
    console.error('[GET /api/orders]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { getUserOrders };
