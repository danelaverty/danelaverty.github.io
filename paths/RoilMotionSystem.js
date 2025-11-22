// RoilMotionSystem.js - Enhanced with clean descent color system
export class RoilMotionSystem {
    constructor() {
        this.activeCircles = new Map(); 
        this.roilGroups = new Map();
        this.interval = null;
        this.monitoringActive = false;
        this.isRunning = false;
        this.tickRate = 50;
        
        // High-frequency monitoring
        this.debugMode = true;
        this.lastKnownPositions = new Map();
        this.positionChanges = [];
        this.maxChanges = 100;
        this.frameCount = 0;
        this.lastUpdateFrameCount = 0;
        
        // Store dataStore reference for group lookups
        this.dataStore = null;
        
        // Track roilAngle transitions
        this.transitioningGroups = new Map(); // groupId -> { fromAngle, toAngle, startTime, duration }
        this.pausedForTransition = false;
        
        // Track roilComposure transitions and state
        this.composureTransitions = new Map(); // groupId -> { fromComposure, toComposure, startTime, duration }
        this.splayedGroups = new Map(); // groupId -> { originalPositions: Map<circleId, {x,y,z,scale,opacity}> }
        this.pausedForComposure = new Map(); // groupId -> boolean (per-group pausing for splayed mode)
        
        // UPDATED: Track descent state for view layer communication (no longer swaps colors)
        this.circleColorStates = new Map(); // circleId -> { isDescending: boolean, lastUpdate: timestamp }
    }

    setDataStore(dataStore) {
        this.dataStore = dataStore;
    }

    getGroupAbsolutePosition(groupId, viewerWidth) {
        if (!this.dataStore) return { x: 0, y: 0 };
        
        const group = this.dataStore.getCircle(groupId);
        if (!group) return { x: 0, y: 0 };
        
        const centerX = viewerWidth / 2;
        const absoluteX = centerX + group.x;
        const absoluteY = group.y;
        
        return { x: absoluteX, y: absoluteY };
    }

    // Enhanced method to smoothly transition roilAngle
    transitionRoilAngle(groupId, fromAngle, toAngle, duration = 500) {
        if (!this.dataStore) return;
        
        const group = this.dataStore.getCircle(groupId);
        if (!group || group.roilMode !== 'on') return;
        
        // Don't transition roilAngle if group is currently splayed
        if (this.splayedGroups.has(groupId)) {
            return;
        }
        
        // Get all circles in this roil group
        const groupMembers = Array.from(this.activeCircles.entries())
            .filter(([circleId, circle]) => circle.groupId === groupId);
        
        if (groupMembers.length === 0) return;
        
        // Store transition info
        this.transitioningGroups.set(groupId, {
            fromAngle,
            toAngle,
            startTime: Date.now(),
            duration,
            members: groupMembers.map(([id]) => id)
        });
        
        // Pause the motion system temporarily
        this.pauseMotionForTransition();
        
        // Enable CSS transitions on all group members
        groupMembers.forEach(([circleId, circle]) => {
            const element = circle.element;
            element.style.transition = `top ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
        });
        
        // Apply new positions immediately (CSS will animate)
        groupMembers.forEach(([circleId, circle]) => {
            const newTop = this.calculateTopForAngle(circle, toAngle);
            circle.element.style.top = newTop + 'px';
        });
        
        // Resume motion system after transition completes
        setTimeout(() => {
            this.resumeMotionAfterTransition(groupId);
        }, duration + 50); // Small buffer to ensure transition completes
    }

    // Method to smoothly transition roilComposure
    transitionRoilComposure(groupId, fromComposure, toComposure, duration = 800) {
        if (!this.dataStore) return;
        
        const group = this.dataStore.getCircle(groupId);
        if (!group || group.roilMode !== 'on') return;
        
        // Get all circles in this roil group, excluding drones
        const allGroupMembers = Array.from(this.activeCircles.entries())
            .filter(([circleId, circle]) => circle.groupId === groupId);
        
        // Filter out drone circles - they should not be repositioned
        const nonDroneMembers = allGroupMembers.filter(([circleId, circle]) => {
            const circleData = this.dataStore.getCircle(circleId);
            return circleData && circleData.type !== 'drone';
        });
        
        if (allGroupMembers.length === 0) return;
        
        if (toComposure === 'splayed') {
            this.transitionToSplayed(groupId, allGroupMembers, nonDroneMembers, duration);
        } else if (fromComposure === 'splayed' && toComposure === 'retracted') {
            this.transitionFromSplayed(groupId, allGroupMembers, nonDroneMembers, duration);
        }
    }

    // Transition to splayed mode
    transitionToSplayed(groupId, allGroupMembers, nonDroneMembers, duration) {
        // Store original positions, scales, and opacities for ALL group members
        const originalPositions = new Map();
        allGroupMembers.forEach(([circleId, circle]) => {
            originalPositions.set(circleId, {
                x: circle.x,
                y: circle.y,
                z: circle.z,
                scale: circle.currentScale || 1.0,
                opacity: parseFloat(circle.element.style.opacity) || 1.0
            });
        });
        
        this.splayedGroups.set(groupId, { originalPositions });
        
        // Pause motion for this group (affects ALL members)
        this.pausedForComposure.set(groupId, true);
        
        // Calculate splayed positions only for non-drone members
        const groupPosition = this.getGroupAbsolutePosition(groupId, allGroupMembers[0][1].viewerWidth);
        const splayedPositions = this.calculateSplayedPositions(nonDroneMembers, groupPosition);
        
        // Enable CSS transitions on non-drone members only
        nonDroneMembers.forEach(([circleId, circle]) => {
            const element = circle.element;
            element.style.transition = `left ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), top ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), opacity ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
        });
        
        // Apply splayed positions and reset scale/opacity for non-drone members only
        nonDroneMembers.forEach(([circleId, circle], index) => {
            const splayedPos = splayedPositions[index];
            const element = circle.element;
            
            element.style.left = splayedPos.x + 'px';
            element.style.top = splayedPos.y + 'px';
            element.style.opacity = '1.0';
            element.style.transform = 'translate(-50%, -50%) scale(1.0)';
        });
        
        // Clean up transitions after duration (non-drone members only)
        setTimeout(() => {
            nonDroneMembers.forEach(([circleId, circle]) => {
                circle.element.style.transition = '';
            });
        }, duration + 50);
    }

    // Transition from splayed back to retracted
    transitionFromSplayed(groupId, allGroupMembers, nonDroneMembers, duration) {
        const splayedData = this.splayedGroups.get(groupId);
        if (!splayedData) return;
        
        const { originalPositions } = splayedData;
        
        // Enable CSS transitions on non-drone members only
        nonDroneMembers.forEach(([circleId, circle]) => {
            const element = circle.element;
            element.style.transition = `left ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), top ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), opacity ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
        });
        
        // Restore original positions, scales, and opacities for non-drone members only
        nonDroneMembers.forEach(([circleId, circle]) => {
            const original = originalPositions.get(circleId);
            if (!original) return;
            
            const element = circle.element;
            const group = this.dataStore.getCircle(groupId);
            
            // Restore original circle internal state
            circle.x = original.x;
            circle.y = original.y;
            circle.z = original.z;
            circle.currentScale = original.scale;
            
            // Apply restored positions with current roilAngle calculation
            element.style.left = original.x + 'px';
            element.style.top = this.calculateTopForAngle(circle, group.roilAngle) + 'px';
            element.style.opacity = original.opacity.toString();
            element.style.transform = `translate(-50%, -50%) scale(${(original.scale - 0.2).toFixed(3)})`;
        });
        
        // Restore drone circle internal state but don't move them (they stay where they are)
        allGroupMembers.forEach(([circleId, circle]) => {
            const circleData = this.dataStore.getCircle(circleId);
            if (circleData && circleData.type === 'drone') {
                const original = originalPositions.get(circleId);
                if (original) {
                    // Restore internal state for drones but don't apply visual changes
                    circle.x = original.x;
                    circle.y = original.y;
                    circle.z = original.z;
                    circle.currentScale = original.scale;
                }
            }
        });
        
        // Clean up after transition
        setTimeout(() => {
            // Remove CSS transitions from non-drone members
            nonDroneMembers.forEach(([circleId, circle]) => {
                circle.element.style.transition = '';
            });
            
            // Clean up tracking data
            this.splayedGroups.delete(groupId);
            this.pausedForComposure.delete(groupId);
            
        }, duration + 50);
    }

    // Calculate splayed positions for group members
    calculateSplayedPositions(groupMembers, groupPosition) {
        const positions = [];
        const leftColumnX = groupPosition.x - 60;  // 40px left of group center
        const rightColumnX = groupPosition.x + 60; // 40px right of group center
        
        const memberCount = groupMembers.length;
        const verticalSpacing = 70;
        
        // Calculate the number of rows (since we have 2 columns)
        const numRows = Math.ceil(memberCount / 2);
        
        // Calculate offset to center the middle row on the group position
        // The middle row index is Math.floor((numRows - 1) / 2)
        const middleRowIndex = Math.floor((numRows - 1) / 2);
        const centeringOffset = middleRowIndex * verticalSpacing;
        const startY = groupPosition.y - (centeringOffset + verticalSpacing / 2);
        
        groupMembers.forEach(([circleId, circle], index) => {
            // Alternate between left and right columns
            const isLeftColumn = index % 2 === 0;
            const columnIndex = Math.floor(index / 2); // This is the row index
            
            const x = isLeftColumn ? leftColumnX : rightColumnX;
            const y = startY + (columnIndex * verticalSpacing);
            
            positions.push({ x, y });
        });
        
        return positions;
    }

    // Calculate top position for a given roilAngle
    calculateTopForAngle(circle, roilAngle) {
        if (roilAngle === 'tilt') {
            return circle.y - (2 * circle.z);
        } else { // 'side'
            return 250 - (5 * circle.z);
        }
    }

    // Calculate descent state based on z-orbit phase
    calculateDescentState(circle) {
        // Normalize phase to 0-2π range
        const normalizedPhase = (circle.zOrbitPhase % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        return normalizedPhase < Math.PI;
    }

updateCircleDescentState(circleId, circle) {
    if (!this.dataStore || !circle.groupId) return;
    
    const group = this.dataStore.getCircle(circle.groupId);
    if (!group || group.secondaryColorDescent !== 'shiftToSecondary') {
        // Only clear and notify if there was actually a previous state
        if (this.circleColorStates.has(circleId)) {
            this.circleColorStates.delete(circleId);
            this.notifyViewLayerColorChange(circleId, false);
        }
        return;
    }
    
    const circleData = this.dataStore.getCircle(circleId);
    if (!circleData || !circleData.secondaryColors || circleData.secondaryColors.length === 0) {
        this.circleColorStates.delete(circleId);
        this.notifyViewLayerColorChange(circleId, false);
        return;
    }
    
    const isDescending = this.calculateDescentState(circle);
    const colorState = this.circleColorStates.get(circleId) || { isDescending: !isDescending };
    
    // Only notify if descent state changed
    if (colorState.isDescending !== isDescending) {
        this.circleColorStates.set(circleId, { 
            isDescending: isDescending,
            lastUpdate: Date.now()
        });
        
        this.notifyViewLayerColorChange(circleId, isDescending);
    }
}

notifyViewLayerColorChange(circleId, useSecondaryColors) {
    const circleElement = document.querySelector(`[data-entity-id="${circleId}"]`);
    if (!circleElement) return;
    
    const glowContainer = circleElement.querySelector('.circle-glow-container');
    const glowElement = circleElement.querySelector('.circle-glow');
    
    if (glowContainer && glowElement) {
        const circleData = this.dataStore.getCircle(circleId);
        const primaryColor = circleData?.colors?.[0] || circleData?.color;
        const secondaryColor = circleData?.secondaryColors?.[0];
        
        if (!primaryColor || !secondaryColor || primaryColor === secondaryColor) {
            return; // No color change needed
        }
        
        // Add flip class to trigger animation
        if (useSecondaryColors) {
            glowContainer.classList.add('roil-secondary-colors');
        } else {
            glowContainer.classList.remove('roil-secondary-colors');
        }
        
        // Switch color at the midpoint of the flip (300ms into the 600ms animation)
        setTimeout(() => {
            const targetColor = useSecondaryColors ? secondaryColor : primaryColor;
            glowElement.style.backgroundColor = targetColor;
            
            // Also update the CSS custom property for consistency
            circleElement.style.setProperty('--circle-color', targetColor);
        }, 300); // Half of the 600ms flip duration
        
    }
    
    // Dispatch event for other systems
    const event = new CustomEvent('roil-color-state-change', {
        detail: { circleId, useSecondaryColors, timestamp: Date.now() }
    });
    circleElement.dispatchEvent(event);
    
    // Optional ripple effect for 'side' roilAngle
    const circleData = this.dataStore.getCircle(circleId);
    const group = circleData?.belongsToID ? this.dataStore.getCircle(circleData.belongsToID) : null;
    
    if (group?.roilAngle === 'side') {
        const primaryColor = circleData?.colors?.[0] || circleData?.color;
        const secondaryColor = circleData?.secondaryColors?.[0];
        
        if (primaryColor && secondaryColor && primaryColor !== secondaryColor) {
            const ripple = document.createElement('div');
            ripple.className = 'color-change-ripple';
            circleElement.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        }
    }
}

    // Pause motion system for transitions
    pauseMotionForTransition() {
        this.pausedForTransition = true;
    }

    pauseGroup(groupId) {
        const group = this.roilGroups.get(groupId) || { isPaused: false };
        group.isPaused = true;
        this.roilGroups.set(groupId, group);
    }

    resumeGroup(groupId) {
        const group = this.roilGroups.get(groupId) || { isPaused: false };
        group.isPaused = false;
        this.roilGroups.set(groupId, group);
    }

    isGroupPaused(groupId) {
        const group = this.roilGroups.get(groupId);
        const regularPause = group ? group.isPaused : false;
        const composurePause = this.pausedForComposure.get(groupId) || false;
        return regularPause || composurePause;
    }

    // Resume motion system after transition
    resumeMotionAfterTransition(groupId) {
        // Remove CSS transitions from group members
        const transitionInfo = this.transitioningGroups.get(groupId);
        if (transitionInfo) {
            transitionInfo.members.forEach(circleId => {
                const circle = this.activeCircles.get(circleId);
                if (circle && circle.element) {
                    circle.element.style.transition = '';
                }
            });
        }
        
        // Remove transition tracking
        this.transitioningGroups.delete(groupId);
        
        // Resume motion system if no other transitions are active
        if (this.transitioningGroups.size === 0) {
            this.pausedForTransition = false;
        }
    }

    // Check if motion system should be paused
    shouldPauseMotion() {
        return this.pausedForTransition;
    }

    addCircle(circleId, element, groupBounds = null, groupId = null, viewerWidth = null) {
        if (!element || this.activeCircles.has(circleId)) return;

        let groupOffset = { x: 0, y: 0 };
        if (groupId && viewerWidth) {
            groupOffset = this.getGroupAbsolutePosition(groupId, viewerWidth);
        }

        const bounds = groupBounds || {
            minX: -50, maxX: 50, minY: -50, maxY: 50
        };

        const baseX = groupOffset.x;
        const baseY = groupOffset.y;

        this.activeCircles.set(circleId, {
            element,
            bounds,
            x: baseX,
            y: baseY,
            z: 0,
            baseX: baseX,
            baseY: baseY,
            baseZ: 0,
            groupId: groupId,
            viewerWidth: viewerWidth,
            orbitRadius: 8 + Math.random() * 20 * 2,
            orbitSpeed: 0.008 + Math.random() * 0.015,
            orbitPhase: Math.random() * Math.PI * 2,
            driftSpeed: 0.002 + Math.random() * 0.005,
            driftPhase: Math.random() * Math.PI * 2,
            driftRadius: 15 + Math.random() * 25 * 2,
            zOrbitRadius: 10 + Math.random() * 15,
            zOrbitSpeed: 0.005 + Math.random() * 0.01,
            zOrbitPhase: Math.random() * Math.PI * 2,
            zDriftSpeed: 0.001 + Math.random() * 0.003,
            zDriftPhase: Math.random() * Math.PI * 2,
            zDriftRadius: 8 + Math.random() * 12,
            baseScale: 1.0,
            minScale: 0.6,
            maxScale: 1.4,
            verticalBias: (Math.random() - 0.5) * 0.3,
            time: Math.random() * 100
        });

        this.lastKnownPositions.set(circleId, {
            x: baseX,
            y: baseY,
            frame: this.frameCount,
            timestamp: Date.now()
        });

        if (this.activeCircles.size === 1) {
            this.startMotion();
            this.startHighFrequencyMonitoring();
        }
    }

    // Skip updates during transitions or when splayed
    updateAllCircles() {
        if (this.shouldPauseMotion()) {
            return; // Skip updates during roilAngle transitions
        }
        
        this.lastUpdateFrameCount = this.frameCount;
        
        this.activeCircles.forEach((circle, circleId) => {
            if (circle.groupId && circle.viewerWidth) {
                const newGroupOffset = this.getGroupAbsolutePosition(circle.groupId, circle.viewerWidth);
                circle.baseX = newGroupOffset.x;
                circle.baseY = newGroupOffset.y;
            }
            
            this.updateCirclePosition(circle, circleId);
        });
    }

    startHighFrequencyMonitoring() {
        if (this.monitoringActive) return;
        
        this.monitoringActive = true;
        this.monitorFrame();
    }

    stopHighFrequencyMonitoring() {
        this.monitoringActive = false;
    }

    monitorFrame() {
        if (!this.monitoringActive) return;
        
        this.frameCount++;
        this.checkAllPositions();
        
        requestAnimationFrame(() => this.monitorFrame());
    }

    checkAllPositions() {
        this.activeCircles.forEach((circle, circleId) => {
            const element = circle.element;
            const computedStyle = getComputedStyle(element);
            const currentX = parseFloat(computedStyle.left) || 0;
            const currentY = parseFloat(computedStyle.top) || 0;
            
            const lastKnown = this.lastKnownPositions.get(circleId);
            
            if (lastKnown) {
                const deltaX = Math.abs(currentX - lastKnown.x);
                const deltaY = Math.abs(currentY - lastKnown.y);
                const framesSinceLastChange = this.frameCount - lastKnown.frame;
                
                if (deltaX > 0.5 || deltaY > 0.5) {
                    const changeData = {
                        circleId,
                        from: { x: lastKnown.x.toFixed(2), y: lastKnown.y.toFixed(2) },
                        to: { x: currentX.toFixed(2), y: currentY.toFixed(2) },
                        delta: { x: deltaX.toFixed(2), y: deltaY.toFixed(2) },
                        framesSinceChange: framesSinceLastChange,
                        currentFrame: this.frameCount,
                        timestamp: Date.now(),
                        ourUpdate: this.frameCount <= this.lastUpdateFrameCount + 2,
                        expectedPosition: { x: circle.x.toFixed(2), y: circle.y.toFixed(2) },
                        matchesExpected: this.matchesExpectedPosition(circle, currentX, currentY),
                        elementInfo: this.getElementInfo(element)
                    };
                    
                    let level = 'frame';
                    let prefix = 'Frame change';
                    
                    if (!changeData.ourUpdate && !changeData.matchesExpected && (deltaX > 5 || deltaY > 5)) {
                        level = 'immediate';
                        prefix = 'FLICKER DETECTED - External position change';
                    } else if (changeData.ourUpdate || changeData.matchesExpected) {
                        level = 'expected';
                        prefix = 'Expected motion';
                    }
                    
                    this.positionChanges.push(changeData);
                    if (this.positionChanges.length > this.maxChanges) {
                        this.positionChanges.shift();
                    }
                }
            }
            
            this.lastKnownPositions.set(circleId, {
                x: currentX,
                y: currentY,
                frame: this.frameCount,
                timestamp: Date.now()
            });
        });
    }

    matchesExpectedPosition(circle, actualX, actualY) {
        const expectedX = circle.x;
        const expectedY = circle.y;
        
        const deltaFromExpected = Math.abs(actualX - expectedX) + Math.abs(actualY - expectedY);
        return deltaFromExpected < 2;
    }

    getElementInfo(element) {
        return {
            classes: Array.from(element.classList),
            hasTransition: getComputedStyle(element).transition !== 'none',
            hasAnimation: getComputedStyle(element).animation !== 'none',
            isDragging: element.hasAttribute('data-dragging') || element.closest('[data-dragging]'),
            parentTag: element.parentElement?.tagName,
            inViewer: !!element.closest('.circle-viewer'),
            transform: getComputedStyle(element).transform
        };
    }

    validateImmediatePosition(circleId, element, expectedX, expectedY) {
        setTimeout(() => {
            const computedStyle = getComputedStyle(element);
            const actualX = parseFloat(computedStyle.left) || 0;
            const actualY = parseFloat(computedStyle.top) || 0;
            
            const deltaX = Math.abs(actualX - expectedX);
            const deltaY = Math.abs(actualY - expectedY);
        }, 0);
        
        requestAnimationFrame(() => {
            const computedStyle = getComputedStyle(element);
            const actualX = parseFloat(computedStyle.left) || 0;
            const actualY = parseFloat(computedStyle.top) || 0;
            
            const deltaX = Math.abs(actualX - expectedX);
            const deltaY = Math.abs(actualY - expectedY);
        });
    }

    removeCircle(circleId) {
        const circle = this.activeCircles.get(circleId);
        if (circle && circle.element) {
            circle.element.style.opacity = '1';
        }
        this.activeCircles.delete(circleId);
        this.lastKnownPositions.delete(circleId);
        
        // Clean up color state tracking
        this.circleColorStates.delete(circleId);
        
        if (this.activeCircles.size === 0) {
            this.stopMotion();
            this.stopHighFrequencyMonitoring();
        }
    }

    startMotion() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.interval = setInterval(() => {
            this.updateAllCircles();
        }, this.tickRate);
    }

    stopMotion() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.stopHighFrequencyMonitoring();
    }

calculateOrbitProgress(circle) {
    // Method 1: Based on actual Y position (more accurate for your use case)
    const currentY = circle.y;
    const baseY = circle.baseY;
    const orbitRadius = circle.orbitRadius;
    
    // Calculate the actual range of Y values
    const minY = baseY - orbitRadius; // Top of orbit (apex)
    const maxY = baseY + orbitRadius; // Bottom of orbit (nadir)
    
    // Calculate progress: 0 at apex (minY), 1 at nadir (maxY)
    const orbitProgress = Math.max(0, Math.min(1, (currentY - minY) / (maxY - minY)));
    
    return orbitProgress;
}

    updateCirclePosition(circle, circleId) {
        const { element, bounds } = circle;
        const group = this.dataStore.getCircle(circle.groupId);

        // Don't update positions if group is paused (including splayed)
        if (this.isGroupPaused(circle.groupId)) {
            return;
        }
        
        circle.time += 1;
        
        circle.orbitPhase += circle.orbitSpeed * group.roilSpeed;
        const orbitX = Math.cos(circle.orbitPhase) * circle.orbitRadius;
        const orbitY = Math.sin(circle.orbitPhase) * circle.orbitRadius;

        circle.driftPhase += circle.driftSpeed;
        const driftX = 0;
        const driftY = 0;
        
        circle.zOrbitPhase += circle.zOrbitSpeed * group.roilSpeed;
        const zOrbit = Math.cos(circle.zOrbitPhase) * circle.zOrbitRadius;

let circularOffsetX = 0;
if (group && group.roilAngle === 'side') {
    // Use the same phase as z-orbit to create synchronized circular motion
    // zOrbitPhase ranges from 0 to 2π, we want x offset to follow sin curve
    // sin(phase) gives us the horizontal component of circular motion
    const horizontalRadius = circle.orbitRadius * 4.8; // Scale the horizontal motion
    circularOffsetX = Math.sin(circle.zOrbitPhase) * horizontalRadius;
}

// Apply the circular offset to targetX
const targetX = circle.baseX + orbitX + driftX + circularOffsetX;
        
        circle.zDriftPhase += circle.zDriftSpeed;
        const zDrift = 0;
        
        const verticalOffset = Math.sin(circle.time * 0.01) * circle.verticalBias * 5;
        
        //const targetX = circle.baseX + orbitX + driftX;
        const targetY = circle.baseY + orbitY + driftY + verticalOffset;
        const targetZ = circle.baseZ + zOrbit + zDrift;
        
        circle.x += (targetX - circle.x) * 0.08;
        circle.y += (targetY - circle.y) * 0.08;
        circle.z += (targetZ - circle.z) * 0.06;
        
        this.updateCircleDescentState(circleId, circle);
        
        // Boundary constraints
        if (circle.x < bounds.minX) {
            circle.baseX += (bounds.minX + 20 - circle.baseX) * 0.02;
        } else if (circle.x > bounds.maxX) {
            circle.baseX += (bounds.maxX - 20 - circle.baseX) * 0.02;
        }
        
        if (circle.y < bounds.minY) {
            circle.baseY += (bounds.minY + 20 - circle.baseY) * 0.02;
        } else if (circle.y > bounds.maxY) {
            circle.baseY += (bounds.maxY - 20 - circle.baseY) * 0.02;
        }
        
        const zMin = -30, zMax = 30;
        if (circle.z < zMin) {
            circle.baseZ += (zMin + 10 - circle.baseZ) * 0.02;
        } else if (circle.z > zMax) {
            circle.baseZ += (zMax - 10 - circle.baseZ) * 0.02;
        }
        
        const normalizedZ = (circle.z + 30) / 60;
        const scale = circle.minScale + (normalizedZ * (circle.maxScale - circle.minScale));
        
        // Apply styles - use current roilAngle from group
        element.style.left = circle.x + 'px';
        element.style.top = this.calculateTopForAngle(circle, group.roilAngle) + 'px';
        element.style.transform = `translate(-50%, -50%) scale(${(scale - 0.2).toFixed(3)})`;
        element.style.opacity = scale * 2 - 1.5;
        
        this.validateImmediatePosition(circleId, element, circle.x, circle.y);
        
        circle.currentScale = scale;
    }

    updateCircleBasePosition(circleId, newX, newY) {
        const circle = this.activeCircles.get(circleId);
        if (circle) {
            circle.baseX = newX;
            circle.baseY = newY;
            circle.x = newX;
            circle.y = newY;
        }
    }

    updateMultipleCircleBasePositions(updates) {
        updates.forEach(({ circleId, x, y }) => {
            this.updateCircleBasePosition(circleId, x, y);
        });
    }

    setCircleBuoyancy(circleId, buoyancy) {
        const circle = this.activeCircles.get(circleId);
        if (circle) {
            circle.verticalBias = (buoyancy - 0.5) * 0.5;
            circle.orbitRadius = 8 + (1 - buoyancy) * 15;
            circle.zOrbitRadius = 10 + (1 - buoyancy) * 10;
            circle.baseZ = (buoyancy - 0.5) * 20;
        }
    }

    updateCircleBuoyancy(circleId) {
        const circle = this.activeCircles.get(circleId);
        if (!circle || !this.dataStore) return;

        const dataStoreCircle = this.dataStore.getCircle(circleId);
        if (!dataStoreCircle) return;

        const buoyancyMap = {
            'normal': 0.8,
            'buoyant': 1.5,
            'antibuoyant': 0.3,
        };

        const buoyancyValue = buoyancyMap[dataStoreCircle.buoyancy] ?? 0.5;
        this.setCircleBuoyancy(circleId, buoyancyValue);
    }

    setCircleDepthRange(circleId, minScale = 0.6, maxScale = 1.4) {
        const circle = this.activeCircles.get(circleId);
        if (circle) {
            circle.minScale = minScale;
            circle.maxScale = maxScale;
        }
    }

    getCircleScale(circleId) {
        const circle = this.activeCircles.get(circleId);
        return circle ? circle.currentScale : null;
    }

    getFlickerReport() {
        const flickerEvents = this.positionChanges.filter(change => 
            !change.ourUpdate && !change.matchesExpected && 
            (parseFloat(change.delta.x) > 5 || parseFloat(change.delta.y) > 5)
        );
        
        return {
            totalChanges: this.positionChanges.length,
            flickerEvents: flickerEvents.length,
            recentFlickers: flickerEvents.slice(-5),
            allRecent: this.positionChanges.slice(-10),
            activeCircles: this.activeCircles.size,
            currentFrame: this.frameCount
        };
    }

    getDebugInfo() {
        return {
            activeCircleCount: this.activeCircles.size,
            isRunning: this.isRunning,
            monitoringActive: this.monitoringActive,
            currentFrame: this.frameCount,
            flickerReport: this.getFlickerReport(),
            pausedForTransition: this.pausedForTransition,
            activeTransitions: this.transitioningGroups.size,
            splayedGroups: this.splayedGroups.size,
            pausedForComposure: Array.from(this.pausedForComposure.entries()),
            colorStateCount: this.circleColorStates.size, // Track descent states
            activeDescentStates: Array.from(this.circleColorStates.entries())
                .filter(([_, state]) => state.isDescending)
                .map(([circleId, _]) => circleId)
        };
    }

    destroy() {
        this.stopMotion();
        this.stopHighFrequencyMonitoring();
        this.activeCircles.clear();
        this.lastKnownPositions.clear();
        this.positionChanges = [];
        this.transitioningGroups.clear();
        this.composureTransitions.clear();
        this.splayedGroups.clear();
        this.pausedForComposure.clear();
        this.circleColorStates.clear(); // Clean up color states
    }
}

export const roilMotionSystem = new RoilMotionSystem();

// Global debug interface
if (typeof window !== 'undefined') {
    window.roilDebug = {
        getFlickerReport: () => roilMotionSystem.getFlickerReport(),
        getDebugInfo: () => roilMotionSystem.getDebugInfo(),
        clearChanges: () => { roilMotionSystem.positionChanges = []; },
        enableDebug: () => { roilMotionSystem.debugMode = true; },
        disableDebug: () => { roilMotionSystem.debugMode = false; },
        // Trigger manual roilAngle transitions
        transitionRoilAngle: (groupId, fromAngle, toAngle, duration) => 
            roilMotionSystem.transitionRoilAngle(groupId, fromAngle, toAngle, duration),
        // Trigger manual roilComposure transitions
        transitionRoilComposure: (groupId, fromComposure, toComposure, duration) =>
            roilMotionSystem.transitionRoilComposure(groupId, fromComposure, toComposure, duration),
        // Debug descent color system
        getColorStates: () => Array.from(roilMotionSystem.circleColorStates.entries()),
        clearColorStates: () => roilMotionSystem.circleColorStates.clear(),
        getActiveDescentCircles: () => Array.from(roilMotionSystem.circleColorStates.entries())
            .filter(([_, state]) => state.isDescending)
            .map(([circleId, _]) => circleId),
        // Manual color state testing
        testColorState: (circleId, useSecondaryColors) => 
            roilMotionSystem.notifyViewLayerColorChange(circleId, useSecondaryColors)
    };
}
