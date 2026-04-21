const { actions, deviceState } = require('../data/memoryStorage');
const mlService = require('./mlService');

/**
 * Service to handle business logic for actions
 * Handles rapid requests safely by using non-blocking updates and backgrounded training.
 */
const performAction = async (actionData) => {
    // 1. Accept specific fields
    const { time, device, action } = actionData;
    
    // 2. Add internal timestamp
    const entry = {
        time: time || new Date().toLocaleTimeString(),
        device: device || 'unknown',
        action: action || 'none',
        timestamp: Date.now() // Internal timestamp
    };

    // 3. Store action in memory
    actions.push(entry);

    // 4. Update deviceState
    if (device && deviceState.hasOwnProperty(device)) {
        // Handle various 'on'/'off' representations
        const isOn = (action === 'on' || action === true || action === 1 || action === 'true');
        deviceState[device] = isOn;
    }

    // 5. Trigger ML training internally (Backgrounded)
    // We don't 'await' it here to ensure the response is rapid and handles concurrency well
    mlService.trainModel().catch(err => console.error('ML Training Error:', err));

    console.log('Processed action:', entry);
    
    // 6. Return updated device state
    return deviceState;
};

module.exports = {
    performAction
};
