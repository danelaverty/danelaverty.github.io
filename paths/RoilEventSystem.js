// RoilEventSystem.js - Event points and action handling
export class RoilEventSystem {
    constructor() {
        // Simple event point system
        this.eventPoints = new Map(); // circleId -> { lastAngle, points: [{ angle, action }] }
        
        // Reference to core motion system and data store
        this.motionCore = null;
        this.dataStore = null;
    }

    setMotionCore(motionCore) {
        this.motionCore = motionCore;
    }

    setDataStore(dataStore) {
        this.dataStore = dataStore;
    }

    checkInventoryForEmoji(targetEmoji, viewerId) {
        if (!this.dataStore) {
            return false;
        }
        
        if (!targetEmoji || !viewerId) {
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
            return false;
        }
    }

    setupEventPoints(circleId, element) {
        if (!this.dataStore) {
            return;
        }
        
        const circleData = this.dataStore.getCircle(circleId);
        if (!circleData) {
            return;
        }

        // Skip event points entirely for satisfaction locked circles
        if (circleData.satisfactionLocked === 'yes') {
            return;
        }

        const points = [];
        
        // Get the group that this circle belongs to (if any)
        const group = circleData.belongsToID ? this.dataStore.getCircle(circleData.belongsToID) : null;
        const shouldCheckInventory = group?.checkInventory === 'yes';
        
        // Get the viewerId from the active circles map
        const activeCircle = this.motionCore?.activeCircles.get(circleId);
        const viewerId = activeCircle?.viewerId;
        
        // Set up thought bubble event points if circle has demandEmoji
        if (circleData.demandEmoji && circleData.demandEmoji.trim() !== '') {
            points.push(
                {
                    angle: 270,
                    action: {
                        type: 'show',
                        selector: '.demand-emoji-thought-balloon',
                        opacity: '0.8'
                    }
                },
                {
                    angle: 0,
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
                    angle: 0,
                    action: { 
                        type: 'flipToSecondary'
                    },
                    executeIf: shouldCheckInventory ? () => {
                        const result = this.checkInventoryForEmoji(circleData.demandEmoji, viewerId);
                        return result;
                    } : undefined
                },
                {
                    angle: 180,
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

        const currentAngle = this.motionCore?.calculateClockPosition(circle);
        if (currentAngle === undefined) return;

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

    // Check if we crossed a specific angle going clockwise
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
            return;
        }
        
        // Check if point has an executeIf condition
        if (point.executeIf && typeof point.executeIf === 'function') {
            const shouldExecute = point.executeIf();
            
            if (!shouldExecute) {
                return; // Don't execute the action
            }
        }

        // Execute the action based on type
        switch (action.type) {
            case 'show':
                const showElement = element.querySelector(action.selector);
                if (showElement) {
                    showElement.style.opacity = action.opacity || '0.8';
                }
                break;

            case 'hide':
                if (circleData.buoyancy !== 'buoyant') {
                    const hideElement = element.querySelector(action.selector);
                    if (hideElement && action.selector === '.demand-emoji-thought-balloon') {
                        this.createCoinPopEffect(element, hideElement);
                        hideElement.style.opacity = '0';
                    } else if (hideElement) {
                        hideElement.style.opacity = '0';
                    }
                }
                break;

            case 'flipToSecondary':
                element.setAttribute('data-use-secondary-colors', 'true');
                this.triggerColorFlip(element, true);
                element.dispatchEvent(new CustomEvent('roil-color-flip', {
                    detail: { circleId, useSecondary: true }
                }));
                break;

            case 'flipToPrimary':
                element.removeAttribute('data-use-secondary-colors');
                this.triggerColorFlip(element, false);
                element.dispatchEvent(new CustomEvent('roil-color-flip', {
                    detail: { circleId, useSecondary: false }
                }));
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
        
        // Skip coin pop effect for satisfaction locked circles
        if (circleData && circleData.satisfactionLocked === 'yes') {
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
    }

    // Handle color flipping (consolidated from your existing logic)
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

    removeEventPoints(circleId) {
        this.eventPoints.delete(circleId);
    }

    // Get debug info for event system
    getDebugInfo() {
        return {
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
        this.eventPoints.clear();
    }
}
