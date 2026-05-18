'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendContact } = require('../controllers/contactController');

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 5,
  message: { error: 'Trop de messages envoyés. Réessayez dans une heure.' },
});

router.post('/', contactLimiter, sendContact);

module.exports = router;
