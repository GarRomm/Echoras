const express = require('express');
const renderController = require('../controllers/renderController');

const router = express.Router();

router.post('/:id', renderController.triggerRender);
router.get('/:id', renderController.getRenderStatus);

module.exports = router;
