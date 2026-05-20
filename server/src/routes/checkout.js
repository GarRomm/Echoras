'use strict';

const express = require('express');
const { authJWT } = require('../middleware/authJWT');
const { placeOrder } = require('../controllers/checkoutController');
const { createPaymentIntent } = require('../controllers/stripeController');

const router = express.Router();

router.post('/create-payment-intent', authJWT, createPaymentIntent);
router.post('/', authJWT, placeOrder);

module.exports = router;
