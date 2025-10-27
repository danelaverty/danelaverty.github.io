// renderers/GlowCircleRenderer.js - Glow circle type renderer
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

        // Handle multi-color cycling for glow container
        const hasMultipleColors = circle.colors && circle.colors.length > 1;
        if (hasMultipleColors) {
            this.startGlowColorCycling(glowContainer, circle.colors);
        }

        // Create particles - hide for drones AND roil members
        if (!circle.isDrone && !isRoilMember) {
            ParticleSystem.create(element, circle);
        }

        // Create chakra form
        ChakraFormSystem.create(element, circle, squareCount);

        // Handle multi-color flow overlay if multiple colors
        if (hasMultipleColors) {
            ColorFlowSystem.start(element, circle.colors);
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
