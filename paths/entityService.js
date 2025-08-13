// entityService.js - FIXED: Remove problematic clearConnections calls from circle selection
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
     * Create a circle in a specific viewer with all necessary relationships
     * UPDATED: Pass documentStore to entityStore.createCircle for type inheritance
     */
    createCircleInViewer(viewerId) {
        const documentId = this.uiStore.getCircleDocumentForViewer(viewerId);
        if (!documentId) return null;

        const viewer = this.uiStore.data.circleViewers.get(viewerId);
        // NEW: Pass documentStore to enable type inheritance
        const circle = this.entityStore.createCircle(documentId, viewer.width, null, this.documentStore);
        
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

        const viewerWidths = this.uiStore.getVisibleCircleViewers().map(v => v.width);
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
            }
            
            // Update connections since squares might have been deleted
            this._updateConnectionsAfterChange();
        }
        
        return deleted;
    }

    /**
     * Delete a square with proper cleanup
     */
    deleteSquare(id) {
        console.log(`EntityService.deleteSquare: Attempting to delete square ${id}`);
        
        // Get the square's document info before deletion
        const square = this.entityStore.getSquare(id);
        console.log('Square found:', square);
        
        if (!square) {
            console.log('Square not found, cannot delete');
            return false;
        }
        
        let circleId = null;
        console.log('Square documentId:', square.documentId);
        const squareDoc = this.documentStore.getSquareDocument(square.documentId);
        console.log('Square document found:', squareDoc);
        circleId = squareDoc?.circleId;
        console.log('Circle ID:', circleId);
        
        // Remove from selection first
        this.uiStore.removeFromSelection('square', id);
        
        // Delete the square
        const deleted = this.entityStore.deleteSquare(id);
        console.log('Square deleted from entity store:', deleted);
        
        // Update connections after deletion - force a full update
        if (deleted) {
            console.log('Updating connections after square deletion...');
            const squares = this._getCurrentSquares();
            console.log(`Current squares after deletion: ${squares.length}`);
            // Force a full update to ensure deleted square connections are removed
            this.connectionManager.forceUpdate(squares);
        }
        
        return deleted;
    }

    /**
     * FIXED: Select a circle with proper document and UI state management
     * Removed ALL clearConnections() calls to preserve circle connections
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
                // FIXED: Don't clear ANY connections when deselecting circles
                // Circle connections should always remain visible
                // Square connections are handled by square document selection state
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
            // FIXED: Don't clear ANY connections when multiple circles are selected
            // Circle connections should always remain visible
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
     * FIXED: Handle square document selection for single circle
     * Removed clearConnections() call that was clearing all connections
     */
    _handleSquareDocumentSelection(circleId) {
        const squareDocuments = this.documentStore.getSquareDocumentsForCircle(circleId);
        if (squareDocuments.length > 0) {
            this.documentStore.setCurrentSquareDocument(squareDocuments[0].id);
            // Update connections when document changes
            this._updateConnectionsAfterChange();
        } else {
            const defaultSquareDoc = this.documentStore.createSquareDocument(circleId, 'Default');
            this.documentStore.setCurrentSquareDocument(defaultSquareDoc.id);
            // FIXED: Don't clear connections for new empty document
            // The connection system will automatically handle empty states
            // Only update square connections, circle connections remain untouched
            this._updateConnectionsAfterChange();
        }
    }

    /**
     * FIXED: Handle square document selection for multiple circles
     * Removed clearConnections() call that was clearing all connections
     */
    _handleMultipleCircleSelection() {
        const selectedCount = this.uiStore.getSelectedCircles().length;
        if (selectedCount !== 1) {
            this.documentStore.data.currentSquareDocumentId = null;
            // FIXED: Don't clear ANY connections when no square document is selected
            // Circle connections should always remain visible regardless of square document state
            // Square connections will be handled automatically by the connection system
        } else {
            // Single circle selected - show its squares
            const singleCircleId = this.uiStore.getSelectedCircles()[0];
            this._handleSquareDocumentSelection(singleCircleId);
        }
    }
}
