const express = require('express');
const router = express.Router();
const {
  getPendingSignatures,
  submitSignature
} = require('../controllers/signatureController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/pending', getPendingSignatures);
router.post('/', submitSignature);

module.exports = router;

