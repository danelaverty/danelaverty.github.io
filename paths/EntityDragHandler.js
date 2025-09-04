// EntityDragHandler.js - UPDATED: Add visual group member dragging during drag operations
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
        
        // Track if actual dragging occurred
        this.hasActuallyDragged = false;
        
        // Track current drag state for connection updates
        this.currentDragState = { deltaX: 0, deltaY: 0, isDragging: false };
        
        // Flag to prevent connection updates during position transition
        this.isUpdatingPositions = false;
        
        // NEW: Track group member elements for visual dragging
        this.groupMemberElements = new Map(); // Map of circleId -> element
        
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

        this.lastMouseX = 0;
        this.lastMouseY = 0;
    
        // Track mouse position for group detection
        this.trackMousePosition = (e) => {
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        };
    
        document.addEventListener('mousemove', this.trackMousePosition);
    }

    createEntityTypeHandler() {
        const handlerProps = {
            ...this.props,
            elementRef: this.elementRef
        };

        const handler = this.props.entityType === 'circle' 
            ? new CircleHandler(this.dataStore, handlerProps)
            : new SquareHandler(this.dataStore, handlerProps);

        return handler;
    }

    setupConnectionUpdater() {
        const connectionEntityType = this.entityTypeHandler.getConnectionEntityType();
        
        const { updateConnectionsForDrag } = useConnectionDragUpdater(
            // Create a function that returns reactive entities with current drag positions
            () => this.getReactiveEntitiesWithCurrentPositions(),
            () => this.entityTypeHandler.getSelectedEntityIds(),
            connectionEntityType
        );
        
        this.updateConnectionsForDrag = updateConnectionsForDrag;
    }

    detectGroupCircleUnderMouse(x, y, viewerId) {
        const circles = this.dataStore.getCirclesForViewer ? this.dataStore.getCirclesForViewer(viewerId) : [];
    
        for (const circle of circles) {
            if (circle.type === 'group' && circle.id !== this.props.entity.id) {
                const circleElement = document.querySelector(`[data-entity-id="${circle.id}"]`);
                if (circleElement) {
                    const rect = circleElement.getBoundingClientRect();
                    const groupScale = circleElement.querySelector('.circle-shape')?._groupScale || { width: 32, height: 32 };
                
                    // Expand hit detection area based on group scale
                    const padding = Math.max(0, (groupScale.width - 32) / 2, (groupScale.height - 32) / 2);
                    const expandedRect = {
                        left: rect.left - padding,
                        right: rect.right + padding,
                        top: rect.top - padding,
                        bottom: rect.bottom + padding
                    };
                
                    if (x >= expandedRect.left && x <= expandedRect.right &&
                        y >= expandedRect.top && y <= expandedRect.bottom) {
                        return circle;
                    }
                }
            }
        }
        return null;
    }

    // NEW: Find and cache group member elements for visual dragging
    findGroupMemberElements() {
        if (this.props.entityType === 'circle' && this.props.entity.type === 'group') {
            const belongingCircles = this.dataStore.getCirclesBelongingToGroup(this.props.entity.id);
            
            this.groupMemberElements.clear();
            
            belongingCircles.forEach(circle => {
                if (circle.id !== this.props.entity.id) { // Don't include the group itself
                    const element = document.querySelector(`[data-entity-id="${circle.id}"]`);
                    if (element) {
                        this.groupMemberElements.set(circle.id, element);
                    }
                }
            });
        }
    }

    // NEW: Apply visual transform to group members during drag
    updateGroupMemberVisuals(deltaX, deltaY) {
        if (this.props.entityType === 'circle' && this.props.entity.type === 'group') {
            this.groupMemberElements.forEach((element, circleId) => {
                if (element && element.style) {
                    // Disable transitions for smooth dragging
                    element.style.transition = 'none';
                    
                    // Apply transform to show visual dragging
                    const existingTransform = element.style.transform || '';
                    const scaleMatch = existingTransform.match(/scale\([^)]+\)/);
                    const scaleTransform = scaleMatch ? scaleMatch[0] : '';
                    
                    element.style.transform = `translate(${deltaX}px, ${deltaY}px) ${scaleTransform}`;
                    element.classList.add('dragging');
                }
            });
        }
    }

    // NEW: Reset visual transforms for group members
    resetGroupMemberVisuals() {
        if (this.props.entityType === 'circle' && this.props.entity.type === 'group') {
            this.groupMemberElements.forEach((element, circleId) => {
                if (element && element.style) {
                    // Reset transform to original state (keep scale if it exists)
                    const existingTransform = element.style.transform || '';
                    const scaleMatch = existingTransform.match(/scale\([^)]+\)/);
                    const scaleTransform = scaleMatch ? scaleMatch[0] : '';
                    
                    element.style.transform = scaleTransform;
                    element.classList.remove('dragging');
                    
                    // Re-enable transitions after a brief delay to allow position to settle
                    setTimeout(() => {
                        if (element && element.style) {
                            element.style.transition = '';
                        }
                    }, 10);
                }
            });
            
            // Clear the cache
            this.groupMemberElements.clear();
        }
    }

    /**
     * Get reactive entities with current drag positions applied
     * This preserves reactivity while using current positions for connection calculations
     */
    getReactiveEntitiesWithCurrentPositions() {
        const originalEntities = this.entityTypeHandler.getCurrentEntities();
        
        if (!this.currentDragState.isDragging || (!this.currentDragState.deltaX && !this.currentDragState.deltaY)) {
            // No drag in progress, return original entities
            return originalEntities;
        }
        
        // During drag: create temporary position-updated entities while preserving reactivity
        return originalEntities.map(entity => {
            const isDragged = this.entityTypeHandler.getSelectedEntityIds().includes(entity.id);
            
            if (isDragged) {
                // Capture current drag state for the proxy closure
                const currentDeltaX = this.currentDragState.deltaX;
                const currentDeltaY = this.currentDragState.deltaY;
                
                // Create a temporary proxy that maintains reactivity but shows updated positions
                return new Proxy(entity, {
                    get(target, prop) {
                        if (prop === 'x') {
                            return target.x + currentDeltaX;
                        }
                        if (prop === 'y') {
                            return target.y + currentDeltaY;
                        }
                        // For all other properties (including activation), return original value
                        // This preserves Vue reactivity for non-position properties
                        return target[prop];
                    },
                    // Ensure the proxy appears reactive to Vue
                    has(target, prop) {
                        return prop in target;
                    },
                    ownKeys(target) {
                        return Object.keys(target);
                    },
                    getOwnPropertyDescriptor(target, prop) {
                        return Object.getOwnPropertyDescriptor(target, prop);
                    }
                });
            }
            
            return entity; // Non-dragged entities unchanged
        });
    }

    bindMethods() {
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
    }

    setupDragging() {
        useDraggable(this.elementRef, this.onDragEnd, () => this.entityTypeHandler.getContainer(), { 
            onDragMove: this.onDragMove,
            onDragStart: this.onDragStart
        });
    }

    setupMouseTracking() {
        onMounted(() => {
            document.addEventListener('mousemove', this.handleMouseMove);
        });
    }

    onDragStart() {
        // Reset the drag flag when drag starts
        this.hasActuallyDragged = false;
        
        // Initialize drag state
        this.currentDragState = { deltaX: 0, deltaY: 0, isDragging: true };
        
        // NEW: Find group member elements for visual dragging
        this.findGroupMemberElements();
        
        // Emit drag start event
        this.emit('drag-start', {
            entityId: this.props.entity.id,
            entityType: this.props.entityType,
            viewerId: this.props.viewerId
        });
    }

    onDragMove(deltaX, deltaY) {
        // Mark that actual dragging has occurred
        this.hasActuallyDragged = true;
        
        // Update current drag state for connection calculations
        this.currentDragState = { deltaX, deltaY, isDragging: true };
        
        this.dragStateManager.updateDragState(deltaX, deltaY);
        
        // Call proximity callback
        this.proximityCallbacks.onDragMove?.(deltaX, deltaY);
        
        this.updateVisualsDuringDrag(deltaX, deltaY);
        
        // NEW: Update group member visuals during drag
        this.updateGroupMemberVisuals(deltaX, deltaY);
        
        this.updateConnectionsDuringDrag();
        
        // Emit drag move event with current state
        this.emit('drag-move', {
            entityId: this.props.entity.id,
            entityType: this.props.entityType,
            viewerId: this.props.viewerId,
            deltaX,
            deltaY,
            selectedEntityIds: this.entityTypeHandler.getSelectedEntityIds()
        });
    }

    updateVisualsDuringDrag(deltaX, deltaY) {
        const selectedIds = this.entityTypeHandler.getSelectedEntityIds();

        // Create radius indicators on first drag move
        if (!this.radiusIndicatorManager.isActive) {
            if (selectedIds && selectedIds.length > 0) {
                this.radiusIndicatorManager.createIndicators(selectedIds, deltaX, deltaY);
            }
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
        if (this.radiusIndicatorManager.isActive) {
            this.radiusIndicatorManager.updateIndicators(selectedIds, deltaX, deltaY);
        }
    }

    updateConnectionsDuringDrag() {
        // Don't update connections during position transition
        if (this.isUpdatingPositions) {
            return;
        }
        
        if (this.updateConnectionsForDrag) {
            // DEBUG: Check if we're about to call with reactive entities
            const entities = this.getReactiveEntitiesWithCurrentPositions();
            entities.forEach(entity => {
                const isReactive = entity.__v_isReactive || entity.__v_isProxy;
            });
            
            this.updateConnectionsForDrag();
        }
    }

    onDragEnd(x, y, deltaX, deltaY) {
        // Check for group drop (only for non-group circles)
        if (this.props.entityType === 'circle' && this.props.entity.type !== 'group') {
            const mouseX = this.lastMouseX || (window.innerWidth / 2);
            const mouseY = this.lastMouseY || (window.innerHeight / 2);
        
            const groupCircle = this.detectGroupCircleUnderMouse(mouseX, mouseY, this.props.viewerId);
        
            if (groupCircle) {
                // Drop onto group circle
                this.dataStore.setCircleBelongsTo(this.props.entity.id, groupCircle.id);
            } else if (this.props.entity.belongsToID) {
                // Dropped outside of any group, clear belonging
                this.dataStore.clearCircleBelongsTo(this.props.entity.id);
            }
        }
    
        // Handle group dragging - move all belonging circles
        if (this.props.entityType === 'circle' && this.props.entity.type === 'group') {
            const belongingCircles = this.dataStore.getCirclesBelongingToGroup(this.props.entity.id);
        
            if (belongingCircles.length > 0) {
                belongingCircles.forEach(belongingCircle => {
                    if (belongingCircle.id !== this.props.entity.id) {
                        this.emit('update-position', {
                            id: belongingCircle.id,
                            x: belongingCircle.x + deltaX,
                            y: belongingCircle.y + deltaY
                        });
                    }
                });
            }
        }
        
        // Set flag to prevent connection updates during position transition
        this.isUpdatingPositions = true;
        
        // Call proximity callback
        this.proximityCallbacks.onDragEnd?.();
        
        // Clean up visuals
        this.radiusIndicatorManager.removeIndicators();
        
        const selectedIds = this.entityTypeHandler.getSelectedIds();
        this.dragStateManager.resetEntityVisuals(selectedIds);
        
        // NEW: Reset group member visuals
        this.resetGroupMemberVisuals();
        
        // Update positions if there was actual movement
        if (this.dragStateManager.shouldUpdatePosition(deltaX, deltaY)) {
            this.updateEntityPositions(x, y, deltaX, deltaY);
        }

        // Reset drag state
        this.dragStateManager.reset();
        
        // Emit drag end event
        this.emit('drag-end', {
            entityId: this.props.entity.id,
            entityType: this.props.entityType,
            viewerId: this.props.viewerId
        });
        
        // Use nextTick to ensure position updates are processed before clearing drag state
        this.$nextTick(() => {
            // Clear drag state AFTER position updates are complete
            this.currentDragState = { deltaX: 0, deltaY: 0, isDragging: false };
            this.isUpdatingPositions = false;
            
            // Force one final connection update with the new positions
            if (this.updateConnectionsForDrag) {
                this.updateConnectionsForDrag();
            }
        });
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
                // Get the original entity (not proxy) to calculate correct final position
                const originalEntity = this.entityTypeHandler.getCurrentEntities()
                    .find(e => e.id === this.props.entity.id);
                
                if (originalEntity) {
                    this.emit('update-position', { 
                        id: this.props.entity.id, 
                        x: originalEntity.x + deltaX,  // Use original entity position + delta
                        y: originalEntity.y + deltaY   // Use original entity position + delta
                    });
                } else {
                    // Fallback - shouldn't happen but just in case
                    this.emit('update-position', { 
                        id: this.props.entity.id, 
                        x: this.props.entity.x + deltaX, 
                        y: this.props.entity.y + deltaY 
                    });
                }
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

    // Helper method to access Vue's nextTick (if available)
    $nextTick(callback) {
        // In Vue 3 composition API context, we can use setTimeout as a fallback
        // or if Vue's nextTick is available in the context, use that
        if (typeof window !== 'undefined' && window.Vue && window.Vue.nextTick) {
            window.Vue.nextTick(callback);
        } else {
            // Fallback to setTimeout to ensure DOM updates are processed
            setTimeout(callback, 0);
        }
    }

    handleMouseDown(e) {
        // Don't interfere with name editing
        if (e.target.hasAttribute('contenteditable')) return;
        
        // Don't start drag on shift-click for squares (used for connection selection)
        if (e.shiftKey && this.props.entityType === 'square') {
            return;
        }
        
        // Reset the drag flag on mouse down
        this.hasActuallyDragged = false;
        
        this.dragStateManager.handleMouseDown(e);
    }

    handleMouseMove(e) {
        this.dragStateManager.handleMouseMove(e);
    }

    // UPDATED: Pass both ctrlKey and shiftKey states in the select emission
    handleClick(e) {
        // Handle special clicks (e.g., shift-click for squares)
        if (this.entityTypeHandler.handleSpecialClick(this.props.entity.id, e)) {
            return;
        }
        
        // Only select if no actual dragging occurred AND normal click conditions are met
        if (!this.hasActuallyDragged && this.dragStateManager.shouldProcessClick()) {
            // UPDATED: Pass both modifier keys to the select handler
            this.emit('select', this.props.entity.id, e.ctrlKey || e.metaKey, e.shiftKey);
        } 
        
        // Reset drag state and flag
        this.dragStateManager.reset();
        this.hasActuallyDragged = false;
    }

    // Cleanup method
    cleanup() {
        this.radiusIndicatorManager.cleanup();
        // NEW: Reset any group member visuals on cleanup
        this.resetGroupMemberVisuals();
        // Remove mouse move listener if needed
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mousemove', this.trackMousePosition);
    }
}
