// systems/ColorFlowSystem.js - FIXED Color flow system for multi-color glow circles
import { hslStringToHex } from './colorUtils.js';

export const ColorFlowSystem = {
    /**
     * Start organic color flow for multi-color circles
     */
    start(element, colors) {
        if (!colors || colors.length <= 1) {
            return;
        }
        
        if (!element) {
            return;
        }
        
        // Stop any existing flow first
        this.stop(element);
        
        // Wait a bit to ensure glow elements are rendered
        setTimeout(() => {
            var hexColors = [];
            colors.forEach(function(color) {
                hexColors.push(hslStringToHex(color));
            });
            this.createColorFlowOverlay(element, hexColors);
        }, 100);
    },

    /**
     * Create the color flow overlay system
     */
    createColorFlowOverlay(element, colors) {
        const gradientOverlay = document.createElement('div');
        gradientOverlay.className = 'color-flow-overlay';
        
        // FIXED: Ensure proper styling for the overlay
        gradientOverlay.style.position = 'absolute';
        gradientOverlay.style.top = '0';
        gradientOverlay.style.left = '0';
        gradientOverlay.style.width = '100%';
        gradientOverlay.style.height = '100%';
        gradientOverlay.style.borderRadius = '50%';
        gradientOverlay.style.pointerEvents = 'none';
        gradientOverlay.style.zIndex = '3'; // FIXED: Higher z-index to ensure it's above glow
        gradientOverlay.style.filter = 'blur(4px)';
        
        this.createGradientLayers(element, gradientOverlay, colors);
        
        element.appendChild(gradientOverlay);
        element._gradientOverlay = gradientOverlay;
        
        this.animateColorFlow(element, colors);
    },

    /**
     * Create gradient layers for color flow
     */
    createGradientLayers(element, container, colors) {
        const layerCount = Math.min(colors.length, 4);
        element._gradientLayers = [];
        
        for (let i = 0; i < layerCount; i++) {
            const layer = document.createElement('div');
            layer.className = `gradient-layer gradient-layer-${i}`;
            
            // FIXED: Ensure proper styling for each layer
            layer.style.position = 'absolute';
            layer.style.top = '0';
            layer.style.left = '0';
            layer.style.width = '100%';
            layer.style.height = '100%';
            layer.style.borderRadius = '50%';
            layer.style.mixBlendMode = i === 0 ? 'normal' : 'overlay';
            layer.style.opacity = '0.9'; // FIXED: Increased opacity for better visibility
            
            // FIXED: Add immediate visible background for testing
            const testColor = colors[i % colors.length];
            layer.style.background = `radial-gradient(circle at 50% 50%, ${testColor} 0%, transparent 70%)`;
            
            container.appendChild(layer);
            element._gradientLayers.push(layer);
            
        }
    },

    /**
     * Animate color flow - FIXED with better debugging and more visible effects
     */
    animateColorFlow(element, colors) {
        const layers = element._gradientLayers;
        if (!layers || layers.length === 0) {
            return;
        }
        
        let time = 0;
        let frameCount = 0;
        
        const animate = () => {
            if (!element.parentNode) {
                return;
            }
            
            time += 0.02;
            frameCount++;
            
            layers.forEach((layer, index) => {
                if (!layer || index >= colors.length) return;
                
                const color1 = colors[index];
                const color2 = colors[(index + 1) % colors.length];
                
                const phase1 = time + (index * Math.PI / 2);
                const phase2 = time * 0.7 + (index * Math.PI / 3);
                
                const x1 = 50 + Math.sin(phase1) * 30;
                const y1 = 50 + Math.cos(phase1) * 30;
                const x2 = 50 + Math.sin(phase2) * 40;
                const y2 = 50 + Math.cos(phase2) * 40;
                
                // FIXED: More pronounced gradient with higher opacity
                const gradient = `radial-gradient(ellipse ${60 + Math.sin(time * 0.5 + index) * 20}% ${60 + Math.cos(time * 0.3 + index) * 20}% at ${x1}% ${y1}%, ${color1} 0%, ${color1}88 30%, transparent 50%, ${color2}88 60%, transparent 100%)`;
                
                layer.style.background = gradient;
                
                const rotation = (time * 10 + index * 45) % 360;
                layer.style.transform = `rotate(${rotation}deg)`;
            });
            
            element._colorFlowAnimation = requestAnimationFrame(animate);
        };
        
        animate();
    },

    /**
     * Stop organic color flow
     */
    stop(element) {
        if (!element) return;
        
        if (element._colorFlowAnimation) {
            cancelAnimationFrame(element._colorFlowAnimation);
            element._colorFlowAnimation = null;
        }
        
        if (element._gradientOverlay && element._gradientOverlay.parentNode) {
            element._gradientOverlay.parentNode.removeChild(element._gradientOverlay);
            element._gradientOverlay = null;
        }
        
        element._gradientLayers = null;
    },

    /**
     * FIXED: Add method to check if color flow is active (for debugging)
     */
    isActive(element) {
        return !!(element && element._colorFlowAnimation && element._gradientOverlay);
    },

    /**
     * FIXED: Add method to get current status (for debugging)
     */
    getStatus(element) {
        if (!element) return 'No element';
        
        return {
            hasAnimation: !!element._colorFlowAnimation,
            hasOverlay: !!element._gradientOverlay,
            hasLayers: !!element._gradientLayers,
            layerCount: element._gradientLayers ? element._gradientLayers.length : 0,
            overlayInDOM: element._gradientOverlay ? !!element._gradientOverlay.parentNode : false
        };
    }
};
