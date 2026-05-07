const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50) * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Format audio non supporte : ${ext}`));
  }
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });
