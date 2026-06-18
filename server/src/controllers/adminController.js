'use strict';

const fs   = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { Order, User, Sculpture, SculptureParams, Material, ShippingAddress } = require('../db/models/index');
const { sendOrderStatusEmail } = require('../services/emailService');

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
    const order = await Order.findByPk(id, {
      include: [{ model: User, attributes: ['email', 'firstName'] }],
    });
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    await order.update({ status });

    // Email de statut - fire-and-forget pour fabrication, shipped, delivered
    if (order.User) {
      sendOrderStatusEmail({
        to:          order.User.email,
        firstName:   order.User.firstName,
        orderNumber: `#ECH-${String(order.id).padStart(4, '0')}`,
        status,
      }).catch(err => console.error('[email] sendOrderStatusEmail:', err));
    }

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
        material: MATERIAL_LABELS[matName] || matName || '-',
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

async function downloadStl(req, res) {
  try {
    const { id, suffix } = req.params;
    const validSuffixes = ['waveform', 'corps', 'plaque'];
    if (!validSuffixes.includes(suffix)) return res.status(400).json({ error: 'Suffix invalide' });

    const order = await Order.findByPk(id, {
      include: [{ model: Sculpture, attributes: ['id', 'name', 'stlFilePath'] }],
    });
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    const stlPath = order.Sculpture?.stlFilePath;
    if (!stlPath) return res.status(404).json({ error: 'Fichier STL non disponible' });

    // New format: sculpture_123_waveform.stl - dérive les autres suffixes
    // Legacy format: sculpture_123.stl - seul waveform disponible
    let targetPath;
    if (stlPath.endsWith('_waveform.stl')) {
      targetPath = stlPath.replace('_waveform.stl', `_${suffix}.stl`);
    } else {
      targetPath = suffix === 'waveform' ? stlPath : null;
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Fichier STL non disponible' });
    }

    const safeName = (order.Sculpture.name || `commande-${id}`)
      .replace(/[^a-z0-9\-_]/gi, '_');
    res.download(targetPath, `${safeName}_${suffix}.stl`);
  } catch (err) {
    console.error('admin downloadStl:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function download3mf(req, res) {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [{ model: Sculpture, attributes: ['id', 'name', 'stlFilePath'] }],
    });
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    const stlPath = order.Sculpture?.stlFilePath;
    if (!stlPath) return res.status(404).json({ error: 'Fichier 3MF non disponible' });
    const threeMfPath = path.join(path.dirname(stlPath), `sculpture_${order.Sculpture.id}.3mf`);
    if (!fs.existsSync(threeMfPath)) return res.status(404).json({ error: 'Fichier 3MF non disponible' });
    const safeName = (order.Sculpture.name || `commande-${id}`).replace(/[^a-z0-9\-_]/gi, '_');
    res.download(threeMfPath, `${safeName}.3mf`);
  } catch (err) {
    console.error('admin download3mf:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function deleteOrder(req, res) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    await order.destroy();
    res.status(204).end();
  } catch (err) {
    console.error('admin deleteOrder:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { getStats, getOrders, updateOrderStatus, getOrderDetail, deleteOrder, downloadStl, download3mf };
