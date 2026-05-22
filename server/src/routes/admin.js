'use strict';

const express = require('express');
const router = express.Router();
const { authJWT, requireRole } = require('../middleware/authJWT');
const { getStats, getOrders, updateOrderStatus, getOrderDetail, deleteOrder, downloadStl, download3mf } = require('../controllers/adminController');

router.use(authJWT, requireRole('ADMIN'));

router.get('/stats', getStats);
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderDetail);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/orders/:id/stl/:suffix', downloadStl);
router.get('/orders/:id/3mf', download3mf);
router.delete('/orders/:id', deleteOrder);

module.exports = router;
