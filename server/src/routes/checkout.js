'use strict';

const express = require('express');
const { authJWT } = require('../middleware/authJWT');
const { placeOrder } = require('../controllers/checkoutController');

const router = express.Router();

router.post('/', authJWT, placeOrder);

module.exports = router;
