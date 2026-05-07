'use strict';

const express = require('express');
const { authJWT } = require('../middleware/authJWT');
const sculpturesController = require('../controllers/sculpturesController');

const router = express.Router();

router.post('/', authJWT, sculpturesController.createSculpture);
router.get('/', authJWT, sculpturesController.getSculptures);
router.delete('/:id', authJWT, sculpturesController.deleteSculpture);

module.exports = router;
