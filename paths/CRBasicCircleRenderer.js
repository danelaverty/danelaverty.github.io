// renderers/BasicCircleRenderer.js - Basic circle type renderer
export const BasicCircleRenderer = {
    /**
     * Render basic circle type
     */
    render(element, circle) {
        if (!element) return;
        element.style.backgroundColor = circle.colors?.[0] || circle.color || '#4CAF50';
    }
};
