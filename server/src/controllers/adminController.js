'use strict';

const { Op } = require('sequelize');
const { Order, User } = require('../db/models/index');

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

module.exports = { getStats, getOrders, updateOrderStatus };
