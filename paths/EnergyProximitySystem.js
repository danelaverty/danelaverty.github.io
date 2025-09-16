// EnergyProximitySystem.js - OPTIMIZED: Separated update frequencies for proximity and explicit connections
import { ref } from './vue-composition-api.js';
import { EnergyEffectsCoordinator } from './EnergyEffectsCoordinator.js';
import { ExplicitEnergyDetector } from './ExplicitEnergyDetector.js';

export class EnergyProximitySystem {
    constructor() {
        this.isActive = false;
        this.circles = new Map(); // Map of circle id to circle data and element
        this.proximityEffects = new Map(); // Map of affected circle ids to their current effects
        this.explicitEffects = new Map(); // NEW: Separate cache for explicit effects
        this.activeViewers = ref(new Set()); // Make this reactive
        this.animationFrame = null;
        this.dataStore = null; // Reference to data store for ignition and explicit connections
        
        // NEW: Separated update timing
        this.lastExplicitUpdate = 0;
        this.explicitUpdateInterval = 200; // Update explicit effects every 200ms (5 FPS)
        this.forceExplicitUpdate = false; // Flag to force immediate explicit update
        
        // Shared calculator and explicit connection detector
        this.calculator = new EnergyEffectsCoordinator();
        
		this.explicitEffectsQueue = new Set();
        this.explicitEffectsTimeout = null;
        this.explicitEffectsDelay = 500;
    }

	processQueuedExplicitEffects() {
		const viewersToUpdate = Array.from(this.explicitEffectsQueue);
		this.explicitEffectsQueue.clear();
		this.explicitEffectsTimeout = null;

		// Clear cache for queued viewers
		if (this.explicitDetector) {
			viewersToUpdate.forEach(viewerId => {
				this.explicitDetector.invalidateCache(viewerId);
			});
		}

		// Clear effects cache and trigger immediate update
		this.explicitEffects.clear();
		this.updateProximityEffects();
	}

	scheduleExplicitEffectsUpdate(viewerId = null) {
        // Add to queue (automatically deduplicates)
        if (viewerId) {
            this.explicitEffectsQueue.add(viewerId);
        } else {
            // If no specific viewer, mark all active viewers for update
            this.activeViewers.value.forEach(activeViewerId => {
                this.explicitEffectsQueue.add(activeViewerId);
            });
        }
        
        // Reset the timeout
        if (this.explicitEffectsTimeout) {
            clearTimeout(this.explicitEffectsTimeout);
        }
        
        // Schedule processing after delay
        this.explicitEffectsTimeout = setTimeout(() => {
            this.processQueuedExplicitEffects();
        }, this.explicitEffectsDelay);
    }

    /**
     * Set the data store reference for ignition functionality and explicit connections
     */
    setDataStore(dataStore) {
        this.dataStore = dataStore;
        // Initialize explicit energy detector
        this.explicitDetector = new ExplicitEnergyDetector(dataStore);
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
        this.activeViewers.value.clear();
        
        // Clear explicit effects cache
        this.explicitEffects.clear();
    }

    /**
     * Check if the proximity system is active for a specific viewer
     */
    isViewerActive(viewerId) {
        return this.activeViewers.value.has(viewerId);
    }

    /**
     * Get all active viewer IDs
     */
    getActiveViewers() {
        return Array.from(this.activeViewers.value);
    }

    /**
     * NEW: Force explicit effects update on next cycle
     */
	invalidateExplicitEffects(viewerId = null) {
		// Use debounced update instead of immediate
		this.scheduleExplicitEffectsUpdate(viewerId);
	}

	invalidateExplicitEffectsImmediate(viewerId = null) {
		if (this.explicitDetector) {
			this.explicitDetector.invalidateCache(viewerId);
		}
		this.explicitEffects.clear();
		this.updateProximityEffects();
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
        const config = this.calculator.visualEffectsCalculator.config;
        // Reset scale before removing
        if (this.proximityEffects.has(id)) {
            const data = this.circles.get(id);
            if (data && data.element) {
                this.setElementProximityEffects(data.element, 1.0, config.maxOpacity, config.maxSaturation);
            }
            this.proximityEffects.delete(id);
        }
        
        // Clear explicit effects for this circle
        this.explicitEffects.delete(id);
        
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
        const transitionDuration = '1s';
        element.style.transition = `transform ${transitionDuration} cubic-bezier(0.2,-2,0.8,2), opacity ${transitionDuration} cubic-bezier(0.2,-2,0.8,2), filter ${transitionDuration} cubic-bezier(0.2,-2,0.8,2)`;
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
     * Check if a circle has a specific energy type
     */
    hasEnergyType(circle, energyType) {
        return circle.energyTypes && circle.energyTypes.includes(energyType);
    }

    /**
     * Check if a circle is a glow type
     */
    isGlowCircle(circle) {
        return true;
    }

    isCircleActivated(circle) {
        return circle.activation === 'activated';
    }

    isCircleInactive(circle) {
        return circle.activation === 'inactive';
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
     * Calculate the net exciter effect on a glow circle from all nearby exciters (proximity only)
     * Returns effect objects compatible with the shared calculator
     */
    calculateProximityExciterEffects(glowPos, exciterCircles, glowCircleId) {
        const config = this.calculator.visualEffectsCalculator.config;
        const effects = [];

        exciterCircles.forEach(exciterData => {
            // Skip if it's the same circle
            if (glowCircleId === exciterData.circle.id) return;

            const exciterPos = this.getEffectivePosition(exciterData.circle.id);
            if (!exciterPos) return;

            const distance = this.calculateDistance(glowPos, exciterPos);
            if (distance <= config.maxDistance) {
                const proximityStrength = this.calculateProximityStrength(distance);
                const isIgniter = this.hasEnergyType(exciterData.circle, 'igniter');
                
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

            const dampenerPos = this.getEffectivePosition(dampenerData.circle.id);
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
     * NEW: Get cached explicit effects or calculate them if needed
     */
	getExplicitEffectsForCircle(circleId, viewerId) {
		if (!this.explicitDetector) {
			return { exciterEffects: [], dampenerEffects: [] };
		}

		// Always calculate fresh (no caching)
		const exciterEffects = this.explicitDetector.findConnectedExciters(circleId, viewerId);
		const dampenerEffects = this.explicitDetector.findConnectedDampeners(circleId, viewerId);

		return { exciterEffects, dampenerEffects };
	}

    /**
     * OPTIMIZED: Process a single glow circle with separated proximity and explicit effects
     */
    processGlowCircle(glowData, exciterCircles, dampenerCircles) {
        const config = this.calculator.visualEffectsCalculator.config;
        if (glowData.circle.activation == 'inert') return;
        const glowPos = this.getEffectivePosition(glowData.circle.id);
        if (!glowPos) return null;
        
        const isActivated = this.isCircleActivated(glowData.circle);
        const baseScale = isActivated ? config.maxScale : 0.7;
        
        // Calculate proximity effects (high frequency)
        const proximityExciterEffects = this.calculateProximityExciterEffects(
            glowPos, exciterCircles, glowData.circle.id
        );
        const proximityDampenerEffects = this.calculateProximityDampenerEffects(
            glowPos, dampenerCircles, glowData.circle.id
        );
        
        // Get explicit connection effects (low frequency, cached)
        const explicitEffects = this.getExplicitEffectsForCircle(
            glowData.circle.id, glowData.viewerId
        );
        
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
     * OPTIMIZED: Process all circles within a single viewer with batched explicit effects
     */
    processViewerCircles(viewerCircles, viewerId, newActiveViewers, newEffects) {
        const { glowCircles, exciterCircles, dampenerCircles } = this.categorizeCirclesByEnergyType(viewerCircles);
        
        // Check for explicit energy connections (batch check)
        let hasExplicitInfluencers = false;
        if (this.explicitDetector) {
            // Quick check: does this viewer have any explicit connections at all?
            hasExplicitInfluencers = this.explicitDetector.shouldUpdateViewerIndex(viewerId) || 
                                   (this.explicitDetector.viewerConnectionCounts.get(viewerId) || 0) > 0;
        }
        
        // Skip processing this viewer if no proximity OR explicit influencers
        if (!this.hasEnergyInfluencers(exciterCircles, dampenerCircles) && !hasExplicitInfluencers) {
            return;
        }

        // Mark this viewer as active since it has energy influencers (proximity or explicit)
        newActiveViewers.add(viewerId);

        // Calculate effects for each glow circle within this viewer
        glowCircles.forEach(glowData => {
            const effect = this.processGlowCircle(glowData, exciterCircles, dampenerCircles);
            if (effect) {
                newEffects.set(effect.circleId, {
                    scale: effect.scale,
                    opacity: effect.opacity,
                    saturation: effect.saturation,
                    shouldIgnite: effect.shouldIgnite
                });
                
                // Handle ignition - activate the circle and trigger animation
                if (effect.shouldIgnite) {
                    this.handleIgnition(effect.circleId);
                }
            }
        });
    }

    /**
     * NEW: Update explicit effects at lower frequency
     */
    shouldUpdateExplicitEffects() {
        const now = Date.now();
        return this.forceExplicitUpdate || 
               (now - this.lastExplicitUpdate) >= this.explicitUpdateInterval;
    }

    /**
     * NEW: Batch update explicit effects for all viewers
     */
    updateExplicitEffects() {
        if (!this.explicitDetector) return;

        // Simply mark that explicit effects should be recalculated
        // The actual calculation happens lazily in getExplicitEffectsForCircle
        this.lastExplicitUpdate = Date.now();
        this.forceExplicitUpdate = false;
        
        if (this.explicitDetector.markClean) {
            this.explicitDetector.markClean();
        }
    }

    /**
     * OPTIMIZED: Main update method with separated frequencies
     */
	updateProximityEffects() {
		if (!this.isActive) {
			return;
		}

		// Always update explicit effects immediately (no caching delays)
		if (this.explicitDetector) {
			this.explicitDetector.markClean();
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

applyProximityEffects(effects) {
        const config = this.calculator.visualEffectsCalculator.config;
    const circlesByViewer = this.groupCirclesByViewer();

    circlesByViewer.forEach((viewerCircles, viewerId) => {
        const hasAnyEnergyInfluencers = this.checkForEnergyInfluencers(viewerId, viewerCircles);

        viewerCircles.forEach((data) => { // data is the circle data object directly
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

checkForEnergyInfluencers(viewerId, viewerCircles) {
    // Check for proximity influencers
    const hasProximityInfluencers = viewerCircles.some((data) => {
        const circle = data.circle; // data is the circle data object directly
        return (this.hasEnergyType(circle, 'exciter') || 
                this.hasEnergyType(circle, 'igniter') || 
                this.hasEnergyType(circle, 'dampener')) && 
               this.isCircleActivated(circle);
    });
    
    // Check for explicit influencers using cached connection count
    let hasExplicitInfluencers = false;
    if (this.explicitDetector) {
        const connectionCount = this.explicitDetector.viewerConnectionCounts.get(viewerId) || 0;
        hasExplicitInfluencers = connectionCount > 0;
    }
    
    return hasProximityInfluencers || hasExplicitInfluencers;
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
        
        // Force explicit effects update since activation changed
        this.invalidateExplicitEffects();
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
        const config = this.calculator.visualEffectsCalculator.config;
        this.proximityEffects.forEach((effect, circleId) => {
            const data = this.circles.get(circleId);
            if (data && data.element) {
                this.setElementProximityEffects(data.element, config.minScale, config.maxOpacity, config.maxSaturation);
            }
        });
        this.proximityEffects.clear();
        this.explicitEffects.clear(); // Clear explicit effects cache
        this.activeViewers.value.clear();
    }

    /**
     * Force an immediate update (useful during drag operations)
     */
	forceUpdate() {
		this.updateProximityEffects();
	}

    /**
     * Clear all registered circles and effects
     */
    clear() {
        this.resetAllProximityEffects();
        this.circles.clear();
        this.proximityEffects.clear();
        this.explicitEffects.clear();
        this.activeViewers.value.clear();
    }

    /**
     * Get debug information about both proximity and explicit effects for a circle
     */
    getDebugInfo(circleId, viewerId) {
        const debugInfo = {
            circleId,
            viewerId,
            proximityEffects: {
                registered: this.circles.has(circleId),
                hasEffect: this.proximityEffects.has(circleId)
            },
            explicitEffects: null,
            cacheStats: {
                explicitEffectsCount: this.explicitEffects.size,
                lastExplicitUpdate: this.lastExplicitUpdate,
                explicitUpdateInterval: this.explicitUpdateInterval,
                forceExplicitUpdate: this.forceExplicitUpdate
            }
        };

        if (this.explicitDetector) {
            debugInfo.explicitEffects = this.explicitDetector.getDebugInfo(circleId, viewerId);
        }

        if (this.proximityEffects.has(circleId)) {
            debugInfo.currentEffect = this.proximityEffects.get(circleId);
        }

        return debugInfo;
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
