const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly } = require('../middleware/auth');
const {
  getAllPayroll,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll
} = require('../controllers/payrollController');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(adminOnly);

// Routes
router.get('/', getAllPayroll);
router.get('/:id', getPayrollById);
router.post('/', createPayroll);
router.put('/:id', updatePayroll);
router.delete('/:id', deletePayroll);

module.exports = router;

