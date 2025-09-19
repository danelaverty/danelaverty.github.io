export class EPSCascadeManager {
    constructor() {
        // Cascading delay system
        this.cascadeDelayInterval = 500; // 500ms between cascade levels
        this.activeCascadeTimeouts = new Map(); // viewerId -> Set of timeout IDs
        this.cascadeEffectsBuffer = new Map(); // circleId -> {effects, depth, timestamp}
        this.appliedCascadeDepths = new Map(); // viewerId -> Set of applied depths for current cascade
        
        // Explicit effects debouncing
        this.explicitEffectsQueue = new Set();
        this.explicitEffectsTimeout = null;
        this.explicitEffectsDelay = 500;
    }

calculateMaxCascadeDepth(viewerCircles, viewerId, explicitDetector) {
    let maxDepth = 0;
    
    const samplesToCheck = Math.min(5, viewerCircles.length);
    for (let i = 0; i < samplesToCheck; i++) {
        const sampleCircle = viewerCircles[i];
        if (sampleCircle && sampleCircle.circle) {
            const exciterEffects = explicitDetector.cascadeEffectCalculator.findConnectedExciters(
                sampleCircle.circle.id, 
                viewerId
            );
            const dampenerEffects = explicitDetector.cascadeEffectCalculator.findConnectedDampeners(
                sampleCircle.circle.id, 
                viewerId
            );
            
            const circleMaxDepth = Math.max(
                ...exciterEffects.map(e => e.cascadeDepth || 0),
                ...dampenerEffects.map(e => e.cascadeDepth || 0),
                0
            );
            
            maxDepth = Math.max(maxDepth, circleMaxDepth);
        }
    }
    
    return maxDepth;
}

    /**
     * Schedule explicit effects update with debouncing
     */
    scheduleExplicitEffectsUpdate(viewerId = null, onUpdate = null) {
        // Add to queue (automatically deduplicates)
        if (viewerId) {
            this.explicitEffectsQueue.add(viewerId);
        } else {
            // If no specific viewer, mark all active viewers for update
            if (this.activeViewers) {
                this.activeViewers.value.forEach(activeViewerId => {
                    this.explicitEffectsQueue.add(activeViewerId);
                });
            }
        }
        
        // Reset the timeout
        if (this.explicitEffectsTimeout) {
            clearTimeout(this.explicitEffectsTimeout);
        }
        
        // Schedule processing after delay
        this.explicitEffectsTimeout = setTimeout(() => {
            this.processQueuedExplicitEffects(onUpdate);
        }, this.explicitEffectsDelay);
    }

    /**
     * Process queued explicit effects updates
     */
    processQueuedExplicitEffects(onUpdate) {
        const viewersToUpdate = Array.from(this.explicitEffectsQueue);
        this.explicitEffectsQueue.clear();
        this.explicitEffectsTimeout = null;

        // Clear cache for queued viewers if callback provided
        if (onUpdate) {
            onUpdate(viewersToUpdate);
        }
    }

    /**
     * Clear all active cascade timeouts for all viewers
     */
    clearAllCascadeTimeouts() {
        this.activeCascadeTimeouts.forEach((timeoutSet, viewerId) => {
            timeoutSet.forEach(timeoutId => clearTimeout(timeoutId));
        });
        this.activeCascadeTimeouts.clear();
    }

    /**
     * Clear cascade timeouts for a specific viewer
     */
    clearCascadeTimeouts(viewerId) {
        if (this.activeCascadeTimeouts.has(viewerId)) {
            this.activeCascadeTimeouts.get(viewerId).forEach(timeoutId => clearTimeout(timeoutId));
            this.activeCascadeTimeouts.delete(viewerId);
        }
        this.appliedCascadeDepths.delete(viewerId);
    }

    /**
     * Process a viewer with cascading delays using the robust public API
     * This approach doesn't rely on internal component structure and is future-proof
     */
    processViewerWithCascading(viewerCircles, viewerId, explicitDetector, onApplyCascadeDepth) {
        // Clear any existing cascade timeouts for this viewer
        this.clearCascadeTimeouts(viewerId);

        // Get all explicit effects to determine maximum cascade depth
        if (!explicitDetector || viewerCircles.length === 0) {
            // No explicit detector or circles, fall back to regular processing
            if (onApplyCascadeDepth) {
                onApplyCascadeDepth(viewerId, 0); // Apply depth 0 only
            }
            return;
        }

        // Find the maximum cascade depth by using the debug info which contains cascade details
        const maxDepth = this.calculateMaxCascadeDepth(viewerCircles, viewerId, explicitDetector);

        // Apply effects progressively by depth
        const timeoutSet = new Set();
        this.activeCascadeTimeouts.set(viewerId, timeoutSet);

        for (let depth = 0; depth <= maxDepth; depth++) {
            const delay = depth * this.cascadeDelayInterval;
            
            const timeoutId = setTimeout(() => {
                if (onApplyCascadeDepth) {
                    onApplyCascadeDepth(viewerId, depth);
                }
                timeoutSet.delete(timeoutId);
                
                // Clean up timeout set when all timeouts complete
                if (timeoutSet.size === 0) {
                    this.activeCascadeTimeouts.delete(viewerId);
                }
            }, delay);
            
            timeoutSet.add(timeoutId);
        }
    }

    /**
     * Mark a cascade depth as applied for a viewer
     */
    markDepthApplied(viewerId, depth) {
        if (!this.appliedCascadeDepths.has(viewerId)) {
            this.appliedCascadeDepths.set(viewerId, new Set());
        }
        this.appliedCascadeDepths.get(viewerId).add(depth);
    }

    /**
     * Check if a cascade depth has been applied for a viewer
     */
    isDepthApplied(viewerId, depth) {
        return this.appliedCascadeDepths.has(viewerId) && 
               this.appliedCascadeDepths.get(viewerId).has(depth);
    }

    /**
     * Get applied cascade depths for a viewer
     */
    getAppliedDepths(viewerId) {
        return this.appliedCascadeDepths.get(viewerId) || new Set();
    }

    /**
     * Set active viewers reference for debouncing
     */
    setActiveViewers(activeViewers) {
        this.activeViewers = activeViewers;
    }

    /**
     * Clear all cascade state
     */
    clear() {
        this.clearAllCascadeTimeouts();
        this.cascadeEffectsBuffer.clear();
        this.appliedCascadeDepths.clear();
        this.explicitEffectsQueue.clear();
        
        if (this.explicitEffectsTimeout) {
            clearTimeout(this.explicitEffectsTimeout);
            this.explicitEffectsTimeout = null;
        }
    }
}
