// entityService.js - FIXED: Immediate square connection clearing on circle deselection AND square document changes
import { useEntityStore } from './entityStore.js';
import { useDocumentStore } from './documentStore.js';
import { useUIStore } from './uiStore.js';
import { useConnections } from './useConnections.js';

/**
 * Service layer that handles complex business operations involving multiple stores
 */
export class EntityService {
    constructor() {
        this.entityStore = useEntityStore();
        this.documentStore = useDocumentStore();
        this.uiStore = useUIStore();
        // Get connection manager for updating connections
        const { connectionManager } = useConnections();
        this.connectionManager = connectionManager;
    }

    /**
     * Helper to get current squares for connection updates
     */
    _getCurrentSquares() {
        const currentDoc = this.documentStore.getCurrentSquareDocument();
        return currentDoc ? this.entityStore.getSquaresForDocument(currentDoc.id) : [];
    }

    /**
     * Helper to update connections after square changes
     */
    _updateConnectionsAfterChange() {
        const squares = this._getCurrentSquares();
        this.connectionManager.updateConnections(squares, 'square');
    }

    /**
     * FIXED: Immediately clear square connections when no squares should be visible
     */
    _clearSquareConnectionsImmediately() {
        // Clear square connections immediately by passing empty array
        this.connectionManager.updateConnections([], 'square');
    }

    /**
     * NEW: Immediately update connections for current square document
     * This prevents the flash when switching between square documents
     */
    _updateSquareConnectionsImmediately() {
        const squares = this._getCurrentSquares();
        this.connectionManager.updateConnections(squares, 'square');
    }

    /**
     * Create a circle in a specific viewer with all necessary relationships
     * UPDATED: Pass documentStore to entityStore.createCircle for type inheritance
     */
    createCircleInViewer(viewerId) {
    const documentId = this.uiStore.getCircleDocumentForViewer(viewerId);
    if (!documentId) return null;

    const viewerProperties = this.documentStore.getCircleDocumentViewerProperties(documentId);
    
    if (!viewerProperties) {
        return null;
    }
    
    const containerWidth = viewerProperties.width;
    
    if (!containerWidth || containerWidth <= 0) {
        return null;
    }

    // Create the circle with the correct container width
    const circle = this.entityStore.createCircle(documentId, containerWidth, null, this.documentStore);
    
    // Create default square document for this circle
    this.documentStore.ensureSquareDocumentForCircle(circle.id);
    
    return circle;
}

    /**
     * Create a square with proper container sizing
     */
createSquare() {
    const currentDoc = this.documentStore.getCurrentSquareDocument();
    if (!currentDoc) return null;

    const visibleViewers = this.uiStore.getVisibleCircleViewers();
    
    // FIXED: Get viewer widths from document properties, not directly from viewer object
    const viewerWidths = visibleViewers.map(v => {
        const viewerProperties = this.uiStore.getViewerProperties(v.id, this.documentStore);
        return viewerProperties.width;
    });
    
    const square = this.entityStore.createSquare(currentDoc.id, viewerWidths);
    
    // Update connections after creating new square
    this._updateConnectionsAfterChange();
    
    return square;
}

    /**
     * Delete a circle and handle all cascading effects
     */
    deleteCircle(id) {
        const circle = this.entityStore.getCircle(id);
        if (!circle) return false;

        // Remove from selection first
        this.uiStore.removeFromSelection('circle', id);
        
        // Delete related square documents
        this.documentStore.deleteSquareDocumentsForCircle(id);
        
        // Delete the circle
        const deleted = this.entityStore.deleteCircle(id);
        
        if (deleted) {
            // If no circles selected anymore, clear square document
            if (this.uiStore.getSelectedCircles().length === 0) {
                this.documentStore.data.currentSquareDocumentId = null;
                // FIXED: Immediately clear square connections when no circles selected
                this._clearSquareConnectionsImmediately();
            } else {
                // Update connections since squares might have been deleted
                this._updateConnectionsAfterChange();
            }
        }
        
        return deleted;
    }

    /**
     * Delete a square with proper cleanup
     */
    deleteSquare(id) {
        // Get the square's document info before deletion
        const square = this.entityStore.getSquare(id);
        
        if (!square) {
            return false;
        }
        
        let circleId = null;
        const squareDoc = this.documentStore.getSquareDocument(square.documentId);
        circleId = squareDoc?.circleId;
        
        // Remove from selection first
        this.uiStore.removeFromSelection('square', id);
        
        // Delete the square
        const deleted = this.entityStore.deleteSquare(id);
        
        // Update connections after deletion - force a full update
        if (deleted) {
            const squares = this._getCurrentSquares();
            // Force a full update to ensure deleted square connections are removed
            this.connectionManager.forceUpdate(squares);
        }
        
        return deleted;
    }

    /**
     * FIXED: Select a circle with immediate square connection clearing on deselection
     */
    selectCircle(id, viewerId, isCtrlClick = false) {
        // Set the viewer as selected when selecting circles in it
        if (id && viewerId) {
            this.uiStore.setSelectedViewer(viewerId);
        }
        
        if (!isCtrlClick) {
            // Normal click - clear all selections
            this.uiStore.clearSelections();
            
            if (id) {
                this.uiStore.selectEntities('circle', [id], viewerId);
                
                // Auto-select square document for single selection
                this._handleSquareDocumentSelection(id);
            } else {
                this.documentStore.data.currentSquareDocumentId = null;
                // FIXED: Immediately clear square connections when deselecting circles
                this._clearSquareConnectionsImmediately();
            }
        } else {
            // Ctrl+click - toggle selection
            if (id) {
                // If selecting from different viewer, clear all and start fresh
                if (this.uiStore.data.selectedCircleViewerId && 
                    this.uiStore.data.selectedCircleViewerId !== viewerId) {
                    this.uiStore.clearSelections();
                    this.uiStore.selectEntities('circle', [id], viewerId);
                } else {
                    // Same viewer - toggle selection
                    this.uiStore.toggleEntitySelection('circle', id, viewerId);
                }
                
                // Handle square document selection based on circle selection count
                this._handleMultipleCircleSelection();
            }
        }
    }

    /**
     * Select a square with proper state management
     */
    selectSquare(id, isCtrlClick = false) {
        if (!isCtrlClick) {
            this.uiStore.clearSelections('square');
            if (id) {
                this.uiStore.selectEntities('square', [id]);
            }
        } else {
            if (id) {
                this.uiStore.toggleEntitySelection('square', id);
            }
        }
    }

    /**
     * NEW: Set current square document with immediate connection update
     * This prevents the flash when switching between square documents
     */
    setCurrentSquareDocument(id) {
        const oldDocId = this.documentStore.data.currentSquareDocumentId;
        const result = this.documentStore.setCurrentSquareDocument(id);
        
        if (result && oldDocId !== id) {
            // FIXED: Immediately update connections for new document to prevent flash
            this._updateSquareConnectionsImmediately();
        }
        
        return result;
    }

    /**
     * Delete a circle document with proper cleanup
     */
    deleteCircleDocument(id) {
        if (this.documentStore.getAllCircleDocuments().length <= 1) return false;

        // Update viewers that were using this document
        const remainingDocs = this.documentStore.getAllCircleDocuments().filter(doc => doc.id !== id);
        const fallbackDocId = remainingDocs.length > 0 ? remainingDocs[0].id : null;
        
        for (const viewer of this.uiStore.getCircleViewers()) {
            if (viewer.currentCircleDocumentId === id) {
                this.uiStore.setCircleDocumentForViewer(viewer.id, fallbackDocId);
            }
        }

        // Remove circles for this document (and their square documents)
        const circlesToRemove = this.entityStore.getCirclesForDocument(id);
        circlesToRemove.forEach(circle => {
            this.uiStore.removeFromSelection('circle', circle.id);
            this.documentStore.deleteSquareDocumentsForCircle(circle.id);
            this.entityStore.deleteCircle(circle.id);
        });

        const deleted = this.documentStore.deleteCircleDocument(id);
        
        // Update connections since squares might have been deleted
        if (deleted) {
            this._updateConnectionsAfterChange();
        }
        
        return deleted;
    }

    /**
     * Select all circles in a viewer with proper document handling
     */
    selectAllCirclesInViewer(viewerId = null) {
        const targetViewerId = viewerId || this.uiStore.data.selectedViewerId;
        if (!targetViewerId) return 0;
        
        const documentId = this.uiStore.getCircleDocumentForViewer(targetViewerId);
        if (!documentId) return 0;
        
        const circles = this.entityStore.getCirclesForDocument(documentId);
        this.uiStore.clearSelections();
        
        const circleIds = circles.map(c => c.id);
        this.uiStore.selectEntities('circle', circleIds, targetViewerId);
        
        // Handle square document selection
        if (circleIds.length === 1) {
            this._handleSquareDocumentSelection(circleIds[0]);
        } else {
            this.documentStore.data.currentSquareDocumentId = null;
            // FIXED: Immediately clear square connections when multiple circles selected
            this._clearSquareConnectionsImmediately();
        }
        
        return circles.length;
    }

    /**
     * Select all squares in current document
     */
    selectAllSquaresInDocument() {
        const currentDocId = this.documentStore.data.currentSquareDocumentId;
        if (!currentDocId) return 0;
        
        const squares = this.entityStore.getSquaresForDocument(currentDocId);
        this.uiStore.clearSelections('square');
        
        const squareIds = squares.map(s => s.id);
        this.uiStore.selectEntities('square', squareIds);
        
        return squares.length;
    }

    /**
     * Bulk delete selected entities
     */
    deleteSelectedCircles() {
        const circleIds = this.uiStore.getSelectedCircles();
        let deletedCount = 0;
        
        circleIds.forEach(id => {
            if (this.deleteCircle(id)) {
                deletedCount++;
            }
        });
        
        // Update connections once after all deletions
        if (deletedCount > 0) {
            this._updateConnectionsAfterChange();
        }
        
        return deletedCount;
    }

    deleteSelectedSquares() {
        const squareIds = this.uiStore.getSelectedSquares();
        let deletedCount = 0;
        
        squareIds.forEach(id => {
            // Remove from selection first
            this.uiStore.removeFromSelection('square', id);
            
            // Delete the square
            if (this.entityStore.deleteSquare(id)) {
                deletedCount++;
            }
        });
        
        // Update connections once after all deletions
        if (deletedCount > 0) {
            this._updateConnectionsAfterChange();
        }
        
        return deletedCount;
    }

    /**
     * Move selected entities
     */
    moveSelectedCircles(deltaX, deltaY) {
        this.entityStore.moveEntities('circle', this.uiStore.getSelectedCircles(), deltaX, deltaY);
    }

    moveSelectedSquares(deltaX, deltaY) {
        this.entityStore.moveEntities('square', this.uiStore.getSelectedSquares(), deltaX, deltaY);
        // Update connections after moving squares
        this._updateConnectionsAfterChange();
    }

    // Private helper methods

    /**
     * Handle square document selection for single circle
     */
    _handleSquareDocumentSelection(circleId) {
        const squareDocuments = this.documentStore.getSquareDocumentsForCircle(circleId);
        if (squareDocuments.length > 0) {
            // FIXED: Use the new method that immediately updates connections
            this.setCurrentSquareDocument(squareDocuments[0].id);
        } else {
            const defaultSquareDoc = this.documentStore.createSquareDocument(circleId, 'Default');
            // FIXED: Use the new method that immediately updates connections
            this.setCurrentSquareDocument(defaultSquareDoc.id);
        }
    }

    /**
     * FIXED: Handle square document selection for multiple circles with immediate clearing
     */
    _handleMultipleCircleSelection() {
        const selectedCount = this.uiStore.getSelectedCircles().length;
        if (selectedCount !== 1) {
            this.documentStore.data.currentSquareDocumentId = null;
            // FIXED: Immediately clear square connections when no single circle is selected
            this._clearSquareConnectionsImmediately();
        } else {
            // Single circle selected - show its squares
            const singleCircleId = this.uiStore.getSelectedCircles()[0];
            this._handleSquareDocumentSelection(singleCircleId);
        }
    }
}
