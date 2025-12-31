// EntityDragHandler.js - ENHANCED: Auto-create/delete explicit connections for roil groups + Fix roil position jump + Immovable circles support
import { onMounted } from './vue-composition-api.js';
import { useDraggable } from './useDraggable.js';
import { useConnectionDragUpdater } from './useConnections.js';
import { CircleHandler, SquareHandler } from './EntityTypeHandler.js';
import { DragStateManager } from './DragStateManager.js';

export class EntityDragHandler {
    constructor(elementRef, emit, dataStore, props, callbacks = {}) {
        this.elementRef = elementRef;
        this.emit = emit;
        this.dataStore = dataStore;
        this.props = props;
        this.proximityCallbacks = callbacks;
        this.currentHoveredGroup = null;
        this.originalBelongsToID = null;
        this.hasRemovedMembership = false;
        
        // Track if actual dragging occurred
        this.hasActuallyDragged = false;
        
        // Track current drag state for connection updates
        this.currentDragState = { deltaX: 0, deltaY: 0, isDragging: false };
        
        // Flag to prevent connection updates during position transition
        this.isUpdatingPositions = false;
        
        // Track group member elements
        this.groupMemberElements = new Map();
        
        // NEW: Track roil connection creation to prevent duplicates
        this.createdRoilConnection = false;
        
        // NEW: Track roil position adjustment
        this.roilPositionAdjustment = { deltaX: 0, deltaY: 0 };
        
        // Initialize type-specific handler
        this.entityTypeHandler = this.createEntityTypeHandler();
        
        // Initialize managers
        this.dragStateManager = new DragStateManager(this.entityTypeHandler);
        
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
            () => this.getReactiveEntitiesWithCurrentPositions(),
            () => this.entityTypeHandler.getSelectedEntityIds(),
            connectionEntityType
        );
        
        this.updateConnectionsForDrag = updateConnectionsForDrag;
    }

    // NEW: Check if entity is immovable
    isEntityImmovable() {
        return this.props.entityType === 'circle' && this.props.entity.immovable === 'yes';
    }

    // NEW: Trigger buzzing animation for immovable entities
    triggerImmovableBuzz() {
        const element = this.elementRef.value;
        if (!element) return;

        // Add buzzing animation class
        element.classList.add('immovable-buzz');
        
        // Remove the class after animation completes
        setTimeout(() => {
            element.classList.remove('immovable-buzz');
        }, 500);
    }

    // NEW: Calculate roil position adjustment to prevent jump
    calculateRoilPositionAdjustment() {
        // Only applies to circles that are roil members
        if (this.props.entityType !== 'circle' || !this.props.entity.belongsToID) {
            return { deltaX: 0, deltaY: 0 };
        }

        const parentGroup = this.dataStore.getCircle(this.props.entity.belongsToID);
        if (!parentGroup || parentGroup.roilMode !== 'on') {
            return { deltaX: 0, deltaY: 0 };
        }

        // Get the element's current visual position
        const element = this.elementRef.value;
        if (!element) {
            return { deltaX: 0, deltaY: 0 };
        }

        const computedStyle = getComputedStyle(element);
        const visualLeft = parseFloat(computedStyle.left) || 0;
        const visualTop = parseFloat(computedStyle.top) || 0;

        // Calculate expected position based on stored x,y values
        const centerX = this.props.viewerWidth / 2;
        const expectedLeft = centerX + this.props.entity.x;
        const expectedTop = this.props.entity.y;

        // Calculate the delta between visual and expected positions
        const deltaX = visualLeft - expectedLeft;
        const deltaY = visualTop - expectedTop;

        return { deltaX, deltaY };
    }

    // NEW: Apply roil position adjustment to prevent jump
    applyRoilPositionAdjustment() {
        if (this.roilPositionAdjustment.deltaX === 0 && this.roilPositionAdjustment.deltaY === 0) {
            return;
        }

        // Adjust the entity's stored position by subtracting the visual offset
        const adjustedX = this.props.entity.x + this.roilPositionAdjustment.deltaX;
        const adjustedY = this.props.entity.y + this.roilPositionAdjustment.deltaY;

        // Update the entity's position immediately
        this.emit('update-position', {
            id: this.props.entity.id,
            x: adjustedX,
            y: adjustedY
        });

        // Update the local props reference for consistency during drag
        this.props.entity.x = adjustedX;
        this.props.entity.y = adjustedY;
    }

    detectGroupCircleUnderMouse(x, y, viewerId) {
        const circles = this.dataStore.getCirclesForViewer ? this.dataStore.getCirclesForViewer(viewerId) : [];
        
        for (const circle of circles) {
            if (circle.type === 'group' && circle.id !== this.props.entity.id) {
                const circleElement = document.querySelector(`[data-entity-id="${circle.id}"]`);
                
                if (circleElement) {
                    const rect = circleElement.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const radiusX = rect.width / 2;
                    const radiusY = rect.height / 2;
                    
                    const normalizedX = (x - centerX) / radiusX;
                    const normalizedY = (y - centerY) / radiusY;
                    const distanceSquared = normalizedX * normalizedX + normalizedY * normalizedY;
                    
                    if (distanceSquared <= 1.1) {
                        return circle;
                    }
                }
            }
        }
        return null;
    }

    // NEW: Create explicit connection between circle and roil group
    createRoilConnection(circleId, groupId) {
        const circle = this.dataStore.getCircle(circleId);
        const group = this.dataStore.getCircle(groupId);
        
        if (!circle || !group) {
            console.warn('Could not find circle or group for roil connection creation');
            return false;
        }
        
        // Check if connection already exists
        const existingConnection = this.dataStore.getExplicitConnectionBetweenEntities(
            circleId, 'circle', groupId, 'circle'
        );
        
        if (existingConnection) {
            return false;
        }
        
        // Create the explicit connection using dataStore's explicit connection service
        // We need to simulate a ctrl+shift+click to create the connection
        // First, select the group
        //this.dataStore.selectCircle(groupId, this.props.viewerId, false);
        
        // Then create connection to the circle
        const result = this.handleExplicitConnectionCreation(circleId, [groupId]);
        
        return result;
    }
    
    // NEW: Helper method to create explicit connections (similar to handleEntityCtrlClick)
    handleExplicitConnectionCreation(clickedEntityId, selectedEntityIds) {
        // We need access to the explicit connection service through the dataStore
        // Since we don't have direct access, we'll emit an event to let the parent handle it
        this.emit('create-roil-connection', {
            clickedEntityId: clickedEntityId,
            selectedEntityIds: selectedEntityIds,
            viewerId: this.props.viewerId
        });
        return true;
    }
    
    // NEW: Delete explicit connection between circle and group if it exists
    deleteExistingGroupConnection(circleId, groupId) {
        const existingConnection = this.dataStore.getExplicitConnectionBetweenEntities(
            circleId, 'circle', groupId, 'circle'
        );
        
        if (existingConnection) {
            // Emit event to delete the connection
            this.emit('delete-group-connection', {
                connectionId: existingConnection.id,
                circleId: circleId,
                groupId: groupId
            });
            return true;
        }
        
        return false;
    }

    // FIXED: Perfect positioning by copying all positioning attributes exactly
findGroupMemberElements() {
        if (this.props.entityType === 'circle' && this.props.entity.type === 'group') {
            const belongingCircles = this.dataStore.getCirclesBelongingToGroup(this.props.entity.id);
            
            this.groupMemberElements.clear();
            
            // NEW: Check if this group is in roil mode
            const isGroupInRoilMode = this.props.entity.roilMode === 'on';
            
            belongingCircles.forEach(circle => {
                if (circle.id !== this.props.entity.id) {
                    // NEW: Skip creating clones for roil members
                    if (isGroupInRoilMode) {
                        return; // Skip this circle entirely
                    }
                    
                    const originalElement = document.querySelector(`[data-entity-id="${circle.id}"]`);
                    
                    if (originalElement && originalElement.style) {
                        // Create a duplicate element
                        const dragClone = originalElement.cloneNode(true);
                        dragClone.id = `drag-clone-${circle.id}`;
                        dragClone.setAttribute('data-drag-clone', 'true');
                        
                        // FIXED: Copy ALL positioning and styling from the original
                        const originalComputedStyle = window.getComputedStyle(originalElement);
                        const originalRect = originalElement.getBoundingClientRect();
                        
                        // Copy the original's inline styles exactly
                        dragClone.style.cssText = originalElement.style.cssText;
                        
                        // FIXED: Ensure positioning context is identical
                        dragClone.style.position = originalComputedStyle.position;
                        dragClone.style.left = originalElement.style.left;
                        dragClone.style.top = originalElement.style.top;
                        dragClone.style.transform = originalElement.style.transform;
                        dragClone.style.transformOrigin = originalComputedStyle.transformOrigin;
                        
                        // Override only what's needed for dragging
                        dragClone.style.zIndex = '9999';
                        dragClone.style.pointerEvents = 'none';
                        dragClone.style.opacity = '1';
                        
                        // FIXED: Insert into the exact same parent to maintain positioning context
                        const parent = originalElement.parentNode;
                        parent.appendChild(dragClone);
                        
                        // FIXED: Verify positioning after insertion
                        const cloneRect = dragClone.getBoundingClientRect();
                        const offsetX = originalRect.left - cloneRect.left;
                        const offsetY = originalRect.top - cloneRect.top;
                        
                        // FIXED: Correct any positioning discrepancy
                        if (Math.abs(offsetX) > 0.5 || Math.abs(offsetY) > 0.5) {
                            const currentLeft = parseFloat(dragClone.style.left) || 0;
                            const currentTop = parseFloat(dragClone.style.top) || 0;
                            
                            dragClone.style.left = (currentLeft + offsetX) + 'px';
                            dragClone.style.top = (currentTop + offsetY) + 'px';
                            
                        }
                        
                        // Hide the original element during drag
                        originalElement.style.visibility = 'hidden';
                        
                        // Store initial position for delta calculations
                        const finalRect = dragClone.getBoundingClientRect();
                        
                        this.groupMemberElements.set(circle.id, {
                            originalElement: originalElement,
                            dragClone: dragClone,
                            initialLeft: parseFloat(dragClone.style.left) || 0,
                            initialTop: parseFloat(dragClone.style.top) || 0,
                            initialTransform: dragClone.style.transform,
                            isCloned: true
                        });
                        
                    }
                }
            });
        }
    }

    // FIXED: Move clones while preserving their transform structure
    updateGroupMemberVisuals(deltaX, deltaY) {
        if (this.props.entityType === 'circle' && this.props.entity.type === 'group') {
            this.groupMemberElements.forEach((memberData, circleId) => {
                const { dragClone, initialLeft, initialTop, initialTransform } = memberData;
                
                if (dragClone && dragClone.style) {
                    // FIXED: Move by adjusting position while preserving transform
                    const newLeft = initialLeft + deltaX;
                    const newTop = initialTop + deltaY;
                    
                    dragClone.style.left = newLeft + 'px';
                    dragClone.style.top = newTop + 'px';
                    
                    // Keep the original transform unchanged
                    dragClone.style.transform = initialTransform;
                    dragClone.style.transition = 'none';
                }
            });
        }
    }

    // Clean up clones and restore originals
    resetGroupMemberVisuals() {
        if (this.props.entityType === 'circle' && this.props.entity.type === 'group') {
            this.groupMemberElements.forEach((memberData, circleId) => {
                const { originalElement, dragClone } = memberData;
                
                if (dragClone && dragClone.parentNode) {
                    // Remove the clone
                    dragClone.parentNode.removeChild(dragClone);
                }
                
                if (originalElement) {
                    // Restore the original element
                    originalElement.style.visibility = '';
                }
            });
            
            this.groupMemberElements.clear();
        }
    }

getReactiveEntitiesWithCurrentPositions() {
    const entities = this.entityTypeHandler.getCurrentEntities();
    
    if (!this.currentDragState.isDragging) {
        return entities;
    }
    
    const selectedIds = this.entityTypeHandler.getSelectedEntityIds();
    
    return entities.map(entity => {
        if (selectedIds.includes(entity.id)) {
            return {
                ...entity,
                x: entity.x + this.currentDragState.deltaX,
                y: entity.y + this.currentDragState.deltaY
            };
        }
        return entity;
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

onDragStart(e) {
    if (e && ((e.ctrlKey || e.metaKey) && e.shiftKey)) {
        return;
    }

    if (this.isEntityImmovable()) {
        this.triggerImmovableBuzz();
        return false; // Prevent drag from starting
    }
    
    this.hasActuallyDragged = false;
    this.currentDragState = { deltaX: 0, deltaY: 0, isDragging: true };
    
    // Reset membership tracking flags
    this.originalBelongsToID = null;
    this.hasRemovedMembership = false;
    this.createdRoilConnection = false; // NEW: Reset roil connection flag
    
    // NEW: Calculate and apply roil position adjustment to prevent jump
    this.roilPositionAdjustment = this.calculateRoilPositionAdjustment();
    if (this.roilPositionAdjustment.deltaX !== 0 || this.roilPositionAdjustment.deltaY !== 0) {
        this.applyRoilPositionAdjustment();
    }
    
    // Store original membership but DON'T remove it yet (wait for actual movement)
    if (this.props.entityType === 'circle' && this.props.entity.belongsToID) {
        this.originalBelongsToID = this.props.entity.belongsToID;
    }
    
    // Create perfectly positioned clones
    this.findGroupMemberElements();
    
    this.emit('drag-start', {
        entityId: this.props.entity.id,
        entityType: this.props.entityType,
        viewerId: this.props.viewerId
    });
}

    onDragMove(deltaX, deltaY) {
        this.hasActuallyDragged = true;
        this.currentDragState = { deltaX, deltaY, isDragging: true };

        if (!this.hasRemovedMembership && this.originalBelongsToID && (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)) {
            // NEW: Check if we're removing from a roil group and create connection
            /*if (this.props.entityType === 'circle' && !this.createdRoilConnection) {
                const originalGroup = this.dataStore.getCircle(this.originalBelongsToID);
                if (originalGroup && originalGroup.type === 'group' && originalGroup.roilMode === 'on') {
                    this.createRoilConnection(this.props.entity.id, this.originalBelongsToID);
                    this.createdRoilConnection = true;
                }
            }*/
            
            this.dataStore.clearCircleBelongsTo(this.props.entity.id);
            this.hasRemovedMembership = true;
        }
        
        this.dragStateManager.updateDragState(deltaX, deltaY);
        this.proximityCallbacks.onDragMove?.(deltaX, deltaY);
        this.updateVisualsDuringDrag(deltaX, deltaY);
        
        // Move the perfectly positioned clones
        this.updateGroupMemberVisuals(deltaX, deltaY);
        
        // Group hover detection
        if (this.props.entityType === 'circle' && this.props.entity.type !== 'group') {
            const mouseX = this.lastMouseX || (window.innerWidth / 2);
            const mouseY = this.lastMouseY || (window.innerHeight / 2);
            
            const hoveredGroup = this.detectGroupCircleUnderMouse(mouseX, mouseY, this.props.viewerId);
            
            if (hoveredGroup !== this.currentHoveredGroup) {
                if (this.currentHoveredGroup) {
                    this.setGroupDropZoneHighlight(this.currentHoveredGroup.id, false);
                }
                
                if (hoveredGroup) {
                    this.setGroupDropZoneHighlight(hoveredGroup.id, true);
                }
                
                this.currentHoveredGroup = hoveredGroup;
            }
        } 
        
        this.updateConnectionsDuringDrag();
        
        this.emit('drag-move', {
            entityId: this.props.entity.id,
            entityType: this.props.entityType,
            viewerId: this.props.viewerId,
            deltaX,
            deltaY,
            selectedEntityIds: this.entityTypeHandler.getSelectedEntityIds()
        });
    }

    setGroupDropZoneHighlight(groupId, highlight) {
        const groupElement = document.querySelector(`[data-entity-id="${groupId}"]`);
        
        if (groupElement) {
            const groupShape = groupElement.querySelector('.entity-shape');
            
            if (groupShape) {
                if (highlight) {
                    groupShape.classList.add('group-drop-zone-active');
                } else {
                    groupShape.classList.remove('group-drop-zone-active');
                }
            }
        }
    }

    updateVisualsDuringDrag(deltaX, deltaY) {
        const selectedIds = this.entityTypeHandler.getSelectedEntityIds();

        if (this.entityTypeHandler.isMultiSelected(this.props.entity.id)) {
            const allSelectedIds = this.entityTypeHandler.getSelectedIds();
            this.dragStateManager.updateEntityVisuals(allSelectedIds, deltaX, deltaY);
        } else {
            this.dragStateManager.updateEntityVisuals([this.props.entity.id], deltaX, deltaY);
        }
    }

    updateConnectionsDuringDrag() {
        if (this.isUpdatingPositions) {
            return;
        }
        
        if (this.updateConnectionsForDrag) {
            const entities = this.getReactiveEntitiesWithCurrentPositions();
            entities.forEach(entity => {
                const isReactive = entity.__v_isReactive || entity.__v_isProxy;
            });
            
            this.updateConnectionsForDrag();
        }
    }

    onDragEnd(x, y, deltaX, deltaY) {
        if (this.currentHoveredGroup) {
            this.setGroupDropZoneHighlight(this.currentHoveredGroup.id, false);
            this.currentHoveredGroup = null;
        }
        
        // Check for group drop (only for non-group circles)
        if (this.props.entityType === 'circle' && this.props.entity.type !== 'group') {
            const mouseX = this.lastMouseX || (window.innerWidth / 2);
            const mouseY = this.lastMouseY || (window.innerHeight / 2);
        
            const groupCircle = this.detectGroupCircleUnderMouse(mouseX, mouseY, this.props.viewerId);
        
            if (groupCircle) {
                // NEW: Before setting belongsTo, check if there's an existing explicit connection and delete it
                this.deleteExistingGroupConnection(this.props.entity.id, groupCircle.id);
                
                this.dataStore.setCircleBelongsTo(this.props.entity.id, groupCircle.id);
            } else if (this.props.entity.belongsToID) {
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
        
        this.isUpdatingPositions = true;
        this.proximityCallbacks.onDragEnd?.();
        
        const selectedIds = this.entityTypeHandler.getSelectedIds();
        this.dragStateManager.resetEntityVisuals(selectedIds);
        
        // Clean up clones and restore originals
        this.resetGroupMemberVisuals();
        
        if (this.dragStateManager.shouldUpdatePosition(deltaX, deltaY)) {
            this.updateEntityPositions(x, y, deltaX, deltaY);
        }

        this.dragStateManager.reset();
        
        // NEW: Reset roil position adjustment
        this.roilPositionAdjustment = { deltaX: 0, deltaY: 0 };
        
        this.emit('drag-end', {
            entityId: this.props.entity.id,
            entityType: this.props.entityType,
            viewerId: this.props.viewerId
        });
        
        this.$nextTick(() => {
            this.currentDragState = { deltaX: 0, deltaY: 0, isDragging: false };
            this.isUpdatingPositions = false;
            
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
                const originalEntity = this.entityTypeHandler.getCurrentEntities()
                    .find(e => e.id === this.props.entity.id);
                
                if (originalEntity) {
                    this.emit('update-position', { 
                        id: this.props.entity.id, 
                        x: originalEntity.x + deltaX,
                        y: originalEntity.y + deltaY
                    });
                } else {
                    this.emit('update-position', { 
                        id: this.props.entity.id, 
                        x: this.props.entity.x + deltaX, 
                        y: this.props.entity.y + deltaY 
                    });
                }
            } else {
                this.emit('update-position', { 
                    id: this.props.entity.id, 
                    x, 
                    y 
                });
            }
        }
    }

    $nextTick(callback) {
        if (typeof window !== 'undefined' && window.Vue && window.Vue.nextTick) {
            window.Vue.nextTick(callback);
        } else {
            setTimeout(callback, 0);
        }
    }

    handleMouseDown(e) {
        if (e.target.hasAttribute('contenteditable')) {
            return;
        }
        
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            return;
        }
        
        if (e.shiftKey && this.props.entityType === 'square') {
            return;
        }
        
        this.hasActuallyDragged = false;
        this.dragStateManager.handleMouseDown(e);
    }

    handleMouseMove(e) {
        this.dragStateManager.handleMouseMove(e);
    }

    handleClick(e) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            this.emit('select', this.props.entity.id, e.ctrlKey || e.metaKey, e.shiftKey);
            return;
        }
        
        if (this.entityTypeHandler.handleSpecialClick(this.props.entity.id, e)) {
            return;
        }
        
        if (!this.hasActuallyDragged && this.dragStateManager.shouldProcessClick()) {
            this.emit('select', this.props.entity.id, e.ctrlKey || e.metaKey, e.shiftKey);
        } 
        
        this.dragStateManager.reset();
        this.hasActuallyDragged = false;
    }

    cleanup() {
        if (this.currentHoveredGroup) {
            this.setGroupDropZoneHighlight(this.currentHoveredGroup.id, false);
            this.currentHoveredGroup = null;
        }
        
        this.resetGroupMemberVisuals();
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mousemove', this.trackMousePosition);
    }
}
