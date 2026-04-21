/**
 * ML Training Logic
 * Group by time, count ON vs OFF per device, and output majority state.
 */

const train = (actions) => {
    if (!actions || actions.length === 0) return {};

    // 1. Group by time
    const groupedByTime = actions.reduce((acc, curr) => {
        const timeKey = curr.time || 'unknown';
        if (!acc[timeKey]) acc[timeKey] = {};
        if (!acc[timeKey][curr.device]) acc[timeKey][curr.device] = { ON: 0, OFF: 0 };
        
        // Handle various action representations
        const isOn = (curr.action === 'on' || curr.action === true || curr.action === 1 || curr.action === 'true');
        if (isOn) {
            acc[timeKey][curr.device].ON++;
        } else {
            acc[timeKey][curr.device].OFF++;
        }
        return acc;
    }, {});

    // 2. Determine majority status per time bucket
    const trainedModel = {};
    for (const time in groupedByTime) {
        trainedModel[time] = {};
        for (const device in groupedByTime[time]) {
            const counts = groupedByTime[time][device];
            trainedModel[time][device] = counts.ON >= counts.OFF ? "ON" : "OFF";
        }
    }

    return trainedModel;
};

module.exports = {
    train
};
