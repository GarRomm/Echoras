'use strict';

const express = require('express');
const router = express.Router();
const { authJWT, requireRole } = require('../middleware/authJWT');
const { getStats, getOrders, updateOrderStatus } = require('../controllers/adminController');

router.use(authJWT, requireRole('ADMIN'));

router.get('/stats', getStats);
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;
