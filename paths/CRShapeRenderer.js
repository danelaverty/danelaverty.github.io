// renderers/ShapeRenderer.js - Shape circle type renderer for geometric shapes
export const ShapeRenderer = {
    /**
     * Render shape circle type
     */
    render(element, circle) {
        if (!element) return;
        
        // Set transparent background for the element
        element.style.backgroundColor = 'transparent';
        element.style.border = 'none';
        
        // Determine which shape to render (default to rightPointingTriangle for now)
        const shapeType = circle.shape || 'rightPointingTriangle';
        
        // Render the appropriate shape
        switch (shapeType) {
            case 'rightPointingTriangle':
                this.renderRightPointingTriangle(element, circle);
                break;
            case 'diamond':
                this.renderDiamond(element, circle);
                break;
            case 'oval':
                this.renderOval(element, circle);
                break;
            default:
                this.renderRightPointingTriangle(element, circle);
                break;
        }
    },

    /**
     * Renders a right-pointing triangle shape
     * @param {HTMLElement} element - The circle element
     * @param {Object} circle - The circle data object
     */
    renderRightPointingTriangle(element, circle) {
        const shapeWrap = this.createShapeWrap(element, 'right-triangle-wrap');
        
        const styles = this.getBaseShapeStyles(circle);
        styles.clipPath = 'polygon(10% 10%, 90% 50%, 10% 90%)';
        
        const shapeElement = this.createShapeElement('right-triangle-shape', styles);
        this.addClickHandler(shapeWrap, element);
        
        shapeWrap.appendChild(shapeElement);
    },

    /**
     * Renders a diamond shape
     * @param {HTMLElement} element - The circle element
     * @param {Object} circle - The circle data object
     */
    renderDiamond(element, circle) {
        this.renderBasicShape(element, circle, 'diamond', 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)');
    },

    /**
     * Renders an oval shape
     * @param {HTMLElement} element - The circle element
     * @param {Object} circle - The circle data object
     */
    renderOval(element, circle) {
        const shapeWrap = this.createShapeWrap(element, 'oval-wrap');
        
        const styles = this.getBaseShapeStyles(circle);
        styles.width = '30px';
        styles.height = '20px';
        styles.borderRadius = '50%';
        
        const shapeElement = this.createShapeElement('oval-shape', styles);
        this.addClickHandler(shapeWrap, element);
        
        shapeWrap.appendChild(shapeElement);
    },

    /**
     * Renders a basic shape with clip path
     * @param {HTMLElement} element - The circle element
     * @param {Object} circle - The circle data object
     * @param {string} shapeType - Type of shape
     * @param {string} clipPath - CSS clip path
     */
    renderBasicShape(element, circle, shapeType, clipPath) {
        const shapeWrap = this.createShapeWrap(element, `${shapeType}-wrap`);
        
        const styles = this.getBaseShapeStyles(circle);
        styles.clipPath = clipPath;
        
        const shapeElement = this.createShapeElement(`${shapeType}-shape`, styles);
        this.addClickHandler(shapeWrap, element);
        
        shapeWrap.appendChild(shapeElement);
    },

    /**
     * Create shape wrapper element
     * @param {HTMLElement} element - The circle element
     * @param {string} className - CSS class name for the wrapper
     * @returns {HTMLElement} The created shape wrap element
     */
    createShapeWrap(element, className = 'shape-wrap') {
        const shapeWrap = document.createElement('div');
        shapeWrap.className = className;
        shapeWrap.style.cssText = `
            position: absolute;
            width: 32px;
            height: 32px;
            cursor: pointer;
            background-color: rgba(0,0,0,0.001);
            z-index: 10;
            top: 50%;
            left: 50%;
        `;
        
        element.appendChild(shapeWrap);
        return shapeWrap;
    },

    /**
     * Get base styles for shape elements
     * @param {Object} circle - The circle data object
     * @returns {Object} Style object
     */
    getBaseShapeStyles(circle) {
        const color = circle.colors?.[0] || circle.color || '#4CAF50';
        
        return {
            position: 'absolute',
            width: '32px',
            height: '32px',
            backgroundColor: color,
            transition: 'transform 0.3s ease',
            zIndex: '5',
            pointerEvents: 'none'
        };
    },

    /**
     * Create shape element with styles
     * @param {string} className - CSS class name
     * @param {Object} styles - Style object
     * @returns {HTMLElement} The created shape element
     */
    createShapeElement(className, styles) {
        const element = document.createElement('div');
        element.className = className;
        
        // Apply styles
        Object.assign(element.style, styles);
        
        return element;
    },

    /**
     * Add click handler to shape wrap
     * @param {HTMLElement} shapeWrap - The shape wrapper element
     * @param {HTMLElement} circleElement - The circle element
     */
    addClickHandler(shapeWrap, circleElement) {
        shapeWrap.style.cursor = "pointer";
        shapeWrap.addEventListener('click', (e) => {
            e.stopPropagation();
            // Trigger click on the circle element to maintain existing behavior
            circleElement.click();
        });
    }
};
