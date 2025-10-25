// renderers/GlowCircleRenderer.js - Glow circle type renderer
import { ParticleSystem } from './ParticleSystem.js';
import { ChakraFormSystem } from './ChakraFormSystem.js';
import { ColorFlowSystem } from './ColorFlowSystem.js';

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

        // Create particles - hide for drones AND roil members
        if (!circle.isDrone && !isRoilMember) {
                ParticleSystem.create(element, circle);
        }

        // Create chakra form
        ChakraFormSystem.create(element, circle, squareCount);

        // Handle multi-color flow if multiple colors
        if (circle.colors && circle.colors.length > 1) {
            ColorFlowSystem.start(element, circle.colors);
        }
    }
};
