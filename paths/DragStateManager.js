// DragStateManager.js - Manages drag state and visual updates during dragging
export class DragStateManager {
    constructor(entityTypeHandler) {
        this.entityTypeHandler = entityTypeHandler;
        this.reset();
    }

    reset() {
        this.dragStarted = false;
        this.hasDraggedSinceMouseDown = false;
        this.mouseStartPos = { x: 0, y: 0 };
        this.currentDragDeltas = { deltaX: 0, deltaY: 0 };
    }

    handleMouseDown(e) {
        this.dragStarted = false;
        this.hasDraggedSinceMouseDown = false;
        this.mouseStartPos = { x: e.clientX, y: e.clientY };
    }

    handleMouseMove(e) {
        if (!this.dragStarted) {
            const deltaX = Math.abs(e.clientX - this.mouseStartPos.x);
            const deltaY = Math.abs(e.clientY - this.mouseStartPos.y);
            if (deltaX > 3 || deltaY > 3) {
                this.dragStarted = true;
            }
        }
    }

    updateDragState(deltaX, deltaY) {
        this.hasDraggedSinceMouseDown = true;
        this.currentDragDeltas = { deltaX, deltaY };
    }

    updateEntityVisuals(selectedEntityIds, deltaX, deltaY) {
        selectedEntityIds.forEach(id => {
            const entityElement = document.querySelector(`[data-entity-id="${id}"]`);
            if (entityElement) {
                const entity = this.entityTypeHandler.findEntityById(id);
                if (entity) {
                    const visualPos = this.entityTypeHandler.calculateVisualPosition(entity, deltaX, deltaY);
                    entityElement.style.left = visualPos.left;
                    entityElement.style.top = visualPos.top;
                    entityElement.classList.add('dragging');
                }
            }
        });
    }

    resetEntityVisuals(selectedEntityIds) {
        selectedEntityIds.forEach(id => {
            const entityElement = document.querySelector(`[data-entity-id="${id}"]`);
            if (entityElement) {
                entityElement.classList.remove('dragging');
                
                const entity = this.entityTypeHandler.findEntityById(id);
                if (entity) {
                    this.entityTypeHandler.resetVisualPosition(entity, entityElement);
                }
            }
        });
    }

    shouldProcessClick() {
        return !this.dragStarted && !this.hasDraggedSinceMouseDown;
    }

    shouldUpdatePosition(deltaX, deltaY) {
        return this.hasDraggedSinceMouseDown && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1);
    }

    getCurrentEntitiesWithDeltas() {
        const entities = this.entityTypeHandler.getCurrentEntities();
        
        if (!this.hasDraggedSinceMouseDown) {
            return entities;
        }
        
        const selectedIds = this.entityTypeHandler.getSelectedEntityIds();
        
        return entities.map(entity => {
            if (selectedIds.includes(entity.id)) {
                return {
                    ...entity,
                    x: entity.x + this.currentDragDeltas.deltaX,
                    y: entity.y + this.currentDragDeltas.deltaY
                };
            }
            return entity;
        });
    }
}
