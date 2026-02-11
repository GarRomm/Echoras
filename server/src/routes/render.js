const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const BLENDER_PATH = process.env.BLENDER_PATH || 'blender';
const RENDER_SCRIPT = path.join(__dirname, '..', '..', '..', 'python-service', 'scripts', 'render_stl.py');
const STL_DIR = path.join(__dirname, '..', '..', 'storage', 'stl');
const RENDER_DIR = path.join(__dirname, '..', '..', 'storage', 'renders');

// POST /api/render/:id  — trigger a Blender render of the given STL
router.post('/:id', (req, res) => {
  const stlPath = path.join(STL_DIR, `${req.params.id}.stl`);
  const outputPath = path.join(RENDER_DIR, `${req.params.id}.png`);

  if (!fs.existsSync(stlPath)) {
    return res.status(404).json({ error: 'STL not found' });
  }

  // Extract optional material parameter (defaults handled by Python script)
  const material = req.body.material || 'plastic_white';

  const args = [
    '--background',
    '--python', RENDER_SCRIPT,
    '--',
    '--input', stlPath,
    '--output', outputPath,
    '--material', material,
  ];

  execFile(BLENDER_PATH, args, { timeout: 120_000 }, (err, stdout, stderr) => {
    if (err) {
      console.error('Blender render error:', stderr);
      return res.status(500).json({ error: 'Render failed', details: stderr });
    }

    res.json({
      id: req.params.id,
      renderUrl: `/renders/${req.params.id}.png`,
      log: stdout,
    });
  });
});

// GET /api/render/:id  — check render status / get image URL
router.get('/:id', (req, res) => {
  const outputPath = path.join(RENDER_DIR, `${req.params.id}.png`);
  if (!fs.existsSync(outputPath)) {
    return res.status(404).json({ ready: false });
  }
  res.json({ ready: true, renderUrl: `/renders/${req.params.id}.png` });
});

module.exports = router;
