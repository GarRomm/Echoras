'use strict';

const express = require('express');
const { authJWT } = require('../middleware/authJWT');
const cartController = require('../controllers/cartController');

const router = express.Router();

router.get('/', authJWT, cartController.getCart);
router.post('/', authJWT, cartController.addToCart);
router.delete('/:itemId', authJWT, cartController.removeFromCart);

module.exports = router;
