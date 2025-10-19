// ShinynessEffectsTranslator.js - Translates shinyness values into visual effects (scale, opacity, saturation, brightness)
export class ShinynessEffectsTranslator {
    constructor() {
        this.effectRanges = {
            scale: {
                shiny: 1.3,
                dull: 0.7
            },
            opacity: {
                shiny: 1.0,
                dull: 0.5
            },
            saturation: {
                shiny: 1.0,
                dull: 0.3
            },
            brightness: {
                shiny: 1.3,
                dull: 0.7
            }
        };

        this.normalValues = {
            scale: 1.0,
            opacity: 1.0,
            saturation: 1.0,
            brightness: 1.0
        };
    }

    lerp(min, max, factor) {
        return min + (max - min) * factor;
    }

    translateShinyness(shinyness) {
        // If shinyness is null (inert circles), return normal values
        if (shinyness === null || shinyness === undefined) {
            return { ...this.normalValues };
        }

        // Clamp shinyness to valid range
        const clampedShinyness = Math.max(0.0, Math.min(1.0, shinyness));

        // Calculate interpolated values
        const scale = this.lerp(
            this.effectRanges.scale.dull,
            this.effectRanges.scale.shiny,
            clampedShinyness
        );

        const opacity = this.lerp(
            this.effectRanges.opacity.dull,
            this.effectRanges.opacity.shiny,
            clampedShinyness
        );

        const saturation = this.lerp(
            this.effectRanges.saturation.dull,
            this.effectRanges.saturation.shiny,
            clampedShinyness
        );

        const brightness = this.lerp(
            this.effectRanges.brightness.dull,
            this.effectRanges.brightness.shiny,
            clampedShinyness
        );

        return {
            scale: parseFloat(scale.toFixed(3)),
            opacity: parseFloat(opacity.toFixed(3)),
            saturation: parseFloat(saturation.toFixed(3)),
            brightness: parseFloat(brightness.toFixed(3))
        };
    }

    generateCSSEffects(shinyness, options = {}) {
        const effects = this.translateShinyness(shinyness);

        const ignoreScale = options.circleType === 'group';
        
        // Apply connection multiplier for additiveOr circles
        if (effects.scale > 1 && options.circleShinynessReceiveMode === 'additiveOr' && options.connectionMultiplier) {
            effects.scale *= options.connectionMultiplier;
        }
        
        // Disable scale for emoji circles
        if (effects.scale > 1 && options.circleType === 'emoji') { 
            effects.scale = 1; 
        }

        return {
            transform: ignoreScale ? 'scale(1.0)' : `scale(${effects.scale})`,
            opacity: effects.opacity,
            filter: `saturate(${effects.saturation}) brightness(${effects.brightness})`
        };
    }

    generateInlineStyles(shinyness, options = {}) {
        const cssEffects = this.generateCSSEffects(shinyness, options);
        
        return `transform: ${cssEffects.transform}; opacity: ${cssEffects.opacity}; filter: ${cssEffects.filter};`;
    }

    translateMultipleShinyness(shinynessMap, optionsMap = null) {
        const effectsMap = new Map();
        
        for (const [entityId, shinyness] of shinynessMap) {
            const options = optionsMap ? optionsMap.get(entityId) : {};
            effectsMap.set(entityId, this.generateCSSEffects(shinyness, options));
        }

        return effectsMap;
    }

    updateEffectRanges(newRanges) {
        this.effectRanges = { ...this.effectRanges, ...newRanges };
    }

    getEffectRanges() {
        return { ...this.effectRanges };
    }

    getNormalValues() {
        return { ...this.normalValues };
    }

    isValidShinyness(shinyness) {
        return typeof shinyness === 'number' && 
               shinyness >= 0.0 && 
               shinyness <= 1.0;
    }
}
