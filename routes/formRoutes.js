const express = require('express');
const router = express.Router();
const {
  getAllForms,
  getTemplateForms,
  getClientForms,
  getFormById,
  getSubmittedForms,
  createForm,
  updateForm,
  deleteForm
} = require('../controllers/formController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get template forms (Admin → Forms / Templates)
// GET /api/forms/templates
router.get('/templates', authenticate, requireAdmin, getTemplateForms);

// Get client forms (Admin → Clients)
// GET /api/forms/clients
router.get('/clients', authenticate, requireAdmin, getClientForms);

// Get submitted forms (Admin → Forms / Templates → Submitted tab)
// GET /api/forms/submissions
router.get('/submissions', authenticate, requireAdmin, getSubmittedForms);

// Get all forms - kept for backward compatibility
// GET /api/forms
router.get('/', authenticate, requireAdmin, getAllForms);

// Get single form by ID
// GET /api/forms/:id
router.get('/:id', authenticate, getFormById);

// Admin only routes
router.post('/', authenticate, requireAdmin, createForm);
router.put('/:id', authenticate, requireAdmin, updateForm);
router.delete('/:id', authenticate, requireAdmin, deleteForm);

module.exports = router;

