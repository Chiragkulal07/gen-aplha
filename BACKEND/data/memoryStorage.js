/**
 * In-memory data storage for the backend.
 * Handled fully inside the backend with no external database.
 */

// 1. actions array
const actions = [];

// 2. deviceState object
const deviceState = {
    light: false,
    fan: false,
    autoMode: false
};

// 3. trainedModel storage (for ML output)
let trainedModel = null;

module.exports = {
    actions,
    deviceState,
    getTrainedModel: () => trainedModel,
    setTrainedModel: (model) => { trainedModel = model; },
    replaceActions: (newActions) => {
        actions.length = 0; // Clear the array
        if (Array.isArray(newActions)) {
            actions.push(...newActions);
        }
    }
};
