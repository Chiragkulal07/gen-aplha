const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

// GET /status
router.get('/', statusController.handleStatus);

// POST /status/auto
router.post('/auto', statusController.handleToggleAuto);

// POST /status/idle
router.post('/idle', statusController.handleDeviceIdle);

module.exports = router;
