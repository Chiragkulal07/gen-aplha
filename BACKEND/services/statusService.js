const { deviceState } = require('../data/memoryStorage');

/**
 * Service to check system status
 * Returns only the current deviceState as per specific requirements
 */
const getSystemStatus = async () => {
    return deviceState;
};

/**
 * Service to toggle Auto Mode state
 */
const toggleAutoMode = async () => {
    if (deviceState) {
        deviceState.autoMode = !deviceState.autoMode;
        console.log(`📡 [Status Service] Auto Mode toggled to: ${deviceState.autoMode}`);
    }
    return deviceState;
};

/**
 * Service to set devices to idle (OFF)
 */
const setDeviceIdle = async () => {
    if (deviceState) {
        deviceState.light = false;
        deviceState.fan = false;
        console.log('💤 [Status Service] Idle detected. Devices turned OFF.');
    }
    return deviceState;
};

module.exports = {
    getSystemStatus,
    toggleAutoMode,
    setDeviceIdle
};
