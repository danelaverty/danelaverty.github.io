// ShinynessCalculator.js - Pure shinyness calculation logic with shinynessReceiveMode support
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
     * NEW: Calculate modified energy contribution based on shinynessReceiveMode
     * @param {Array} energyEffects - Array of {energyType, amount, connectionMeta} objects
     * @param {string} shinynessReceiveMode - 'or', 'and', or 'explosiveAnd'
     * @returns {number} Modified energy contribution to shinyness
     */
    calculateModifiedEnergyShinyness(energyEffects, shinynessReceiveMode = 'or') {
        if (shinynessReceiveMode === 'or') {
            // Default behavior - use existing logic
            return this.calculateEnergyShinyness(energyEffects);
        }

        // Group effects by energy type and calculate modified amounts
        const exciterEffects = energyEffects.filter(e => e.energyType === 'exciter' || e.energyType === 'igniter');
        const dampenerEffects = energyEffects.filter(e => e.energyType === 'dampener');

        let totalContribution = 0;

        // Process exciter/igniter effects
        if (exciterEffects.length > 0) {
            const exciterContribution = this.calculateReceiveModeContribution(
                exciterEffects, 
                shinynessReceiveMode,
                this.config.exciterMultiplier,
                this.config.igniterMultiplier
            );
            totalContribution += exciterContribution;
        }

        // Process dampener effects
        if (dampenerEffects.length > 0) {
            const dampenerContribution = this.calculateReceiveModeContribution(
                dampenerEffects,
                shinynessReceiveMode,
                this.config.dampenerMultiplier
            );
            totalContribution += dampenerContribution;
        }

        return totalContribution;
    }

    /**
     * Calculate contribution for a specific energy type group based on receive mode
     * @param {Array} effects - Effects of the same energy type
     * @param {string} receiveMode - 'and' or 'explosiveAnd'
     * @param {number} baseMultiplier - Base multiplier for this energy type
     * @param {number} igniterMultiplier - Optional separate multiplier for igniters
     * @returns {number} Modified contribution
     */
    calculateReceiveModeContribution(effects, receiveMode, baseMultiplier, igniterMultiplier = null) {
        if (effects.length === 0) return 0;

        // Get total connected count from metadata (should be the same for all effects of this type)
        const totalConnected = effects.length > 0 ? (effects[0].connectionMeta?.totalConnected || effects.length) : 0;
        
        if (totalConnected === 0) return 0;

        // Calculate contribution per active effect
        let totalContribution = 0;
        let activeCount = 0;

        effects.forEach(effect => {
            if (effect.amount > 0) {
                activeCount++;
                const multiplier = (effect.energyType === 'igniter' && igniterMultiplier !== null) 
                    ? igniterMultiplier 
                    : baseMultiplier;
                
                // Each active effect contributes its scaled amount
                const effectContribution = effect.amount * multiplier;
                
                if (receiveMode === 'and') {
                    // Each active effect contributes 1/totalConnected of its normal amount
                    totalContribution += effectContribution / totalConnected;
                } else if (receiveMode === 'explosiveAnd') {
                    if (activeCount === totalConnected) {
                        // All connected circles are active - this effect contributes full amount
                        totalContribution += effectContribution;
                    } else {
                        // Partial effect - this effect contributes 1/(2*totalConnected) of normal
                        totalContribution += effectContribution / (2 * totalConnected);
                    }
                } else {
                    // Default 'or' behavior
                    totalContribution += effectContribution;
                }
            }
        });

        // For explosiveAnd, we need to check if ALL are active after processing
        if (receiveMode === 'explosiveAnd' && activeCount === totalConnected && activeCount > 0) {
            // Recalculate with full contribution for all effects
            totalContribution = 0;
            effects.forEach(effect => {
                if (effect.amount > 0) {
                    const multiplier = (effect.energyType === 'igniter' && igniterMultiplier !== null) 
                        ? igniterMultiplier 
                        : baseMultiplier;
                    totalContribution += effect.amount * multiplier;
                }
            });
        }

        return totalContribution;
    }

    /**
     * Calculate net shinyness from activation and energy effects with receive mode support
     * @param {string} activation - Entity activation state
     * @param {Array} energyEffects - Array of energy effects
     * @param {string} shinynessReceiveMode - How the entity receives shinyness ('or', 'and', 'explosiveAnd')
     * @returns {Object} {base, energy, net, effectBreakdown} shinyness values
     */
    calculateNetShinyness(activation, energyEffects = [], shinynessReceiveMode = 'or') {
        const base = this.calculateBaseShinyness(activation);
        const energy = this.calculateModifiedEnergyShinyness(energyEffects, shinynessReceiveMode);
        const net = base + energy;
        
        // Calculate individual effect contributions for display purposes
        const effectBreakdown = this.calculateEffectBreakdown(energyEffects, shinynessReceiveMode);
        
        return { 
            base, 
            energy, 
            net,
            receiveMode: shinynessReceiveMode,
            receiveModeApplied: shinynessReceiveMode !== 'or' && energyEffects.length > 0,
            effectBreakdown
        };
    }

    /**
     * Calculate individual effect contributions for display purposes
     * @param {Array} energyEffects - Array of {energyType, amount, connectionMeta} objects
     * @param {string} shinynessReceiveMode - 'or', 'and', or 'explosiveAnd'
     * @returns {Array} Array of {energyType, originalAmount, modifiedAmount, multiplier} objects
     */
    calculateEffectBreakdown(energyEffects, shinynessReceiveMode = 'or') {
        if (shinynessReceiveMode === 'or') {
            // Default behavior - use existing logic
            return energyEffects.map(effect => ({
                energyType: effect.energyType,
                originalAmount: effect.amount,
                modifiedAmount: this.getBaseMultiplier(effect.energyType) * effect.amount,
                multiplier: this.getBaseMultiplier(effect.energyType),
                receiveModifier: 1.0
            }));
        }

        // Group effects by energy type
        const exciterEffects = energyEffects.filter(e => e.energyType === 'exciter' || e.energyType === 'igniter');
        const dampenerEffects = energyEffects.filter(e => e.energyType === 'dampener');

        const breakdown = [];

        // Process exciter/igniter effects
        if (exciterEffects.length > 0) {
            const totalConnected = exciterEffects.length > 0 ? 
                (exciterEffects[0].connectionMeta?.totalConnected || exciterEffects.length) : 0;
            const activeCount = exciterEffects.filter(e => e.amount > 0).length;
            
            exciterEffects.forEach(effect => {
                if (effect.amount > 0) {
                    const baseMultiplier = this.getBaseMultiplier(effect.energyType);
                    const originalContribution = effect.amount * baseMultiplier;
                    
                    let receiveModifier = 1.0;
                    if (shinynessReceiveMode === 'and') {
                        receiveModifier = 1.0 / totalConnected;
                    } else if (shinynessReceiveMode === 'explosiveAnd') {
                        receiveModifier = (activeCount === totalConnected) ? 1.0 : (1.0 / (2 * totalConnected));
                    }
                    
                    breakdown.push({
                        energyType: effect.energyType,
                        originalAmount: effect.amount,
                        modifiedAmount: originalContribution * receiveModifier,
                        multiplier: baseMultiplier,
                        receiveModifier
                    });
                }
            });
        }

        // Process dampener effects
        if (dampenerEffects.length > 0) {
            const totalConnected = dampenerEffects.length > 0 ? 
                (dampenerEffects[0].connectionMeta?.totalConnected || dampenerEffects.length) : 0;
            const activeCount = dampenerEffects.filter(e => e.amount > 0).length;
            
            dampenerEffects.forEach(effect => {
                if (effect.amount > 0) {
                    const baseMultiplier = this.getBaseMultiplier(effect.energyType);
                    const originalContribution = effect.amount * baseMultiplier;
                    
                    let receiveModifier = 1.0;
                    if (shinynessReceiveMode === 'and') {
                        receiveModifier = 1.0 / totalConnected;
                    } else if (shinynessReceiveMode === 'explosiveAnd') {
                        receiveModifier = (activeCount === totalConnected) ? 1.0 : (1.0 / (2 * totalConnected));
                    }
                    
                    breakdown.push({
                        energyType: effect.energyType,
                        originalAmount: effect.amount,
                        modifiedAmount: originalContribution * receiveModifier,
                        multiplier: baseMultiplier,
                        receiveModifier
                    });
                }
            });
        }

        return breakdown;
    }

    /**
     * Get base multiplier for an energy type
     * @param {string} energyType - 'exciter', 'igniter', or 'dampener'
     * @returns {number} Base multiplier
     */
    getBaseMultiplier(energyType) {
        switch (energyType) {
            case 'exciter':
                return this.config.exciterMultiplier;
            case 'igniter':
                return this.config.igniterMultiplier;
            case 'dampener':
                return this.config.dampenerMultiplier;
            default:
                return 1;
        }
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
