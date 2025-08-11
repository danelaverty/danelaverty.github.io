// EntityDragHandler.js - Enhanced with connection radius indicators during drag (Fixed) + Shift-click connection selection
import { onMounted } from './vue-composition-api.js';
import { useDraggable } from './useDraggable.js';
import { useConnectionDragUpdater } from './useConnections.js';
import { injectComponentStyles } from './styleUtils.js';
import { ConnectionUtils } from './ConnectionUtils.js';

// Inject radius indicator styles directly here since we're creating elements programmatically
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

// Inject the styles once
injectComponentStyles('connection-radius-indicator', radiusIndicatorStyles);

export class EntityDragHandler {
    constructor(elementRef, emit, dataStore, props, callbacks = {}) {
        this.elementRef = elementRef;
        this.emit = emit;
        this.dataStore = dataStore;
        this.props = props;
        
        // FIXED: Store proximity callbacks
        this.proximityCallbacks = callbacks;
        
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
        this.currentDragDeltas = { deltaX: 0, deltaY: 0 };

        // NEW: Radius indicator tracking
        this.isDraggingSquares = false;
        this.radiusIndicatorElements = new Map(); // Track indicator elements

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

    // Helper to calculate visual position for circles (center-relative to absolute)
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

    // Reset visual position to stored position (accounting for center-relative)
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

    // NEW: Create connection radius indicators for dragged squares
    createRadiusIndicators(selectedSquareIds, deltaX, deltaY) {
        if (this.props.entityType !== 'square') return;

        const container = this.getContainer();
        if (!container) {
            return;
        }

        // Remove any existing indicators
        this.removeRadiusIndicators();

        selectedSquareIds.forEach(squareId => {
            const square = this.dataStore.getSquare(squareId);
            if (!square) {
                return;
            }

            // Determine connection distance based on bold state
            const connectionDistance = square.bold ? 165 : 130;

            // Create indicator element
            const indicator = document.createElement('div');
            
            // Calculate position - using center of square
            const centerX = square.x + deltaX + 21; // 21px = center of 41px square
            const centerY = square.y + deltaY + 21;
            const radius = connectionDistance;
            const diameter = radius * 2;
            
            // Set base class
            indicator.className = 'connection-radius-indicator';
            if (square.bold) {
                indicator.classList.add('bold');
            }
            
            // Apply all styles directly to ensure they work
            indicator.style.position = 'absolute';
            indicator.style.left = (centerX - radius) + 'px';
            indicator.style.top = (centerY - radius) + 'px';
            indicator.style.width = diameter + 'px';
            indicator.style.height = diameter + 'px';
            indicator.style.borderRadius = '50%';
            indicator.style.pointerEvents = 'none';
            indicator.style.zIndex = '998';
            indicator.style.transition = 'none';
            
            // Apply border and background based on bold state
            if (square.bold) {
                indicator.style.background = 'rgba(255, 255, 100, 0.08)';
            } else {
                indicator.style.background = 'rgba(255, 255, 255, 0.05)';
            }

            // Add fade-in animation
            indicator.classList.add('fade-in');

            container.appendChild(indicator);
            this.radiusIndicatorElements.set(squareId, indicator);
        });
    }

    // NEW: Update radius indicator positions during drag
    updateRadiusIndicators(selectedSquareIds, deltaX, deltaY) {
        if (this.props.entityType !== 'square') return;

        selectedSquareIds.forEach(squareId => {
            const indicator = this.radiusIndicatorElements.get(squareId);
            const square = this.dataStore.getSquare(squareId);
            if (!indicator || !square) return;

            // Calculate new position
            const centerX = square.x + deltaX + 21;
            const centerY = square.y + deltaY + 21;
            const connectionDistance = square.bold ? 165 : 130;
            const radius = connectionDistance;

            // Update position
            indicator.style.left = (centerX - radius) + 'px';
            indicator.style.top = (centerY - radius) + 'px';
        });
    }

    // NEW: Remove all radius indicators
    removeRadiusIndicators() {
        this.radiusIndicatorElements.forEach((indicator, squareId) => {
            if (indicator && indicator.parentNode) {
                // Add fade-out animation before removal
                indicator.classList.add('fade-out');
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 200);
            }
        });
        this.radiusIndicatorElements.clear();
    }

    // NEW: Handle shift-click for recursive connection selection
    handleShiftClickSquare(squareId) {
        // Get all squares in the current document
        const currentDoc = this.dataStore.getCurrentSquareDocument();
        if (!currentDoc) return;
        
        const allSquares = this.dataStore.getSquaresForDocument(currentDoc.id);
        
        // Find all recursively connected squares
        const connectedSquareIds = ConnectionUtils.findRecursivelyConnectedSquares(squareId, allSquares);
        
        // Clear current square selections and select all connected squares
        this.dataStore.selectSquare(null, false); // Clear current selection
        
        // Select all connected squares
        const connectedIds = Array.from(connectedSquareIds);
        if (connectedIds.length > 0) {
            // Select first square normally
            this.dataStore.selectSquare(connectedIds[0], false);
            
            // Add remaining squares to selection
            for (let i = 1; i < connectedIds.length; i++) {
                this.dataStore.selectSquare(connectedIds[i], true); // true for multi-select
            }
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
        
        let selectedIds;
        if (isMultiSelected) {
            selectedIds = this.dataStore.getSelectedSquares();
        } else {
            // Always include the current square being dragged
            selectedIds = [this.props.entity.id];
        }
        
        return selectedIds;
    }

    setupDragging() {
        // FIXED: Pass onDragMove callback to useDraggable
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
        this.currentDragDeltas = { deltaX, deltaY };
        
        // FIXED: Call proximity callback if provided
        if (this.proximityCallbacks.onDragMove) {
            this.proximityCallbacks.onDragMove(deltaX, deltaY);
        }
        
        // Check if this is a square drag to show radius indicators
        const isSquareDrag = this.props.entityType === 'square';
        
        // During drag, visually move all selected entities
        const isMultiSelected = this.props.entityType === 'circle' 
            ? this.dataStore.hasMultipleCirclesSelected() && this.dataStore.isCircleSelected(this.props.entity.id)
            : this.dataStore.hasMultipleSquaresSelected() && this.dataStore.isSquareSelected(this.props.entity.id);

        const selectedIds = this.props.entityType === 'circle' 
            ? this.dataStore.getSelectedCircles()
            : this.dataStore.getSelectedSquares();

        // NEW: Create radius indicators on first drag move for squares
        if (isSquareDrag && !this.isDraggingSquares) {
            this.isDraggingSquares = true;
            const squareIds = this.getSelectedSquareIds();
            this.createRadiusIndicators(squareIds, deltaX, deltaY);
        }

        if (isMultiSelected) {
            // Update visual position of all selected entities
            selectedIds.forEach(id => {
                const entityElement = document.querySelector(`[data-entity-id="${id}"]`);
                if (entityElement) {
                    // Get entity data directly from the store
                    const entity = this.props.entityType === 'circle' 
                        ? this.dataStore.data.circles?.get?.(id) || this.findCircleInAllDocuments(id)
                        : this.dataStore.data.squares?.get?.(id) || this.findSquareInCurrentDoc(id);
                    
                    if (entity) {
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
                const visualPos = this.calculateVisualPosition(this.props.entity, deltaX, deltaY);
                entityElement.style.left = visualPos.left;
                entityElement.style.top = visualPos.top;
                entityElement.classList.add('dragging');
            }
        }

        // NEW: Update radius indicators during drag for squares
        if (isSquareDrag && this.isDraggingSquares) {
            const squareIds = this.getSelectedSquareIds();
            this.updateRadiusIndicators(squareIds, deltaX, deltaY);
        }

        // Update connections in real-time for squares
        if (this.props.entityType === 'square' && this.updateConnectionsForDrag) {
            this.updateConnectionsForDrag();
        }
    }

    onDragEnd(x, y, deltaX, deltaY) {
        
        // FIXED: Call proximity callback if provided
        if (this.proximityCallbacks.onDragEnd) {
            this.proximityCallbacks.onDragEnd();
        }
        
        // NEW: Remove radius indicators when drag ends
        if (this.isDraggingSquares) {
            this.isDraggingSquares = false;
            this.removeRadiusIndicators();
        }

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
                // For circles, emit position update using center-relative coordinates
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
        
        // Don't start drag on shift-click for squares (it's for connection selection)
        if (e.shiftKey && this.props.entityType === 'square') {
            return;
        }
        
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
        // Check for shift-click on squares to select recursively connected squares
        if (e.shiftKey && this.props.entityType === 'square') {
            this.handleShiftClickSquare(this.props.entity.id);
            return;
        }
        
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
