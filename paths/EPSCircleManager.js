export class EPSCircleManager {
    constructor() {
        this.circles = new Map(); // Map of circle id to circle data and element
    }

    /**
     * Register a circle with the proximity system
     */
    registerCircle(id, circle, element, viewerWidth, viewerId) {
        if (!circle || !element || !viewerId) return;

        this.circles.set(id, {
            circle,
            element,
            viewerWidth,
            viewerId,
            lastPosition: this.getCirclePosition(circle, viewerWidth),
            tempPosition: null
        });

        // Initialize CSS transition for smooth scaling
        this.initializeElementTransition(element);
        
        return true;
    }

    /**
     * Unregister a circle from the proximity system
     */
    unregisterCircle(id) {
        this.circles.delete(id);
    }

    /**
     * Update circle data (called when circle moves or changes)
     */
    updateCircle(id, circle, element, viewerWidth, viewerId) {
        if (!this.circles.has(id)) {
            return this.registerCircle(id, circle, element, viewerWidth, viewerId);
        } else {
            const data = this.circles.get(id);
            data.circle = circle;
            data.element = element;
            data.viewerWidth = viewerWidth;
            data.viewerId = viewerId;
            data.lastPosition = this.getCirclePosition(circle, viewerWidth);
            return true;
        }
    }

    /**
     * Set temporary position for a circle during drag operations
     */
    setTempPosition(id, x, y) {
        const data = this.circles.get(id);
        if (data) {
            data.tempPosition = { x, y };
        }
    }

    /**
     * Clear temporary position for a circle (called when drag ends)
     */
    clearTempPosition(id) {
        const data = this.circles.get(id);
        if (data) {
            data.tempPosition = null;
        }
    }

    /**
     * Get effective position of a circle (temp position if dragging, otherwise stored position)
     */
    getEffectivePosition(id) {
        const data = this.circles.get(id);
        if (!data) return null;

        // Use temporary position if available (during drag), otherwise use stored position
        if (data.tempPosition) {
            return data.tempPosition;
        }

        return this.getCirclePosition(data.circle, data.viewerWidth);
    }

    /**
     * Get absolute position of a circle
     */
    getCirclePosition(circle, viewerWidth) {
        // For circles: position relative to center of viewer
        const centerX = viewerWidth / 2;
        return {
            x: centerX + circle.x + 16, // +16 for circle center (32px width / 2)
            y: circle.y + 16 // +16 for circle center (32px height / 2)
        };
    }

    /**
     * Initialize CSS transition for smooth scaling
     */
    initializeElementTransition(element) {
        const transitionDuration = '1s';
        element.style.transition = `transform ${transitionDuration} cubic-bezier(0.2,-2,0.8,2), opacity ${transitionDuration} cubic-bezier(0.2,-2,0.8,2), filter ${transitionDuration} cubic-bezier(0.2,-2,0.8,2)`;
    }

    /**
     * Group circles by their viewer ID for isolated processing
     */
    groupCirclesByViewer() {
        const circlesByViewer = new Map();
        
        Array.from(this.circles.values()).forEach(data => {
            const viewerId = data.viewerId;
            if (!circlesByViewer.has(viewerId)) {
                circlesByViewer.set(viewerId, []);
            }
            circlesByViewer.get(viewerId).push(data);
        });
        
        return circlesByViewer;
    }

    /**
     * Categorize circles by their energy types within a viewer
     */
    categorizeCirclesByEnergyType(viewerCircles) {
        return {
            glowCircles: viewerCircles.filter(data => this.isGlowCircle(data.circle)),
            exciterCircles: viewerCircles.filter(data => 
                (this.hasEnergyType(data.circle, 'exciter') || this.hasEnergyType(data.circle, 'igniter')) && this.isCircleActivated(data.circle)
            ),
            dampenerCircles: viewerCircles.filter(data => 
                this.hasEnergyType(data.circle, 'dampener') && this.isCircleActivated(data.circle)
            )
        };
    }

    /**
     * Check if a circle has a specific energy type
     */
    hasEnergyType(circle, energyType) {
        return circle.energyTypes && circle.energyTypes.includes(energyType);
    }

    /**
     * Check if a circle is a glow type
     */
    isGlowCircle(circle) {
        return true;
    }

    /**
     * Check if a circle is activated
     */
    isCircleActivated(circle) {
        return circle.activation === 'activated';
    }

    /**
     * Check if a circle is inactive
     */
    isCircleInactive(circle) {
        return circle.activation === 'inactive';
    }

    /**
     * Clear all registered circles
     */
    clear() {
        this.circles.clear();
    }

    /**
     * Get circle data by ID
     */
    getCircleData(id) {
        return this.circles.get(id);
    }

    /**
     * Get all circles
     */
    getAllCircles() {
        return this.circles;
    }
}
