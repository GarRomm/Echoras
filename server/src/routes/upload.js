const express = require('express');
const uploadMiddleware = require('../services/uploadService');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

router.post('/', uploadMiddleware.single('audio'), uploadController.uploadAudio);

module.exports = router;
