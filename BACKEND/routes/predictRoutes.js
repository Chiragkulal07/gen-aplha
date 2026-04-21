const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');

// POST /predict
router.post('/', predictController.handlePredict);

// POST /predict/train
router.post('/train', predictController.handleManualTrain);

module.exports = router;
