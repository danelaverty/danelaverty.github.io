// EnergyAggregator.js - Pure energy calculation logic
export class EnergyAggregator {
    /**
     * Calculate the net exciter effect from multiple sources
     * @param {Array} exciterEffects - Array of {influence: number, isIgniter: boolean}
     * @returns {Object} {netExciterEffect, hasNearbyExciter, hasIgniterAtMaxEffect}
     */
    calculateNetExciterEffect(exciterEffects) {
        let netExciterEffect = 0;
        let hasNearbyExciter = exciterEffects.length > 0;
        let hasIgniterAtMaxEffect = false;

        exciterEffects.forEach(effect => {
            netExciterEffect = Math.max(netExciterEffect, effect.influence);
            
            if (effect.isIgniter && effect.influence >= 1.0) {
                hasIgniterAtMaxEffect = true;
            }
        });

        return { netExciterEffect, hasNearbyExciter, hasIgniterAtMaxEffect };
    }

    /**
     * Calculate the net dampener effect from multiple sources
     * @param {Array} dampenerEffects - Array of {influence: number}
     * @returns {Object} {netDampenerEffect, hasNearbyDampener}
     */
    calculateNetDampenerEffect(dampenerEffects) {
        let netDampenerEffect = 0;
        let hasNearbyDampener = dampenerEffects.length > 0;

        dampenerEffects.forEach(effect => {
            netDampenerEffect = Math.max(netDampenerEffect, effect.influence);
        });

        return { netDampenerEffect, hasNearbyDampener };
    }

    /**
     * Calculate net energy effect from exciters and dampeners
     * @param {Array} exciterEffects 
     * @param {Array} dampenerEffects 
     * @returns {Object} Combined energy analysis
     */
    calculateNetEnergyEffect(exciterEffects, dampenerEffects) {
        const exciterResult = this.calculateNetExciterEffect(exciterEffects);
        const dampenerResult = this.calculateNetDampenerEffect(dampenerEffects);
        
        const netEffect = exciterResult.netExciterEffect - dampenerResult.netDampenerEffect;
        
        return {
            ...exciterResult,
            ...dampenerResult,
            netEffect,
            hasAnyInfluencer: exciterResult.hasNearbyExciter || dampenerResult.hasNearbyDampener
        };
    }

    /**
     * Create effect objects from different sources
     */
    createExciterEffectFromProximity(proximityStrength, isIgniter = false, config = { minScale: 1.0, maxScale: 1.01 }) {
        const influence = (proximityStrength - config.minScale) / (config.maxScale - config.minScale);
        
        return {
            influence,
            isIgniter,
            isMaxEffect: influence >= 1.0,
            source: 'proximity'
        };
    }

    createExciterEffectFromConnection(isIgniter = false) {
        return {
            influence: 1.0,
            isIgniter,
            isMaxEffect: true,
            source: 'explicit'
        };
    }

    createDampenerEffectFromProximity(proximityStrength, config = { minScale: 1.0, maxScale: 1.01 }) {
        const influence = (proximityStrength - config.minScale) / (config.maxScale - config.minScale);
        
        return {
            influence,
            source: 'proximity'
        };
    }

    createDampenerEffectFromConnection() {
        return {
            influence: 1.0,
            source: 'explicit'
        };
    }
}
