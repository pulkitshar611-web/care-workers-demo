const express = require('express');
const router = express.Router();
const {
  getAllCareWorkers,
  getCareWorkerById,
  createCareWorker,
  updateCareWorker,
  deleteCareWorker
} = require('../controllers/careWorkerController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

router.get('/', getAllCareWorkers);
router.get('/:id', getCareWorkerById);
router.post('/', createCareWorker);
router.put('/:id', updateCareWorker);
router.delete('/:id', deleteCareWorker);

module.exports = router;

