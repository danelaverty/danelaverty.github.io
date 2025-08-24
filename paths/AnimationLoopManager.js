// AnimationLoopManager.js - Manages animation loops for CircleViewers
import { ref, reactive } from './vue-composition-api.js';

export class AnimationLoopManager {
    constructor() {
        this.activeLoops = new Map(); // viewerId -> loop data
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.isRunning = false;
    }

    /**
     * Start animation loop for a specific viewer
     */
    startLoop(viewerId, circles, viewerWidth, duration = 3000) {
        // Stop existing loop if any
        this.stopLoop(viewerId);

        // Find attractors and attractees
        const attractors = circles.filter(circle => 
            circle.energyTypes?.includes('attractor') && circle.activation === 'activated'
        );
        const attractees = circles.filter(circle => 
            circle.energyTypes?.includes('attractee') && circle.activation === 'activated'
        );

        // Only start loop if we have both attractors and attractees
        if (attractors.length === 0 || attractees.length === 0) {
            console.log(`[AnimationLoop] Viewer ${viewerId}: No valid attractor/attractee pairs found`);
            return false;
        }

        console.log(`[AnimationLoop] Starting loop for viewer ${viewerId}`, {
            attractors: attractors.length,
            attractees: attractees.length,
            duration
        });

        // Create copies of attractees and store original positions
        const attracteeCopies = attractees.map(attractee => ({
            id: `${attractee.id}_copy`,
            originalId: attractee.id,
            x: attractee.x,
            y: attractee.y,
            startX: attractee.x,
            startY: attractee.y,
            name: attractee.name,
            type: attractee.type,
            color: attractee.color,
            colors: attractee.colors ? [...attractee.colors] : [attractee.color],
            emoji: attractee.emoji,
            energyTypes: [...(attractee.energyTypes || [])],
            activation: attractee.activation,
            referenceID: attractee.referenceID,
            isAnimationCopy: true
        }));

        // Store loop data
        this.activeLoops.set(viewerId, {
            viewerId,
            viewerWidth,
            duration,
            startTime: performance.now(),
            attractors: [...attractors],
            attractees: [...attractees],
            attracteeCopies: attracteeCopies,
            isActive: true
        });

        // Dim original attractees
        this.dimOriginalAttractees(attractees);

        // Start the animation frame loop if not already running
        this.startAnimationFrame();

        return true;
    }

    /**
     * Stop animation loop for a specific viewer
     */
    stopLoop(viewerId) {
        const loopData = this.activeLoops.get(viewerId);
        if (!loopData) return false;

        console.log(`[AnimationLoop] Stopping loop for viewer ${viewerId}`);

        // Restore original attractees
        this.restoreOriginalAttractees(loopData.attractees);

        // Remove loop data
        this.activeLoops.delete(viewerId);

        // Stop animation frame if no loops are active
        if (this.activeLoops.size === 0) {
            this.stopAnimationFrame();
        }

        // Notify that copies should be removed
        this.notifyLoopStopped(viewerId, loopData.attracteeCopies);

        return true;
    }

    /**
     * Check if a viewer has an active animation loop
     */
    isLoopActive(viewerId) {
        return this.activeLoops.has(viewerId);
    }

    /**
     * Get animation copies for a viewer (for rendering)
     */
    getAnimationCopies(viewerId) {
        const loopData = this.activeLoops.get(viewerId);
        return loopData ? loopData.attracteeCopies : [];
    }

    /**
     * Update loop parameters (e.g., when circles change)
     */
    updateLoop(viewerId, circles, viewerWidth) {
        const loopData = this.activeLoops.get(viewerId);
        if (!loopData) return false;

        // Find current attractors and attractees
        const attractors = circles.filter(circle => 
            circle.energyTypes?.includes('attractor') && circle.activation === 'activated'
        );
        const attractees = circles.filter(circle => 
            circle.energyTypes?.includes('attractee') && circle.activation === 'activated'
        );

        // If no valid pairs, stop the loop
        if (attractors.length === 0 || attractees.length === 0) {
            this.stopLoop(viewerId);
            return false;
        }

        // Update loop data
        loopData.attractors = [...attractors];
        loopData.attractees = [...attractees];
        loopData.viewerWidth = viewerWidth;

        return true;
    }

    /**
     * Start the master animation frame loop
     */
    startAnimationFrame() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.animate();
    }

    /**
     * Stop the master animation frame loop
     */
    stopAnimationFrame() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.isRunning = false;
    }

    /**
     * Main animation loop
     */
    animate = () => {
        const currentTime = performance.now();
        
        // Update all active loops
        for (const [viewerId, loopData] of this.activeLoops) {
            this.updateLoopFrame(loopData, currentTime);
        }

        // Continue animation if we have active loops
        if (this.activeLoops.size > 0) {
            this.animationFrameId = requestAnimationFrame(this.animate);
        } else {
            this.isRunning = false;
        }
    };

    /**
     * Update a single loop frame
     */
    updateLoopFrame(loopData, currentTime) {
        if (!loopData.isActive) return;

        const elapsed = currentTime - loopData.startTime;
        const progress = (elapsed % loopData.duration) / loopData.duration;

        // Reset loop if we've completed a cycle
        if (elapsed > 0 && elapsed % loopData.duration < 16) { // ~60fps threshold
            this.resetLoopPositions(loopData);
            loopData.startTime = currentTime;
            return;
        }

        // Update positions of attractee copies using smooth easing
        const easedProgress = this.easeInOutCubic(progress);
        
        loopData.attracteeCopies.forEach(copy => {
            const forces = this.calculateAttractionForces(
                copy, 
                loopData.attractors, 
                loopData.viewerWidth
            );
            
            // Apply forces with easing
            copy.x = copy.startX + (forces.totalX * easedProgress);
            copy.y = copy.startY + (forces.totalY * easedProgress);
        });

        // Notify about position updates
        this.notifyPositionUpdate(loopData.viewerId, loopData.attracteeCopies);
    }

    /**
     * Calculate attraction forces from all attractors
     */
    calculateAttractionForces(attractee, attractors, viewerWidth) {
        let totalForceX = 0;
        let totalForceY = 0;

        const centerX = viewerWidth / 2;
        const attracteeAbsX = centerX + attractee.startX + 16; // Circle center offset
        const attracteeAbsY = attractee.startY + 16;

        attractors.forEach(attractor => {
            const attractorAbsX = centerX + attractor.x + 16;
            const attractorAbsY = attractor.y + 16;

            // Calculate distance vector
            const dx = attractorAbsX - attracteeAbsX;
            const dy = attractorAbsY - attracteeAbsY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                // Normalize and apply force (with distance falloff)
                const force = Math.min(1, 200 / Math.max(distance, 50)); // Max force at close distance
                const normalizedX = dx / distance;
                const normalizedY = dy / distance;

                totalForceX += normalizedX * force * 150; // Scale factor for visual effect
                totalForceY += normalizedY * force * 150;
            }
        });

        return {
            totalX: totalForceX,
            totalY: totalForceY
        };
    }

    /**
     * Reset attractee copies to starting positions
     */
    resetLoopPositions(loopData) {
        loopData.attracteeCopies.forEach(copy => {
            copy.x = copy.startX;
            copy.y = copy.startY;
        });
    }

    /**
     * Dim original attractees during animation
     */
    dimOriginalAttractees(attractees) {
        // This will be handled by the proximity system or entity rendering
        // For now, we just mark them as dimmed in the animation state
        attractees.forEach(attractee => {
            attractee._isAnimationDimmed = true;
        });
    }

    /**
     * Restore original attractees when animation stops
     */
    restoreOriginalAttractees(attractees) {
        attractees.forEach(attractee => {
            delete attractee._isAnimationDimmed;
        });
    }

    /**
     * Cubic ease-in-out function for smooth animation
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Notify about position updates (to be overridden by external listeners)
     */
    notifyPositionUpdate(viewerId, copies) {
        // This method can be overridden or extended by components that need to know about updates
        window.dispatchEvent(new CustomEvent('animationLoopUpdate', {
            detail: { viewerId, copies }
        }));
    }

    /**
     * Notify that a loop has stopped (for cleanup)
     */
    notifyLoopStopped(viewerId, copies) {
        window.dispatchEvent(new CustomEvent('animationLoopStopped', {
            detail: { viewerId, copies: copies.map(c => c.id) }
        }));
    }

    /**
     * Cleanup all loops (for app shutdown)
     */
    cleanup() {
        // Stop all active loops
        const viewerIds = Array.from(this.activeLoops.keys());
        viewerIds.forEach(viewerId => this.stopLoop(viewerId));
        
        // Stop animation frame
        this.stopAnimationFrame();
    }
}

// Create singleton instance
let animationLoopManagerInstance = null;

export function useAnimationLoopManager() {
    if (!animationLoopManagerInstance) {
        animationLoopManagerInstance = new AnimationLoopManager();
    }
    return animationLoopManagerInstance;
}
