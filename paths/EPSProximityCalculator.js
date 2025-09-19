export class EPSProximityCalculator {
    constructor(calculator, circleManager) {
        this.calculator = calculator; // EnergyEffectsCoordinator
        this.circleManager = circleManager;
    }

    /**
     * Calculate distance between two positions
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate proximity strength based on distance
     */
    calculateProximityStrength(distance) {
        const config = this.calculator.visualEffectsCalculator.config;
        if (distance > config.maxDistance) {
            return config.minScale;
        }
        
        if (distance < config.minDistance) {
            return config.maxScale;
        }
        
        // Linear interpolation between min and max proximity strength
        const normalizedDistance = (distance - config.minDistance) / 
                                  (config.maxDistance - config.minDistance);
        
        return config.maxScale - (normalizedDistance * (config.maxScale - config.minScale));
    }

    /**
     * Check if a viewer has any energy influencers (exciters or dampeners)
     */
    hasEnergyInfluencers(exciterCircles, dampenerCircles) {
        return exciterCircles.length > 0 || dampenerCircles.length > 0;
    }

    /**
     * Calculate the net exciter effect on a glow circle from all nearby exciters (proximity only)
     * Returns effect objects compatible with the shared calculator
     */
    calculateProximityExciterEffects(glowPos, exciterCircles, glowCircleId) {
        const config = this.calculator.visualEffectsCalculator.config;
        const effects = [];

        exciterCircles.forEach(exciterData => {
            // Skip if it's the same circle
            if (glowCircleId === exciterData.circle.id) return;

            const exciterPos = this.circleManager.getEffectivePosition(exciterData.circle.id);
            if (!exciterPos) return;

            const distance = this.calculateDistance(glowPos, exciterPos);
            if (distance <= config.maxDistance) {
                const proximityStrength = this.calculateProximityStrength(distance);
                const isIgniter = this.circleManager.hasEnergyType(exciterData.circle, 'igniter');
                
                const effect = this.calculator.createExciterEffectFromProximity(proximityStrength, isIgniter);
                effect.sourceCircleId = exciterData.circle.id;
                effects.push(effect);
            }
        });

        return effects;
    }

    /**
     * Calculate the net dampener effect on a glow circle from all nearby dampeners (proximity only)
     * Returns effect objects compatible with the shared calculator
     */
    calculateProximityDampenerEffects(glowPos, dampenerCircles, glowCircleId) {
        const config = this.calculator.visualEffectsCalculator.config;
        const effects = [];

        dampenerCircles.forEach(dampenerData => {
            // Skip if it's the same circle
            if (glowCircleId === dampenerData.circle.id) return;

            const dampenerPos = this.circleManager.getEffectivePosition(dampenerData.circle.id);
            if (!dampenerPos) return;

            const distance = this.calculateDistance(glowPos, dampenerPos);
            if (distance <= config.maxDistance) {
                const proximityStrength = this.calculateProximityStrength(distance);
                
                const effect = this.calculator.createDampenerEffectFromProximity(proximityStrength);
                effect.sourceCircleId = dampenerData.circle.id;
                effects.push(effect);
            }
        });

        return effects;
    }

    /**
     * Process a single glow circle with separated proximity and explicit effects
     */
    processGlowCircle(glowData, exciterCircles, dampenerCircles, explicitEffectsGetter) {
        const config = this.calculator.visualEffectsCalculator.config;
        if (glowData.circle.activation == 'inert') return;
        
        const glowPos = this.circleManager.getEffectivePosition(glowData.circle.id);
        if (!glowPos) return null;
        
        const isActivated = this.circleManager.isCircleActivated(glowData.circle);
        const baseScale = isActivated ? config.maxScale : 0.7;
        
        // Calculate proximity effects (high frequency)
        const proximityExciterEffects = this.calculateProximityExciterEffects(
            glowPos, exciterCircles, glowData.circle.id
        );
        const proximityDampenerEffects = this.calculateProximityDampenerEffects(
            glowPos, dampenerCircles, glowData.circle.id
        );
        
        // Get explicit connection effects
        const explicitEffects = explicitEffectsGetter(glowData.circle.id, glowData.viewerId, null);
        
        // Combine proximity and explicit effects
        const allExciterEffects = [...proximityExciterEffects, ...explicitEffects.exciterEffects];
        const allDampenerEffects = [...proximityDampenerEffects, ...explicitEffects.dampenerEffects];
        
        // Only apply effect if there's any influencer (proximity or explicit)
        if (allExciterEffects.length === 0 && allDampenerEffects.length === 0) {
            return null;
        }
        
        // Use shared calculator to determine final effects
        return this.calculator.calculateEnergyEffects({
            targetCircle: glowData.circle,
            exciterEffects: allExciterEffects,
            dampenerEffects: allDampenerEffects,
            baseScale
        });
    }

    /**
     * Process a glow circle with depth-limited explicit effects
     */
    processGlowCircleWithDepth(glowData, exciterCircles, dampenerCircles, explicitEffectsGetter, maxDepth) {
        const config = this.calculator.visualEffectsCalculator.config;
        if (glowData.circle.activation == 'inert') return;
        
        const glowPos = this.circleManager.getEffectivePosition(glowData.circle.id);
        if (!glowPos) return null;
        
        const isActivated = this.circleManager.isCircleActivated(glowData.circle);
        const baseScale = isActivated ? config.maxScale : 0.7;
        
        // Calculate proximity effects (high frequency)
        const proximityExciterEffects = this.calculateProximityExciterEffects(
            glowPos, exciterCircles, glowData.circle.id
        );
        const proximityDampenerEffects = this.calculateProximityDampenerEffects(
            glowPos, dampenerCircles, glowData.circle.id
        );
        
        // Get explicit connection effects limited by depth
        const explicitEffects = explicitEffectsGetter(glowData.circle.id, glowData.viewerId, maxDepth);
        
        // Combine proximity and explicit effects
        const allExciterEffects = [...proximityExciterEffects, ...explicitEffects.exciterEffects];
        const allDampenerEffects = [...proximityDampenerEffects, ...explicitEffects.dampenerEffects];
        
        // Only apply effect if there's any influencer (proximity or explicit)
        if (allExciterEffects.length === 0 && allDampenerEffects.length === 0) {
            return null;
        }
        
        // Use shared calculator to determine final effects
        return this.calculator.calculateEnergyEffects({
            targetCircle: glowData.circle,
            exciterEffects: allExciterEffects,
            dampenerEffects: allDampenerEffects,
            baseScale
        });
    }
}
