'use strict';

const express = require('express');
const { Sculpture, SculptureParams, Material } = require('../db/models/index');
const { authJWT } = require('../middleware/authJWT');

const router = express.Router();

// POST /api/sculptures — sauvegarde une sculpture en draft
router.post('/', authJWT, async (req, res) => {
  try {
    const {
      name,
      audioFileName,
      peakHeight,
      smoothing,
      cylinderRadius,
      cylinderHeight,
      ringThickness,
      segments,
      materialSlug,
      helixTurns,
      ribbonWidth,
      waveformColor,
      cylinderColor,
      baseHeight,
      showBase,
    } = req.body;

    // Récupère le matériau pour vérifier qu'il existe
    const material = await Material.findOne({ where: { name: materialSlug || 'plastic_white' } });
    if (!material) {
      return res.status(400).json({ error: 'Matériau invalide' });
    }

    // Crée les paramètres
    const sculptureParams = await SculptureParams.create({
      peakHeight:     peakHeight     ?? 1.5,
      smoothing:      smoothing      ?? 0,
      cylinderRadius: cylinderRadius ?? 1.0,
      cylinderHeight: cylinderHeight ?? 4.0,
      ringThickness:  ringThickness  ?? 0.3,
      segments:       segments       ?? 512,
      helixTurns:     helixTurns     ?? 6,
      ribbonWidth:    ribbonWidth    ?? 0.15,
      waveformColor:  waveformColor  || '#40E0D0',
      cylinderColor:  cylinderColor  || '#FFFFFF',
    });

    // Crée la sculpture liée à l'utilisateur
    const sculpture = await Sculpture.create({
      name:              name || 'Ma sculpture',
      audioFileName:     audioFileName || null,
      status:            'draft',
      userId:            req.user.id,
      materialId:        material.id,
      sculptureParamsId: sculptureParams.id,
    });

    res.status(201).json({
      id:         sculpture.id,
      name:       sculpture.name,
      materialId: material.id,
      price:      parseFloat(material.basePrice),
    });
  } catch (err) {
    console.error('[POST /api/sculptures]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sculptures — liste les drafts de l'utilisateur connecté
router.get('/', authJWT, async (req, res) => {
  try {
    const sculptures = await Sculpture.findAll({
      where: { userId: req.user.id, status: 'draft' },
      include: [
        { model: Material, attributes: ['id', 'name', 'basePrice'] },
        { model: SculptureParams, as: 'params' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ sculptures });
  } catch (err) {
    console.error('[GET /api/sculptures]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/sculptures/:id — supprime un draft (ownership vérifié)
router.delete('/:id', authJWT, async (req, res) => {
  try {
    const deleted = await Sculpture.destroy({
      where: { id: req.params.id, userId: req.user.id, status: 'draft' },
    });
    if (!deleted) return res.status(404).json({ error: 'Sculpture introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/sculptures/:id]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
