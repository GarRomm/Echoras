const express = require('express');
const { authJWT, requireRole } = require('../middleware/authJWT');
const modelController = require('../controllers/modelController');

const router = express.Router();

router.post('/save', express.raw({ type: 'application/octet-stream', limit: '100mb' }), modelController.saveModel);
router.get('/:id', authJWT, requireRole('ADMIN'), modelController.getModel);
router.delete('/:id', authJWT, requireRole('ADMIN'), modelController.deleteModel);

module.exports = router;
