const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  importCareWorkers,
  exportCareWorkers
} = require('../controllers/importExportController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

router.post('/import-care-workers', upload.single('file'), importCareWorkers);
router.get('/export-care-workers', exportCareWorkers);

module.exports = router;

