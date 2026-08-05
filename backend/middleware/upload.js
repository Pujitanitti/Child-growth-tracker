const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new AppError('Only JPG, PNG, or WEBP images are allowed', 400));
  }
  cb(null, true);
};

const csvFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.csv') {
    return cb(new AppError('Only .csv files are allowed for import', 400));
  }
  cb(null, true);
};

const maxSizeBytes = Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024;

const uploadPhoto = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: maxSizeBytes },
}).single('photo');

const uploadCsv = multer({
  storage,
  fileFilter: csvFileFilter,
  limits: { fileSize: maxSizeBytes },
}).single('file');

module.exports = { uploadPhoto, uploadCsv, UPLOAD_DIR };
