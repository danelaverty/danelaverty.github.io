// RadiusIndicatorManager.js - Manages connection radius indicators
import { injectComponentStyles } from './styleUtils.js';

// Inject radius indicator styles
const radiusIndicatorStyles = `
    .connection-radius-indicator {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        z-index: 998;
        background: rgba(255, 255, 255, 0.05);
        transition: none;
    }

    .connection-radius-indicator.bold {
        background: rgba(255, 255, 100, 0.08) !important;
    }

    .connection-radius-indicator.circle-indicator {
        background: rgba(76, 175, 80, 0.06) !important;
    }

    .connection-radius-indicator.fade-in {
        animation: radiusIndicatorFadeIn 0.2s ease;
    }

    .connection-radius-indicator.fade-out {
        animation: radiusIndicatorFadeOut 0.2s ease;
    }

    @keyframes radiusIndicatorFadeIn {
        from { 
            opacity: 0; 
            transform: scale(0.8);
        }
        to { 
            opacity: 1; 
            transform: scale(1);
        }
    }

    @keyframes radiusIndicatorFadeOut {
        from { 
            opacity: 1; 
            transform: scale(1);
        }
        to { 
            opacity: 0; 
            transform: scale(0.8);
        }
    }
`;

injectComponentStyles('connection-radius-indicator', radiusIndicatorStyles);

export class RadiusIndicatorManager {
    constructor(entityTypeHandler, container) {
        this.entityTypeHandler = entityTypeHandler;
        this.container = container;
        this.indicatorElements = new Map();
        this.isActive = false;
    }

    createIndicators(selectedEntityIds, deltaX, deltaY) {
        if (!this.container) return;

        this.removeIndicators();
        this.isActive = true;

        selectedEntityIds.forEach(entityId => {
            const entity = this.entityTypeHandler.findEntityById(entityId);
            if (!entity) return;

            const indicator = this.createSingleIndicator(entity, deltaX, deltaY);
            if (indicator) {
                this.container.appendChild(indicator);
                this.indicatorElements.set(entityId, indicator);
            }
        });
    }

    createSingleIndicator(entity, deltaX, deltaY) {
        const connectionDistance = this.entityTypeHandler.getConnectionDistance(entity);
        const centerPos = this.entityTypeHandler.getCenterPosition(entity, deltaX, deltaY);
        
        const indicator = document.createElement('div');
        const radius = connectionDistance;
        const diameter = radius * 2;
        
        // Set classes
        indicator.className = 'connection-radius-indicator fade-in';
        
        if (this.entityTypeHandler.constructor.name === 'SquareHandler' && entity.bold) {
            indicator.classList.add('bold');
        } else if (this.entityTypeHandler.constructor.name === 'CircleHandler') {
            indicator.classList.add('circle-indicator');
        }
        
        // Set styles
        this.applyIndicatorStyles(indicator, centerPos, radius, diameter, entity);
        
        return indicator;
    }

    applyIndicatorStyles(indicator, centerPos, radius, diameter, entity) {
        Object.assign(indicator.style, {
            position: 'absolute',
            left: (centerPos.x - radius) + 'px',
            top: (centerPos.y - radius) + 'px',
            width: diameter + 'px',
            height: diameter + 'px',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: '998',
            transition: 'none'
        });

        // Apply background based on entity type and state
        if (this.entityTypeHandler.constructor.name === 'SquareHandler' && entity.bold) {
            indicator.style.background = 'rgba(255, 255, 100, 0.08)';
        } else if (this.entityTypeHandler.constructor.name === 'CircleHandler') {
            indicator.style.background = 'rgba(76, 175, 80, 0.06)';
        } else {
            indicator.style.background = 'rgba(255, 255, 255, 0.05)';
        }
    }

    updateIndicators(selectedEntityIds, deltaX, deltaY) {
        if (!this.isActive) return;

        selectedEntityIds.forEach(entityId => {
            const indicator = this.indicatorElements.get(entityId);
            const entity = this.entityTypeHandler.findEntityById(entityId);
            
            if (!indicator || !entity) return;

            const centerPos = this.entityTypeHandler.getCenterPosition(entity, deltaX, deltaY);
            const connectionDistance = this.entityTypeHandler.getConnectionDistance(entity);
            const radius = connectionDistance;

            indicator.style.left = (centerPos.x - radius) + 'px';
            indicator.style.top = (centerPos.y - radius) + 'px';
        });
    }

    removeIndicators() {
        this.indicatorElements.forEach((indicator) => {
            if (indicator && indicator.parentNode) {
                indicator.classList.add('fade-out');
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 200);
            }
        });
        this.indicatorElements.clear();
        this.isActive = false;
    }

    cleanup() {
        this.removeIndicators();
    }
}
