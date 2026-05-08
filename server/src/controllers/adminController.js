'use strict';

const { Op } = require('sequelize');
const { Order, User, Sculpture, SculptureParams, Material, ShippingAddress } = require('../db/models/index');

const VALID_STATUSES = ['pending', 'paid', 'fabrication', 'shipped', 'delivered'];

async function getStats(req, res) {
  try {
    const [total, inProgress, pendingShipment, revenue] = await Promise.all([
      Order.count(),
      Order.count({ where: { status: { [Op.in]: ['pending', 'paid', 'fabrication'] } } }),
      Order.count({ where: { status: 'shipped' } }),
      Order.sum('totalPrice'),
    ]);
    res.json({ total, inProgress, pendingShipment, revenue: revenue || 0 });
  } catch (err) {
    console.error('admin getStats:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function getOrders(req, res) {
  try {
    const orders = await Order.findAll({
      include: [{ model: User, attributes: ['firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders.map(o => ({
      id: o.id,
      orderNumber: `#ECH-${String(o.id).padStart(4, '0')}`,
      client: o.User ? `${o.User.firstName} ${o.User.lastName}` : 'Inconnu',
      date: o.createdAt,
      amount: Number(o.totalPrice),
      status: o.status,
    })));
  } catch (err) {
    console.error('admin getOrders:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }
  try {
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    await order.update({ status });
    res.json({ id: order.id, status: order.status });
  } catch (err) {
    console.error('admin updateOrderStatus:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

const MATERIAL_LABELS = { pla: 'PLA mat', petg: 'PETG brillant' };

async function getOrderDetail(req, res) {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['firstName', 'lastName', 'email', 'phone'] },
        {
          model: Sculpture,
          attributes: ['id', 'name', 'stlFilePath'],
          include: [
            { model: SculptureParams, as: 'params' },
            { model: Material, attributes: ['name'] },
          ],
        },
        { model: ShippingAddress },
      ],
    });

    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    const s = order.Sculpture;
    const p = s?.params;
    const matName = s?.Material?.name || null;

    res.json({
      id:                    order.id,
      orderNumber:           `#ECH-${order.id.toString().padStart(4, '0')}`,
      status:                order.status,
      totalPrice:            parseFloat(order.totalPrice),
      trackingNumber:        order.trackingNumber        || null,
      estimatedDeliveryDate: order.estimatedDeliveryDate || null,
      createdAt:             order.createdAt,
      updatedAt:             order.updatedAt,
      client: order.User ? {
        firstName: order.User.firstName,
        lastName:  order.User.lastName,
        email:     order.User.email,
        phone:     order.User.phone || null,
      } : null,
      sculpture: s ? {
        id:       s.id,
        name:     s.name,
        hasStl:   !!s.stlFilePath,
        material: MATERIAL_LABELS[matName] || matName || '—',
        params:   p ? {
          peakHeight:     p.peakHeight,
          cylinderHeight: p.cylinderHeight,
          cylinderRadius: p.cylinderRadius,
          helixTurns:     p.helixTurns,
          waveformColor:  p.waveformColor,
          artistName:     p.artistName,
          songTitle:      p.songTitle,
        } : null,
      } : null,
      shipping: order.ShippingAddress ? {
        name:       order.ShippingAddress.name,
        street:     order.ShippingAddress.street,
        city:       order.ShippingAddress.city,
        postalCode: order.ShippingAddress.postalCode,
        country:    order.ShippingAddress.country,
        phone:      order.ShippingAddress.phone || null,
      } : null,
    });
  } catch (err) {
    console.error('admin getOrderDetail:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { getStats, getOrders, updateOrderStatus, getOrderDetail };
