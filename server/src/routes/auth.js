'use strict';

const express = require('express');
const router = express.Router();
const { authJWT } = require('../middleware/authJWT');
const { register, login, logout, me, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authJWT, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
