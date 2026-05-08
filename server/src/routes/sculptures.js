'use strict';

const express = require('express');
const { authJWT } = require('../middleware/authJWT');
const sculpturesController = require('../controllers/sculpturesController');

const router = express.Router();

// Routes publiques — avant authJWT
router.get('/gallery',   sculpturesController.getPublicGallery);
router.get('/materials', sculpturesController.getMaterials);

router.post('/', authJWT, sculpturesController.createSculpture);
router.get('/', authJWT, sculpturesController.getSculptures);
router.post('/:id/screenshot', authJWT, sculpturesController.saveScreenshot);
router.delete('/:id', authJWT, sculpturesController.deleteSculpture);

module.exports = router;
