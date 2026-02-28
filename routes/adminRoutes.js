const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/adminController');
const { getAssignedFormsStatus } = require('../controllers/formProgressController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

router.get('/dashboard', getDashboard);

// Form status tracking route
router.get('/forms/assigned-status', getAssignedFormsStatus);

module.exports = router;

