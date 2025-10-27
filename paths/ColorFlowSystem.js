// systems/ColorFlowSystem.js - Refactored to use individual gradient divs
import { hslStringToHex } from './colorUtils.js';

export const ColorFlowSystem = {
    debugLog(message, element, data = {}) {
        const elementId = element?.id || element?.dataset?.entityId || 'unknown';
        console.log(`[ColorFlowSystem] ${message} - Element: ${elementId}`, {
            element,
            overlayCount: element ? element.querySelectorAll('.color-flow-overlay').length : 0,
            gradientLayerCount: element ? element.querySelectorAll('.color-flow-gradient-layer').length : 0,
            hasAnimation: !!element?._colorFlowAnimation,
            hasOverlay: !!element?._gradientOverlay,
            ...data
        });
    },

    /**
     * Start CSS-based multi-layer color flow for multi-color circles
     */
    start(element, colors) {
        this.debugLog('start() called', element, { colorsLength: colors?.length });
        
        if (!colors || colors.length <= 1) {
            this.debugLog('start() early return - insufficient colors', element);
            return;
        }
        
        if (!element) {
            this.debugLog('start() early return - no element', element);
            return;
        }
        
        // Stop any existing flow first
        this.debugLog('calling stop() before starting new flow', element);
        this.stop(element);
        
        // Convert colors to hex format
        const hexColors = colors.map(color => hslStringToHex(color));
        
        this.createColorFlowOverlay(element, hexColors);
    },

    /**
     * Create the CSS-based color flow overlay system with individual gradient divs
     */
    createColorFlowOverlay(element, colors) {
        this.debugLog('createColorFlowOverlay() called', element, { colorsLength: colors.length });
        
        // Check for existing overlays before creating new one
        const existingOverlays = element.querySelectorAll('.color-flow-overlay');
        if (existingOverlays.length > 0) {
            this.debugLog('WARNING: Found existing overlays before creating new one!', element, { 
                overlayCount: existingOverlays.length 
            });
            // Remove existing overlays
            existingOverlays.forEach((overlay, index) => {
                this.debugLog(`Removing existing overlay ${index}`, element);
                overlay.remove();
            });
        }
        
        // Create parent container
        const gradientOverlay = document.createElement('div');
        gradientOverlay.className = 'color-flow-overlay multi-layer-flow';
        gradientOverlay.dataset.debugId = Date.now(); // Add unique ID for debugging
        
        this.debugLog('created new overlay element', element, { 
            overlayDebugId: gradientOverlay.dataset.debugId 
        });
        
        // Create individual gradient layers
        this.createGradientLayers(gradientOverlay, colors);
        
        element.appendChild(gradientOverlay);
        element._gradientOverlay = gradientOverlay;
        
        this.debugLog('overlay added to DOM', element, { 
            overlayDebugId: gradientOverlay.dataset.debugId,
            totalOverlaysInElement: element.querySelectorAll('.color-flow-overlay').length,
            gradientLayersCreated: gradientOverlay.querySelectorAll('.color-flow-gradient-layer').length
        });
    },

    /**
     * Create individual gradient layer divs within the overlay container
     */
    createGradientLayers(overlay, colors) {
        // Define gradient positions for up to 4 colors
        const gradientPositions = [
            { ellipse: '60% 60%', at: '30% 30%', rotation: '0deg' },
            { ellipse: '70% 50%', at: '70% 60%', rotation: '90deg' },
            { ellipse: '50% 80%', at: '40% 80%', rotation: '180deg' },
            { ellipse: '80% 60%', at: '80% 20%', rotation: '270deg' }
        ];
        
        // Create layers - limit to 4 for performance
        const layerCount = Math.min(colors.length, 4);
        
        for (let i = 0; i < layerCount; i++) {
            const color = colors[i % colors.length];
            const position = gradientPositions[i];
            
            // Create gradient layer div
            const gradientLayer = document.createElement('div');
            gradientLayer.className = 'color-flow-gradient-layer';
            gradientLayer.dataset.layerIndex = i;
            gradientLayer.dataset.color = color;
            
            // Set individual layer styles
            this.setGradientLayerStyles(gradientLayer, color, position, i);
            
            overlay.appendChild(gradientLayer);
        }
        
        this.debugLog('gradient layers created', overlay.parentElement, {
            layerCount: layerCount,
            colorsUsed: colors.slice(0, layerCount)
        });
    },

    /**
     * Set styles for an individual gradient layer
     */
    setGradientLayerStyles(layer, color, position, index) {
        // Add transparency to color (88 = about 53% opacity)
        const transparentColor = color + '88';
        
        // Create the radial gradient for this layer
        const gradient = `radial-gradient(ellipse ${position.ellipse} at ${position.at}, ${transparentColor} 0%, transparent 70%)`;
        
        // Apply styles to the layer
        layer.style.position = 'absolute';
        layer.style.top = '0';
        layer.style.left = '0';
        layer.style.width = '100%';
        layer.style.height = '100%';
        layer.style.borderRadius = '50%';
        layer.style.pointerEvents = 'none';
        layer.style.background = gradient;
        layer.style.zIndex = 3 + index; // Stack layers with increasing z-index
        
        // Add unique animation for each layer
        this.setLayerAnimation(layer, index);
        
        this.debugLog('gradient layer styles set', layer.parentElement?.parentElement, {
            layerIndex: index,
            color: color,
            gradient: gradient,
            zIndex: 3 + index
        });
    },


/**
 * Set unique animation for each gradient layer with organic timing variations
 */
setLayerAnimation(layer, index) {
    // Different animation duration and direction for each layer
    const baseDuration = 12; // seconds
    const durationVariation = [0, 2, -1, 3]; // Vary duration for each layer
    const duration = baseDuration + (durationVariation[index] || 0);
    
    // Alternate rotation direction
    const direction = index % 2 === 0 ? 'normal' : 'reverse';
    
    // Add slight delay for staggered effect
    const delay = index * 0.5; // seconds
    
    // Generate random coefficients for organic timing (seeded by layer index for consistency)
    const seed = index + 1;
    const opacityCoeff = 0.7 + (Math.sin(seed * 2.1) + 1) * 0.3; // Range: 0.7 - 1.3
    const scaleCoeff = 0.8 + (Math.cos(seed * 1.7) + 1) * 0.2; // Range: 0.8 - 1.2
    
    const opacityDuration = (8 * opacityCoeff).toFixed(1);
    const scaleDuration = (6 * scaleCoeff).toFixed(1);
    const opacityDelay = (delay + seed * 0.3).toFixed(1);
    const scaleDelay = (delay + seed * 0.7).toFixed(1);
    
    // Combine all animations
    layer.style.animation = [
        `smoothRotate ${duration}s linear infinite ${direction}`,
        `gradientOpacityShift ${opacityDuration}s ease-in-out infinite`,
        `gradientScaleShift ${scaleDuration}s ease-in-out infinite`
    ].join(', ');
    
    layer.style.animationDelay = `${delay}s, ${opacityDelay}s, ${scaleDelay}s`;
    
    // Store animation info for debugging
    layer.dataset.animationDuration = duration;
    layer.dataset.animationDirection = direction;
    layer.dataset.animationDelay = delay;
    layer.dataset.opacityCoeff = opacityCoeff;
    layer.dataset.scaleCoeff = scaleCoeff;
},

    /**
     * Update a specific gradient layer's color
     */
    updateLayerColor(element, layerIndex, newColor) {
        if (!element || !element._gradientOverlay) return;
        
        const layer = element._gradientOverlay.querySelector(`[data-layer-index="${layerIndex}"]`);
        if (!layer) return;
        
        const transparentColor = newColor + '88';
        const currentBackground = layer.style.background;
        
        // Extract position info from current gradient and apply new color
        const gradientMatch = currentBackground.match(/ellipse ([^)]+) at ([^,]+),/);
        if (gradientMatch) {
            const ellipse = gradientMatch[1];
            const at = gradientMatch[2];
            layer.style.background = `radial-gradient(ellipse ${ellipse} at ${at}, ${transparentColor} 0%, transparent 70%)`;
            layer.dataset.color = newColor;
        }
        
        this.debugLog('layer color updated', element, {
            layerIndex,
            newColor,
            updatedBackground: layer.style.background
        });
    },

    /**
     * Get a specific gradient layer
     */
    getGradientLayer(element, layerIndex) {
        if (!element || !element._gradientOverlay) return null;
        return element._gradientOverlay.querySelector(`[data-layer-index="${layerIndex}"]`);
    },

    /**
     * Get all gradient layers
     */
    getAllGradientLayers(element) {
        if (!element || !element._gradientOverlay) return [];
        return Array.from(element._gradientOverlay.querySelectorAll('.color-flow-gradient-layer'));
    },

    /**
     * Stop color flow
     */
    stop(element) {
        this.debugLog('stop() called', element);
        
        if (!element) {
            this.debugLog('stop() early return - no element', element);
            return;
        }
        
        if (element._gradientOverlay && element._gradientOverlay.parentNode) {
            const layerCount = element._gradientOverlay.querySelectorAll('.color-flow-gradient-layer').length;
            this.debugLog('removing gradient overlay from DOM', element, {
                overlayDebugId: element._gradientOverlay.dataset?.debugId,
                layerCount: layerCount
            });
            element._gradientOverlay.parentNode.removeChild(element._gradientOverlay);
            element._gradientOverlay = null;
        }
        
        // Final check for any remaining overlays
        const remainingOverlays = element.querySelectorAll('.color-flow-overlay');
        if (remainingOverlays.length > 0) {
            this.debugLog('WARNING: Found remaining overlays after stop()', element, {
                overlayCount: remainingOverlays.length
            });
            remainingOverlays.forEach((overlay, index) => {
                this.debugLog(`Removing remaining overlay ${index}`, element, {
                    overlayDebugId: overlay.dataset?.debugId
                });
                overlay.remove();
            });
        }
    },

    /**
     * Check if color flow is active
     */
    isActive(element) {
        const active = !!(element && element._gradientOverlay);
        this.debugLog('isActive() called', element, { active });
        return active;
    },

    /**
     * Get current status
     */
    getStatus(element) {
        if (!element) return 'No element';
        
        const status = {
            hasOverlay: !!element._gradientOverlay,
            overlayInDOM: element._gradientOverlay ? !!element._gradientOverlay.parentNode : false,
            overlayCountInElement: element.querySelectorAll('.color-flow-overlay').length,
            gradientLayerCount: element.querySelectorAll('.color-flow-gradient-layer').length,
            layerDetails: this.getAllGradientLayers(element).map((layer, index) => ({
                index: layer.dataset.layerIndex,
                color: layer.dataset.color,
                duration: layer.dataset.animationDuration,
                direction: layer.dataset.animationDirection,
                delay: layer.dataset.animationDelay
            }))
        };
        
        this.debugLog('getStatus() called', element, status);
        return status;
    },

    // Debug method to manually check for duplicates
    checkForDuplicates(element) {
        if (!element) return;
        
        const overlays = element.querySelectorAll('.color-flow-overlay');
        const gradientLayers = element.querySelectorAll('.color-flow-gradient-layer');
        
        this.debugLog('Manual duplicate check', element, {
            overlayCount: overlays.length,
            gradientLayerCount: gradientLayers.length,
            overlayDetails: Array.from(overlays).map(overlay => ({
                debugId: overlay.dataset?.debugId,
                hasParent: !!overlay.parentNode,
                className: overlay.className,
                childLayerCount: overlay.querySelectorAll('.color-flow-gradient-layer').length
            })),
            layerDetails: Array.from(gradientLayers).map(layer => ({
                layerIndex: layer.dataset?.layerIndex,
                color: layer.dataset?.color,
                hasParent: !!layer.parentNode
            }))
        });
        
        return {
            overlayCount: overlays.length,
            gradientLayerCount: gradientLayers.length
        };
    }
};
