// renderers/GlowCircleRenderer.js - Enhanced with descent state listener for clean color switching
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

        // NEW: Set up descent state listener for roil members
        if (isRoilMember) {
            this.setupDescentStateListener(element, circle);
        } else {
            // For non-roil members, use normal color handling
            const hasMultipleColors = circle.colors && circle.colors.length > 1;
            if (hasMultipleColors) {
                this.startGlowColorCycling(glowContainer, circle.colors);
            }
        }

        // Create particles - hide for drones AND roil members
        if (!circle.isDrone && !isRoilMember) {
            ParticleSystem.create(element, circle);
        }

        // Create chakra form
        ChakraFormSystem.create(element, circle, squareCount);

        // Handle multi-color flow overlay if multiple colors (initial setup)
        const hasMultipleColors = circle.colors && circle.colors.length > 1;
        if (hasMultipleColors && !isRoilMember) {
            ColorFlowSystem.start(element, circle.colors);
        }
    },

    /**
     * NEW: Set up descent state listener for a glow circle
     */
setupDescentStateListener(element, circle) {
    // Store reference to the circle data for the listener
    element._roilCircleData = circle;
    
    // Listen for roil color state changes
    const handleColorStateChange = (event) => {
        console.log(`🎨 handleColorStateChange for ${circle.id}:`, event.detail);
        const { useSecondaryColors } = event.detail;
        this.updateColorsForDescentState(element, circle, useSecondaryColors);
    };
    
    // Store listener reference for cleanup
    element._roilColorStateListener = handleColorStateChange;
    element.addEventListener('roil-color-state-change', handleColorStateChange);
    
    console.log(`🎯 Set up descent state listener for ${circle.id}`);
    
    // Check initial state from data attribute
    const useSecondaryColors = element.hasAttribute('data-use-secondary-colors');
    console.log(`🎯 Initial state for ${circle.id}: useSecondaryColors=${useSecondaryColors}`);
    this.updateColorsForDescentState(element, circle, useSecondaryColors);
},

    /**
     * NEW: Update colors based on descent state
     */
    updateColorsForDescentState(element, circle, useSecondaryColors) {
        console.log(`🎨 updateColorsForDescentState for ${circle.id}: useSecondaryColors=${useSecondaryColors}`);
            
            const colorsToUse = useSecondaryColors ? 
                    (circle.secondaryColors || circle.colors) : 
                    circle.colors;
            
            console.log(`🎨 Colors to use:`, colorsToUse, 'vs main colors:', circle.colors);
            
        
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
                // Clear any existing transition for immediate color change
                glowElement.style.transition = 'none';
                // Re-enable transitions after a frame for future changes
                requestAnimationFrame(() => {
                    if (glowElement) {
                        glowElement.style.transition = '';
                    }
                });
            }
        }
        
        // Update color flow system if needed
        ColorFlowSystem.stop(element);
        if (colorsToUse && colorsToUse.length > 1) {
            ColorFlowSystem.start(element, colorsToUse);
        }
    },

    /**
     * NEW: Clean up descent state listener
     */
    cleanupDescentStateListener(element) {
        if (element._roilColorStateListener) {
            element.removeEventListener('roil-color-state-change', element._roilColorStateListener);
            element._roilColorStateListener = null;
        }
        element._roilCircleData = null;
    },

    /**
     * Update colors for existing glow circle without recreating elements
     * Enhanced to handle descent state listening
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

        // NEW: Check if this element has descent state listening active
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

        // Note: ChakraFormSystem and ParticleSystem don't have updateColors methods
        // so they will pick up the new colors via CSS variables automatically
        // If needed, these systems could be recreated, but that might affect other animations
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
        
        console.log(`[GlowCircleRenderer] ${entityId}: transition=${transitionDuration}s, interval=${cycleInterval}ms, startColor=${startingColorIndex}`);
        
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
