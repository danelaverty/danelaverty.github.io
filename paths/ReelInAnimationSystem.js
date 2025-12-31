// ReelInAnimationSystem.js - Animation system for reeling in connected circles with unreel functionality
export class ReelInAnimationSystem {
    constructor() {
        this.activeAnimations = new Map(); // circleId -> animationData
        this.animationId = 0;
        this.onPositionUpdate = null;
        this.onAnimationComplete = null;
        
        // NEW: Track original positions and group membership for unreeling
        this.originalStates = new Map(); // circleId -> { x, y, belongsToID }
        this.lastReelSession = null; // Track which circle did the reeling
    }

    setCallbacks(onPositionUpdate, onAnimationComplete) {
        this.onPositionUpdate = onPositionUpdate;
        this.onAnimationComplete = onAnimationComplete;
    }

    // Calculate target position 35px away from the target circle
    calculateTargetPosition(targetCircle, circleToMove) {
        const dx = circleToMove.x - targetCircle.x;
        const dy = circleToMove.y - targetCircle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If already very close, don't move
        if (distance <= 35) {
            return { x: circleToMove.x, y: circleToMove.y };
        }
        
        // Calculate unit vector from target to circle
        const unitX = dx / distance;
        const unitY = dy / distance;
        
        // Position 35px away from target in the same direction
        const targetX = targetCircle.x + unitX * 35;
        const targetY = targetCircle.y + unitY * 35;
        
        return { x: targetX, y: targetY };
    }

    // NEW: Save original states for unreeling
    saveOriginalStates(targetCircleId, circlesToReel) {
        this.lastReelSession = targetCircleId;
        this.originalStates.clear(); // Clear any previous session data
        
        circlesToReel.forEach(circle => {
            this.originalStates.set(circle.id, {
                x: circle.x,
                y: circle.y,
                belongsToID: circle.belongsToID
            });
        });
    }

    // NEW: Check if unreel is available for the current selection
    canUnreel(selectedCircleId) {
        return this.lastReelSession === selectedCircleId && this.originalStates.size > 0;
    }

    // NEW: Clear unreel data (when selection changes or page reloads)
    clearUnreelData() {
        this.lastReelSession = null;
        this.originalStates.clear();
    }

    // NEW: Get circles that can be unreeled
    getUnreelableCircles() {
        return Array.from(this.originalStates.keys());
    }

    // Start reeling in circles towards a target
    reelInCircles(targetCircle, circlesToReel) {
        // Stop any existing animations for these circles
        circlesToReel.forEach(circle => {
            if (this.activeAnimations.has(circle.id)) {
                this.stopAnimation(circle.id);
            }
        });

        // NEW: Save original states before reeling in
        this.saveOriginalStates(targetCircle.id, circlesToReel);

        const animationStartTime = Date.now();
        const duration = 800; // 800ms as requested

        circlesToReel.forEach(circle => {
            const startPos = { x: circle.x, y: circle.y };
            const targetPos = this.calculateTargetPosition(targetCircle, circle);
            
            // Skip animation if already at target
            if (Math.abs(startPos.x - targetPos.x) < 1 && Math.abs(startPos.y - targetPos.y) < 1) {
                return;
            }

            const animationData = {
                circleId: circle.id,
                startPos,
                targetPos,
                startTime: animationStartTime,
                duration,
                targetGroupId: targetCircle.belongsToID || null,
                isReeling: true // Mark as reeling in (vs unreeling)
            };

            this.activeAnimations.set(circle.id, animationData);
        });

        // Start the animation loop if we have circles to animate
        if (this.activeAnimations.size > 0) {
            this.animate();
        }
    }

    // NEW: Start unreeling circles back to their original positions
    unreelCircles(circlesToUnreel) {
        // Stop any existing animations for these circles
        circlesToUnreel.forEach(circle => {
            if (this.activeAnimations.has(circle.id)) {
                this.stopAnimation(circle.id);
            }
        });

        const animationStartTime = Date.now();
        const duration = 800; // Same duration as reel in

        circlesToUnreel.forEach(circle => {
            const originalState = this.originalStates.get(circle.id);
            if (!originalState) return;

            const startPos = { x: circle.x, y: circle.y };
            const targetPos = { x: originalState.x, y: originalState.y };
            
            // Skip animation if already at original position
            if (Math.abs(startPos.x - targetPos.x) < 1 && Math.abs(startPos.y - targetPos.y) < 1) {
                return;
            }

            const animationData = {
                circleId: circle.id,
                startPos,
                targetPos,
                startTime: animationStartTime,
                duration,
                originalGroupId: originalState.belongsToID,
                isReeling: false // Mark as unreeling
            };

            this.activeAnimations.set(circle.id, animationData);
        });

        // Start the animation loop if we have circles to animate
        if (this.activeAnimations.size > 0) {
            this.animate();
        }
    }

    // Ease-in-out function
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    // Animation loop
    animate() {
        const currentTime = Date.now();
        const completedAnimations = [];

        this.activeAnimations.forEach((animationData, circleId) => {
            const elapsed = currentTime - animationData.startTime;
            const progress = Math.min(elapsed / animationData.duration, 1);
            const easedProgress = this.easeInOut(progress);

            // Calculate current position
            const currentX = animationData.startPos.x + 
                           (animationData.targetPos.x - animationData.startPos.x) * easedProgress;
            const currentY = animationData.startPos.y + 
                           (animationData.targetPos.y - animationData.startPos.y) * easedProgress;

            // Update circle position
            if (this.onPositionUpdate) {
                this.onPositionUpdate(circleId, currentX, currentY);
            }

            // Check if animation is complete
            if (progress >= 1) {
                completedAnimations.push({ 
                    circleId, 
                    targetGroupId: animationData.targetGroupId,
                    originalGroupId: animationData.originalGroupId,
                    isReeling: animationData.isReeling
                });
            }
        });

        // Handle completed animations
        completedAnimations.forEach(({ circleId, targetGroupId, originalGroupId, isReeling }) => {
            this.activeAnimations.delete(circleId);
            
            if (isReeling) {
                // Handle group membership if target belongs to a group
                if (targetGroupId && this.onAnimationComplete) {
                    this.onAnimationComplete(circleId, targetGroupId);
                }
            } else {
                // Handle unreeling - restore original group membership
                if (this.onAnimationComplete) {
                    this.onAnimationComplete(circleId, originalGroupId, true); // true indicates unreeling
                }
            }
        });

        // Continue animation if there are still active animations
        if (this.activeAnimations.size > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            // Animation complete - clear unreel data if this was an unreeling operation
            const wasUnreeling = completedAnimations.some(({ isReeling }) => !isReeling);
            if (wasUnreeling) {
                this.clearUnreelData();
            }
        }
    }

    // Stop a specific animation
    stopAnimation(circleId) {
        this.activeAnimations.delete(circleId);
    }

    // Stop all animations
    stopAllAnimations() {
        this.activeAnimations.clear();
    }

    // Check if any animations are active
    isAnimating() {
        return this.activeAnimations.size > 0;
    }
}
