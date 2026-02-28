const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getCareWorkerDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  uploadCertificate,
  getCertificates,
  deleteCertificate
} = require('../controllers/documentsController');

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/care-worker/:id', getCareWorkerDocuments);
router.get('/care-worker/me', getCareWorkerDocuments);
router.get('/certificates/me', (req, res, next) => {
  req.params.id = 'me';
  next();
}, getCertificates);
router.get('/certificates/care-worker/:id', getCertificates);
router.post('/certificates', uploadCertificate);
router.delete('/certificates/:id', deleteCertificate);
router.get('/:id', getDocumentById);
router.post('/', uploadDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

module.exports = router;

