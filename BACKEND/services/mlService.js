const { setTrainedModel, actions } = require('../data/memoryStorage');
const trainer = require('../../MLMODEL/trainer');

/**
 * Internal ML Training Trigger
 * This processes the current actions history and updates the trainedModel state.
 * It uses the core logic from the MLMODEL directory.
 */
const trainModel = async () => {
    console.log('🔄 [Internal ML] Starting training session using MLMODEL trainer...');
    
    // Simulate internal processing delay
    await new Promise(resolve => setTimeout(resolve, 200)); 

    // Call the logic strictly from MLMODEL folder
    const trainedOutput = trainer.train(actions);

    // Store the refined output in memory
    setTrainedModel(trainedOutput);
    
    console.log('✅ [Internal ML] Training complete. Consolidated model updated.');
    return trainedOutput;
};

/**
 * Service to interface with the ML model logic
 * Uses the trainedModel generated from MLMODEL trainer.
 */
const getPrediction = async (inputData) => {
    const { getTrainedModel } = require('../data/memoryStorage');
    const { time } = inputData;
    const model = getTrainedModel();

    console.log(`🔍 [Prediction] Request for time: ${time}`);

    // Edge case: No trained data or no matching time
    if (!model || !time || !model[time]) {
        return {
            light: "OFF",
            fan: "OFF",
            confidence: 0.5,
            reason: "No historical data available for this time. Defaulting to OFF."
        };
    }

    // Success case: Use matched data
    const prediction = model[time];
    const lightState = prediction.light || "OFF";
    const fanState = prediction.fan || "OFF";

    // AUTO MODE LOGIC: If enabled, update current device states automatically
    const { deviceState } = require('../data/memoryStorage');
    let autoReason = "";

    if (deviceState && deviceState.autoMode) {
        console.log('🤖 [Auto Mode] Applying predicted states to devices...');
        deviceState.light = (lightState === "ON");
        deviceState.fan = (fanState === "ON");
        autoReason = " (Auto Mode Applied)";
    }

    return {
        light: lightState,
        fan: fanState,
        confidence: 0.95,
        reason: `Based on historical majority at time: ${time}${autoReason}`
    };
};

const manualTrain = async (dataset) => {
    const { replaceActions } = require('../data/memoryStorage');
    
    if (dataset) {
        replaceActions(dataset);
    }

    const trainedModel = await trainModel();
    
    return {
        success: true,
        totalSamples: actions.length,
        trainedModelSummary: trainedModel,
        message: dataset ? 'Dataset replaced and training successful' : 'Training successful with current data'
    };
};

module.exports = {
    getPrediction,
    trainModel,
    manualTrain
};
