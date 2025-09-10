// EnergyIgnitionStateManager.js - Handle activation states and ignition logic
export class EnergyIgnitionStateManager {
    constructor(dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * Check if a circle should be ignited based on energy conditions
     * @param {Object} circle - The target circle
     * @param {Object} energyData - Result from EnergyAggregator
     * @returns {boolean} Whether ignition should occur
     */
    shouldIgnite(circle, energyData) {
        const isCurrentlyActivated = circle.activation === 'activated';
        
        return !isCurrentlyActivated && 
               energyData.hasIgniterAtMaxEffect && 
               energyData.netExciterEffect >= 1.0;
    }

    /**
     * Activate a circle (ignite it)
     * @param {string} circleId 
     * @returns {boolean} Success status
     */
    igniteCircle(circleId) {
        if (this.dataStore && this.dataStore.updateCircle) {
            this.dataStore.updateCircle(circleId, { activation: 'activated' });
            return true;
        }
        return false;
    }

    /**
     * Get the appropriate base scale for a circle based on its activation state
     * @param {Object} circle 
     * @param {Object} config 
     * @returns {number} Base scale value
     */
    getBaseScale(circle, config = { maxScale: 1.01 }) {
        const isActivated = circle.activation === 'activated';
        return isActivated ? config.maxScale : 0.7;
    }

    /**
     * Check if a circle can be affected by energy (not inert)
     * @param {Object} circle 
     * @returns {boolean}
     */
    canBeAffected(circle) {
        return circle && circle.activation !== 'inert';
    }
}
