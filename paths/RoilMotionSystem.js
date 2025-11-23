// RoilMotionSystem.js - Refactored with simple event point system
export class RoilMotionSystem {
    constructor() {
        this.activeCircles = new Map(); 
        this.roilGroups = new Map();
        this.interval = null;
        this.monitoringActive = false;
        this.isRunning = false;
        this.tickRate = 50;
        
        // High-frequency monitoring (kept for debugging)
        this.debugMode = true;
        this.lastKnownPositions = new Map();
        this.positionChanges = [];
        this.maxChanges = 100;
        this.frameCount = 0;
        this.lastUpdateFrameCount = 0;
        
        // Store dataStore reference for group lookups
        this.dataStore = null;
        
        // Track roilAngle transitions
        this.transitioningGroups = new Map();
        this.pausedForTransition = false;
        
        // Track roilComposure transitions and state
        this.composureTransitions = new Map();
        this.splayedGroups = new Map();
        this.pausedForComposure = new Map();
        
        // NEW: Simple event point system
        this.eventPoints = new Map(); // circleId -> { lastAngle, points: [{ angle, action }] }
    }

    setDataStore(dataStore) {
        this.dataStore = dataStore;
    }

checkInventoryForEmoji(targetEmoji, viewerId) {
    if (!this.dataStore) {
        console.warn('❌ No dataStore available for inventory check');
        return false;
    }
    
    if (!targetEmoji || !viewerId) {
        console.warn(`❌ Missing parameters - emoji: "${targetEmoji}", viewerId: "${viewerId}"`);
        return false;
    }

    try {
        // Get all circles in the current viewer
        const circlesInViewer = this.dataStore.getCirclesForViewer(viewerId);
        
        // Find all emoji-type circles that belong to groups
        const inventoryItems = circlesInViewer.filter(circle => {
            const isEmojiType = circle.type === 'emoji';
            const belongsToGroup = circle.belongsToID !== null;
            const matchesEmoji = circle.emoji === targetEmoji;
            
            return isEmojiType && belongsToGroup && matchesEmoji;
        });

        const hasInventory = inventoryItems.length > 0;
        
        return hasInventory;
        
    } catch (error) {
        console.error('💥 Error checking inventory:', error);
        return false;
    }
}


setupEventPoints(circleId, element) {
    if (!this.dataStore) {
        console.warn('⌦ No dataStore for setupEventPoints');
        return;
    }
    
    const circleData = this.dataStore.getCircle(circleId);
    if (!circleData) {
        console.warn(`⌦ No circle data found for: ${circleId}`);
        return;
    }

    // Skip event points entirely for satisfaction locked circles
    if (circleData.satisfactionLocked === 'yes') {
        console.log(`🔒 Circle ${circleId} is satisfaction locked - skipping event points`);
        return;
    }

    const points = [];
    
    // Get the group that this circle belongs to (if any)
    const group = circleData.belongsToID ? this.dataStore.getCircle(circleData.belongsToID) : null;
    const shouldCheckInventory = group?.checkInventory === 'yes';
    
    // Get the viewerId from the active circles map
    const activeCircle = this.activeCircles.get(circleId);
    const viewerId = activeCircle?.viewerId;
    
    if (!viewerId) {
        console.warn(`⌦ No viewerId found for circle ${circleId} - inventory checking will fail`);
    }
    
    // Set up thought bubble event points if circle has demandEmoji
    if (circleData.demandEmoji && circleData.demandEmoji.trim() !== '') {
        points.push(
            {
                angle: 180,
                action: {
                    type: 'show',
                    selector: '.demand-emoji-thought-balloon',
                    opacity: '0.8'
                }
            },
            {
                angle: 270,
                action: {
                    type: 'hide',
                    selector: '.demand-emoji-thought-balloon'
                },
                executeIf: shouldCheckInventory ? () => {
                    const result = this.checkInventoryForEmoji(circleData.demandEmoji, viewerId);
                    return result;
                } : undefined
            }
        );
    }

    // Set up color flip event points if circle has secondary colors
    if (group?.secondaryColorDescent === 'shiftToSecondary' && 
        circleData.secondaryColors && circleData.secondaryColors.length > 0) {
        
        points.push(
            {
                angle: 270,
                action: { 
                    type: 'flipToSecondary'
                },
                executeIf: shouldCheckInventory ? () => {
                    const result = this.checkInventoryForEmoji(circleData.demandEmoji, viewerId);
                    return result;
                } : undefined
            },
            {
                angle: 90,
                action: { 
                    type: 'flipToPrimary'
                }
                // Note: flipToPrimary doesn't need inventory check - always allow return to primary
            }
        );
    }

    if (points.length > 0) {
        this.eventPoints.set(circleId, {
            element,
            lastAngle: -1,
            points
        });
    }
}

checkEventPoints(circleId, circle) {
    const eventData = this.eventPoints.get(circleId);
    if (!eventData) return;

    const currentAngle = this.calculateClockPosition(circle);
    const { lastAngle, points, element } = eventData;

    // Skip if angle hasn't changed enough
    if (Math.abs(currentAngle - lastAngle) < 3) return;

    // Check each event point
    points.forEach(point => {
        if (this.didCrossAngle(lastAngle, currentAngle, point.angle)) {
            // Pass the entire point object instead of just the action
            this.executeEventAction(circleId, element, point, currentAngle);
        }
    });

    eventData.lastAngle = currentAngle;
}

    // NEW: Check if we crossed a specific angle going clockwise
    didCrossAngle(fromAngle, toAngle, targetAngle) {
        if (fromAngle < 0) return false; // First update, no crossing

        // Normalize angles
        fromAngle = (fromAngle + 360) % 360;
        toAngle = (toAngle + 360) % 360;
        targetAngle = (targetAngle + 360) % 360;

        if (fromAngle <= toAngle) {
            // No wrap-around: simple range check
            return fromAngle < targetAngle && targetAngle <= toAngle;
        } else {
            // Wrap-around case (e.g., from 350° to 10°)
            return (fromAngle < targetAngle) || (targetAngle <= toAngle);
        }
    }

executeEventAction(circleId, element, point, currentAngle) {
    const action = point.action;
    
    // Double-check: Skip all event actions for satisfaction locked circles
    const circleData = this.dataStore?.getCircle(circleId);
    if (circleData?.satisfactionLocked === 'yes') {
        console.log(`🔒 Skipping event action for satisfaction locked circle: ${circleId}`);
        return;
    }
    
    // Check if point has an executeIf condition
    if (point.executeIf && typeof point.executeIf === 'function') {
        const shouldExecute = point.executeIf();
        
        if (!shouldExecute) {
            return; // Don't execute the action
        }
    }

    // Original executeEventAction logic continues here...
    switch (action.type) {
        case 'show':
            const showElement = element.querySelector(action.selector);
            if (showElement) {
                showElement.style.opacity = action.opacity || '0.8';
            } else {
                console.warn(`⚠️ Could not find element to show: ${action.selector}`);
            }
            break;

        case 'hide':
            const hideElement = element.querySelector(action.selector);
            if (hideElement && action.selector === '.demand-emoji-thought-balloon') {
                this.createCoinPopEffect(element, hideElement);
                hideElement.style.opacity = '0';
            } else if (hideElement) {
                hideElement.style.opacity = '0';
            } else {
                console.warn(`⚠️ Could not find element to hide: ${action.selector}`);
            }
            break;

        case 'flipToSecondary':
            element.setAttribute('data-use-secondary-colors', 'true');
            this.triggerColorFlip(element, true);
            break;

        case 'flipToPrimary':
            element.removeAttribute('data-use-secondary-colors');
            this.triggerColorFlip(element, false);
            break;
    }

    // Emit a single, meaningful event
    element.dispatchEvent(new CustomEvent('event-point-crossed', {
        detail: { circleId, action, angle: currentAngle }
    }));
}

createCoinPopEffect(circleElement, thoughtBalloonElement) {
    const circleId = circleElement.dataset.entityId;
    const circleData = this.dataStore?.getCircle(circleId);
    
    // Skip coin pop effect for angrified OR satisfaction locked circles
    if (circleData && (circleData.angrified === 'yes' || circleData.satisfactionLocked === 'yes')) {
        return;
    }
    
    // Extract the demand emoji from the thought balloon
    const demandEmojiElement = thoughtBalloonElement.querySelector('span');
    if (!demandEmojiElement) return;
    
    const demandEmoji = demandEmojiElement.textContent;
    
    // Create the popping emoji div
    const popEmoji = document.createElement('div');
    popEmoji.className = 'demand-emoji-pop';
    popEmoji.textContent = demandEmoji;
    
    // Style the pop emoji
    popEmoji.style.cssText = `
        position: absolute;
        top: -15px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 24px;
        z-index: 15;
        pointer-events: none;
        opacity: 1;
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        text-shadow: 
            0 0 3px rgba(255, 255, 255, 0.8),
            0 0 6px rgba(255, 255, 255, 0.6),
            0 0 9px rgba(255, 255, 255, 0.4);
    `;
    
    // Add it to the circle element
    circleElement.appendChild(popEmoji);
    
    // Trigger the upward glide animation
    requestAnimationFrame(() => {
        popEmoji.style.top = '-45px';
        popEmoji.style.opacity = '0';
        popEmoji.style.transform = 'translateX(-50%) scale(1.2)';
    });
    
    // Remove the element after animation completes
    setTimeout(() => {
        if (popEmoji.parentNode) {
            popEmoji.parentNode.removeChild(popEmoji);
        }
    }, 850);
    
    // Optional: Add a subtle bounce effect to the original circle
    this.addCircleBounceEffect(circleElement);
}

addCircleBounceEffect(circleElement) {
    const glowContainer = circleElement.querySelector('.circle-glow-container');
    if (!glowContainer) return;
    
    // Store original transform
    const originalTransform = glowContainer.style.transform || '';
    
    // Add bounce class temporarily
    glowContainer.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    glowContainer.style.transform = originalTransform + ' scale(1.1)';
    
    setTimeout(() => {
        glowContainer.style.transform = originalTransform;
        
        // Clean up transition after animation
        setTimeout(() => {
            glowContainer.style.transition = '';
        }, 300);
    }, 150);
}

    // NEW: Handle color flipping (consolidated from your existing logic)
    triggerColorFlip(element, useSecondary) {
        const glowContainer = element.querySelector('.circle-glow-container');
        const glowElement = element.querySelector('.circle-glow');
        
        if (!glowContainer || !glowElement) return;

        const circleId = element.dataset.entityId;
        const circleData = this.dataStore?.getCircle(circleId);
        if (!circleData) return;

        const primaryColor = circleData.colors?.[0] || circleData.color;
        const secondaryColor = circleData.secondaryColors?.[0];
        
        if (!primaryColor || !secondaryColor || primaryColor === secondaryColor) {
            return;
        }

        // Add flip animation class
        if (useSecondary) {
            glowContainer.classList.add('roil-secondary-colors');
        } else {
            glowContainer.classList.remove('roil-secondary-colors');
        }

        // Switch color at animation midpoint
        setTimeout(() => {
            const targetColor = useSecondary ? secondaryColor : primaryColor;
            glowElement.style.backgroundColor = targetColor;
            element.style.setProperty('--circle-color', targetColor);
        }, 300);

        // Handle name switching if applicable
        if (circleData.secondaryName?.trim()) {
            const nameElement = element.querySelector('.entity-name.circle-name');
            if (nameElement) {
                setTimeout(() => {
                    nameElement.textContent = useSecondary ? circleData.secondaryName : circleData.name;
                    nameElement.classList.toggle('roil-secondary-name', useSecondary);
                }, 300);
            }
        }

        // Optional ripple effect for 'side' roilAngle
        const group = circleData?.belongsToID ? this.dataStore.getCircle(circleData.belongsToID) : null;
        if (group?.roilAngle === 'side') {
            const ripple = document.createElement('div');
            ripple.className = 'color-change-ripple';
            element.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        }
    }

    // Calculate clock-face position in degrees (0° = 12:00, 90° = 3:00, etc.)
    calculateClockPosition(circle) {
        const normalizedPhase = (circle.zOrbitPhase % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        let degrees = (normalizedPhase * 180 / Math.PI - 90 + 360) % 360;
        return degrees;
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
        
        if (this.splayedGroups.has(groupId)) return;
        
        const groupMembers = Array.from(this.activeCircles.entries())
            .filter(([circleId, circle]) => circle.groupId === groupId);
        
        if (groupMembers.length === 0) return;
        
        this.transitioningGroups.set(groupId, {
            fromAngle,
            toAngle,
            startTime: Date.now(),
            duration,
            members: groupMembers.map(([id]) => id)
        });
        
        this.pauseMotionForTransition();
        
        groupMembers.forEach(([circleId, circle]) => {
            const element = circle.element;
            element.style.transition = `top ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
        });
        
        groupMembers.forEach(([circleId, circle]) => {
            const newTop = this.calculateTopForAngle(circle, toAngle);
            circle.element.style.top = newTop + 'px';
        });
        
        setTimeout(() => {
            this.resumeMotionAfterTransition(groupId);
        }, duration + 50);
    }

    // Method to smoothly transition roilComposure
    transitionRoilComposure(groupId, fromComposure, toComposure, duration = 800) {
        if (!this.dataStore) return;
        
        const group = this.dataStore.getCircle(groupId);
        if (!group || group.roilMode !== 'on') return;
        
        const allGroupMembers = Array.from(this.activeCircles.entries())
            .filter(([circleId, circle]) => circle.groupId === groupId);
        
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
        this.pausedForComposure.set(groupId, true);
        
        const groupPosition = this.getGroupAbsolutePosition(groupId, allGroupMembers[0][1].viewerWidth);
        const splayedPositions = this.calculateSplayedPositions(nonDroneMembers, groupPosition);
        
        nonDroneMembers.forEach(([circleId, circle]) => {
            const element = circle.element;
            element.style.transition = `left ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), top ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), opacity ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
        });
        
        nonDroneMembers.forEach(([circleId, circle], index) => {
            const splayedPos = splayedPositions[index];
            const element = circle.element;
            
            element.style.left = splayedPos.x + 'px';
            element.style.top = splayedPos.y + 'px';
            element.style.opacity = '1.0';
            element.style.transform = 'translate(-50%, -50%) scale(1.0)';
        });
        
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
        
        nonDroneMembers.forEach(([circleId, circle]) => {
            const element = circle.element;
            element.style.transition = `left ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), top ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), opacity ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
        });
        
        nonDroneMembers.forEach(([circleId, circle]) => {
            const original = originalPositions.get(circleId);
            if (!original) return;
            
            const element = circle.element;
            const group = this.dataStore.getCircle(groupId);
            
            circle.x = original.x;
            circle.y = original.y;
            circle.z = original.z;
            circle.currentScale = original.scale;
            
            element.style.left = original.x + 'px';
            element.style.top = this.calculateTopForAngle(circle, group.roilAngle) + 'px';
            element.style.opacity = original.opacity.toString();
            element.style.transform = `translate(-50%, -50%) scale(${(original.scale - 0.2).toFixed(3)})`;
        });
        
        allGroupMembers.forEach(([circleId, circle]) => {
            const circleData = this.dataStore.getCircle(circleId);
            if (circleData && circleData.type === 'drone') {
                const original = originalPositions.get(circleId);
                if (original) {
                    circle.x = original.x;
                    circle.y = original.y;
                    circle.z = original.z;
                    circle.currentScale = original.scale;
                }
            }
        });
        
        setTimeout(() => {
            nonDroneMembers.forEach(([circleId, circle]) => {
                circle.element.style.transition = '';
            });
            
            this.splayedGroups.delete(groupId);
            this.pausedForComposure.delete(groupId);
        }, duration + 50);
    }

    // Calculate splayed positions for group members
    calculateSplayedPositions(groupMembers, groupPosition) {
        const positions = [];
        const leftColumnX = groupPosition.x - 60;
        const rightColumnX = groupPosition.x + 60;
        
        const memberCount = groupMembers.length;
        const verticalSpacing = 70;
        const numRows = Math.ceil(memberCount / 2);
        const middleRowIndex = Math.floor((numRows - 1) / 2);
        const centeringOffset = middleRowIndex * verticalSpacing;
        const startY = groupPosition.y - (centeringOffset + verticalSpacing / 2);
        
        groupMembers.forEach(([circleId, circle], index) => {
            const isLeftColumn = index % 2 === 0;
            const columnIndex = Math.floor(index / 2);
            
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
        const transitionInfo = this.transitioningGroups.get(groupId);
        if (transitionInfo) {
            transitionInfo.members.forEach(circleId => {
                const circle = this.activeCircles.get(circleId);
                if (circle && circle.element) {
                    circle.element.style.transition = '';
                }
            });
        }
        
        this.transitioningGroups.delete(groupId);
        
        if (this.transitioningGroups.size === 0) {
            this.pausedForTransition = false;
        }
    }

    // Check if motion system should be paused
    shouldPauseMotion() {
        return this.pausedForTransition;
    }

addCircle(circleId, element, groupBounds = null, groupId = null, viewerWidth = null, viewerId = null) {
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
        viewerId: viewerId,
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

    // Set up event points for this circle (will be skipped if satisfaction locked)
    this.setupEventPoints(circleId, element);

    if (this.activeCircles.size === 1) {
        this.startMotion();
        this.startHighFrequencyMonitoring();
    }
}

    // Skip updates during transitions or when splayed
    updateAllCircles() {
        if (this.shouldPauseMotion()) {
            return;
        }
        
        this.lastUpdateFrameCount = this.frameCount;
        
        this.activeCircles.forEach((circle, circleId) => {
            if (circle.groupId && circle.viewerWidth) {
                const newGroupOffset = this.getGroupAbsolutePosition(circle.groupId, circle.viewerWidth);
                circle.baseX = newGroupOffset.x;
                circle.baseY = newGroupOffset.y;
            }
            
            this.updateCirclePosition(circle, circleId);
            
            // NEW: Check event points instead of continuous state tracking
            this.checkEventPoints(circleId, circle);
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
    }

    removeCircle(circleId) {
        const circle = this.activeCircles.get(circleId);
        if (circle && circle.element) {
            circle.element.style.opacity = '1';
        }
        this.activeCircles.delete(circleId);
        this.lastKnownPositions.delete(circleId);
        
        // NEW: Clean up event points
        this.eventPoints.delete(circleId);
        
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
            const horizontalRadius = circle.orbitRadius * 4.8;
            circularOffsetX = Math.sin(circle.zOrbitPhase) * horizontalRadius;
        }

        const targetX = circle.baseX + orbitX + driftX + circularOffsetX;
        
        circle.zDriftPhase += circle.zDriftSpeed;
        const zDrift = 0;
        
        const verticalOffset = Math.sin(circle.time * 0.01) * circle.verticalBias * 5;
        
        const targetY = circle.baseY + orbitY + driftY + verticalOffset;
        const targetZ = circle.baseZ + zOrbit + zDrift;
        
        circle.x += (targetX - circle.x) * 0.08;
        circle.y += (targetY - circle.y) * 0.08;
        circle.z += (targetZ - circle.z) * 0.06;
        
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
            'buoyant': 1.8,
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
            // NEW: Event point debugging
            eventPointCount: this.eventPoints.size,
            circlesWithEvents: Array.from(this.eventPoints.keys()),
            eventPointSummary: Array.from(this.eventPoints.entries()).map(([circleId, data]) => ({
                circleId,
                pointCount: data.points.length,
                lastAngle: data.lastAngle,
                points: data.points.map(p => `${p.angle}°:${p.action.type}`)
            }))
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
        this.eventPoints.clear(); // NEW: Clean up event points
    }
}

export const roilMotionSystem = new RoilMotionSystem();

// Global debug interface - UPDATED with event point debugging
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
        
        // NEW: Event point debugging
        getEventPoints: () => Array.from(roilMotionSystem.eventPoints.entries()),
        getEventPointsForCircle: (circleId) => roilMotionSystem.eventPoints.get(circleId),
        clearEventPoints: () => roilMotionSystem.eventPoints.clear(),
        
        // Test event point crossing
        testEventPoint: (circleId, angle) => {
            const eventData = roilMotionSystem.eventPoints.get(circleId);
            if (!eventData) return 'No event points for this circle';
            
            const point = eventData.points.find(p => Math.abs(p.angle - angle) < 10);
            if (!point) return `No event point near ${angle}°`;
            
            roilMotionSystem.executeEventAction(circleId, eventData.element, point.action, angle);
            return `Triggered ${point.action.type} at ${angle}°`;
        },
        
        // Force setup event points for a circle
        forceSetupEventPoints: (circleId) => {
            const circle = roilMotionSystem.activeCircles.get(circleId);
            if (!circle) return 'Circle not found';
            
            roilMotionSystem.setupEventPoints(circleId, circle.element);
            return `Set up event points for ${circleId}`;
        },
        
        // Utility to convert clock position to human-readable time
        clockToTime: (degrees) => {
            const hours = Math.floor(degrees / 30);
            const minutes = Math.floor((degrees % 30) * 2);
            return `${hours === 0 ? 12 : hours}:${minutes.toString().padStart(2, '0')}`;
        },
        
        // Show all circles with their current angles and event points
        showEventStatus: () => {
            const results = [];
            roilMotionSystem.eventPoints.forEach((eventData, circleId) => {
                const circle = roilMotionSystem.activeCircles.get(circleId);
                const currentAngle = circle ? roilMotionSystem.calculateClockPosition(circle) : -1;
                
                results.push({
                    circleId,
                    currentAngle: currentAngle.toFixed(1),
                    currentTime: window.roilDebug.clockToTime(currentAngle),
                    eventPoints: eventData.points.map(p => ({
                        angle: p.angle,
                        time: window.roilDebug.clockToTime(p.angle),
                        action: p.action.type
                    }))
                });
            });
            
            return results;
        }
    };

if (typeof window !== 'undefined') {
    // Add new debug methods for inventory system
    window.roilDebug = {
        ...window.roilDebug, // Keep existing methods
        
        // NEW: Inventory debugging
        checkInventory: (emoji, viewerId) => {
            return roilMotionSystem.checkInventoryForEmoji(emoji, viewerId);
        },
        
        getInventoryItems: (viewerId) => {
            if (!roilMotionSystem.dataStore) return [];
            const circlesInViewer = roilMotionSystem.dataStore.getCirclesForViewer(viewerId);
            return circlesInViewer.filter(circle => 
                circle.type === 'emoji' && 
                circle.belongsToID !== null
            ).map(circle => ({
                id: circle.id,
                emoji: circle.emoji,
                name: circle.name,
                groupId: circle.belongsToID
            }));
        },
        
        testInventoryCheck: (demandEmoji, viewerId) => {
            const hasInventory = roilMotionSystem.checkInventoryForEmoji(demandEmoji, viewerId);
            const inventoryItems = window.roilDebug.getInventoryItems(viewerId);
            const matchingItems = inventoryItems.filter(item => item.emoji === demandEmoji);
            
            return {
                demandEmoji,
                viewerId,
                hasInventory,
                matchingItems,
                allInventoryItems: inventoryItems
            };
        },
        
        // Test a full inventory scenario
        simulateInventoryEvent: (circleId, targetAngle) => {
            const circle = roilMotionSystem.activeCircles.get(circleId);
            if (!circle) return 'Circle not found in active circles';
            
            const circleData = roilMotionSystem.dataStore?.getCircle(circleId);
            if (!circleData) return 'Circle data not found';
            
            const group = circleData.belongsToID ? roilMotionSystem.dataStore.getCircle(circleData.belongsToID) : null;
            
            const inventoryCheck = group?.checkInventory === 'yes' ? 
                roilMotionSystem.checkInventoryForEmoji(circleData.demandEmoji, circle.viewerId) : 
                'N/A (checkInventory is off)';
            
            return {
                circleId,
                demandEmoji: circleData.demandEmoji,
                groupCheckInventory: group?.checkInventory,
                inventoryCheckResult: inventoryCheck,
                viewerId: circle.viewerId,
                message: `Circle ${circleId} wants ${circleData.demandEmoji}. Inventory check: ${inventoryCheck}`
            };
        }
    };
}
}
