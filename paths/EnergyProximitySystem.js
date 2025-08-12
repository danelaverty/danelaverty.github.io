// EnergyProximitySystem.js - Handles proximity-based scaling, opacity, and saturation effects between energy types (WITH DEBUG LOGGING)
export class EnergyProximitySystem {
    constructor() {
        this.isActive = false;
        this.circles = new Map(); // Map of circle id to circle data and element
        this.proximityEffects = new Map(); // Map of affected circle ids to their current effects
        this.animationFrame = null;
        
        // Configuration
        this.config = {
            maxDistance: 90, // Maximum distance for effect
            minDistance: 60,  // Minimum distance for maximum effect
            maxScale: 1.5,    // Maximum scale multiplier
            minScale: 1.0,    // Minimum scale (normal size)
            maxOpacity: 1.0,  // Maximum opacity
            minOpacity: 0.3,  // Minimum opacity when exciter is present
            maxSaturation: 1.0, // Maximum saturation
            minSaturation: 0.3, // Minimum saturation when exciter is present
            transitionDuration: '0.3s' // CSS transition duration
        };
    }

    /**
     * Initialize the proximity system
     */
    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.updateProximityEffects();
    }

    /**
     * Stop the proximity system
     */
    stop() {
        this.isActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.resetAllProximityEffects();
    }

    /**
     * Register a circle with the proximity system
     */
    registerCircle(id, circle, element, viewerWidth) {
        if (!circle || !element) return;

        this.circles.set(id, {
            circle,
            element,
            viewerWidth,
            lastPosition: this.getCirclePosition(circle, viewerWidth),
            tempPosition: null
        });

        // Initialize CSS transition for smooth scaling
        this.initializeElementTransition(element);
        
        // Update effects immediately after registration
        if (this.isActive) {
            this.updateProximityEffects();
        }
    }

    /**
     * Unregister a circle from the proximity system
     */
    unregisterCircle(id) {
        // Reset scale before removing
        if (this.proximityEffects.has(id)) {
            const data = this.circles.get(id);
            if (data && data.element) {
                this.setElementProximityEffects(data.element, 1.0, this.config.maxOpacity, this.config.maxSaturation);
            }
            this.proximityEffects.delete(id);
        }
        
        this.circles.delete(id);
        
        // Update effects after removal
        if (this.isActive) {
            this.updateProximityEffects();
        }
    }

    /**
     * Update circle data (called when circle moves or changes)
     */
    updateCircle(id, circle, element, viewerWidth) {
        if (!this.circles.has(id)) {
            this.registerCircle(id, circle, element, viewerWidth);
        } else {
            const data = this.circles.get(id);
            data.circle = circle;
            data.element = element;
            data.viewerWidth = viewerWidth;
            data.lastPosition = this.getCirclePosition(circle, viewerWidth);
        }
        
        // Update effects immediately after circle update
        if (this.isActive) {
            this.updateProximityEffects();
        }
    }

    /**
     * Set temporary position for a circle during drag operations
     */
    setTempPosition(id, x, y) {
        const data = this.circles.get(id);
        if (data) {
            data.tempPosition = { x, y };
        }
    }

    /**
     * Clear temporary position for a circle (called when drag ends)
     */
    clearTempPosition(id) {
        const data = this.circles.get(id);
        if (data) {
            data.tempPosition = null;
        }
    }

    /**
     * Get effective position of a circle (temp position if dragging, otherwise stored position)
     */
    getEffectivePosition(id) {
        const data = this.circles.get(id);
        if (!data) return null;

        // Use temporary position if available (during drag), otherwise use stored position
        if (data.tempPosition) {
            return data.tempPosition;
        }

        return this.getCirclePosition(data.circle, data.viewerWidth);
    }

    /**
     * Initialize CSS transition for smooth scaling
     */
    initializeElementTransition(element) {
        // DISABLE transitions for debugging - make changes immediate
        const transitionDuration = '0.1s';
        element.style.transition = `transform ${transitionDuration} ease-out, opacity ${transitionDuration} ease-out, filter ${transitionDuration} ease-out`;
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
     * Get absolute position of a circle
     */
    getCirclePosition(circle, viewerWidth) {
        // For circles: position relative to center of viewer
        const centerX = viewerWidth / 2;
        return {
            x: centerX + circle.x + 16, // +16 for circle center (32px width / 2)
            y: circle.y + 16 // +16 for circle center (32px height / 2)
        };
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
        if (distance > this.config.maxDistance) {
            return this.config.minScale;
        }
        
        if (distance < this.config.minDistance) {
            return this.config.maxScale;
        }
        
        // Linear interpolation between min and max proximity strength
        const normalizedDistance = (distance - this.config.minDistance) / 
                                  (this.config.maxDistance - this.config.minDistance);
        
        return this.config.maxScale - (normalizedDistance * (this.config.maxScale - this.config.minScale));
    }

    /**
     * Check if a circle has a specific energy type
     */
    hasEnergyType(circle, energyType) {
        return circle.energyTypes && circle.energyTypes.includes(energyType);
    }

    /**
     * Check if a circle is a glow type
     */
    isGlowCircle(circle) {
        return circle.type === 'glow';
    }

    isCircleActivated(circle) {
        return circle.activation === 'activated';
    }

    /**
     * Update all proximity effects
     */
    updateProximityEffects() {
        if (!this.isActive) {
            return;
        }

        const circleArray = Array.from(this.circles.values());
        const newEffects = new Map();

        // Group circles by viewer (using viewerWidth as a proxy for viewer identity)
        const circlesByViewer = new Map();
        circleArray.forEach(data => {
            const viewerKey = data.viewerWidth; // Use viewerWidth as viewer identifier
            if (!circlesByViewer.has(viewerKey)) {
                circlesByViewer.set(viewerKey, []);
            }
            circlesByViewer.get(viewerKey).push(data);
        });

        // Calculate effects for each viewer separately
        circlesByViewer.forEach(viewerCircles => {
            const glowCircles = viewerCircles.filter(data => this.isGlowCircle(data.circle));
            const exciterCircles = viewerCircles.filter(data => 
                this.hasEnergyType(data.circle, 'exciter')
            );

            // Calculate effects for each glow circle within this viewer only
            glowCircles.forEach(glowData => {
                const glowPos = this.getEffectivePosition(glowData.circle.id);
                if (!glowPos) return;
                
                const isActivated = this.isCircleActivated(glowData.circle);
                let maxProximityStrength = this.config.minScale;
                let closestDistance = Infinity;

                // Check distance to all exciter circles in this viewer
                exciterCircles.forEach(exciterData => {
                    // Skip if it's the same circle
                    if (glowData.circle.id === exciterData.circle.id) return;

                    const exciterPos = this.getEffectivePosition(exciterData.circle.id);
                    if (!exciterPos) return;

                    const distance = this.calculateDistance(glowPos, exciterPos);
                    const proximityStrength = this.calculateProximityStrength(distance);
                    
                    if (distance < closestDistance) {
                        closestDistance = distance;
                    }
                    
                    // Use the maximum proximity strength from all nearby exciters
                    maxProximityStrength = Math.max(maxProximityStrength, proximityStrength);
                });

		if (isActivated) { 
			const maxMinScaleMidpoint = (this.config.maxScale + this.config.minScale) / 2;
			const maxMinScaleMidpointDelta = maxProximityStrength - maxMinScaleMidpoint;
			maxProximityStrength = maxMinScaleMidpoint - maxMinScaleMidpointDelta;
		}

                // Only apply effect if proximity strength is different from normal or if there are exciters in this viewer
                if (Math.abs(maxProximityStrength - this.config.minScale) > 0.01) {
                    // Calculate opacity and saturation based on the same distance as scale
                    const opacityRange = this.config.maxOpacity - this.config.minOpacity;
                    const saturationRange = this.config.maxSaturation - this.config.minSaturation;
                    const proximityStrengthRange = this.config.maxScale - this.config.minScale;
                    
                    // Use the same proportion as proximity strength for opacity and saturation
                    const effectStrength = (maxProximityStrength - this.config.minScale) / proximityStrengthRange;
                    const opacity = this.config.minOpacity + (effectStrength * opacityRange);
                    const saturation = this.config.minSaturation + (effectStrength * saturationRange);
                    
                    newEffects.set(glowData.circle.id, { scale: maxProximityStrength, opacity, saturation });
                } else if (exciterCircles.length > 0) {
                    // If there are exciters in this viewer but this glow circle is far away, apply minimum values
                    newEffects.set(glowData.circle.id, { 
                        scale: this.config.minScale, 
                        opacity: this.config.minOpacity, 
                        saturation: this.config.minSaturation 
                    });
                }
            });
        });

        // Apply proximity effects
        this.applyProximityEffects(newEffects);
        this.proximityEffects = newEffects;
    }

    /**
     * Apply proximity effects to elements
     */
    applyProximityEffects(effects) {
        // Reset circles that no longer have effects
        this.proximityEffects.forEach((oldEffect, circleId) => {
            if (!effects.has(circleId)) {
                const data = this.circles.get(circleId);
                if (data && data.element) {
                    this.setElementProximityEffects(data.element, this.config.minScale, this.config.maxOpacity, this.config.maxSaturation);
                }
            }
        });

        // Apply new/updated effects
        effects.forEach((effect, circleId) => {
            const data = this.circles.get(circleId);
            if (data && data.element) {
                this.setElementProximityEffects(data.element, effect.scale, effect.opacity, effect.saturation);
            }
        });
    }

    /**
     * Reset all proximity effects to normal
     */
    resetAllProximityEffects() {
        this.proximityEffects.forEach((effect, circleId) => {
            const data = this.circles.get(circleId);
            if (data && data.element) {
                this.setElementProximityEffects(data.element, this.config.minScale, this.config.maxOpacity, this.config.maxSaturation);
            }
        });
        this.proximityEffects.clear();
    }

    /**
     * Force an immediate update (useful during drag operations)
     */
    forceUpdate() {
        if (this.isActive) {
            this.updateProximityEffects();
        }
    }

    /**
     * Clear all registered circles and effects
     */
    clear() {
        this.resetAllProximityEffects();
        this.circles.clear();
        this.proximityEffects.clear();
    }
}

// Create singleton instance
let proximitySystemInstance = null;

export function useEnergyProximitySystem() {
    if (!proximitySystemInstance) {
        proximitySystemInstance = new EnergyProximitySystem();
    }
    return proximitySystemInstance;
}
