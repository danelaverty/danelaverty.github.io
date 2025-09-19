// EnergyProximitySystem.js - Main coordinator (refactored and fixed)
import { ref } from './vue-composition-api.js';
import { EnergyEffectsCoordinator } from './EnergyEffectsCoordinator.js';
import { ExplicitEnergyDetector } from './ExplicitEnergyDetector.js';
import { EPSCircleManager } from './EPSCircleManager.js';
import { EPSProximityCalculator } from './EPSProximityCalculator.js';
import { EPSEffectsApplicator } from './EPSEffectsApplicator.js';
import { EPSCascadeManager } from './EPSCascadeManager.js';

export class EnergyProximitySystem {
    constructor() {
        this.isActive = false;
        this.proximityEffects = new Map(); // Map of affected circle ids to their current effects
        this.explicitEffects = new Map(); // Separate cache for explicit effects
        this.activeViewers = ref(new Set()); // Make this reactive
        this.animationFrame = null;
        this.dataStore = null; // Reference to data store for ignition and explicit connections
        
        // Separated update timing
        this.lastExplicitUpdate = 0;
        this.explicitUpdateInterval = 200; // Update explicit effects every 200ms (5 FPS)
        this.forceExplicitUpdate = false; // Flag to force immediate explicit update
        
        // Initialize components
        this.calculator = new EnergyEffectsCoordinator();
        this.circleManager = new EPSCircleManager();
        this.proximityCalculator = new EPSProximityCalculator(this.calculator, this.circleManager);
        this.effectsApplicator = new EPSEffectsApplicator(this.calculator, this.circleManager);
        this.cascadeManager = new EPSCascadeManager();
        
        // Set up cascade manager with active viewers reference
        this.cascadeManager.setActiveViewers(this.activeViewers);
        
        this.explicitDetector = null;
    }

    /**
     * Set the data store reference for ignition functionality and explicit connections
     */
    setDataStore(dataStore) {
        this.dataStore = dataStore;
        this.effectsApplicator.setDataStore(dataStore);
        
        // Initialize explicit energy detector
        this.explicitDetector = new ExplicitEnergyDetector(dataStore);
    }

    /**
     * Get connection cascade state for UI components
     */
    getConnectionCascadeState(connectionId) {
        if (this.explicitDetector && this.explicitDetector.cascadeEffectCalculator) {
            return this.explicitDetector.cascadeEffectCalculator.getConnectionCascadeState(connectionId);
        }
        return null;
    }

    /**
     * Get all active cascade connections for a viewer
     */
    getActiveCascadeConnectionsForViewer(viewerId) {
        if (this.explicitDetector && this.explicitDetector.cascadeEffectCalculator) {
            return this.explicitDetector.cascadeEffectCalculator.getActiveCascadeConnectionsForViewer(viewerId);
        }
        return new Map();
    }

    /**
     * Check if a connection is currently carrying cascaded energy
     */
    isConnectionCarryingCascadeEnergy(connectionId) {
        const cascadeState = this.getConnectionCascadeState(connectionId);
        return cascadeState && cascadeState.isActive;
    }

    /**
     * Get energy type being carried by a connection
     */
    getConnectionEnergyType(connectionId) {
        const cascadeState = this.getConnectionCascadeState(connectionId);
        return cascadeState ? cascadeState.energyType : null;
    }

    /**
     * Check if a viewer has explicit energy connections using the public API
     */
    hasExplicitInfluencers(viewerId) {
        if (!this.explicitDetector) {
            return false;
        }
        
        // Use the public hasConnections method from the connection index manager
        return this.explicitDetector.connectionIndexManager.hasConnections(viewerId);
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
        
        this.cascadeManager.clear();
        this.effectsApplicator.resetAllProximityEffects(this.proximityEffects);
        this.activeViewers.value.clear();
        this.proximityEffects.clear();
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
     * Force explicit effects update with debouncing
     */
    invalidateExplicitEffects(viewerId = null) {
        this.cascadeManager.scheduleExplicitEffectsUpdate(viewerId, (viewersToUpdate) => {
            // Clear cache for queued viewers
            if (this.explicitDetector) {
                viewersToUpdate.forEach(vid => {
                    this.explicitDetector.invalidateCache(vid);
                });
            }
            
            // Clear effects cache and trigger cascading update
            this.explicitEffects.clear();
            this.updateProximityEffectsWithCascading();
        });
    }

    /**
     * Force immediate explicit effects update
     */
    invalidateExplicitEffectsImmediate(viewerId = null) {
        if (this.explicitDetector) {
            this.explicitDetector.invalidateCache(viewerId);
        }
        this.explicitEffects.clear();
        
        // Clear any pending cascades for this viewer
        if (viewerId) {
            this.cascadeManager.clearCascadeTimeouts(viewerId);
        } else {
            this.cascadeManager.clearAllCascadeTimeouts();
        }
        
        this.updateProximityEffectsWithCascading();
    }

    /**
     * Register a circle with the proximity system
     */
    registerCircle(id, circle, element, viewerWidth, viewerId) {
        const success = this.circleManager.registerCircle(id, circle, element, viewerWidth, viewerId);
        if (success && this.isActive) {
            this.updateProximityEffects();
        }
        return success;
    }

    /**
     * Unregister a circle from the proximity system
     */
    unregisterCircle(id) {
        // Reset scale before removing
        const data = this.circleManager.getCircleData(id);
        if (data && data.element) {
            const config = this.calculator.visualEffectsCalculator.config;
            this.effectsApplicator.setElementProximityEffects(data.element, 1.0, config.maxOpacity, config.maxSaturation);
        }
        
        // Clear effects
        this.proximityEffects.delete(id);
        this.explicitEffects.delete(id);
        
        this.circleManager.unregisterCircle(id);
        
        if (this.isActive) {
            this.updateProximityEffects();
        }
    }

    /**
     * Update circle data
     */
    updateCircle(id, circle, element, viewerWidth, viewerId) {
        const success = this.circleManager.updateCircle(id, circle, element, viewerWidth, viewerId);
        if (success && this.isActive) {
            this.updateProximityEffects();
        }
        return success;
    }

    /**
     * Set temporary position for a circle during drag operations
     */
    setTempPosition(id, x, y) {
        this.circleManager.setTempPosition(id, x, y);
    }

    /**
     * Clear temporary position for a circle
     */
    clearTempPosition(id) {
        this.circleManager.clearTempPosition(id);
    }

    /**
     * Get explicit effects for a circle with depth filtering
     * Uses the public API methods from the refactored detector
     */
    getExplicitEffectsForCircleWithDepth(circleId, viewerId, maxDepth = null) {
        if (!this.explicitDetector) {
            return { exciterEffects: [], dampenerEffects: [] };
        }

        // Use the public methods that are still available after refactoring
        const exciterEffects = this.explicitDetector.cascadeEffectCalculator.findConnectedExciters(circleId, viewerId);
        const dampenerEffects = this.explicitDetector.cascadeEffectCalculator.findConnectedDampeners(circleId, viewerId);

        if (maxDepth !== null) {
            return {
                exciterEffects: exciterEffects.filter(effect => (effect.cascadeDepth || 0) <= maxDepth),
                dampenerEffects: dampenerEffects.filter(effect => (effect.cascadeDepth || 0) <= maxDepth)
            };
        }

        return { exciterEffects, dampenerEffects };
    }

    /**
     * Apply effects for a specific cascade depth
     */
    applyCascadeDepth(viewerId, depth) {
        const newEffects = new Map();
        const newActiveViewers = new Set();

        const circlesByViewer = this.circleManager.groupCirclesByViewer();
        const viewerCircles = circlesByViewer.get(viewerId) || [];

        if (viewerCircles.length === 0) return;

        const { glowCircles, exciterCircles, dampenerCircles } = this.circleManager.categorizeCirclesByEnergyType(viewerCircles);
        
        // FIXED: Use the correct method to check for explicit influencers
        const hasExplicitInfluencers = this.hasExplicitInfluencers(viewerId);
        
        // Skip processing this viewer if no influencers
        if (!this.proximityCalculator.hasEnergyInfluencers(exciterCircles, dampenerCircles) && !hasExplicitInfluencers) {
            return;
        }

        newActiveViewers.add(viewerId);

        // Calculate effects for each glow circle within this viewer
        glowCircles.forEach(glowData => {
            const effect = this.proximityCalculator.processGlowCircleWithDepth(
                glowData, exciterCircles, dampenerCircles, 
                //(circleId, vid, maxD) => this.getExplicitEffectsForCircleWithDepth(circleId, vid, maxD),
                (circleId, vid, maxD) => this.getExplicitEffectsForCircleWithDepth(circleId, vid, depth),
                depth
            );
            
            if (effect) {
                newEffects.set(effect.circleId, {
                    scale: effect.scale,
                    opacity: effect.opacity,
                    saturation: effect.saturation,
                    shouldIgnite: effect.shouldIgnite
                });
                
                // Handle ignition
                if (effect.shouldIgnite) {
                    const ignitionOccurred = this.effectsApplicator.handleIgnition(effect.circleId);
                    if (ignitionOccurred) {
                        this.invalidateExplicitEffects();
                    }
                }
            }
        });

        // Update active viewers and apply effects
        this.activeViewers.value = new Set([...this.activeViewers.value, ...newActiveViewers]);
        this.effectsApplicator.applyProximityEffectsForViewer(newEffects, viewerId);
        
        // Merge with existing effects
        newEffects.forEach((effect, circleId) => {
            this.proximityEffects.set(circleId, effect);
        });

        // Mark this depth as applied
        this.cascadeManager.markDepthApplied(viewerId, depth);
    }

    /**
     * Update proximity effects with cascading delays
     */
    updateProximityEffectsWithCascading() {
        if (!this.isActive) return;

        // Always update explicit effects immediately
        if (this.explicitDetector) {
            this.explicitDetector.markClean();
        }

        // Group circles by viewer for isolated processing
        const circlesByViewer = this.circleManager.groupCirclesByViewer();

        // Process each viewer separately with cascading
        circlesByViewer.forEach((viewerCircles, viewerId) => {
            this.cascadeManager.processViewerWithCascading(
                viewerCircles, 
                viewerId, 
                this.explicitDetector,
                (vid, depth) => this.applyCascadeDepth(vid, depth)
            );
        });
    }

    /**
     * Main update method
     */
    updateProximityEffects() {
        if (!this.isActive) return;

        if (this.explicitDetector) {
            this.updateProximityEffectsWithCascading();
        } else {
            this.updateProximityEffectsRegular();
        }
    }

    /**
     * Fallback: Regular update method without cascading
     */
    updateProximityEffectsRegular() {
        if (this.explicitDetector) {
            this.explicitDetector.markClean();
        }

        const newEffects = new Map();
        const newActiveViewers = new Set();
        const circlesByViewer = this.circleManager.groupCirclesByViewer();

        circlesByViewer.forEach((viewerCircles, viewerId) => {
            this.processViewerCircles(viewerCircles, viewerId, newActiveViewers, newEffects);
        });

        this.activeViewers.value = newActiveViewers;
        this.effectsApplicator.applyProximityEffects(newEffects);
        this.proximityEffects = newEffects;
    }

    /**
     * Process all circles within a single viewer (fallback method)
     */
    processViewerCircles(viewerCircles, viewerId, newActiveViewers, newEffects) {
        const { glowCircles, exciterCircles, dampenerCircles } = this.circleManager.categorizeCirclesByEnergyType(viewerCircles);
        
        // FIXED: Use the correct method to check for explicit influencers
        const hasExplicitInfluencers = this.hasExplicitInfluencers(viewerId);
        
        if (!this.proximityCalculator.hasEnergyInfluencers(exciterCircles, dampenerCircles) && !hasExplicitInfluencers) {
            return;
        }

        newActiveViewers.add(viewerId);

        glowCircles.forEach(glowData => {
            const effect = this.proximityCalculator.processGlowCircle(
                glowData, exciterCircles, dampenerCircles,
                (circleId, vid, maxD) => this.getExplicitEffectsForCircleWithDepth(circleId, vid, maxD)
            );
            
            if (effect) {
                newEffects.set(effect.circleId, {
                    scale: effect.scale,
                    opacity: effect.opacity,
                    saturation: effect.saturation,
                    shouldIgnite: effect.shouldIgnite
                });
                
                if (effect.shouldIgnite) {
                    const ignitionOccurred = this.effectsApplicator.handleIgnition(effect.circleId);
                    if (ignitionOccurred) {
                        this.invalidateExplicitEffects();
                    }
                }
            }
        });
    }

    /**
     * Force an immediate update
     */
    forceUpdate() {
        this.updateProximityEffects();
    }

    /**
     * Clear all registered circles and effects
     */
    clear() {
        this.cascadeManager.clear();
        this.effectsApplicator.resetAllProximityEffects(this.proximityEffects);
        this.circleManager.clear();
        this.proximityEffects.clear();
        this.explicitEffects.clear();
        this.activeViewers.value.clear();
    }

    /**
     * Get debug information
     */
    getDebugInfo(circleId, viewerId) {
        const debugInfo = {
            circleId,
            viewerId,
            proximityEffects: {
                registered: this.circleManager.getAllCircles().has(circleId),
                hasEffect: this.proximityEffects.has(circleId)
            },
            explicitEffects: null,
            cascadeInfo: {
                activeCascades: this.cascadeManager.activeCascadeTimeouts.has(viewerId),
                appliedDepths: Array.from(this.cascadeManager.getAppliedDepths(viewerId)),
                bufferedEffects: this.cascadeManager.cascadeEffectsBuffer.has(circleId)
            },
            connectionStates: this.getActiveCascadeConnectionsForViewer(viewerId),
            cacheStats: {
                explicitEffectsCount: this.explicitEffects.size,
                lastExplicitUpdate: this.lastExplicitUpdate,
                explicitUpdateInterval: this.explicitUpdateInterval,
                forceExplicitUpdate: this.forceExplicitUpdate,
                cascadeBufferSize: this.cascadeManager.cascadeEffectsBuffer.size
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
    
    if (dataStore) {
        proximitySystemInstance.setDataStore(dataStore);
    }
    
    return proximitySystemInstance;
}
