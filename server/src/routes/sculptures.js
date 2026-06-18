'use strict';

const express = require('express');
const { authJWT } = require('../middleware/authJWT');
const sculpturesController = require('../controllers/sculpturesController');

const router = express.Router();

// Routes publiques - avant authJWT
router.get('/gallery',   sculpturesController.getPublicGallery);
router.get('/materials', sculpturesController.getMaterials);

router.post('/', authJWT, sculpturesController.createSculpture);
router.get('/', authJWT, sculpturesController.getSculptures);
router.post('/:id/screenshot', authJWT, sculpturesController.saveScreenshot);
router.post('/:id/stl/:suffix', authJWT, express.raw({ type: 'application/octet-stream', limit: '100mb' }), sculpturesController.saveStl);
router.post('/:id/3mf', authJWT, express.raw({ type: 'application/octet-stream', limit: '100mb' }), sculpturesController.save3mf);
router.delete('/:id', authJWT, sculpturesController.deleteSculpture);

module.exports = router;
