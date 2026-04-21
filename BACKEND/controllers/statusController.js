const statusService = require('../services/statusService');

/**
 * Handle status requests
 * Returns only the deviceState
 */
const handleStatus = async (req, res) => {
    try {
        const result = await statusService.getSystemStatus();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Handle Auto Mode toggle requests
 */
const handleToggleAuto = async (req, res) => {
    try {
        const result = await statusService.toggleAutoMode();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Handle Idle Detection requests
 */
const handleDeviceIdle = async (req, res) => {
    try {
        const result = await statusService.setDeviceIdle();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    handleStatus,
    handleToggleAuto,
    handleDeviceIdle
};
