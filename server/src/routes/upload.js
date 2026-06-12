const express = require('express');
const uploadMiddleware = require('../services/uploadService');
const uploadController = require('../controllers/uploadController');
const { authJWT } = require('../middleware/authJWT');

const router = express.Router();

router.post('/', authJWT, uploadMiddleware.single('audio'), uploadController.uploadAudio);

module.exports = router;
