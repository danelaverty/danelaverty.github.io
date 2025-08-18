// renderers/TriangleCircleRenderer.js - Triangle circle type renderer
export const TriangleCircleRenderer = {
    /**
     * Render triangle circle type
     */
    render(element, circle) {
        if (!element) return;
        
        // Get completion level
        const completionLevel = this.getCompletionLevel(circle);
        
        // Create triangle wrapper
        const triangleWrap = document.createElement('div');
        triangleWrap.className = `triangle-wrap completion-${completionLevel}`;
        
        // Create triangle shape based on completion level
        this.createTriangleShapeByCompletionLevel(triangleWrap, circle, completionLevel);
        
        element.appendChild(triangleWrap);
    },

    /**
     * Get completion level for triangle
     */
    getCompletionLevel(circle) {
        if (!circle.characteristics || !circle.characteristics.completion) {
            return "no-completion";
        }
        return circle.characteristics.completion;
    },

    /**
     * Create triangle shape based on completion level
     */
    createTriangleShapeByCompletionLevel(triangleWrap, circle, completionLevel) {
        switch (completionLevel) {
            case 'level0':
                this.createLevel0Triangle(triangleWrap, circle);
                break;
            case 'level1':
                this.createLevel1Triangle(triangleWrap, circle);
                break;
            case 'level2':
            case 'no-completion':
            default:
                this.createLevel2Triangle(triangleWrap, circle);
                break;
        }
    },

    /**
     * Create level 0 triangle (dashed outline only)
     */
    createLevel0Triangle(triangleWrap, circle) {
        const triangleShape = document.createElement('div');
        triangleShape.className = 'triangle-shape';
        triangleWrap.appendChild(triangleShape);
    },

    /**
     * Create level 1 triangle (partial fill with outline)
     */
    createLevel1Triangle(triangleWrap, circle) {
        const triangleOutline = document.createElement('div');
        triangleOutline.className = 'triangle-outline';
        triangleWrap.appendChild(triangleOutline);
        
        const triangleShape = document.createElement('div');
        triangleShape.className = 'triangle-shape';
        triangleWrap.appendChild(triangleShape);
    },

    /**
     * Create level 2 triangle (full 3D pyramid)
     */
    createLevel2Triangle(triangleWrap, circle) {
        const triangleShape = document.createElement('div');
        triangleShape.className = 'triangle-shape';
        triangleWrap.appendChild(triangleShape);
        
        const pyramidSide = document.createElement('div');
        pyramidSide.className = 'pyramid-side';
        triangleWrap.appendChild(pyramidSide);
    }
};
