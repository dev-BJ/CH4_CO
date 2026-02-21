/**
 * Calculates the Calibration Factor (Z) based on a 420ppm standard.
 * @param {number} yMeasured - The raw ppm reading from the sensor in a clean area.
 * @returns {object} An object containing X (percentage) and Z (multiplier).
 */
function calculateCalibration(yMeasured: number): { x: string; z: string; explanation: string } {
    const globalStandardPpm = 420;
    const globalStandardPercent = 0.042;

    // 1. Solve for X (The percentage equivalent of your measured Y)
    // Using the logic: 0.042 / 420 = X / Y
    const xPercentage = (globalStandardPercent * yMeasured) / globalStandardPpm;

    // 2. Solve for Z (The Normalization Factor)
    // Using the logic: Z = X / 0.042
    const zFactor = xPercentage / globalStandardPercent;

    return {
        x: xPercentage.toFixed(4), // Scaled percentage
        z: zFactor.toFixed(4),     // The multiplier for your code
        explanation: `Multiply raw data by ${zFactor.toFixed(4)} to calibrate.`
    };
}

export { calculateCalibration };

// EXAMPLE USE CASE:
// If you go outside and your sensor reads 1260ppm (which is too high)
// const calibrationResult = calculateCalibration(1260);

// console.log("Calculated X:", calibrationResult.x + "%");
// console.log("Calibration Factor (Z):", calibrationResult.z);
