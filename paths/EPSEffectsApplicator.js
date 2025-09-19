export class EPSEffectsApplicator {
    constructor(calculator, circleManager) {
        this.calculator = calculator;
        this.circleManager = circleManager;
        this.dataStore = null;
    }

    /**
     * Set the data store reference for ignition functionality
     */
    setDataStore(dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * Set proximity effects on an element (scale, opacity, saturation) while preserving other transforms
     */
    setElementProximityEffects(element, scale, opacity = null, saturation = null) {
        const currentTransform = element.style.transform || '';
        const scaleRegex = /scale\([^)]*\)/g;
        const baseTransform = currentTransform.replace(scaleRegex, '').trim();
        
        const newTransform = baseTransform 
            ? `${baseTransform} scale(${scale})`
            : `scale(${scale})`;
            
        element.style.transform = newTransform;
        
        // Apply opacity and saturation if provided
        if (opacity !== null) {
            element.style.opacity = opacity;
            element.style.filter = `saturate(${saturation})`;
            
            // Also apply effects to the circle's name
            const entityContainer = element.closest('.entity-container');
            if (entityContainer) {
                const nameElement = entityContainer.querySelector('.entity-name');
                if (nameElement) {
                    nameElement.style.opacity = opacity;
                    nameElement.style.filter = `saturate(${saturation})`;
                }
            }
        }
        
        // Force immediate style application for real-time updates
        element.offsetHeight; // Trigger reflow
    }

    /**
     * Apply proximity effects for a specific viewer
     */
    applyProximityEffectsForViewer(effects, targetViewerId) {
        const config = this.calculator.visualEffectsCalculator.config;
        const circlesByViewer = this.circleManager.groupCirclesByViewer();
        const viewerCircles = circlesByViewer.get(targetViewerId) || [];

        const hasAnyEnergyInfluencers = this.checkForEnergyInfluencers(targetViewerId, viewerCircles);

        viewerCircles.forEach((data) => {
            const circleId = data.circle.id;
            if (!data.element) return;

            const circle = data.circle;

            // Handle inert circles first - they always have neutral appearance
            if (circle.activation === 'inert') {
                this.setElementProximityEffects(data.element, 1, 1, 1);
                return;
            }

            if (effects.has(circleId)) {
                // Apply calculated shinyness-based effects
                const effect = effects.get(circleId);
                this.setElementProximityEffects(data.element, effect.scale, effect.opacity, effect.saturation);
            } else if (hasAnyEnergyInfluencers) {
                // Calculate neutral shinyness effects based on activation only
                const shinyness = this.calculator.shinynessCalculator.calculateNetShinyness(circle.activation, []);
                const visualEffects = this.calculator.visualEffectsCalculator.calculateVisualEffects(shinyness.net, circle.type);
                this.setElementProximityEffects(data.element, visualEffects.scale, visualEffects.opacity, visualEffects.saturation);
            } else {
                // No energy influencers - use basic visual effects
                this.setElementProximityEffects(data.element, 1, 1, 1);
            }
        });
    }

    /**
     * Apply proximity effects for all viewers
     */
    applyProximityEffects(effects) {
        const config = this.calculator.visualEffectsCalculator.config;
        const circlesByViewer = this.circleManager.groupCirclesByViewer();

        circlesByViewer.forEach((viewerCircles, viewerId) => {
            const hasAnyEnergyInfluencers = this.checkForEnergyInfluencers(viewerId, viewerCircles);

            viewerCircles.forEach((data) => {
                const circleId = data.circle.id;
                if (!data.element) return;

                const circle = data.circle;

                // Handle inert circles first - they always have neutral appearance
                if (circle.activation === 'inert') {
                    this.setElementProximityEffects(data.element, 1, 1, 1);
                    return;
                }

                if (effects.has(circleId)) {
                    // Apply calculated shinyness-based effects
                    const effect = effects.get(circleId);
                    this.setElementProximityEffects(data.element, effect.scale, effect.opacity, effect.saturation);
                } else if (hasAnyEnergyInfluencers) {
                    // Calculate neutral shinyness effects based on activation only
                    const shinyness = this.calculator.shinynessCalculator.calculateNetShinyness(circle.activation, []);
                    const visualEffects = this.calculator.visualEffectsCalculator.calculateVisualEffects(shinyness.net, circle.type);
                    this.setElementProximityEffects(data.element, visualEffects.scale, visualEffects.opacity, visualEffects.saturation);
                } else {
                    // No energy influencers - use basic visual effects
                    this.setElementProximityEffects(data.element, 1, 1, 1);
                }
            });
        });
    }

    /**
     * Check for energy influencers in a viewer
     */
    checkForEnergyInfluencers(viewerId, viewerCircles, explicitDetector = null) {
        // Check for proximity influencers
        const hasProximityInfluencers = viewerCircles.some((data) => {
            const circle = data.circle;
            return (this.circleManager.hasEnergyType(circle, 'exciter') || 
                    this.circleManager.hasEnergyType(circle, 'igniter') || 
                    this.circleManager.hasEnergyType(circle, 'dampener')) && 
                   this.circleManager.isCircleActivated(circle);
        });
        
        // Check for explicit influencers using cached connection count
        let hasExplicitInfluencers = false;
        if (explicitDetector) {
            const connectionCount = explicitDetector.viewerConnectionCounts.get(viewerId) || 0;
            hasExplicitInfluencers = connectionCount > 0;
        }
        
        return hasProximityInfluencers || hasExplicitInfluencers;
    }

    /**
     * Handle ignition - activate a circle and trigger animation
     */
    handleIgnition(circleId) {
        const data = this.circleManager.getCircleData(circleId);
        if (!data || !data.circle) return;
        
        // Only ignite if the circle is currently inactive
        if (data.circle.activation !== 'inactive') return;
        
        // Activate the circle through the data store
        if (this.dataStore && this.dataStore.updateCircle) {
            this.dataStore.updateCircle(circleId, { activation: 'activated' });
        }
        
        // Trigger ignition animation
        this.triggerIgnitionAnimation(circleId, data.element);
        
        return true; // Signal that ignition occurred
    }

    /**
     * Trigger ignition blast animation
     */
    triggerIgnitionAnimation(circleId, element) {
        if (!element) return;
        
        // Create animation container
        const animationContainer = document.createElement('div');
        animationContainer.className = 'ignition-blast';
        animationContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(0, 255, 255, 0.8) 0%, rgba(0, 255, 255, 0.4) 50%, rgba(0, 255, 255, 0) 100%);
            pointer-events: none;
            transform: translate(-50%, -50%);
            z-index: 1000;
            animation: ignitionBlast 0.4s ease-out forwards;
        `;
        
        // Add animation keyframes if not already present
        if (!document.querySelector('#ignition-blast-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'ignition-blast-styles';
            styleSheet.textContent = `
                @keyframes ignitionBlast {
                    0% {
                        width: 0;
                        height: 0;
                        opacity: 1;
                    }
                    50% {
                        width: 40px;
                        height: 40px;
                        opacity: 0.8;
                    }
                    100% {
                        width: 100px;
                        height: 100px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // Add animation to the circle element
        element.style.position = 'relative';
        element.appendChild(animationContainer);
        
        // Remove animation after completion
        setTimeout(() => {
            if (animationContainer && animationContainer.parentNode) {
                animationContainer.parentNode.removeChild(animationContainer);
            }
        }, 600);
    }

    /**
     * Reset all proximity effects to normal
     */
    resetAllProximityEffects(proximityEffects) {
        const config = this.calculator.visualEffectsCalculator.config;
        proximityEffects.forEach((effect, circleId) => {
            const data = this.circleManager.getCircleData(circleId);
            if (data && data.element) {
                this.setElementProximityEffects(data.element, config.minScale, config.maxOpacity, config.maxSaturation);
            }
        });
    }
}
