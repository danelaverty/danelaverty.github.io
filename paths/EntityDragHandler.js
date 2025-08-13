// EntityDragHandler.js - Refactored with improved architecture
import { onMounted } from './vue-composition-api.js';
import { useDraggable } from './useDraggable.js';
import { useConnectionDragUpdater } from './useConnections.js';
import { CircleHandler, SquareHandler } from './EntityTypeHandler.js';
import { RadiusIndicatorManager } from './RadiusIndicatorManager.js';
import { DragStateManager } from './DragStateManager.js';

export class EntityDragHandler {
    constructor(elementRef, emit, dataStore, props, callbacks = {}) {
        this.elementRef = elementRef;
        this.emit = emit;
        this.dataStore = dataStore;
        this.props = props;
        this.proximityCallbacks = callbacks;
        
        // Initialize type-specific handler
        this.entityTypeHandler = this.createEntityTypeHandler();
        
        // Initialize managers
        this.dragStateManager = new DragStateManager(this.entityTypeHandler);
        this.radiusIndicatorManager = new RadiusIndicatorManager(
            this.entityTypeHandler, 
            this.entityTypeHandler.getContainer()
        );
        
        // Set up connection drag updater
        this.setupConnectionUpdater();
        
        // Bind methods
        this.bindMethods();
        
        // Set up event handlers
        this.setupDragging();
        this.setupMouseTracking();
    }

    createEntityTypeHandler() {
        const handlerProps = {
            ...this.props,
            elementRef: this.elementRef
        };

        return this.props.entityType === 'circle' 
            ? new CircleHandler(this.dataStore, handlerProps)
            : new SquareHandler(this.dataStore, handlerProps);
    }

    setupConnectionUpdater() {
        const connectionEntityType = this.entityTypeHandler.getConnectionEntityType();
        
        const { updateConnectionsForDrag } = useConnectionDragUpdater(
            () => this.dragStateManager.getCurrentEntitiesWithDeltas(),
            () => this.entityTypeHandler.getSelectedEntityIds(),
            connectionEntityType
        );
        
        this.updateConnectionsForDrag = updateConnectionsForDrag;
    }

    bindMethods() {
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    setupDragging() {
        useDraggable(this.elementRef, this.onDragEnd, () => this.entityTypeHandler.getContainer(), { 
            onDragMove: this.onDragMove 
        });
    }

    setupMouseTracking() {
        onMounted(() => {
            document.addEventListener('mousemove', this.handleMouseMove);
        });
    }

    onDragMove(deltaX, deltaY) {
        this.dragStateManager.updateDragState(deltaX, deltaY);
        
        // Call proximity callback
        this.proximityCallbacks.onDragMove?.(deltaX, deltaY);
        
        this.updateVisualsDuringDrag(deltaX, deltaY);
        this.updateConnectionsDuringDrag();
    }

    updateVisualsDuringDrag(deltaX, deltaY) {
        const selectedIds = this.entityTypeHandler.getSelectedEntityIds();
        
        // Create radius indicators on first drag move
        if (!this.radiusIndicatorManager.isActive) {
            this.radiusIndicatorManager.createIndicators(selectedIds, deltaX, deltaY);
        }

        // Update entity visuals
        if (this.entityTypeHandler.isMultiSelected(this.props.entity.id)) {
            // Multi-selection: update all selected entities
            const allSelectedIds = this.entityTypeHandler.getSelectedIds();
            this.dragStateManager.updateEntityVisuals(allSelectedIds, deltaX, deltaY);
        } else {
            // Single entity: update just this one
            this.dragStateManager.updateEntityVisuals([this.props.entity.id], deltaX, deltaY);
        }

        // Update radius indicators
        this.radiusIndicatorManager.updateIndicators(selectedIds, deltaX, deltaY);
    }

    updateConnectionsDuringDrag() {
        if (this.updateConnectionsForDrag) {
            this.updateConnectionsForDrag();
        } else {
            console.warn('⚠️ EntityDragHandler: updateConnectionsForDrag is not available!');
        }
    }

    onDragEnd(x, y, deltaX, deltaY) {
        // Call proximity callback
        this.proximityCallbacks.onDragEnd?.();
        
        // Clean up visuals
        this.radiusIndicatorManager.removeIndicators();
        
        const selectedIds = this.entityTypeHandler.getSelectedIds();
        this.dragStateManager.resetEntityVisuals(selectedIds);
        
        // Update positions if there was actual movement
        if (this.dragStateManager.shouldUpdatePosition(deltaX, deltaY)) {
            this.updateEntityPositions(x, y, deltaX, deltaY);
        }

        // Reset drag state
        this.dragStateManager.reset();
    }

    updateEntityPositions(x, y, deltaX, deltaY) {
        const isMultiSelected = this.entityTypeHandler.isMultiSelected(this.props.entity.id);

        if (isMultiSelected) {
            this.emit('move-multiple', { 
                entityType: this.props.entityType, 
                deltaX, 
                deltaY 
            });
        } else {
            if (this.props.entityType === 'circle') {
                // For circles, use center-relative coordinates
                this.emit('update-position', { 
                    id: this.props.entity.id, 
                    x: this.props.entity.x + deltaX, 
                    y: this.props.entity.y + deltaY 
                });
            } else {
                // For squares, use absolute coordinates
                this.emit('update-position', { 
                    id: this.props.entity.id, 
                    x, 
                    y 
                });
            }
        }
    }

    handleMouseDown(e) {
        // Don't interfere with name editing
        if (e.target.hasAttribute('contenteditable')) return;
        
        // Don't start drag on shift-click for squares (used for connection selection)
        if (e.shiftKey && this.props.entityType === 'square') {
            return;
        }
        
        this.dragStateManager.handleMouseDown(e);
    }

    handleMouseMove(e) {
        this.dragStateManager.handleMouseMove(e);
    }

    handleClick(e) {
        // Handle special clicks (e.g., shift-click for squares)
        if (this.entityTypeHandler.handleSpecialClick(this.props.entity.id, e)) {
            return;
        }
        
        // Only select if no drag occurred
        if (this.dragStateManager.shouldProcessClick()) {
            this.emit('select', this.props.entity.id, e.ctrlKey || e.metaKey);
        }
        
        // Reset drag state
        this.dragStateManager.reset();
    }

    // Cleanup method
    cleanup() {
        this.radiusIndicatorManager.cleanup();
        // Remove mouse move listener if needed
        document.removeEventListener('mousemove', this.handleMouseMove);
    }
}
