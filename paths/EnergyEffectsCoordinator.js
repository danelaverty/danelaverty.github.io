// EnergyEffectsCoordinator.js - Orchestrates the three systems with circle type awareness and shinynessReceiveMode support
import { EnergyAggregator } from './EnergyAggregator.js';
import { EnergyIgnitionStateManager } from './EnergyIgnitionStateManager.js';
import { ShinynessCalculator } from './ShinynessCalculator.js';
import { VisualEffectsCalculator } from './VisualEffectsCalculator.js';


export class EnergyEffectsCoordinator {
    constructor(dataStore, config = {}) {
        this.aggregator = new EnergyAggregator();
        this.shinynessCalculator = new ShinynessCalculator(config);
        this.visualEffectsCalculator = new VisualEffectsCalculator(config);
        this.stateManager = new EnergyIgnitionStateManager(dataStore);
    }

    /**
     * Convert energy effects to shinyness format with connection metadata
     * @param {Array} exciterEffects - Array of exciter effects from aggregator
     * @param {Array} dampenerEffects - Array of dampener effects from aggregator
     * @returns {Array} Combined effects in shinyness format with metadata
     */
    convertToShinynessFormat(exciterEffects, dampenerEffects) {
        const shinynessEffects = [];
        
        // Convert exciter effects
        exciterEffects.forEach(effect => {
            const energyType = effect.isIgniter ? 'igniter' : 'exciter';
            shinynessEffects.push({
                energyType: energyType,
                amount: effect.influence,
                connectionMeta: effect.connectionMeta // Pass through metadata for receive mode calculations
            });
        });
        
        // Convert dampener effects
        dampenerEffects.forEach(effect => {
            shinynessEffects.push({
                energyType: 'dampener',
                amount: effect.influence,
                connectionMeta: effect.connectionMeta // Pass through metadata for receive mode calculations
            });
        });
        
        return shinynessEffects;
    }

    calculateEnergyEffects(params) {
        const { targetCircle, exciterEffects, dampenerEffects } = params;
        
        if (!this.stateManager.canBeAffected(targetCircle)) {
            return null;
        }

        const energyData = this.aggregator.calculateNetEnergyEffect(exciterEffects, dampenerEffects);
        
        if (!energyData.hasAnyInfluencer) {
            return null;
        }

        // Convert energy effects to shinyness format with metadata
        const energyEffectsForShinyness = this.convertToShinynessFormat(exciterEffects, dampenerEffects);
        
        // Get the target circle's shinynessReceiveMode (default to 'or')
        const shinynessReceiveMode = targetCircle.shinynessReceiveMode || 'or';
        
        // Calculate shinyness with receive mode support
        const shinynessResult = this.shinynessCalculator.calculateNetShinyness(
            targetCircle.activation, 
            energyEffectsForShinyness,
            shinynessReceiveMode
        );
        
        // Calculate visual effects from shinyness, passing circle type to respect scaling rules
        const visualEffects = this.visualEffectsCalculator.calculateVisualEffects(
            shinynessResult.net, 
            targetCircle.type
        );
        
        const shouldIgnite = this.stateManager.shouldIgnite(targetCircle, energyData);
        
        return {
            circleId: targetCircle.id,
            ...visualEffects,
            shouldIgnite,
            shinyness: shinynessResult,
            energyData // Keep for debugging during transition
        };
    }

    // Delegate effect creation methods using VisualEffectsCalculator's config
    createExciterEffectFromProximity(proximityStrength, isIgniter = false) {
        return this.aggregator.createExciterEffectFromProximity(proximityStrength, isIgniter, this.visualEffectsCalculator.config);
    }

    createExciterEffectFromConnection(isIgniter = false) {
        return this.aggregator.createExciterEffectFromConnection(isIgniter);
    }

    createDampenerEffectFromProximity(proximityStrength) {
        return this.aggregator.createDampenerEffectFromProximity(proximityStrength, this.visualEffectsCalculator.config);
    }

    createDampenerEffectFromConnection() {
        return this.aggregator.createDampenerEffectFromConnection();
    }
}
