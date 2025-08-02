// EntityDragHandler.js - Fixed for center-relative positioning
import { onMounted } from './vue-composition-api.js';
import { useDraggable } from './useDraggable.js';
import { useConnectionDragUpdater } from './useConnections.js';

export class EntityDragHandler {
    constructor(elementRef, emit, dataStore, props) {
        this.elementRef = elementRef;
        this.emit = emit;
        this.dataStore = dataStore;
        this.props = props;
        
        // Set up connection drag updater for squares
        if (this.props.entityType === 'square') {
            const { updateConnectionsForDrag } = useConnectionDragUpdater(
                () => this.getCurrentSquares(),
                () => this.getSelectedSquareIds()
            );
            this.updateConnectionsForDrag = updateConnectionsForDrag;
        }
        
        // Drag state tracking
        this.dragStarted = false;
        this.mouseStartPos = { x: 0, y: 0 };
        this.hasDraggedSinceMouseDown = false;
        this.currentDragDeltas = { deltaX: 0, deltaY: 0 }; // Track current drag offsets

        // Bind methods to preserve 'this' context
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.getContainer = this.getContainer.bind(this);
        this.getCurrentSquares = this.getCurrentSquares.bind(this);
        this.getSelectedSquareIds = this.getSelectedSquareIds.bind(this);

        // Set up dragging and mouse tracking
        this.setupDragging();
        this.setupMouseTracking();
    }

    // NEW: Helper to calculate visual position for circles (center-relative to absolute)
    calculateVisualPosition(entity, deltaX, deltaY) {
        if (this.props.entityType === 'circle' && this.props.viewerWidth) {
            // For circles: convert center-relative to absolute for visual positioning
            const centerX = this.props.viewerWidth / 2;
            return {
                left: (centerX + entity.x + deltaX) + 'px',
                top: (entity.y + deltaY) + 'px'
            };
        } else {
            // For squares: use position as-is
            return {
                left: (entity.x + deltaX) + 'px',
                top: (entity.y + deltaY) + 'px'
            };
        }
    }

    // NEW: Reset visual position to stored position (accounting for center-relative)
    resetVisualPosition(entity, entityElement) {
        if (this.props.entityType === 'circle' && this.props.viewerWidth) {
            // For circles: convert center-relative to absolute
            const centerX = this.props.viewerWidth / 2;
            entityElement.style.left = (centerX + entity.x) + 'px';
            entityElement.style.top = entity.y + 'px';
        } else {
            // For squares: use position as-is
            entityElement.style.left = entity.x + 'px';
            entityElement.style.top = entity.y + 'px';
        }
    }

    // Helper methods for connection updates
    getCurrentSquares() {
        const currentDoc = this.dataStore.getCurrentSquareDocument();
        if (!currentDoc) return [];
        
        const allSquares = this.dataStore.getSquaresForDocument(currentDoc.id);
        
        // If we're currently dragging, apply the current deltas to the dragged squares
        if (this.hasDraggedSinceMouseDown && this.props.entityType === 'square') {
            const selectedIds = this.getSelectedSquareIds();
            return allSquares.map(square => {
                if (selectedIds.includes(square.id)) {
                    return {
                        ...square,
                        x: square.x + this.currentDragDeltas.deltaX,
                        y: square.y + this.currentDragDeltas.deltaY
                    };
                }
                return square;
            });
        }
        
        return allSquares;
    }

    getSelectedSquareIds() {
        if (this.props.entityType !== 'square') return [];
        
        const isMultiSelected = this.dataStore.hasMultipleSquaresSelected() && 
                               this.dataStore.isSquareSelected(this.props.entity.id);
        
        if (isMultiSelected) {
            return this.dataStore.getSelectedSquares();
        } else {
            return [this.props.entity.id];
        }
    }

    setupDragging() {
        // Use draggable composable with drag move callback
        useDraggable(this.elementRef, this.onDragEnd, this.getContainer, { 
            onDragMove: this.onDragMove 
        });
    }

    setupMouseTracking() {
        onMounted(() => {
            document.addEventListener('mousemove', this.handleMouseMove);
        });
    }

    onDragMove(deltaX, deltaY) {
        this.hasDraggedSinceMouseDown = true;
        this.currentDragDeltas = { deltaX, deltaY }; // Store current deltas
        
        // During drag, visually move all selected entities
        const isMultiSelected = this.props.entityType === 'circle' 
            ? this.dataStore.hasMultipleCirclesSelected() && this.dataStore.isCircleSelected(this.props.entity.id)
            : this.dataStore.hasMultipleSquaresSelected() && this.dataStore.isSquareSelected(this.props.entity.id);

        if (isMultiSelected) {
            // Get all selected entities of the same type
            const selectedIds = this.props.entityType === 'circle' 
                ? this.dataStore.getSelectedCircles()
                : this.dataStore.getSelectedSquares();

            // Update visual position of all selected entities
            selectedIds.forEach(id => {
                const entityElement = document.querySelector(`[data-entity-id="${id}"]`);
                if (entityElement) {
                    // Get entity data directly from the store
                    const entity = this.props.entityType === 'circle' 
                        ? this.dataStore.data.circles?.get?.(id) || this.findCircleInAllDocuments(id)
                        : this.dataStore.data.squares?.get?.(id) || this.findSquareInCurrentDoc(id);
                    
                    if (entity) {
                        // NEW: Use calculateVisualPosition for proper positioning
                        const visualPos = this.calculateVisualPosition(entity, deltaX, deltaY);
                        entityElement.style.left = visualPos.left;
                        entityElement.style.top = visualPos.top;
                        entityElement.classList.add('dragging');
                    }
                }
            });
        } else {
            // Single entity drag - update its visual position
            const entityElement = this.elementRef.value;
            if (entityElement) {
                // NEW: Use calculateVisualPosition for proper positioning
                const visualPos = this.calculateVisualPosition(this.props.entity, deltaX, deltaY);
                entityElement.style.left = visualPos.left;
                entityElement.style.top = visualPos.top;
                entityElement.classList.add('dragging');
            }
        }

        // Update connections in real-time for squares
        if (this.props.entityType === 'square' && this.updateConnectionsForDrag) {
            this.updateConnectionsForDrag();
        }
    }

    onDragEnd(x, y, deltaX, deltaY) {
        // Reset drag deltas
        this.currentDragDeltas = { deltaX: 0, deltaY: 0 };
        
        // Clean up: remove dragging class from all entities and reset their visual positions
        const selectedIds = this.props.entityType === 'circle' 
            ? this.dataStore.getSelectedCircles()
            : this.dataStore.getSelectedSquares();
        
        selectedIds.forEach(id => {
            const entityElement = document.querySelector(`[data-entity-id="${id}"]`);
            if (entityElement) {
                entityElement.classList.remove('dragging');
                
                // Get entity data and reset visual position
                const entity = this.props.entityType === 'circle' 
                    ? this.dataStore.data.circles?.get?.(id) || this.findCircleInAllDocuments(id)
                    : this.dataStore.data.squares?.get?.(id) || this.findSquareInCurrentDoc(id);
                
                if (entity) {
                    // NEW: Use resetVisualPosition for proper positioning
                    this.resetVisualPosition(entity, entityElement);
                }
            }
        });

        // Only update positions if there was actual dragging movement
        if (this.hasDraggedSinceMouseDown && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
            // Check if this entity is part of a multi-selection
            const isMultiSelected = this.props.entityType === 'circle' 
                ? this.dataStore.hasMultipleCirclesSelected() && this.dataStore.isCircleSelected(this.props.entity.id)
                : this.dataStore.hasMultipleSquaresSelected() && this.dataStore.isSquareSelected(this.props.entity.id);

            if (isMultiSelected) {
                // Move all selected entities by the delta
                this.emit('move-multiple', { 
                    entityType: this.props.entityType, 
                    deltaX, 
                    deltaY 
                });
            } else {
                // NEW: For circles, emit position update using center-relative coordinates
                if (this.props.entityType === 'circle') {
                    // The new position should be center-relative
                    this.emit('update-position', { 
                        id: this.props.entity.id, 
                        x: this.props.entity.x + deltaX, 
                        y: this.props.entity.y + deltaY 
                    });
                } else {
                    // For squares, use absolute coordinates
                    this.emit('update-position', { id: this.props.entity.id, x, y });
                }
            }
        }

        // Reset drag tracking
        this.hasDraggedSinceMouseDown = false;
    }

    // Find the correct container for this entity
    getContainer() {
        if (this.props.entityType === 'square') {
            return document.querySelector('.square-viewer-content');
        } else {
            // For circles, find the viewer-content that contains this element
            return this.elementRef.value?.closest('.viewer-content');
        }
    }

    handleMouseDown(e) {
        // Don't interfere with name editing
        if (e.target.hasAttribute('contenteditable')) return;
        
        // Track mouse down position for drag detection
        this.dragStarted = false;
        this.hasDraggedSinceMouseDown = false;
        this.mouseStartPos = { x: e.clientX, y: e.clientY };
    }

    handleMouseMove(e) {
        if (!this.dragStarted) {
            // Check if mouse has moved beyond threshold
            const deltaX = Math.abs(e.clientX - this.mouseStartPos.x);
            const deltaY = Math.abs(e.clientY - this.mouseStartPos.y);
            if (deltaX > 3 || deltaY > 3) {
                this.dragStarted = true;
            }
        }
    }

    handleClick(e) {
        // Only select if no drag occurred and no actual dragging happened
        if (!this.dragStarted && !this.hasDraggedSinceMouseDown) {
            this.emit('select', this.props.entity.id, e.ctrlKey || e.metaKey);
        }
        // Reset drag state
        this.dragStarted = false;
        this.hasDraggedSinceMouseDown = false;
    }

    // Helper functions to find entities when direct access isn't available
    findCircleInAllDocuments(id) {
        const allDocuments = this.dataStore.getAllCircleDocuments();
        for (const doc of allDocuments) {
            const circles = this.dataStore.getCirclesForDocument(doc.id);
            const circle = circles.find(c => c.id === id);
            if (circle) return circle;
        }
        return null;
    }

    findSquareInCurrentDoc(id) {
        const currentDoc = this.dataStore.getCurrentSquareDocument();
        if (currentDoc) {
            const squares = this.dataStore.getSquaresForDocument(currentDoc.id);
            return squares.find(s => s.id === id);
        }
        return null;
    }
}
