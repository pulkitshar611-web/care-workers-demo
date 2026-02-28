const express = require('express');
const router = express.Router();
const {
  assignForms,
  getCareWorkerAssignments,
  updateFormAssignment
} = require('../controllers/formAssignmentController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Assign forms (Admin only)
router.post('/', requireAdmin, assignForms);

// Get assignments for Kiaan Technology
router.get('/care-worker/:id', getCareWorkerAssignments);

// Update assignment (Kiaan Technology or Admin)
router.put('/:id', updateFormAssignment);

module.exports = router;

