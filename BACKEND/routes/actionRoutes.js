const express = require('express');
const router = express.Router();
const actionController = require('../controllers/actionController');

// POST /action
router.post('/', actionController.handleAction);

module.exports = router;
