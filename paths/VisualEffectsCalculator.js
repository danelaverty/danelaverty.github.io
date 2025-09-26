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

    shouldApplyScale(circleType) {
        return !this.config.noScaleCircleTypes.includes(circleType);
    }

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

    driverValueToOpacity(driverValue) {
        const clampedValue = Math.max(this.config.minDriverValue, 
                                    Math.min(this.config.maxDriverValue, driverValue));
        
        // Map driver value range to opacity range
        const normalizedValue = (clampedValue - this.config.minDriverValue) / 
                               (this.config.maxDriverValue - this.config.minDriverValue);
        
        return this.config.minOpacity + (normalizedValue * (this.config.maxOpacity - this.config.minOpacity));
    }

    driverValueToSaturation(driverValue) {
        const clampedValue = Math.max(this.config.minDriverValue, 
                                    Math.min(this.config.maxDriverValue, driverValue));
        
        // Map driver value range to saturation range
        const normalizedValue = (clampedValue - this.config.minDriverValue) / 
                               (this.config.maxDriverValue - this.config.minDriverValue);
        
        return this.config.minSaturation + (normalizedValue * (this.config.maxSaturation - this.config.minSaturation));
    }

    calculateVisualEffects(driverValue, circleType = null) {
        var effects = {
            scale: this.driverValueToScale(driverValue, circleType),
            opacity: this.driverValueToOpacity(driverValue),
            saturation: this.driverValueToSaturation(driverValue)
        };
        return effects;
    }
}
