// EnergyProximitySystem.js - FIXED: Make activeViewers reactive with Vue's ref
import { ref } from './vue-composition-api.js';

export class EnergyProximitySystem {
    constructor() {
        this.isActive = false;
        this.circles = new Map(); // Map of circle id to circle data and element
        this.proximityEffects = new Map(); // Map of affected circle ids to their current effects
        this.activeViewers = ref(new Set()); // FIXED: Make this reactive!
        this.animationFrame = null;
        
        // Configuration
        this.config = {
            maxDistance: 80, // Maximum distance for effect
            minDistance: 30,  // Minimum distance for maximum effect
            maxScale: 1.5,    // Maximum scale multiplier
            minScale: 1.0,    // Minimum scale (normal size)
            maxOpacity: 1.0,  // Maximum opacity
            minOpacity: 0.3,  // Minimum opacity when dampener is present
            maxSaturation: 1.0, // Maximum saturation
            minSaturation: 0.3, // Minimum saturation when dampener is present
            inactiveOpacity: 0.4, // Opacity for inactive exciters/dampeners
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
        this.activeViewers.value.clear(); // FIXED: Use .value for reactive ref
    }

    /**
     * Check if the proximity system is active for a specific viewer
     */
    isViewerActive(viewerId) {
        const isActive = this.activeViewers.value.has(viewerId); // FIXED: Use .value for reactive ref
        console.log(`[EnergyProximitySystem] isViewerActive(${viewerId}): ${isActive}`);
        console.log(`[EnergyProximitySystem] Current active viewers:`, Array.from(this.activeViewers.value));
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

        console.log(`[EnergyProximitySystem] Registering circle:`, {
            id,
            name: circle.name,
            type: circle.type,
            energyTypes: circle.energyTypes,
            activation: circle.activation,
            viewerId,
            viewerWidth
        });

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
            console.log(`[EnergyProximitySystem] Updating effects after registering circle ${id}`);
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
        console.log(`[EnergyProximitySystem] hasEnergyType(${circle.id}, ${energyType}):`, {
            result: hasType,
            circleEnergyTypes: circle.energyTypes,
            isArray: Array.isArray(circle.energyTypes)
        });
        return hasType;
    }

    /**
     * Check if a circle is a glow type
     */
    isGlowCircle(circle) {
        return circle.type === 'glow';
    }

    isCircleActivated(circle) {
        const isActivated = circle.activation === 'activated';
        console.log(`[EnergyProximitySystem] isCircleActivated(${circle.id}):`, {
            result: isActivated,
            activation: circle.activation
        });
        return isActivated;
    }

    /**
     * Update all proximity effects
     * FIXED: Use reactive activeViewers that will trigger Vue reactivity
     */
    updateProximityEffects() {
        if (!this.isActive) {
            console.log('[EnergyProximitySystem] System not active, skipping update');
            return;
        }

        const circleArray = Array.from(this.circles.values());
        const newEffects = new Map();
        const newActiveViewers = new Set(); // Track viewers with energy influencers

        console.log('[EnergyProximitySystem] Starting proximity effects update');
        console.log(`[EnergyProximitySystem] Total registered circles: ${circleArray.length}`);

        // Group circles by actual viewerId
        const circlesByViewer = new Map();
        circleArray.forEach(data => {
            const viewerId = data.viewerId;
            if (!circlesByViewer.has(viewerId)) {
                circlesByViewer.set(viewerId, []);
            }
            circlesByViewer.get(viewerId).push(data);
        });

        console.log(`[EnergyProximitySystem] Circles grouped by viewer:`, 
            Array.from(circlesByViewer.entries()).map(([viewerId, circles]) => ({
                viewerId, 
                count: circles.length,
                circles: circles.map(data => ({
                    id: data.circle.id,
                    name: data.circle.name,
                    type: data.circle.type,
                    energyTypes: data.circle.energyTypes,
                    activation: data.circle.activation
                }))
            }))
        );

        // Calculate effects for each viewer separately
        circlesByViewer.forEach((viewerCircles, viewerId) => {
            console.log(`[EnergyProximitySystem] Processing viewer ${viewerId} with ${viewerCircles.length} circles`);
            
            const glowCircles = viewerCircles.filter(data => this.isGlowCircle(data.circle));
            const exciterCircles = viewerCircles.filter(data => 
                this.hasEnergyType(data.circle, 'exciter') && this.isCircleActivated(data.circle)
            );
            const dampenerCircles = viewerCircles.filter(data => 
                this.hasEnergyType(data.circle, 'dampener') && this.isCircleActivated(data.circle)
            );

            console.log(`[EnergyProximitySystem] Viewer ${viewerId} analysis:`, {
                glowCircles: glowCircles.length,
                exciterCircles: exciterCircles.length,
                dampenerCircles: dampenerCircles.length,
                exciterDetails: exciterCircles.map(data => ({
                    id: data.circle.id,
                    name: data.circle.name,
                    energyTypes: data.circle.energyTypes,
                    activation: data.circle.activation,
                    hasExciterType: this.hasEnergyType(data.circle, 'exciter'),
                    isActivated: this.isCircleActivated(data.circle)
                })),
                dampenerDetails: dampenerCircles.map(data => ({
                    id: data.circle.id,
                    name: data.circle.name,
                    energyTypes: data.circle.energyTypes,
                    activation: data.circle.activation,
                    hasDampenerType: this.hasEnergyType(data.circle, 'dampener'),
                    isActivated: this.isCircleActivated(data.circle)
                }))
            });

            if (exciterCircles.length === 0 && dampenerCircles.length === 0) {
                console.log(`[EnergyProximitySystem] Viewer ${viewerId} has no active energy influencers, skipping`);
                return; // Skip processing this viewer entirely
            }

            // Mark this viewer as active since it has energy influencers
            console.log(`[EnergyProximitySystem] Marking viewer ${viewerId} as ACTIVE (has energy influencers)`);
            newActiveViewers.add(viewerId);

            // Calculate effects for each glow circle within this viewer only
            glowCircles.forEach(glowData => {
                const glowPos = this.getEffectivePosition(glowData.circle.id);
                if (!glowPos) return;
                
                const isActivated = this.isCircleActivated(glowData.circle);
                
                // Start with the circle's natural state
                let baseScale = isActivated ? this.config.maxScale : 0.7;
                let netExciterEffect = 0;
                let netDampenerEffect = 0;
                let hasNearbyInfluencer = false;

                // Calculate exciter effects - only from activated exciters
                exciterCircles.forEach(exciterData => {
                    // Skip if it's the same circle
                    if (glowData.circle.id === exciterData.circle.id) return;

                    const exciterPos = this.getEffectivePosition(exciterData.circle.id);
                    if (!exciterPos) return;

                    const distance = this.calculateDistance(glowPos, exciterPos);
                    if (distance <= this.config.maxDistance) {
                        hasNearbyInfluencer = true;
                        const proximityStrength = this.calculateProximityStrength(distance);
                        
                        // Calculate exciter effect as positive influence
                        const exciterInfluence = (proximityStrength - this.config.minScale) / (this.config.maxScale - this.config.minScale);
                        netExciterEffect = Math.max(netExciterEffect, exciterInfluence);
                    }
                });

                // Calculate dampener effects - only from activated dampeners
                dampenerCircles.forEach(dampenerData => {
                    // Skip if it's the same circle
                    if (glowData.circle.id === dampenerData.circle.id) return;

                    const dampenerPos = this.getEffectivePosition(dampenerData.circle.id);
                    if (!dampenerPos) return;

                    const distance = this.calculateDistance(glowPos, dampenerPos);
                    if (distance <= this.config.maxDistance) {
                        hasNearbyInfluencer = true;
                        const proximityStrength = this.calculateProximityStrength(distance);
                        
                        // Calculate dampener effect as negative influence
                        const dampenerInfluence = (proximityStrength - this.config.minScale) / (this.config.maxScale - this.config.minScale);
                        netDampenerEffect = Math.max(netDampenerEffect, dampenerInfluence);
                    }
                });

                // Only apply effect if there's a nearby influencer
                if (hasNearbyInfluencer) {
                    // Calculate net effect: exciter pushes toward maxScale, dampener pushes toward minScale
                    const netEffect = netExciterEffect - netDampenerEffect;
                    
                    // Apply the net effect to determine final scale
                    let finalScale;
                    if (netEffect > 0) {
                        // More excitation than dampening - scale up from base
                        const maxPossibleScale = isActivated ? this.config.maxScale : this.config.maxScale;
                        finalScale = baseScale + (netEffect * (maxPossibleScale - baseScale));
                    } else if (netEffect < 0) {
                        // More dampening than excitation - scale down from base
                        const minPossibleScale = isActivated ? 0.7 : 0.7;
                        finalScale = baseScale + (netEffect * (baseScale - minPossibleScale));
                    } else {
                        // Equal forces or no net effect
                        finalScale = baseScale;
                    }
                    
                    // Calculate opacity and saturation based on final scale
                    const effectStrength = (finalScale - 0.7) / (this.config.maxScale - 0.7);
                    const clampedEffectStrength = Math.max(0, Math.min(1, effectStrength));
                    
                    const opacityRange = this.config.maxOpacity - this.config.minOpacity;
                    const saturationRange = this.config.maxSaturation - this.config.minSaturation;
                    
                    const opacity = this.config.minOpacity + (clampedEffectStrength * opacityRange);
                    const saturation = this.config.minSaturation + (clampedEffectStrength * saturationRange);
                    
                    newEffects.set(glowData.circle.id, { scale: finalScale, opacity, saturation });
                }
            });
        });

        // FIXED: Update reactive activeViewers - this will trigger Vue reactivity!
        console.log(`[EnergyProximitySystem] Update complete. Active viewers:`, Array.from(newActiveViewers));
        console.log(`[EnergyProximitySystem] Previous active viewers:`, Array.from(this.activeViewers.value));
        this.activeViewers.value = newActiveViewers;

        // Apply proximity effects
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
                return (this.hasEnergyType(circle, 'exciter') || this.hasEnergyType(circle, 'dampener')) 
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
                // Handle exciter/dampener circles
                else if (this.hasEnergyType(circle, 'exciter') || this.hasEnergyType(circle, 'dampener')) {
                    const isActivated = this.isCircleActivated(circle);
                    if (isActivated) {
                        // Activated exciters/dampeners: full opacity
                        this.setElementProximityEffects(data.element, this.config.minScale, this.config.maxOpacity, this.config.maxSaturation);
                    } else {
                        // Inactive exciters/dampeners: dimmed opacity
                        this.setElementProximityEffects(data.element, this.config.minScale, this.config.inactiveOpacity, this.config.maxSaturation);
                    }
                }
            });
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

export function useEnergyProximitySystem() {
    if (!proximitySystemInstance) {
        proximitySystemInstance = new EnergyProximitySystem();
    }
    return proximitySystemInstance;
}
