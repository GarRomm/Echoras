const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const STL_DIR = path.join(__dirname, '..', '..', 'storage', 'stl');
const OBJ_DIR = path.join(__dirname, '..', '..', 'storage', 'obj');

function saveModel(req, res) {
  const id = uuidv4();
  const filePath = path.join(STL_DIR, `${id}.stl`);

  fs.writeFile(filePath, req.body, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to save model' });
    res.json({ id, file: `${id}.stl`, size: req.body.length });
  });
}

function getModel(req, res) {
  const filePath = path.join(STL_DIR, `${req.params.id}.stl`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Model not found' });
  res.download(filePath);
}

function deleteModel(req, res) {
  const stlPath = path.join(STL_DIR, `${req.params.id}.stl`);
  const objPath = path.join(OBJ_DIR, `${req.params.id}.obj`);

  [stlPath, objPath].forEach((p) => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  res.json({ deleted: req.params.id });
}

module.exports = { saveModel, getModel, deleteModel };
