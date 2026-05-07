const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const BLENDER_PATH = process.env.BLENDER_PATH || 'blender';
const RENDER_SCRIPT = path.join(__dirname, '..', '..', '..', 'python-service', 'scripts', 'render_stl.py');
const STL_DIR = path.join(__dirname, '..', '..', 'storage', 'stl');
const RENDER_DIR = path.join(__dirname, '..', '..', 'storage', 'renders');

function triggerRender(req, res) {
  const stlPath = path.join(STL_DIR, `${req.params.id}.stl`);
  const outputPath = path.join(RENDER_DIR, `${req.params.id}.png`);

  if (!fs.existsSync(stlPath)) return res.status(404).json({ error: 'STL not found' });

  const material = req.body.material || 'pla';
  const color = req.body.color || null;
  const input2Id = req.body.input2 || null;
  const color2 = req.body.color2 || null;

  const args = [
    '--background',
    '--python', RENDER_SCRIPT,
    '--',
    '--input', stlPath,
    '--output', outputPath,
    '--material', material,
  ];

  if (color && /^#[0-9a-fA-F]{6}$/.test(color)) args.push('--color', color);

  if (input2Id) {
    const stlPath2 = path.join(STL_DIR, `${path.basename(input2Id)}.stl`);
    if (fs.existsSync(stlPath2)) {
      args.push('--input2', stlPath2);
      if (color2 && /^#[0-9a-fA-F]{6}$/.test(color2)) args.push('--color2', color2);
    }
  }

  execFile(BLENDER_PATH, args, { timeout: 300_000 }, (err, stdout, stderr) => {
    if (err) {
      console.error('Blender render error:', stderr);
      return res.status(500).json({ error: 'Render failed', details: stderr });
    }
    res.json({ id: req.params.id, renderUrl: `/renders/${req.params.id}.png`, log: stdout });
  });
}

function getRenderStatus(req, res) {
  const outputPath = path.join(RENDER_DIR, `${req.params.id}.png`);
  if (!fs.existsSync(outputPath)) return res.status(404).json({ ready: false });
  res.json({ ready: true, renderUrl: `/renders/${req.params.id}.png` });
}

module.exports = { triggerRender, getRenderStatus };
