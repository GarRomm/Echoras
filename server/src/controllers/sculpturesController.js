'use strict';

const path = require('path');
const fs   = require('fs');
const { Sculpture, SculptureParams, Material, AudioAnalysis, Order, CartItem } = require('../db/models/index');

const RENDER_DIR = path.join(__dirname, '..', '..', 'storage', 'renders');
const STL_DIR    = path.join(__dirname, '..', '..', 'storage', 'stl');

async function saveScreenshot(req, res) {
  try {
    const { id } = req.params;
    const { imageData } = req.body;
    if (!imageData) return res.status(400).json({ error: 'imageData requis' });

    const sculpture = await require('../db/models/index').Sculpture.findOne({
      where: { id, userId: req.user.id },
    });
    if (!sculpture) return res.status(404).json({ error: 'Sculpture introuvable' });

    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    fs.mkdirSync(RENDER_DIR, { recursive: true });
    fs.writeFileSync(path.join(RENDER_DIR, `${id}.png`), buffer);
    res.json({ success: true, renderUrl: `/renders/${id}.png` });
  } catch (err) {
    console.error('[POST /api/sculptures/:id/screenshot]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

const MATERIAL_LABELS = { pla: 'PLA mat', petg: 'PETG brillant' };

async function createSculpture(req, res) {
  try {
    const {
      name,
      audioFileName,
      waveformData,
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
      artistName,
      songTitle,
    } = req.body;

    const material = await Material.findOne({ where: { name: materialSlug || 'pla' } });
    if (!material) return res.status(400).json({ error: 'Materiau invalide' });

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
      artistName:     artistName     || null,
      songTitle:      songTitle      || null,
    });

    let audioAnalysis = null;
    if (Array.isArray(waveformData) && waveformData.length > 0) {
      audioAnalysis = await AudioAnalysis.create({ rmsEnvelope: waveformData });
    }

    const sculpture = await Sculpture.create({
      name:              name || 'Ma sculpture',
      audioFileName:     audioFileName || null,
      status:            'draft',
      userId:            req.user.id,
      materialId:        material.id,
      sculptureParamsId: sculptureParams.id,
      audioAnalysisId:   audioAnalysis?.id ?? null,
    });

    res.status(201).json({
      id:          sculpture.id,
      name:        sculpture.name,
      materialId:  material.id,
      price:       parseFloat(material.basePrice),
      hasWaveform: !!audioAnalysis,
    });
  } catch (err) {
    console.error('[POST /api/sculptures]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function getSculptures(req, res) {
  try {
    const sculptures = await Sculpture.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Material, attributes: ['id', 'name', 'basePrice'] },
        { model: SculptureParams, as: 'params' },
        { model: AudioAnalysis, as: 'analysis', attributes: ['id', 'rmsEnvelope'] },
        { model: Order, attributes: ['id', 'status'], required: false },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ sculptures });
  } catch (err) {
    console.error('[GET /api/sculptures]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function deleteSculpture(req, res) {
  try {
    const sculpture = await Sculpture.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!sculpture) return res.status(404).json({ error: 'Sculpture introuvable' });

    await CartItem.destroy({ where: { sculptureId: sculpture.id } });
    await Order.update({ sculptureId: null }, { where: { sculptureId: sculpture.id } });
    await sculpture.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/sculptures/:id]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

const PAID_STATUSES = ['pending', 'paid', 'fabrication', 'shipped', 'delivered'];

async function getPublicGallery(req, res) {
  try {
    const sculptures = await Sculpture.findAll({
      include: [
        { model: Material, attributes: ['name'] },
        { model: SculptureParams, as: 'params', attributes: ['waveformColor', 'artistName', 'songTitle'] },
        {
          model: Order,
          required: true,                          // INNER JOIN — exclut les sculptures sans commande
          attributes: [],
          where: { status: { [require('sequelize').Op.in]: PAID_STATUSES } },
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 12,
    });

    const result = sculptures.map(s => {
      const hasRender = fs.existsSync(path.join(RENDER_DIR, `${s.id}.png`));
      const matName   = s.Material?.name || 'pla';
      return {
        id:           s.id,
        name:         s.name || 'Sans titre',
        material:     MATERIAL_LABELS[matName] || matName,
        waveformColor: s.params?.waveformColor || null,
        artistName:   s.params?.artistName || null,
        songTitle:    s.params?.songTitle || null,
        renderUrl:    hasRender ? `/renders/${s.id}.png` : null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('[GET /api/sculptures/gallery]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function getMaterials(_req, res) {
  try {
    const materials = await Material.findAll({
      attributes: ['id', 'name', 'basePrice'],
      order: [['id', 'ASC']],
    });
    res.json(materials);
  } catch (err) {
    console.error('[GET /api/sculptures/materials]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function saveStl(req, res) {
  try {
    const { id } = req.params;
    const sculpture = await Sculpture.findOne({ where: { id, userId: req.user.id } });
    if (!sculpture) return res.status(404).json({ error: 'Sculpture introuvable' });

    fs.mkdirSync(STL_DIR, { recursive: true });
    const filePath = path.join(STL_DIR, `sculpture_${id}.stl`);
    fs.writeFileSync(filePath, req.body);
    await sculpture.update({ stlFilePath: filePath });
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/sculptures/:id/stl]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { createSculpture, getSculptures, deleteSculpture, getPublicGallery, getMaterials, saveScreenshot, saveStl };
