// HandleAnimationSystem.js - System for managing handle yank animations

export class HandleAnimationSystem {
    constructor() {
        this.dataStore = null;
        this.intervalId = null;
        this.isRunning = false;
        this.animationInterval = 1;
        this.activeAnimations = new Set();

        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    handleVisibilityChange() {
        // When tab becomes visible again, reset all animated elements
        if (!document.hidden) {
            this.resetAllAnimatedElements();
        }
    }

    resetAllAnimatedElements() {
        // Get all circle elements that might have been animated
        const circleElements = document.querySelectorAll('[data-entity-id]');

        circleElements.forEach(element => {
            // Reset to default transform (centered position)
            element.style.transition = 'none'; // No transition for immediate reset
            element.style.transform = 'translate(-50%, -50%)';

            // Restore normal transition after reset
            setTimeout(() => {
                element.style.transition = 'transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease';
            }, 50);
        });

        // Clear any active animations since we're resetting
        this.activeAnimations.clear();
    }

    setDataStore(dataStore) {
        this.dataStore = dataStore;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.checkAndTriggerHandleAnimations();
        }, this.animationInterval);
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    checkAndTriggerHandleAnimations() {
        // Get all circles that are active handles
        const activeHandles = this.getActiveHandles();
        
        activeHandles.forEach(handle => {
            this.triggerHandleYankAnimation(handle);
        });
    }

    getActiveHandles() {
        // FIXED: Get only visible circles by checking each viewer's document
        const visibleCircles = this.getVisibleCircles();
        
        if (visibleCircles.length === 0) {
            console.warn('No visible circles found');
            return [];
        }
        
        const activeHandles = visibleCircles.filter(circle => {
            if (circle.handle !== 'yes') { return false; }
            if (!circle.belongsToID) { return false; }
            if (circle.activation !== 'activated') { return false; }
            const connections = this.getConnectionsForCircle(circle.id);
            return connections.length > 0;
        });
        
        return activeHandles;
    }

    // NEW: Get all visible circles from all viewers
    getVisibleCircles() {
        const allVisibleCircles = [];
        
        // FIXED: Access viewers correctly - they're in the dataStore's data.circleViewers Map
        let viewers;
        
        // Try different ways to access the viewers based on how dataStore might be structured
        if (this.dataStore.data && this.dataStore.data.circleViewers) {
            // If dataStore.data.circleViewers is a Map
            if (this.dataStore.data.circleViewers instanceof Map) {
                viewers = Array.from(this.dataStore.data.circleViewers.values());
            } else {
                viewers = this.dataStore.data.circleViewers;
            }
        } else if (this.dataStore.getVisibleCircleViewers) {
            // Use the dataStore method if available
            viewers = this.dataStore.getVisibleCircleViewers();
        } else {
            console.warn('No circle viewers found in dataStore. Available properties:', Object.keys(this.dataStore));
            console.warn('dataStore.data properties:', this.dataStore.data ? Object.keys(this.dataStore.data) : 'no data property');
            return [];
        }
        
        if (!viewers || viewers.length === 0) {
            console.warn('No viewers available');
            return [];
        }
        
        // For each viewer, get its document and then get circles for that document
        viewers.forEach(viewer => {
            if (viewer.currentCircleDocumentId) {
                const circlesInDocument = this.dataStore.getCirclesForDocument ? 
                    this.dataStore.getCirclesForDocument(viewer.currentCircleDocumentId) : 
                    [];
                allVisibleCircles.push(...circlesInDocument);
            }
        });
        
        // Remove duplicates (in case multiple viewers show the same document)
        const uniqueCircles = Array.from(
            new Map(allVisibleCircles.map(circle => [circle.id, circle])).values()
        );
        
        return uniqueCircles;
    }

    getConnectionsForCircle(circleId) {
        if (!this.dataStore.getExplicitConnectionBetweenEntities) {
            return [];
        }
        
        // Get the handle circle to find its viewer/document
        const handleCircle = this.dataStore.getCircle(circleId);
        if (!handleCircle) {
            return [];
        }
        
        // FIXED: Get only visible circles in the same document using our new method
        const visibleCircles = this.getVisibleCircles().filter(circle => 
            circle.documentId === handleCircle.documentId && circle.id !== circleId
        );
        
        const connections = [];
        
        visibleCircles.forEach(otherCircle => {
            try {
                // FIXED: Use the correct method signature for getExplicitConnectionBetweenEntities
                // The method expects (id1, type1, id2, type2)
                const connection1 = this.dataStore.getExplicitConnectionBetweenEntities(
                    circleId, 'circle', otherCircle.id, 'circle'
                );
                const connection2 = this.dataStore.getExplicitConnectionBetweenEntities(
                    otherCircle.id, 'circle', circleId, 'circle'
                );
                
                if (connection1) {
                    connections.push({
                        connection: connection1,
                        targetCircleId: otherCircle.id
                    });
                } else if (connection2) {
                    connections.push({
                        connection: connection2,
                        targetCircleId: otherCircle.id
                    });
                }
            } catch (error) {
                console.error(`Error checking connection between ${circleId} and ${otherCircle.id}:`, error);
            }
        });
        
        return connections;
    }

    triggerHandleYankAnimation(handleCircle) {
        const connections = this.getConnectionsForCircle(handleCircle.id);
        
        connections.forEach(({ connection, targetCircleId }) => {
            // Skip if this handle-target pair is already animating
            const animationKey = `${handleCircle.id}-${targetCircleId}`;
            if (this.activeAnimations.has(animationKey)) return;
            
            this.executeYankAnimation(handleCircle.id, targetCircleId, animationKey);
        });
    }

executeYankAnimation(handleCircleId, targetCircleId, animationKey) {
    // Mark animation as active
    this.activeAnimations.add(animationKey);
    
    const handleElement = document.querySelector(`[data-entity-id="${handleCircleId}"]`);
    const targetElement = document.querySelector(`[data-entity-id="${targetCircleId}"]`);
    
    if (!handleElement || !targetElement) {
        this.activeAnimations.delete(animationKey);
        return;
    }

    // Calculate direction from handle to target
    const handleCircle = this.dataStore.getCircle(handleCircleId);
    const targetCircle = this.dataStore.getCircle(targetCircleId);
    
    if (!handleCircle || !targetCircle) {
        this.activeAnimations.delete(animationKey);
        return;
    }

    if (targetCircle.belongsToID == handleCircle.belongsToID) {
        this.activeAnimations.delete(animationKey);
        return;
    }

    const dx = targetCircle.x - handleCircle.x;
    const dy = targetCircle.y - handleCircle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize direction and calculate yank distance (proportional to connection distance)
    const yankDistance = Math.min(distance * 0.15, 10); // 15% of distance, max 30px
    const yankDx = distance > 0 ? (dx / distance) * yankDistance : 0;
    const yankDy = distance > 0 ? (dy / distance) * yankDistance : 0;

    // First yank - Apply yank animation to handle (pulls away from target)
    this.applyYankToElement(handleElement, -yankDx, -yankDy);
    
    // First yank - Apply yank animation to target (delayed, pulls toward handle)
    // FIX: Negate the direction so target moves TOWARD handle, not away
    setTimeout(() => {
        this.applyYankToElement(targetElement, -yankDx * 0.8, -yankDy * 0.8); // Move toward handle
    }, 100); // 150ms delay for cause-effect
    
    // Second yank - repeat the animation after a short pause
    setTimeout(() => {
        this.applyYankToElement(handleElement, -yankDx, -yankDy);
        
        setTimeout(() => {
            this.applyYankToElement(targetElement, -yankDx * 0.8, -yankDy * 0.8);
        }, 100);
    }, 300); // Start second yank after first one completes (200ms + 600ms + 400ms buffer)

    // Clean up animation tracking after both animations complete
    setTimeout(() => {
        this.activeAnimations.delete(animationKey);
    }, 2200); // Extended duration for double yank
}

    applyYankToElement(element, deltaX, deltaY) {
        if (!element) return;

        // Store original transform
        const originalTransform = element.style.transform || 'translate(-50%, -50%)';
        
        // Quick jerk phase (200ms)
        element.style.transition = 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        element.style.transform = `${originalTransform} translate(${deltaX}px, ${deltaY}px)`;
        
        // Slow return phase (600ms)
        setTimeout(() => {
            element.style.transition = 'transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)';
            element.style.transform = originalTransform;
            
            // Clear transition after animation
            setTimeout(() => {
                element.style.transition = 'transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease';
            }, 600);
        }, 200);
    }

    // Method to be called when circles are updated
    onCircleUpdated(circleId, updates) {
        // If handle, activation, or group membership changed, we might need to start/stop animations
        if (updates.handle !== undefined || 
            updates.activation !== undefined || 
            updates.belongsToID !== undefined) {
            
            // Let the next interval cycle handle the change
            // This prevents immediate animation triggering on property changes
        }
    }

    // Method to be called when connections change
    onConnectionsChanged() {
        // Connections changed, let next cycle handle it
        // This prevents immediate animation triggering on connection changes
    }

    destroy() {
        this.stop();
        this.activeAnimations.clear();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}
