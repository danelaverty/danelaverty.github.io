class AppController {
    constructor() {
        this.addGlobalStyles();
        
        // Single data store for all data management
        this.dataStore = new DataStore();
        
        // Managers for different entity types
        this.circleManager = new CircleManager(this.dataStore);
        this.squareManager = new SquareManager(this.dataStore);
        this.uiManager = new UIManager(this.dataStore);
        this.keyboardManager = new KeyboardManager(
            this.handleDeleteSquareKeyPressed.bind(this),
            this.handleDeleteCircleKeyPressed.bind(this)
        );

        this.setupEventListeners();
        this.initialize();
    }

    addGlobalStyles() {
        const globalCSS = `
            body {
                margin: 0;
                padding: 0;
                background-color: black;
                font-family: Arial, sans-serif;
                overflow: hidden;
                height: 100vh;
            }

            #app {
                position: relative;
                width: 100vw;
                height: 100vh;
            }
        `;
        StyleManager.addGlobalStyles(globalCSS, 'app-global-styles');
    }

    setupEventListeners() {
        // Circle Manager Events
        this.circleManager.on('circleViewCreated', this.handleCircleViewCreated.bind(this));
        this.circleManager.on('circlesLoaded', this.handleCirclesLoaded.bind(this));
        this.circleManager.on('circlesCleared', this.handleCirclesCleared.bind(this));
        this.circleManager.on('circleSelected', this.handleCircleSelected.bind(this));
        this.circleManager.on('circleDeleted', this.handleCircleDeleted.bind(this));
        this.circleManager.on('circleUpdated', this.handleCircleUpdated.bind(this));

        // Square Manager Events
        this.squareManager.on('squareViewCreated', this.handleSquareViewCreated.bind(this));
        this.squareManager.on('squaresLoaded', this.handleSquaresLoaded.bind(this));
        this.squareManager.on('squaresCleared', this.handleSquaresCleared.bind(this));
        this.squareManager.on('squareSelected', this.handleSquareSelected.bind(this));
        this.squareManager.on('squareDeleted', this.handleSquareDeleted.bind(this));
        this.squareManager.on('squareUpdated', this.handleSquareUpdated.bind(this));

        // UI Manager Events
        this.uiManager.on('addCircleRequested', this.handleAddCircleRequest.bind(this));
        this.uiManager.on('addSquareRequested', this.handleAddSquareRequest.bind(this));
        this.uiManager.on('deselectRequested', this.handleDeselectRequest.bind(this));
	this.uiManager.on('deselectSquareRequested', this.handleDeselectSquareRequest.bind(this));
        this.uiManager.on('documentChanged', this.handleDocumentChanged.bind(this));
	this.uiManager.on('squareDocumentChanged', this.handleSquareDocumentChanged.bind(this));

        // Data Store Events
        this.dataStore.subscribe('currentSquareDocument', this.handleSquareDocumentChanged.bind(this));
    }

    initialize() {
        try {
            this.uiManager.initialize();
            this.loadInitialData();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.uiManager.showError('Failed to initialize application');
        }
    }

    loadInitialData() {
        const currentDocId = this.dataStore.getCurrentCircleDocumentId();
        if (currentDocId) {
            this.circleManager.loadCirclesForDocument(currentDocId);
        }
    }

    // Circle Event Handlers
    handleCircleViewCreated({ id, element, view }) {
        this.uiManager.addCircleToDOM(element);
    }

    handleCirclesLoaded(loadedCircles) {
        console.log(`Loaded ${loadedCircles.length} circles`);
    }

    handleCirclesCleared() {
        // Additional cleanup if needed
    }

    handleDeselectSquareRequest() {
	// Only deselect squares, keep circle selection
	this.squareManager.selectSquare(null);
}

handleCircleSelected({ id, previousId }) {
	// When a circle is selected, deselect any selected square (only if there is one)
	if (this.squareManager.getSelectedSquareId()) {
		this.squareManager.selectSquare(null);
	}
	
	// Update square button state
	this.uiManager.updateSquareButtonState(id !== null);
	
	// Update square document dropdown state
	this.uiManager.updateSquareDocumentDropdown(id);
	
	// Debug logging
	if (id) {
		console.log('Circle selected:', id);
		console.log('Current square document:', this.dataStore.getCurrentSquareDocumentId());
	}
}

    handleCircleDeleted({ id }) {
        // Additional cleanup logic if needed
    }

    handleCircleUpdated({ id, updates }) {
        // Additional update logic if needed
    }

    // Square Event Handlers
    handleSquareViewCreated({ id, element, view }) {
        this.uiManager.addSquareToDOM(element);
    }

    handleSquaresLoaded(loadedSquares) {
        console.log(`Loaded ${loadedSquares.length} squares`);
    }

    handleSquaresCleared() {
        // Additional cleanup if needed
    }

   handleSquareSelected({ id, previousId }) {
	// When a square is selected, DO NOT deselect the circle
	// Squares belong to circles and should coexist with circle selection
	
	// No need to deselect circles - squares and circles can both be selected
	// The circle selection drives which squares are visible
} 

    handleSquareDeleted({ id }) {
        // Additional cleanup logic if needed
    }

    handleSquareUpdated({ id, updates }) {
        // Additional update logic if needed
    }

    // UI Event Handlers
    handleAddCircleRequest() {
        try {
            this.circleManager.createCircle();
        } catch (error) {
            console.error('Failed to create circle:', error);
            this.uiManager.showError('Failed to create circle');
        }
    }

    handleAddSquareRequest() {
        try {
            this.squareManager.createSquare();
        } catch (error) {
            console.error('Failed to create square:', error);
            this.uiManager.showError('Failed to create square');
        }
    }

    handleDeselectRequest() {
        this.circleManager.selectCircle(null);
        this.squareManager.selectSquare(null);
    }

    handleDocumentChanged(documentId) {
        try {
            // Load circles for the new document
            this.circleManager.loadCirclesForDocument(documentId);
            
            // Clear squares since no circle is selected
            this.squareManager.clearAllViews();
            
            // Update UI
            this.uiManager.updateDocumentDropdown();
            this.uiManager.updateSquareButtonState(false);
        } catch (error) {
            console.error('Failed to change document:', error);
            this.uiManager.showError('Failed to change document');
        }
    }

handleSquareDocumentChanged(squareDocumentId) {
	try {
		// Load squares for the new square document
		if (squareDocumentId) {
			this.squareManager.loadSquaresForDocument(squareDocumentId);
		} else {
			this.squareManager.clearAllViews();
		}
	} catch (error) {
		console.error('Failed to change square document:', error);
		this.uiManager.showError('Failed to change square document');
	}
}

    // Keyboard Event Handlers
    handleDeleteSquareKeyPressed() {
        try {
            const deleted = this.squareManager.deleteSelectedSquare();
            if (deleted) {
                console.log('Square deleted via keyboard');
                return true; // Indicate that deletion was handled
            }
            return false; // No square was deleted
        } catch (error) {
            console.error('Failed to delete square:', error);
            this.uiManager.showError('Failed to delete square');
            return false;
        }
    }

    handleDeleteCircleKeyPressed() {
        try {
            const deleted = this.circleManager.deleteSelectedCircle();
            if (!deleted) {
                console.log('No circle selected for deletion');
            } else {
                console.log('Circle deleted via keyboard');
            }
        } catch (error) {
            console.error('Failed to delete circle:', error);
            this.uiManager.showError('Failed to delete circle');
        }
    }

    // Public API for external access if needed
    getCircleManager() {
        return this.circleManager;
    }

    getSquareManager() {
        return this.squareManager;
    }

    getDataStore() {
        return this.dataStore;
    }

    getUIManager() {
        return this.uiManager;
    }

    // Legacy compatibility methods (updated for CircleDocuments)
    get documentManager() {
        return {
            getCurrentDocumentId: () => this.dataStore.getCurrentCircleDocumentId(),
            getCurrentDocument: () => this.dataStore.getCurrentCircleDocument(),
            getAllDocuments: () => this.dataStore.getAllCircleDocuments(),
            createDocument: (name) => this.dataStore.createCircleDocument(name),
            setCurrentDocument: (id) => this.dataStore.setCurrentCircleDocument(id),
            deleteDocument: (id) => this.dataStore.deleteCircleDocument(id),
            updateDocumentName: (id, name) => this.dataStore.updateCircleDocumentName(id, name)
        };
    }

    get appState() {
        return {
            getCircles: () => this.dataStore.getAllCircles(),
            getCirclesForDocument: (docId) => this.dataStore.getCirclesForDocument(docId),
            generateId: () => this.dataStore.generateCircleId(),
            getSquares: () => this.dataStore.getAllSquares(),
            getSquaresForDocument: (docId) => this.dataStore.getSquaresForDocument(docId)
        };
    }

    // Cleanup method
    destroy() {
        if (this.circleManager) {
            this.circleManager.destroy();
        }
        
        if (this.squareManager) {
            this.squareManager.destroy();
        }

        if (this.uiManager) {
            this.uiManager.destroy();
        }

        // Clean up references
        this.circleManager = null;
        this.squareManager = null;
        this.uiManager = null;
        this.dataStore = null;
        this.keyboardManager = null;
    }
}
