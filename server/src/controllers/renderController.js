const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const BLENDER_PATH       = process.env.BLENDER_PATH || 'blender';
const RENDER_SCRIPT      = path.join(__dirname, '..', '..', '..', 'python-service', 'scripts', 'render_stl.py');
const GENERATE_BASE_SCRIPT = path.join(__dirname, '..', '..', '..', 'python-service', 'scripts', 'generate_base.py');
const STL_DIR    = path.join(__dirname, '..', '..', 'storage', 'stl');
const RENDER_DIR = path.join(__dirname, '..', '..', 'storage', 'renders');

function runBlender(args, id, res) {
  execFile(BLENDER_PATH, args, { timeout: 300_000 }, (err, stdout, stderr) => {
    if (err) {
      console.error('Blender render error:', stderr);
      return res.status(500).json({ error: 'Render failed', details: stderr });
    }
    res.json({ id, renderUrl: `/renders/${id}.png`, log: stdout });
  });
}

function triggerRender(req, res) {
  const id = req.params.id;
  const stlPath    = path.join(STL_DIR, `${id}.stl`);
  const outputPath = path.join(RENDER_DIR, `${id}.png`);

  if (!fs.existsSync(stlPath)) return res.status(404).json({ error: 'STL not found' });

  const material      = req.body.material || 'pla';
  const color         = req.body.color    || null;
  const input2Id      = req.body.input2   || null;
  const color2        = req.body.color2   || null;
  const artistName    = req.body.artistName    || null;
  const songTitle     = req.body.songTitle     || null;
  const cylinderRadius = parseFloat(req.body.cylinderRadius) || 2.5;
  const baseHeight     = parseFloat(req.body.baseHeight)     || 1.2;

  const args = [
    '--background',
    '--python', RENDER_SCRIPT,
    '--',
    '--input',    stlPath,
    '--output',   outputPath,
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

  if (artistName || songTitle) {
    const baseStlPath = path.join(STL_DIR, `base_${id}.stl`);
    const baseRadius  = cylinderRadius + 0.5;

    const generateArgs = [
      GENERATE_BASE_SCRIPT,
      '--radius', String(baseRadius),
      '--height', String(baseHeight),
      '--artist', artistName || '',
      '--title',  songTitle  || '',
      '--output', baseStlPath,
    ];

    execFile('python3', generateArgs, { timeout: 60_000 }, (genErr) => {
      if (genErr) {
        console.error('generate_base error:', genErr.message);
      } else if (fs.existsSync(baseStlPath)) {
        args.push('--input3', baseStlPath);
        if (color && /^#[0-9a-fA-F]{6}$/.test(color)) args.push('--color3', color);
      }
      runBlender(args, id, res);
    });
  } else {
    runBlender(args, id, res);
  }
}

function getRenderStatus(req, res) {
  const outputPath = path.join(RENDER_DIR, `${req.params.id}.png`);
  if (!fs.existsSync(outputPath)) return res.status(404).json({ ready: false });
  res.json({ ready: true, renderUrl: `/renders/${req.params.id}.png` });
}

module.exports = { triggerRender, getRenderStatus };
