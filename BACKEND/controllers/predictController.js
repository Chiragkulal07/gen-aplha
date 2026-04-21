const mlService = require('../services/mlService');

/**
 * Handle prediction requests
 */
const handlePredict = async (req, res) => {
    try {
        const result = await mlService.getPrediction(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Handle manual training requests
 */
const handleManualTrain = async (req, res) => {
    try {
        const { dataset } = req.body;
        const result = await mlService.manualTrain(dataset);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    handlePredict,
    handleManualTrain
};
