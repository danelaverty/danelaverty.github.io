// VisualEffectsCalculator.js - Converts any driver value to visual effects with circle type awareness
export class VisualEffectsCalculator {
    constructor(config = {}) {
        this.config = {
            // Visual effect ranges
            maxScale: 1.3,
            minScale: 0.7,
            maxOpacity: 1.0,
            minOpacity: 0.5,
            maxSaturation: 1.0,
            minSaturation: 0.3,
            
            // Legacy proximity system compatibility
            maxDistance: 80,
            minDistance: 50,
            inactiveOpacity: 0.4,
            transitionDuration: '0.3s',
            
            // Driver value mapping ranges (currently shinyness, but configurable)
            maxDriverValue: 1,    // Maximum expected driver value
            minDriverValue: -1,   // Minimum expected driver value
            neutralDriverValue: 0, // Neutral driver value
            
            // Circle types that should not receive scale effects
            noScaleCircleTypes: ['emoji', 'group'],
            //noScaleCircleTypes: ['group'],
            
            ...config
        };
    }

    /**
     * Check if a circle type should receive scale effects
     * @param {string} circleType - The type of circle (e.g., 'basic', 'emoji', 'group')
     * @returns {boolean} True if scale effects should be applied
     */
    shouldApplyScale(circleType) {
        return !this.config.noScaleCircleTypes.includes(circleType);
    }

    /**
     * Convert driver value (e.g., shinyness) to scale factor
     * @param {number} driverValue - The input value that drives visual effects
     * @param {string} circleType - The type of circle (optional, defaults to applying scale)
     * @returns {number} Scale factor for visual rendering
     */
    driverValueToScale(driverValue, circleType = null) {
        // If circle type is specified and shouldn't receive scale effects, return 1.0
        if (circleType && !this.shouldApplyScale(circleType)) {
            return 1.0;
        }
        
        const clampedValue = Math.max(this.config.minDriverValue, 
                                    Math.min(this.config.maxDriverValue, driverValue));
        
        // Map driver value range to scale range
        const normalizedValue = (clampedValue - this.config.minDriverValue) / 
                               (this.config.maxDriverValue - this.config.minDriverValue);
        
        return this.config.minScale + (normalizedValue * (this.config.maxScale - this.config.minScale));
    }

    /**
     * Convert driver value to opacity factor
     * @param {number} driverValue - The input value that drives visual effects
     * @returns {number} Opacity factor for visual rendering
     */
    driverValueToOpacity(driverValue) {
        const clampedValue = Math.max(this.config.minDriverValue, 
                                    Math.min(this.config.maxDriverValue, driverValue));
        
        // Map driver value range to opacity range
        const normalizedValue = (clampedValue - this.config.minDriverValue) / 
                               (this.config.maxDriverValue - this.config.minDriverValue);
        
        return this.config.minOpacity + (normalizedValue * (this.config.maxOpacity - this.config.minOpacity));
    }

    /**
     * Convert driver value to saturation factor
     * @param {number} driverValue - The input value that drives visual effects
     * @returns {number} Saturation factor for visual rendering
     */
    driverValueToSaturation(driverValue) {
        const clampedValue = Math.max(this.config.minDriverValue, 
                                    Math.min(this.config.maxDriverValue, driverValue));
        
        // Map driver value range to saturation range
        const normalizedValue = (clampedValue - this.config.minDriverValue) / 
                               (this.config.maxDriverValue - this.config.minDriverValue);
        
        return this.config.minSaturation + (normalizedValue * (this.config.maxSaturation - this.config.minSaturation));
    }

    /**
     * Calculate complete visual effects from any driver value
     * @param {number} driverValue - The input value that drives visual effects
     * @param {string} circleType - The type of circle (optional, defaults to applying all effects)
     * @returns {Object} {scale, opacity, saturation} visual effects
     */
    calculateVisualEffects(driverValue, circleType = null) {
        var effects = {
            scale: this.driverValueToScale(driverValue, circleType),
            opacity: this.driverValueToOpacity(driverValue),
            saturation: this.driverValueToSaturation(driverValue)
        };
        return effects;
    }

    /**
     * Calculate visual effects with a specific base scale override
     * Useful for maintaining backward compatibility with existing systems
     * @param {number} driverValue - The input value that drives visual effects
     * @param {number} baseScale - Override base scale (optional)
     * @param {string} circleType - The type of circle (optional)
     * @returns {Object} {scale, opacity, saturation} visual effects
     */
    calculateVisualEffectsWithBaseScale(driverValue, baseScale = null, circleType = null) {
        const effects = this.calculateVisualEffects(driverValue, circleType);
        
        if (baseScale !== null && this.shouldApplyScale(circleType)) {
            // If a base scale is provided and scale effects should be applied, 
            // use it as the minimum and scale relative to that
            const scaleFactor = (effects.scale - this.config.minScale) / 
                               (this.config.maxScale - this.config.minScale);
            effects.scale = baseScale + (scaleFactor * (this.config.maxScale - baseScale));
        }
        
        return effects;
    }

    /**
     * Legacy compatibility: Convert proximity strength to scale
     * This allows existing proximity calculations to work unchanged
     * @param {number} proximityStrength - Raw proximity strength from distance calculations
     * @returns {number} Scale factor
     */
    proximityStrengthToScale(proximityStrength) {
        return proximityStrength; // Direct mapping for backward compatibility
    }
}
