// EnergyProximitySystem.js - FIXED: Make activeViewers reactive with Vue's ref
import { ref } from './vue-composition-api.js';

export class EnergyProximitySystem {
    constructor() {
        this.isActive = false;
        this.circles = new Map(); // Map of circle id to circle data and element
        this.proximityEffects = new Map(); // Map of affected circle ids to their current effects
        this.activeViewers = ref(new Set()); // FIXED: Make this reactive!
        this.animationFrame = null;
        this.dataStore = null; // NEW: Reference to data store for ignition
        
        // Configuration
        this.config = {
            maxDistance: 80, // Maximum distance for effect
            minDistance: 50,  // Minimum distance for maximum effect
            maxScale: 1.01,    // Maximum scale multiplier
            minScale: 1.0,    // Minimum scale (normal size)
            maxOpacity: 1.0,  // Maximum opacity
            minOpacity: 0.5,  // Minimum opacity when dampener is present
            maxSaturation: 1.0, // Maximum saturation
            minSaturation: 0.3, // Minimum saturation when dampener is present
            inactiveOpacity: 0.4, // Opacity for inactive exciters/dampeners
            transitionDuration: '0.3s' // CSS transition duration
        };
    }

    /**
     * Set the data store reference for ignition functionality
     */
    setDataStore(dataStore) {
        this.dataStore = dataStore;
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
        this.activeViewers.value.clear(); // FIXED: Use .value for reactive ref
    }

    /**
     * Check if the proximity system is active for a specific viewer
     */
    isViewerActive(viewerId) {
        const isActive = this.activeViewers.value.has(viewerId); // FIXED: Use .value for reactive ref
        return isActive;
    }

    /**
     * Get all active viewer IDs
     */
    getActiveViewers() {
        return Array.from(this.activeViewers.value); // FIXED: Use .value for reactive ref
    }

    /**
     * Register a circle with the proximity system
     */
    registerCircle(id, circle, element, viewerWidth, viewerId) {
        if (!circle || !element || !viewerId) return;

        this.circles.set(id, {
            circle,
            element,
            viewerWidth,
            viewerId,
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
    updateCircle(id, circle, element, viewerWidth, viewerId) {
        if (!this.circles.has(id)) {
            this.registerCircle(id, circle, element, viewerWidth, viewerId);
        } else {
            const data = this.circles.get(id);
            data.circle = circle;
            data.element = element;
            data.viewerWidth = viewerWidth;
            data.viewerId = viewerId;
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
        const hasType = circle.energyTypes && circle.energyTypes.includes(energyType);
        return hasType;
    }

    /**
     * Check if a circle is a glow type
     */
    isGlowCircle(circle) {
        return true;
        return circle.type === 'glow';
    }

    isCircleActivated(circle) {
        const isActivated = circle.activation === 'activated';
        return isActivated;
    }

    isCircleInactive(circle) {
        const isInactive = circle.activation === 'inactive';
        return isInactive;
    }

    /**
 * Group circles by their viewer ID for isolated processing
 */
groupCirclesByViewer() {
    const circlesByViewer = new Map();
    
    Array.from(this.circles.values()).forEach(data => {
        const viewerId = data.viewerId;
        if (!circlesByViewer.has(viewerId)) {
            circlesByViewer.set(viewerId, []);
        }
        circlesByViewer.get(viewerId).push(data);
    });
    
    return circlesByViewer;
}

/**
 * Categorize circles by their energy types within a viewer
 */
categorizeCirclesByEnergyType(viewerCircles) {
    return {
        glowCircles: viewerCircles.filter(data => this.isGlowCircle(data.circle)),
        exciterCircles: viewerCircles.filter(data => 
            (this.hasEnergyType(data.circle, 'exciter') || this.hasEnergyType(data.circle, 'igniter')) && this.isCircleActivated(data.circle)
        ),
        dampenerCircles: viewerCircles.filter(data => 
            this.hasEnergyType(data.circle, 'dampener') && this.isCircleActivated(data.circle)
        )
    };
}

/**
 * Check if a viewer has any energy influencers (exciters or dampeners)
 */
hasEnergyInfluencers(exciterCircles, dampenerCircles) {
    return exciterCircles.length > 0 || dampenerCircles.length > 0;
}

/**
 * Calculate the net exciter effect on a glow circle from all nearby exciters
 */
calculateExciterEffect(glowPos, exciterCircles, glowCircleId) {
    let netExciterEffect = 0;
    let hasNearbyExciter = false;
    let hasIgniterAtMaxEffect = false;

    exciterCircles.forEach(exciterData => {
        // Skip if it's the same circle
        if (glowCircleId === exciterData.circle.id) return;

        const exciterPos = this.getEffectivePosition(exciterData.circle.id);
        if (!exciterPos) return;

        const distance = this.calculateDistance(glowPos, exciterPos);
        if (distance <= this.config.maxDistance) {
            hasNearbyExciter = true;
            const proximityStrength = this.calculateProximityStrength(distance);
            
            // Calculate exciter effect as positive influence
            const exciterInfluence = (proximityStrength - this.config.minScale) / 
                                   (this.config.maxScale - this.config.minScale);
            netExciterEffect = Math.max(netExciterEffect, exciterInfluence);
            
            // Check if this is an igniter at maximum effect
            const isIgniter = this.hasEnergyType(exciterData.circle, 'igniter');
            if (isIgniter && exciterInfluence >= 1.0) {
                hasIgniterAtMaxEffect = true;
            }
        }
    });

    return { netExciterEffect, hasNearbyExciter, hasIgniterAtMaxEffect };
}

/**
 * Calculate the net dampener effect on a glow circle from all nearby dampeners
 */
calculateDampenerEffect(glowPos, dampenerCircles, glowCircleId) {
    let netDampenerEffect = 0;
    let hasNearbyDampener = false;

    dampenerCircles.forEach(dampenerData => {
        // Skip if it's the same circle
        if (glowCircleId === dampenerData.circle.id) return;

        const dampenerPos = this.getEffectivePosition(dampenerData.circle.id);
        if (!dampenerPos) return;

        const distance = this.calculateDistance(glowPos, dampenerPos);
        if (distance <= this.config.maxDistance) {
            hasNearbyDampener = true;
            const proximityStrength = this.calculateProximityStrength(distance);
            
            // Calculate dampener effect as negative influence
            const dampenerInfluence = (proximityStrength - this.config.minScale) / 
                                    (this.config.maxScale - this.config.minScale);
            netDampenerEffect = Math.max(netDampenerEffect, dampenerInfluence);
        }
    });

    return { netDampenerEffect, hasNearbyDampener };
}

/**
 * Calculate the final scale based on base scale and net energy effects
 */
calculateFinalScale(baseScale, netExciterEffect, netDampenerEffect, isActivated) {
    const netEffect = netExciterEffect - netDampenerEffect;
    
    if (netEffect > 0) {
        // More excitation than dampening - scale up from base
        const maxPossibleScale = isActivated ? this.config.maxScale : this.config.maxScale;
        return baseScale + (netEffect * (maxPossibleScale - baseScale));
    } else if (netEffect < 0) {
        // More dampening than excitation - scale down from base
        const minPossibleScale = isActivated ? 0.7 : 0.7;
        return baseScale + (netEffect * (baseScale - minPossibleScale));
    } else {
        // Equal forces or no net effect
        return baseScale;
    }
}

/**
 * Calculate opacity and saturation based on the final scale
 */
calculateOpacityAndSaturation(finalScale) {
    const effectStrength = (finalScale - 0.7) / (this.config.maxScale - 0.7);
    const clampedEffectStrength = Math.max(0, Math.min(1, effectStrength));
    
    const opacityRange = this.config.maxOpacity - this.config.minOpacity;
    const saturationRange = this.config.maxSaturation - this.config.minSaturation;
    
    const opacity = this.config.minOpacity + (clampedEffectStrength * opacityRange);
    const saturation = this.config.minSaturation + (clampedEffectStrength * saturationRange);
    
    return { opacity, saturation };
}

/**
 * Process a single glow circle and calculate its proximity effects
 */
processGlowCircle(glowData, exciterCircles, dampenerCircles) {
    if (glowData.circle.activation == 'inert') return;
    const glowPos = this.getEffectivePosition(glowData.circle.id);
    if (!glowPos) return null;
    
    const isActivated = this.isCircleActivated(glowData.circle);
    const baseScale = isActivated ? this.config.maxScale : 0.7;
    
    // Calculate energy effects
    const { netExciterEffect, hasNearbyExciter, hasIgniterAtMaxEffect } = this.calculateExciterEffect(
        glowPos, exciterCircles, glowData.circle.id
    );
    const { netDampenerEffect, hasNearbyDampener } = this.calculateDampenerEffect(
        glowPos, dampenerCircles, glowData.circle.id
    );
    
    const hasNearbyInfluencer = hasNearbyExciter || hasNearbyDampener;
    
    // Only apply effect if there's a nearby influencer
    if (!hasNearbyInfluencer) return null;
    
    // Check for ignition condition
    let shouldIgnite = false;
    if (!isActivated && hasIgniterAtMaxEffect && netExciterEffect >= 1.0) {
        shouldIgnite = true;
    }
    
    const finalScale = this.calculateFinalScale(baseScale, netExciterEffect, netDampenerEffect, isActivated);
    const { opacity, saturation } = this.calculateOpacityAndSaturation(finalScale);
    
    return {
        circleId: glowData.circle.id,
        scale: finalScale,
        opacity,
        saturation,
        shouldIgnite // NEW: Flag for ignition
    };
}

/**
 * Process all circles within a single viewer and calculate their effects
 */
processViewerCircles(viewerCircles, viewerId, newActiveViewers, newEffects) {
    const { glowCircles, exciterCircles, dampenerCircles } = this.categorizeCirclesByEnergyType(viewerCircles);
    
    if (!this.hasEnergyInfluencers(exciterCircles, dampenerCircles)) {
        return; // Skip processing this viewer entirely
    }

    // Mark this viewer as active since it has energy influencers
    newActiveViewers.add(viewerId);

    // Calculate effects for each glow circle within this viewer only
    glowCircles.forEach(glowData => {
        const effect = this.processGlowCircle(glowData, exciterCircles, dampenerCircles);
        if (effect) {
            newEffects.set(effect.circleId, {
                scale: effect.scale,
                opacity: effect.opacity,
                saturation: effect.saturation,
                shouldIgnite: effect.shouldIgnite // Pass ignition flag
            });
            
            // Handle ignition - activate the circle and trigger animation
            if (effect.shouldIgnite) {
                this.handleIgnition(effect.circleId);
            }
        }
    });
}

/**
 * Main update method - now much simpler and more readable
 */
updateProximityEffects() {
    if (!this.isActive) {
        return;
    }

    const newEffects = new Map();
    const newActiveViewers = new Set();

    // Group circles by viewer for isolated processing
    const circlesByViewer = this.groupCirclesByViewer();

    // Process each viewer separately
    circlesByViewer.forEach((viewerCircles, viewerId) => {
        this.processViewerCircles(viewerCircles, viewerId, newActiveViewers, newEffects);
    });

    // Update reactive state and apply effects
    this.activeViewers.value = newActiveViewers;
    this.applyProximityEffects(newEffects);
    this.proximityEffects = newEffects;
}

    /**
     * Apply proximity effects to elements
     */
    applyProximityEffects(effects) {
        // Group circles by actual viewerId
        const circlesByViewer = new Map();
        this.circles.forEach((data, circleId) => {
            const viewerId = data.viewerId;
            if (!circlesByViewer.has(viewerId)) {
                circlesByViewer.set(viewerId, []);
            }
            circlesByViewer.get(viewerId).push({ circleId, data });
        });

        // Process all circles to set appropriate appearance
        circlesByViewer.forEach(viewerCircles => {
            // Check if this viewer has any energy influencers
            const hasEnergyInfluencers = viewerCircles.some(({ data }) => {
                const circle = data.circle;
                return (this.hasEnergyType(circle, 'exciter') || this.hasEnergyType(circle, 'igniter') || this.hasEnergyType(circle, 'dampener')) 
                       && this.isCircleActivated(circle);
            });

            viewerCircles.forEach(({ circleId, data }) => {
                if (!data.element) return;

                const circle = data.circle;
                
                // Handle glow circles
                if (this.isGlowCircle(circle)) {
                    if (effects.has(circleId)) {
                        // Apply proximity effects
                        const effect = effects.get(circleId);
                        this.setElementProximityEffects(data.element, effect.scale, effect.opacity, effect.saturation);
                    } else if (hasEnergyInfluencers) {
                        // Only apply activated/inactive effects if there are energy influencers in this viewer
                        const isActivated = this.isCircleActivated(circle);
                        if (isActivated) {
                            // Activated circles: big & bright by default
                            this.setElementProximityEffects(data.element, this.config.maxScale, this.config.maxOpacity, this.config.maxSaturation);
                        } else {
                            // Inactive circles: small & dim by default
                            this.setElementProximityEffects(data.element, 0.7, this.config.minOpacity, this.config.minSaturation);
                        }
                    } else {
                        // No energy influencers in this viewer - use neutral appearance
                        this.setElementProximityEffects(data.element, this.config.minScale, this.config.maxOpacity, this.config.maxSaturation);
                    }
                }
                // Handle exciter/igniter/dampener circles
                else if (this.hasEnergyType(circle, 'exciter') || this.hasEnergyType(circle, 'igniter') || this.hasEnergyType(circle, 'dampener')) {
                    const isActivated = this.isCircleActivated(circle);
                    const isInactive = this.isCircleInactive(circle);
                    if (isActivated) {
                        // Activated exciters/igniters/dampeners: full opacity
                        this.setElementProximityEffects(data.element, this.config.minScale, this.config.maxOpacity, this.config.maxSaturation);
                    } else if (isInactive) {
                        // Inactive exciters/igniters/dampeners: dimmed opacity
                        this.setElementProximityEffects(data.element, this.config.minScale, this.config.inactiveOpacity, this.config.maxSaturation);
                    }
                }
            });
        });
    }

    /**
     * Handle ignition - activate a circle and trigger animation
     */
    handleIgnition(circleId) {
        const data = this.circles.get(circleId);
        if (!data || !data.circle) return;
        
        // Only ignite if the circle is currently inactive
        if (data.circle.activation !== 'inactive') return;
        
        // Activate the circle through the data store
        if (this.dataStore && this.dataStore.updateCircle) {
            this.dataStore.updateCircle(circleId, { activation: 'activated' });
        }
        
        // Trigger ignition animation
        this.triggerIgnitionAnimation(circleId, data.element);
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
    resetAllProximityEffects() {
        this.proximityEffects.forEach((effect, circleId) => {
            const data = this.circles.get(circleId);
            if (data && data.element) {
                this.setElementProximityEffects(data.element, this.config.minScale, this.config.maxOpacity, this.config.maxSaturation);
            }
        });
        this.proximityEffects.clear();
        this.activeViewers.value.clear(); // FIXED: Use .value to trigger reactivity
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
        this.activeViewers.value.clear(); // FIXED: Use .value to trigger reactivity
    }
}

// Create singleton instance
let proximitySystemInstance = null;

export function useEnergyProximitySystem(dataStore = null) {
    if (!proximitySystemInstance) {
        proximitySystemInstance = new EnergyProximitySystem();
    }
    
    // Set or update the data store reference
    if (dataStore) {
        proximitySystemInstance.setDataStore(dataStore);
    }
    
    return proximitySystemInstance;
}
