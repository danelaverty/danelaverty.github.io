// renderers/GlowCircleRenderer.js - Glow circle type renderer
import { ParticleSystem } from './ParticleSystem.js';
import { ChakraFormSystem } from './ChakraFormSystem.js';
import { ColorFlowSystem } from './ColorFlowSystem.js';

export const GlowCircleRenderer = {
    /**
     * Render glow circle type
     */
    render(element, circle, squareCount) {
        if (!element) return;
        
        // Create glow element
        const glowElement = document.createElement('div');
        glowElement.className = 'circle-glow';
        element.appendChild(glowElement);

        // Create particles
        ParticleSystem.create(element, circle);

        // Create chakra form
        ChakraFormSystem.create(element, circle, squareCount);

        // Handle multi-color flow if multiple colors
        if (circle.colors && circle.colors.length > 1) {
            console.log('b');
            ColorFlowSystem.start(element, circle.colors);
        }
    }
};
