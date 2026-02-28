const express = require('express');
const router = express.Router();
const { getCareWorkerDashboard } = require('../controllers/careWorkerDashboardController');
const {
  updateFormProgress,
  saveFormDraft,
  submitForm,
  signForm
} = require('../controllers/formProgressController');
const { authenticate, requireCareWorker } = require('../middleware/auth');

// All routes require Kiaan Technology authentication
router.use(authenticate);
router.use(requireCareWorker);

router.get('/dashboard', getCareWorkerDashboard);

// Form progress tracking routes
router.put('/forms/update-progress', updateFormProgress);
router.put('/forms/save-draft', saveFormDraft);
router.post('/forms/submit', submitForm);
router.post('/forms/sign', signForm);

module.exports = router;

