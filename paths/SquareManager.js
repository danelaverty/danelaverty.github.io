class SquareManager extends EventEmitter {
	constructor(dataStore) {
		super();
		this.dataStore = dataStore;
		this.squareViews = new Map(); // Map of square ID to SquareView
		this.selectedSquareId = null;
		
		// Subscribe to data changes
		this.setupDataSubscriptions();
	}

	setupDataSubscriptions() {
		// Listen for square data changes
		this.dataStore.subscribe('squares', (squares) => {
			this.handleSquaresDataChanged(squares);
		});

		// Listen for square document changes
		this.dataStore.subscribe('currentSquareDocument', (squareDocument) => {
			this.handleSquareDocumentChanged(squareDocument);
		});
	}

	handleSquaresDataChanged(squares) {
		// This gets called when the squares data changes in the store
		// We need to sync our views with the data
		
		const currentViewIds = new Set(this.squareViews.keys());
		const dataSquareIds = new Set(squares.map(s => s.id));

		// Remove views for squares that no longer exist in data
		for (const viewId of currentViewIds) {
			if (!dataSquareIds.has(viewId)) {
				this.removeSquareView(viewId);
			}
		}

		// Update or create views for squares in data
		squares.forEach(squareData => {
			const existingView = this.squareViews.get(squareData.id);
			if (existingView) {
				// Update existing view
				const model = new SquareModel(squareData);
				existingView.updateFromModel(model);
			} else {
				// Create new view
				this.createSquareView(squareData);
			}
		});
	}

	handleSquareDocumentChanged(squareDocument) {
		// Add debugging
		console.log('SquareManager: handleSquareDocumentChanged called with:', squareDocument);
		console.log('Current square views count:', this.squareViews.size);
		
		// Clear existing views when square document changes
		this.clearAllViews();
		
		console.log('After clearAllViews, square views count:', this.squareViews.size);
		
		// Only load squares if there's a valid square document
		if (squareDocument && squareDocument.id) {
			console.log('Loading squares for document:', squareDocument.id);
			// Load squares for the new document
			this.loadSquaresForDocument(squareDocument.id);
		} else {
			console.log('No square document, squares should be hidden');
		}
	}

	createSquare() {
	const currentSquareDocId = this.dataStore.getCurrentSquareDocumentId();
	console.log('Creating square, current square document ID:', currentSquareDocId);
	
	if (!currentSquareDocId) {
		console.log('No current square document, available square documents:', this.dataStore.getAllSquareDocuments());
		throw new Error('No current square document available');
	}

	// Position squares within the right container's coordinate system (0 to 50vw)
	const rightContainerWidth = window.innerWidth / 2; // 50vw
	const rightContainerHeight = window.innerHeight;
	
	const x = Math.random() * (rightContainerWidth - 200) + 100;
	const y = Math.random() * (rightContainerHeight - 200) + 100;

	const squareData = {
		x,
		y,
		name: '???',
		documentId: currentSquareDocId
	};

	// Add to data store - this will trigger our subscription
	const savedSquare = this.dataStore.addSquare(squareData);
	return savedSquare;
}

	createSquareView(squareData) {
		const model = new SquareModel(squareData);
		const view = new SquareView(model);
		
		// Set up view event listeners
		view.on('selected', this.handleSquareSelected.bind(this));
		view.on('positionChanged', this.handlePositionChanged.bind(this));
		view.on('nameChanged', this.handleNameChanged.bind(this));

		this.squareViews.set(squareData.id, view);
		
		// Emit event for UI Manager to add to DOM
		this.emit('squareViewCreated', { 
			id: squareData.id, 
			element: view.element,
			view: view 
		});

		return view;
	}

	removeSquareView(squareId) {
		const view = this.squareViews.get(squareId);
		if (view) {
			// Clear selection if this square was selected
			if (this.selectedSquareId === squareId) {
				this.selectedSquareId = null;
			}

			view.destroy();
			this.squareViews.delete(squareId);
			
			this.emit('squareViewRemoved', { id: squareId });
		}
	}

	loadSquaresForDocument(documentId) {
		if (!documentId) return [];

		const squares = this.dataStore.getSquaresForDocument(documentId);
		
		// Clear existing views
		this.clearAllViews();
		
		// Create views for loaded squares
		squares.forEach(squareData => {
			this.createSquareView(squareData);
		});

		this.emit('squaresLoaded', squares);
		return squares;
	}

	clearAllViews() {
		console.log('SquareManager: clearAllViews called, current views:', Array.from(this.squareViews.keys()));
		
		// Remove all square views
		for (const [id, view] of this.squareViews) {
			console.log('Destroying square view:', id);
			view.destroy();
		}
		this.squareViews.clear();
		this.selectedSquareId = null;
		
		console.log('SquareManager: clearAllViews completed, views count:', this.squareViews.size);
		
		this.emit('squaresCleared');
	}

	// Event handlers from views
	handleSquareSelected(squareId) {
		this.selectSquare(squareId);
	}

	handlePositionChanged({ id, x, y }) {
		this.dataStore.updateSquare(id, { x, y });
		this.emit('squareUpdated', { id, updates: { x, y } });
	}

	handleNameChanged({ id, name }) {
		this.dataStore.updateSquare(id, { name });
		this.emit('squareUpdated', { id, updates: { name } });
	}

	// Selection management
	selectSquare(id) {
		const previousId = this.selectedSquareId;

		// Deselect previous square
		if (previousId) {
			const prevView = this.squareViews.get(previousId);
			if (prevView) {
				prevView.setSelected(false);
			}
		}

		// Select new square
		this.selectedSquareId = id;
		if (id) {
			const view = this.squareViews.get(id);
			if (view) {
				view.setSelected(true);
			}
		}

		this.emit('squareSelected', { id, previousId });
	}

	deleteSelectedSquare() {
		if (!this.selectedSquareId) return false;

		return this.deleteSquare(this.selectedSquareId);
	}

	deleteSquare(id) {
		const success = this.dataStore.removeSquare(id);
		if (success) {
			this.emit('squareDeleted', { id });
		}
		return success;
	}

	// Utility methods
	getSquareView(id) {
		return this.squareViews.get(id);
	}

	getAllSquareViews() {
		return Array.from(this.squareViews.values());
	}

	getSelectedSquareId() {
		return this.selectedSquareId;
	}

	getSquareCount() {
		return this.squareViews.size;
	}

	// Get square data (delegates to data store)
	getSquareData(id) {
		return this.dataStore.getSquare(id);
	}

	getAllSquareData() {
		return this.dataStore.getAllSquares();
	}

	// Cleanup
	destroy() {
		this.clearAllViews();
		// DataStore subscriptions should be cleaned up automatically
	}
}
