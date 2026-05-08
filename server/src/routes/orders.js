'use strict';

const express = require('express');
const { authJWT } = require('../middleware/authJWT');
const { getUserOrders } = require('../controllers/ordersController');

const router = express.Router();

router.get('/', authJWT, getUserOrders);

module.exports = router;
