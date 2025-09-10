// ShinynessCalculator.js - Pure shinyness calculation logic (no visual effects)
export class ShinynessCalculator {
    constructor(config = {}) {
        this.config = {
            // Base shinyness values for activation states
            activatedBase: 1,
            inactiveBase: -1,
            inertBase: 0,
            
            // Energy type multipliers for shinyness contribution
            exciterMultiplier: 2,
            igniterMultiplier: 2,
            dampenerMultiplier: -2,
            
            ...config
        };
    }

    /**
     * Calculate base shinyness from activation status
     * @param {string} activation - 'activated', 'inactive', or 'inert'
     * @returns {number} Base shinyness value
     */
    calculateBaseShinyness(activation) {
        const activationMap = {
            'activated': this.config.activatedBase,
            'inactive': this.config.inactiveBase,
            'inert': this.config.inertBase
        };
        return activationMap[activation] || 0;
    }

    /**
     * Calculate energy contribution to shinyness from energy effects
     * @param {Array} energyEffects - Array of {energyType, amount} objects
     * @returns {number} Energy contribution to shinyness
     */
    calculateEnergyShinyness(energyEffects) {
        let energyContribution = 0;
        
        energyEffects.forEach(effect => {
            switch (effect.energyType) {
                case 'exciter':
                    energyContribution += effect.amount * this.config.exciterMultiplier;
                    break;
                case 'igniter':
                    energyContribution += effect.amount * this.config.igniterMultiplier;
                    break;
                case 'dampener':
                    energyContribution += effect.amount * this.config.dampenerMultiplier;
                    break;
            }
        });
        
        return energyContribution;
    }

    /**
     * Calculate net shinyness from activation and energy effects
     * @param {string} activation - Entity activation state
     * @param {Array} energyEffects - Array of energy effects
     * @returns {Object} {base, energy, net} shinyness values
     */
    calculateNetShinyness(activation, energyEffects = []) {
        const base = this.calculateBaseShinyness(activation);
        const energy = this.calculateEnergyShinyness(energyEffects);
        const net = base + energy;
        
        return { base, energy, net };
    }

    /**
     * Format shinyness value for display
     * @param {number} value - Shinyness value
     * @returns {string} Formatted display string
     */
    formatShinynessValue(value) {
        return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
    }

    /**
     * Get CSS class for shinyness value styling
     * @param {number} value - Shinyness value
     * @returns {string} CSS class name
     */
    getShinynessClass(value) {
        if (value > 0) return 'shinyness-positive';
        if (value < 0) return 'shinyness-negative';
        return 'shinyness-neutral';
    }
}
