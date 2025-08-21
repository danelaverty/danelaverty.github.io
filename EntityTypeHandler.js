import { ConnectionUtils } from './ConnectionUtils.js';

// EntityTypeHandler.js - Fixed to ensure circles use correct viewer containers
export class EntityTypeHandler {
    constructor(dataStore, props) {
        this.dataStore = dataStore;
        this.props = props;
    }

    // Abstract methods to be implemented by subclasses
    getConnectionEntityType() {
        throw new Error('getConnectionEntityType must be implemented by subclass');
    }

    getCurrentEntities() {
        throw new Error('getCurrentEntities must be implemented by subclass');
    }

    getSelectedEntityIds() {
        throw new Error('getSelectedEntityIds must be implemented by subclass');
    }

    calculateVisualPosition(entity, deltaX, deltaY) {
        throw new Error('calculateVisualPosition must be implemented by subclass');
    }

    resetVisualPosition(entity, entityElement) {
        throw new Error('resetVisualPosition must be implemented by subclass');
    }

    getConnectionDistance(entity) {
        throw new Error('getConnectionDistance must be implemented by subclass');
    }

    getCenterPosition(entity, deltaX, deltaY) {
        throw new Error('getCenterPosition must be implemented by subclass');
    }

    isMultiSelected(entityId) {
        throw new Error('isMultiSelected must be implemented by subclass');
    }

    getSelectedIds() {
        throw new Error('getSelectedIds must be implemented by subclass');
    }

    findEntityById(id) {
        throw new Error('findEntityById must be implemented by subclass');
    }

    handleSpecialClick(entityId, event) {
        // Default implementation - can be overridden
        return false;
    }

    getContainer() {
        throw new Error('getContainer must be implemented by subclass');
    }

    // ADDED: Helper method to get viewerId (useful for subclasses)
    getViewerId() {
        return this.props.viewerId;
    }
}

// Circle-specific handler
export class CircleHandler extends EntityTypeHandler {
    getConnectionEntityType() {
        // Priority 1: Use viewerId from props
        if (this.props.viewerId) {
            return `circle-${this.props.viewerId}`;
        }
        
        // Priority 2: Try DOM hierarchy
        if (this.props.elementRef?.value) {
            const viewer = this.props.elementRef.value.closest('[data-viewer-id]');
            if (viewer) {
                const viewerId = viewer.getAttribute('data-viewer-id');
                return `circle-${viewerId}`;
            }
        }
        
        // Priority 3: Selected viewer from dataStore
        if (this.dataStore.data?.selectedViewerId) {
            return `circle-${this.dataStore.data.selectedViewerId}`;
        }
        
        // Priority 4: Search through viewers
        const actualViewerId = this.findActualViewerId();
        if (actualViewerId) {
            return `circle-${actualViewerId}`;
        }
        
        return 'circle';
    }

    findActualViewerId() {
        if (!this.dataStore.getCirclesForViewer) return null;
        
        const potentialViewerIds = this.findPotentialViewerIds();
        
        for (const viewerId of potentialViewerIds) {
            try {
                const circlesInViewer = this.dataStore.getCirclesForViewer(viewerId);
                if (circlesInViewer.some(c => c.id === this.props.entity.id)) {
                    return viewerId;
                }
            } catch (error) {
                continue;
            }
        }
        return null;
    }

    findPotentialViewerIds() {
        const viewerIds = [];
        
        // DOM elements
        document.querySelectorAll('[data-viewer-id]').forEach(el => {
            const id = el.getAttribute('data-viewer-id');
            if (id && !viewerIds.includes(id)) {
                viewerIds.push(id);
            }
        });
        
        // DataStore viewers
        if (this.dataStore.data?.circleViewers) {
            this.dataStore.data.circleViewers.forEach((viewer, id) => {
                if (!viewerIds.includes(id)) {
                    viewerIds.push(id);
                }
            });
        }
        
        // Fallback IDs
        ['viewer_1', 'viewer_2', 'viewer_3'].forEach(id => {
            if (!viewerIds.includes(id)) {
                viewerIds.push(id);
            }
        });
        
        return viewerIds;
    }

    getCurrentEntities() {
        const actualViewerId = this.findActualViewerId();
        const allCircles = actualViewerId && this.dataStore.getCirclesForViewer ? 
            this.dataStore.getCirclesForViewer(actualViewerId) : [];
        
        return allCircles;
    }

    getSelectedEntityIds() {
        const isMultiSelected = this.dataStore.hasMultipleCirclesSelected() && 
                               this.dataStore.isCircleSelected(this.props.entity.id);
        
        return isMultiSelected ? 
            this.dataStore.getSelectedCircles() : 
            [this.props.entity.id];
    }

    calculateVisualPosition(entity, deltaX, deltaY) {
        if (this.props.viewerWidth) {
            const centerX = this.props.viewerWidth / 2;
            return {
                left: (centerX + entity.x + deltaX) + 'px',
                top: (entity.y + deltaY) + 'px'
            };
        }
        return {
            left: (entity.x + deltaX) + 'px',
            top: (entity.y + deltaY) + 'px'
        };
    }

    resetVisualPosition(entity, entityElement) {
        if (this.props.viewerWidth) {
            const centerX = this.props.viewerWidth / 2;
            entityElement.style.left = (centerX + entity.x) + 'px';
            entityElement.style.top = entity.y + 'px';
        } else {
            entityElement.style.left = entity.x + 'px';
            entityElement.style.top = entity.y + 'px';
        }
    }

    getConnectionDistance(entity) {
        return 100; // Base circle connection distance
    }

    getCenterPosition(entity, deltaX, deltaY) {
        const viewerCenterX = this.props.viewerWidth ? this.props.viewerWidth / 2 : 200;
        return {
            x: viewerCenterX + entity.x + deltaX + 16,
            y: entity.y + deltaY + 16
        };
    }

    isMultiSelected(entityId) {
        return this.dataStore.hasMultipleCirclesSelected() && 
               this.dataStore.isCircleSelected(entityId);
    }

    getSelectedIds() {
        return this.dataStore.getSelectedCircles();
    }

    findEntityById(id) {
        const allDocuments = this.dataStore.getAllCircleDocuments();
        for (const doc of allDocuments) {
            const circles = this.dataStore.getCirclesForDocument(doc.id);
            const circle = circles.find(c => c.id === id);
            if (circle) return circle;
        }
        return null;
    }

    // FIXED: Get the correct viewer-specific container
    getContainer() {
        // Priority 1: Use viewerId from props
        if (this.props.viewerId) {
            const viewerContainer = document.querySelector(`[data-viewer-id="${this.props.viewerId}"] .viewer-content`);
            if (viewerContainer) {
                return viewerContainer;
            }
        }
        
        // Priority 2: Try DOM hierarchy from elementRef
        if (this.props.elementRef?.value) {
            const viewer = this.props.elementRef.value.closest('[data-viewer-id]');
            if (viewer) {
                const viewerContent = viewer.querySelector('.viewer-content');
                if (viewerContent) {
                    return viewerContent;
                }
            }
        }
        
        // Priority 3: Find the viewer this entity belongs to
        const actualViewerId = this.findActualViewerId();
        if (actualViewerId) {
            const viewerContainer = document.querySelector(`[data-viewer-id="${actualViewerId}"] .viewer-content`);
            if (viewerContainer) {
                return viewerContainer;
            }
        }
        
        // Priority 4: Selected viewer from dataStore
        if (this.dataStore.data?.selectedViewerId) {
            const selectedViewerContainer = document.querySelector(`[data-viewer-id="${this.dataStore.data.selectedViewerId}"] .viewer-content`);
            if (selectedViewerContainer) {
                return selectedViewerContainer;
            }
        }
        
        // Fallback: First available viewer content (should rarely be used now)
        return document.querySelector('.viewer-content');
    }
}

// Square-specific handler
export class SquareHandler extends EntityTypeHandler {
    getConnectionEntityType() {
        return 'square';
    }

    getCurrentEntities() {
        const currentDoc = this.dataStore.getCurrentSquareDocument();
        if (!currentDoc) return [];
        
        return this.dataStore.getSquaresForDocument(currentDoc.id);
    }

    getSelectedEntityIds() {
        const isMultiSelected = this.dataStore.hasMultipleSquaresSelected() && 
                               this.dataStore.isSquareSelected(this.props.entity.id);
        
        return isMultiSelected ? 
            this.dataStore.getSelectedSquares() : 
            [this.props.entity.id];
    }

    calculateVisualPosition(entity, deltaX, deltaY) {
        return {
            left: (entity.x + deltaX) + 'px',
            top: (entity.y + deltaY) + 'px'
        };
    }

    resetVisualPosition(entity, entityElement) {
        entityElement.style.left = entity.x + 'px';
        entityElement.style.top = entity.y + 'px';
    }

    getConnectionDistance(entity) {
        return entity.bold ? 165 : 130;
    }

    getCenterPosition(entity, deltaX, deltaY) {
        return {
            x: entity.x + deltaX + 21,
            y: entity.y + deltaY + 21
        };
    }

    isMultiSelected(entityId) {
        return this.dataStore.hasMultipleSquaresSelected() && 
               this.dataStore.isSquareSelected(entityId);
    }

    getSelectedIds() {
        return this.dataStore.getSelectedSquares();
    }

    findEntityById(id) {
        const currentDoc = this.dataStore.getCurrentSquareDocument();
        if (currentDoc) {
            const squares = this.dataStore.getSquaresForDocument(currentDoc.id);
            return squares.find(s => s.id === id);
        }
        return null;
    }

    handleSpecialClick(entityId, event) {
        if (event.shiftKey) {
            this.handleShiftClickSquare(entityId);
            return true;
        }
        return false;
    }

    handleShiftClickSquare(squareId) {
        const currentDoc = this.dataStore.getCurrentSquareDocument();
        if (!currentDoc) return;
        
        const allSquares = this.dataStore.getSquaresForDocument(currentDoc.id);
        const connectedSquareIds = ConnectionUtils.findRecursivelyConnectedSquares(squareId, allSquares);
        
        // Clear and select connected squares
        this.dataStore.selectSquare(null, false);
        
        const connectedIds = Array.from(connectedSquareIds);
        if (connectedIds.length > 0) {
            this.dataStore.selectSquare(connectedIds[0], false);
            for (let i = 1; i < connectedIds.length; i++) {
                this.dataStore.selectSquare(connectedIds[i], true);
            }
        }
    }

    getContainer() {
        return document.querySelector('.square-viewer-content');
    }
}
