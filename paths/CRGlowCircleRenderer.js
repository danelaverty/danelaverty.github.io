// renderers/GlowCircleRenderer.js - Enhanced with satisfaction lock support and cause emoji
import { ParticleSystem } from './ParticleSystem.js';
import { ChakraFormSystem } from './ChakraFormSystem.js';
import { ColorFlowSystem } from './ColorFlowSystem.js';
import { hslStringToHex } from './colorUtils.js';

export const GlowCircleRenderer = {
    /**
     * Render glow circle type
     */
    render(element, circle, squareCount, isRoilMember = false) {
        if (!element) return;

        const glowContainer = document.createElement('div');
        glowContainer.className = 'circle-glow-container';
        element.appendChild(glowContainer);
        
        // Create glow element
        const glowElement = document.createElement('div');
        glowElement.className = 'circle-glow';
        glowContainer.appendChild(glowElement);

        // Add demand emoji display if present
        if (circle.demandEmoji && typeof circle.demandEmoji == 'string' && circle.demandEmoji.trim() !== '') {
            if (circle.satisfactionLocked === 'yes') {
                this.createDemandEmojiLock(element, circle.demandEmoji, circle);
            } else {
                this.createDemandEmojiThoughtBalloon(element, circle.demandEmoji, isRoilMember, circle);
            }
        }

        // Add cause emoji display if present
        if (circle.causeEmoji && typeof circle.causeEmoji == 'string' && circle.causeEmoji.trim() !== '') {
            this.createCauseEmojiThoughtBalloon(element, circle.causeEmoji, isRoilMember, circle);
        }

        // Set up descent state listener for roil members (unless satisfaction locked)
        if (isRoilMember && circle.satisfactionLocked !== 'yes') {
            this.setupDescentStateListener(element, circle);
        } else if (isRoilMember && circle.satisfactionLocked === 'yes') {
            // For satisfaction locked circles, force secondary state immediately
            this.initializeSatisfactionLockedState(element, circle);
        } else {
            // For non-roil members, use normal color handling
            const hasMultipleColors = circle.colors && circle.colors.length > 1;
            if (hasMultipleColors) {
                this.startGlowColorCycling(glowContainer, circle.colors);
            }
        }

        // Create particles - hide for drones AND roil members
        /*if (!circle.isDrone && !isRoilMember) {
            ParticleSystem.create(element, circle);
        }*/

        // Create chakra form
        //ChakraFormSystem.create(element, circle, squareCount);

        // Handle multi-color flow overlay if multiple colors (initial setup)
        const hasMultipleColors = circle.colors && circle.colors.length > 1;
        if (hasMultipleColors && !isRoilMember) {
            ColorFlowSystem.start(element, circle.colors);
        }
        
        // Auto-initialize thought bubble listeners after DOM settles (only for non-locked circles)
        if (isRoilMember && ((circle.demandEmoji && typeof circle.demandEmoji == 'string' && 
            circle.demandEmoji.trim() !== '') || (circle.causeEmoji && typeof circle.causeEmoji == 'string' && 
            circle.causeEmoji.trim() !== '')) && circle.satisfactionLocked !== 'yes') {
            this.autoInitializeListeners();
        }
    },

    /**
     * Initialize satisfaction locked state (permanent secondary colors)
     */
    initializeSatisfactionLockedState(element, circle) {
        // Force the element to use secondary colors permanently
        element.setAttribute('data-use-secondary-colors', 'true');
        element.setAttribute('data-satisfaction-locked', 'true');
        
        // Immediately apply secondary colors
        const secondaryColor = circle.secondaryColors?.[0];
        const glowElement = element.querySelector('.circle-glow');
        
        if (glowElement && secondaryColor) {
            glowElement.style.backgroundColor = secondaryColor;
            element.style.setProperty('--circle-color', secondaryColor);
        }
        
        // Add visual indicator class for satisfaction locked state
        element.classList.add('satisfaction-locked');
    },

    /**
     * Create permanent demand emoji lock (for satisfactionLocked circles)
     */
    createDemandEmojiLock(element, demandEmoji, circle) {
        const lockContainer = document.createElement('div');
        lockContainer.className = 'demand-emoji-lock';
        
        // Style the lock container (always visible)
        lockContainer.style.cssText = `
            position: absolute;
            top: -25px;
            right: -25px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            opacity: 0.9;
        `;
        
        // Create the lock emoji (larger)
        const lockElement = document.createElement('span');
        lockElement.textContent = '🔒';
        lockElement.style.cssText = `
            font-size: 32px;
            position: relative;
            display: inline-block;
            filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.5));
        `;
        
        // Create the demand emoji (smaller, positioned inside)
        const demandElement = document.createElement('span');
        demandElement.textContent = demandEmoji;
        demandElement.style.cssText = `
            font-size: 18px;
            position: absolute;
            top: 65%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 11;
        `;
        
        lockContainer.appendChild(demandElement);
        lockContainer.appendChild(lockElement);
        element.appendChild(lockContainer);
    },

    /**
     * Create demand emoji thought balloon with clock-face visibility support (top-right position)
     */
    createDemandEmojiThoughtBalloon(element, demandEmoji, isRoilMember = false, circle = {}) {
        const thoughtBalloon = document.createElement('div');
        thoughtBalloon.className = 'demand-emoji-thought-balloon';
        
        // Style the thought balloon container (no inline opacity) - positioned top-right
        thoughtBalloon.style.cssText = `
            position: absolute;
            top: -19px;
            right: -13px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            transition: opacity 0.3s ease-in-out;
            opacity: 0.8;
        `;
        
        this.createThoughtBubbleContent(thoughtBalloon, demandEmoji, 'right');
        element.appendChild(thoughtBalloon);
    },

    /**
     * Create cause emoji thought balloon with clock-face visibility support (top-left position)
     */
    createCauseEmojiThoughtBalloon(element, causeEmoji, isRoilMember = false, circle = {}) {
        const thoughtBalloon = document.createElement('div');
        thoughtBalloon.className = 'cause-emoji-thought-balloon';
        
        // Style the thought balloon container (no inline opacity) - positioned top-left
        thoughtBalloon.style.cssText = `
            position: absolute;
            top: -19px;
            left: -13px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            transition: opacity 0.3s ease-in-out;
            opacity: 0.8;
        `;
        
        this.createThoughtBubbleContent(thoughtBalloon, causeEmoji, 'left');
        element.appendChild(thoughtBalloon);
    },

    /**
     * Create the content for a thought bubble with appropriate tail direction
     */
    createThoughtBubbleContent(thoughtBalloon, emoji, tailDirection = 'right') {
        // Create the thought balloon emoji (larger)
        const balloonElement = document.createElement('span');
        balloonElement.style.cssText = `
            font-size: 32px;
            position: relative;
            display: inline-block;
            width: 24px;
            height: 24px;
        `;

        // Create the bubble body
        const bubbleBody = document.createElement('div');
        bubbleBody.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: white;
            border-radius: 5px;
        `;
        balloonElement.appendChild(bubbleBody);

        // Create the tail (direction and style depends on position)
        const bubbleTail = document.createElement('div');
        if (tailDirection === 'right') {
            // Right-pointing triangle for demand emoji (speech bubble style)
            bubbleTail.style.cssText = `
                position: absolute;
                bottom: -5px;
                right: 9px;
                width: 0;
                height: 0;
                border-top: 0.25em solid transparent;
                border-bottom: 0.25em solid transparent;
                border-left: 0.25em solid white;
            `;
        } else {
            // Circular tail for cause emoji (thought bubble style)
            bubbleTail.style.cssText = `
                position: absolute;
                bottom: -3px;
                left: 9px;
                width: 8px;
                height: 8px;
                background-color: white;
                border-radius: 50%;
            `;
            
            // Add a smaller circle for classic thought bubble appearance
            const smallerCircle = document.createElement('div');
            smallerCircle.style.cssText = `
                position: absolute;
                bottom: -7px;
                left: 14px;
                width: 4px;
                height: 4px;
                background-color: white;
                border-radius: 50%;
            `;
            balloonElement.appendChild(smallerCircle);
        }
        balloonElement.appendChild(bubbleTail);
        
        // Create the emoji (smaller, positioned inside)
        const emojiElement = document.createElement('span');
        emojiElement.textContent = emoji;
        emojiElement.style.cssText = `
            font-size: 20px;
            position: absolute;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 11;
        `;
        
        thoughtBalloon.appendChild(emojiElement);
        thoughtBalloon.appendChild(balloonElement);
    },

    /**
     * Initialize thought bubble position listeners for all existing thought balloons
     */
    initializeThoughtBubbleListeners() {
        // Handle both demand and cause emoji thought balloons
        document.querySelectorAll('.demand-emoji-thought-balloon, .cause-emoji-thought-balloon').forEach(balloon => {
            const element = balloon.closest('[data-entity-id]');
            if (element && element.dataset.entityId && !element._thoughtBubblePositionListener) {
                const handlePositionChange = (event) => {
                    const { clockPosition } = event.detail;
                    this.updateThoughtBubbleVisibility(balloon, clockPosition);
                };
                
                element._thoughtBubblePositionListener = handlePositionChange;
                element.addEventListener('roil-position-change', handlePositionChange);
            }
        });
    },
    
    /**
     * Auto-initialize listeners after a delay (handles timing issues)
     */
    autoInitializeListeners() {
        setTimeout(() => {
            this.initializeThoughtBubbleListeners();
        }, 1000);
    },

    /**
     * Update thought bubble visibility based on clock position
     */
    updateThoughtBubbleVisibility(thoughtBalloon, clockPosition) {
        let isInVisibleRange;
        
        if (thoughtBalloon.classList.contains('demand-emoji-thought-balloon')) {
            // Demand emoji (top-right): Visible between 9:00 (270°) and 1:00 (30°), centered around 12:00
            isInVisibleRange = clockPosition >= 180 && clockPosition < 270;
        } else if (thoughtBalloon.classList.contains('cause-emoji-thought-balloon')) {
            // Cause emoji (top-left): Visible between 11:00 (330°) and 3:00 (90°), centered around 12:00
            isInVisibleRange = clockPosition >= 270 || clockPosition < 90;
        } else {
            // Default behavior for unknown balloon types
            isInVisibleRange = clockPosition >= 180 && clockPosition < 270;
        }
        
        const targetOpacity = isInVisibleRange ? '0.8' : '0';
        
        if (thoughtBalloon.style.opacity !== targetOpacity) {
            thoughtBalloon.style.opacity = targetOpacity;
        }
    },

    /**
     * Set up descent state listener for a glow circle
     */
    setupDescentStateListener(element, circle) {
        // Store reference to the circle data for the listener
        element._roilCircleData = circle;
        
        // Listen for roil color state changes
        const handleColorStateChange = (event) => {
            const { useSecondaryColors } = event.detail;
            this.updateColorsForDescentState(element, circle, useSecondaryColors);
        };
        
        // Store listener reference for cleanup
        element._roilColorStateListener = handleColorStateChange;
        element.addEventListener('roil-color-state-change', handleColorStateChange);
        
        // Check initial state from data attribute
        const useSecondaryColors = element.hasAttribute('data-use-secondary-colors');
        this.updateColorsForDescentState(element, circle, useSecondaryColors);
    },

    /**
     * Update colors based on descent state
     */
    updateColorsForDescentState(element, circle, useSecondaryColors) {
        const colorsToUse = useSecondaryColors ? 
                (circle.secondaryColors || circle.colors) : 
                circle.colors;
        
        // Update the glow color cycling with the appropriate colors
        const glowContainer = element.querySelector('.circle-glow-container');
        if (glowContainer && colorsToUse && colorsToUse.length > 1) {
            // Stop existing cycling and restart with new colors
            this.stopGlowColorCycling(glowContainer);
            this.startGlowColorCycling(glowContainer, colorsToUse);
        } else if (glowContainer) {
            // Single color - just update the background
            const glowElement = glowContainer.querySelector('.circle-glow');
            if (glowElement && colorsToUse && colorsToUse.length > 0) {
                const primaryColor = colorsToUse[0];
                glowElement.style.backgroundColor = primaryColor;
            }
        }
        
        // Update color flow system if needed
        ColorFlowSystem.stop(element);
        if (colorsToUse && colorsToUse.length > 1) {
            ColorFlowSystem.start(element, colorsToUse);
        }
    },

    /**
     * Clean up descent state listener
     */
    cleanupDescentStateListener(element) {
        if (element._roilColorStateListener) {
            element.removeEventListener('roil-color-state-change', element._roilColorStateListener);
            element._roilColorStateListener = null;
        }
        element._roilCircleData = null;
    },

    /**
     * Clean up thought bubble position listener
     */
    cleanupThoughtBubblePositionListener(element) {
        if (element._thoughtBubblePositionListener) {
            element.removeEventListener('roil-position-change', element._thoughtBubblePositionListener);
            element._thoughtBubblePositionListener = null;
        }
    },

    /**
     * Update colors for existing glow circle without recreating elements
     */
    updateColors(element, circle) {
        if (!element) return;

        const glowContainer = element.querySelector('.circle-glow-container');
        const glowElement = element.querySelector('.circle-glow');
        
        if (!glowContainer || !glowElement) {
            // If elements don't exist, fall back to full render
            this.render(element, circle);
            return;
        }

        // Handle satisfaction locked state
        if (circle.satisfactionLocked === 'yes') {
            this.initializeSatisfactionLockedState(element, circle);
            
            // Update to lock emoji if needed
            const existingThoughtBalloon = element.querySelector('.demand-emoji-thought-balloon');
            const existingLock = element.querySelector('.demand-emoji-lock');
            
            if (existingThoughtBalloon && !existingLock && circle.demandEmoji) {
                existingThoughtBalloon.remove();
                this.createDemandEmojiLock(element, circle.demandEmoji, circle);
            }
            return;
        }

        // Check if this element has descent state listening active
        if (element._roilColorStateListener) {
            // For roil members, check current descent state and update accordingly
            const useSecondaryColors = element.hasAttribute('data-use-secondary-colors');
            this.updateColorsForDescentState(element, circle, useSecondaryColors);
        } else {
            // For non-roil members, use standard color updating
            // Stop existing color cycling
            this.stopGlowColorCycling(glowContainer);

            // Handle multi-color cycling for updated colors
            const hasMultipleColors = circle.colors && circle.colors.length > 1;
            if (hasMultipleColors) {
                this.startGlowColorCycling(glowContainer, circle.colors);
            } else {
                // For single color, just update the background-color
                // The CSS variable --circle-color is already updated by the parent renderer
                glowElement.style.backgroundColor = 'var(--circle-color)';
            }

            // Update color flow system
            ColorFlowSystem.stop(element);
            if (hasMultipleColors) {
                ColorFlowSystem.start(element, circle.colors);
            }
        }

        // Handle switching between lock and thought balloon for demand emoji
        const existingDemandThoughtBalloon = element.querySelector('.demand-emoji-thought-balloon');
        const existingLock = element.querySelector('.demand-emoji-lock');
        
        if (circle.demandEmoji && circle.demandEmoji.trim() !== '') {
            if (circle.satisfactionLocked === 'yes' && existingDemandThoughtBalloon && !existingLock) {
                // Switch from thought balloon to lock
                existingDemandThoughtBalloon.remove();
                this.createDemandEmojiLock(element, circle.demandEmoji, circle);
            } else if (circle.satisfactionLocked !== 'yes' && existingLock && !existingDemandThoughtBalloon) {
                // Switch from lock to thought balloon
                existingLock.remove();
                this.createDemandEmojiThoughtBalloon(element, circle.demandEmoji, true, circle);
                this.autoInitializeListeners();
            }  else if (circle.satisfactionLocked !== 'yes' && existingDemandThoughtBalloon) {
                const existingEmoji = existingDemandThoughtBalloon.querySelector('span');
                if (existingEmoji && existingEmoji.textContent !== circle.demandEmoji) {
                    existingEmoji.textContent = circle.demandEmoji;
                }
            } else if (circle.satisfactionLocked === 'yes' && existingLock) {
                const existingEmoji = existingLock.querySelector('span');
                if (existingEmoji && existingEmoji.textContent !== circle.demandEmoji) {
                    existingEmoji.textContent = circle.demandEmoji;
                }
            }  else if (circle.satisfactionLocked !== 'yes' && !existingDemandThoughtBalloon && !existingLock) {
                this.createDemandEmojiThoughtBalloon(element, circle.demandEmoji, true, circle);
                this.autoInitializeListeners();
            } else if (circle.satisfactionLocked === 'yes' && !existingDemandThoughtBalloon && !existingLock) {
                this.createDemandEmojiLock(element, circle.demandEmoji, circle);
            }
        }  else {
            if (existingDemandThoughtBalloon) {
                existingDemandThoughtBalloon.remove();
            }
            if (existingLock) {
                existingLock.remove();
            }
        }

        // Handle cause emoji thought balloon updates
        const existingCauseThoughtBalloon = element.querySelector('.cause-emoji-thought-balloon');
        
        if (circle.causeEmoji && circle.causeEmoji.trim() !== '') {
            if (!existingCauseThoughtBalloon) {
                // Add cause emoji thought balloon if it doesn't exist
                this.createCauseEmojiThoughtBalloon(element, circle.causeEmoji, true, circle);
                this.autoInitializeListeners();
            } else {
                // Update existing cause emoji if it changed
                const existingEmoji = existingCauseThoughtBalloon.querySelector('span');
                if (existingEmoji && existingEmoji.textContent !== circle.causeEmoji) {
                    existingEmoji.textContent = circle.causeEmoji;
                }
            }
        }  else {
            if (existingCauseThoughtBalloon) {
                existingCauseThoughtBalloon.remove();
            }
        }
    },

    /**
     * Start color cycling for the glow element background with randomized timing
     */
    startGlowColorCycling(glowContainer, colors) {
        // Get the glow element inside the container
        const glowElement = glowContainer.querySelector('.circle-glow');
        if (!glowElement) return;
        
        // Convert colors to hex format
        const hexColors = colors.map(color => hslStringToHex(color));
        
        // Clean up any existing cycling
        this.stopGlowColorCycling(glowContainer);
        
        // Generate unique timing based on entity ID
        const circleElement = glowContainer.closest('[data-entity-id]');
        const entityId = circleElement?.dataset?.entityId || 'fallback';
        
        // Simple seeded random using entity ID
        const numericSeed = entityId.split('').reduce((acc, char, index) => {
            return acc + char.charCodeAt(0) * (index + 1);
        }, 0);
        
        // Use the seed to generate random-ish values
        const rand1 = Math.sin(numericSeed * 12.9898) * 43758.5453;
        const rand2 = Math.sin(numericSeed * 78.233) * 43758.5453;
        const rand3 = Math.sin(numericSeed * 35.421) * 43758.5453;
        
        const transitionCoeff = 0.7 + (rand1 - Math.floor(rand1)) * 0.6; // 0.7 - 1.3
        const intervalCoeff = 0.8 + (rand2 - Math.floor(rand2)) * 0.4;   // 0.8 - 1.2
        const startingColorIndex = Math.floor((rand3 - Math.floor(rand3)) * hexColors.length);
        
        const transitionDuration = (2 * transitionCoeff).toFixed(1);
        const cycleInterval = Math.round(3000 * intervalCoeff);
        
        // Set initial color to the random starting index
        let colorIndex = startingColorIndex;
        glowElement.style.backgroundColor = hexColors[colorIndex];
        glowElement.style.transition = `background-color ${transitionDuration}s ease-in-out`;
        
        // Start cycling through colors
        const cycleIntervalId = setInterval(() => {
            colorIndex = (colorIndex + 1) % hexColors.length;
            glowElement.style.backgroundColor = hexColors[colorIndex];
        }, cycleInterval);
        
        // Store interval reference for cleanup
        glowContainer._colorCycleInterval = cycleIntervalId;
    },

    /**
     * Stop color cycling for the glow element
     */
    stopGlowColorCycling(glowContainer) {
        if (glowContainer._colorCycleInterval) {
            clearInterval(glowContainer._colorCycleInterval);
            glowContainer._colorCycleInterval = null;
        }
    }
};
