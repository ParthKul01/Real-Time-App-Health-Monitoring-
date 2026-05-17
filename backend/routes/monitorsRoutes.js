const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const monitorsController = require('../controllers/monitorsController');

// All monitor routes are protected — user must be logged in
router.get('/', protect, monitorsController.getMonitors);
router.post('/', protect, monitorsController.createMonitor);
router.delete('/:id', protect, monitorsController.deleteMonitor);

module.exports = router;
