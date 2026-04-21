const actionService = require('../services/actionService');

/**
 * Handle action requests
 */
const handleAction = async (req, res) => {
    try {
        const result = await actionService.performAction(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    handleAction
};
