const path = require('path');

function uploadAudio(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
  res.json({
    id: path.basename(req.file.filename, path.extname(req.file.filename)),
    originalName: req.file.originalname,
    size: req.file.size,
    path: req.file.filename,
  });
}

module.exports = { uploadAudio };
