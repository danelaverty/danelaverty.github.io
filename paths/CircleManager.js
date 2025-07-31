class CircleManager extends EventEmitter {
	constructor(dataStore) {
		super();
		this.dataStore = dataStore;
		this.circleViews = new Map(); // Map of circle ID to CircleView
		this.selectedCircleId = null;
		
		// Subscribe to data changes
		this.setupDataSubscriptions();
	}

	setupDataSubscriptions() {
		// Listen for circle data changes
		this.dataStore.subscribe('circles', (circles) => {
			this.handleCirclesDataChanged(circles);
		});
	}

	handleCirclesDataChanged(circles) {
		// This gets called when the circles data changes in the store
		// We need to sync our views with the data
		
		const currentViewIds = new Set(this.circleViews.keys());
		const dataCircleIds = new Set(circles.map(c => c.id));

		// Remove views for circles that no longer exist in data
		for (const viewId of currentViewIds) {
			if (!dataCircleIds.has(viewId)) {
				this.removeCircleView(viewId);
			}
		}

		// Update or create views for circles in data
		circles.forEach(circleData => {
			const existingView = this.circleViews.get(circleData.id);
			if (existingView) {
				// Update existing view
				const model = new CircleModel(circleData);
				existingView.updateFromModel(model);
			} else {
				// Create new view
				this.createCircleView(circleData);
			}
		});
	}

	createCircle() {
		const currentDocId = this.dataStore.getCurrentCircleDocumentId();
		if (!currentDocId) {
			throw new Error('No current circle document available');
		}

		const x = Math.random() * (window.innerWidth/2 - 200) + 100; // Left half of screen
		const y = Math.random() * (window.innerHeight - 200) + 100;

		const circleData = {
			x,
			y,
			name: '???',
			documentId: currentDocId
		};

		// Add to data store - this will trigger our subscription and create default square document
		const savedCircle = this.dataStore.addCircle(circleData);
		
		// Ensure this new circle has a square document selected
		this.selectSquareDocumentForCircle(savedCircle.id);
		
		return savedCircle;
	}

	createCircleView(circleData) {
		const model = new CircleModel(circleData);
		const view = new CircleView(model);
		
		// Set up view event listeners
		view.on('selected', this.handleCircleSelected.bind(this));
		view.on('positionChanged', this.handlePositionChanged.bind(this));
		view.on('nameChanged', this.handleNameChanged.bind(this));

		this.circleViews.set(circleData.id, view);
		
		// Emit event for UI Manager to add to DOM
		this.emit('circleViewCreated', { 
			id: circleData.id, 
			element: view.element,
			view: view 
		});

		return view;
	}

	removeCircleView(circleId) {
		const view = this.circleViews.get(circleId);
		if (view) {
			// Clear selection if this circle was selected
			if (this.selectedCircleId === circleId) {
				this.selectedCircleId = null;
			}

			view.destroy();
			this.circleViews.delete(circleId);
			
			this.emit('circleViewRemoved', { id: circleId });
		}
	}

	loadCirclesForDocument(documentId) {
		if (!documentId) return [];

		const circles = this.dataStore.getCirclesForDocument(documentId);
		
		// Clear existing views
		this.clearAllViews();
		
		// Create views for loaded circles
		circles.forEach(circleData => {
			this.createCircleView(circleData);
		});

		this.emit('circlesLoaded', circles);
		return circles;
	}

	clearAllViews() {
		// Remove all circle views
		for (const [id, view] of this.circleViews) {
			view.destroy();
		}
		this.circleViews.clear();
		this.selectedCircleId = null;
		
		this.emit('circlesCleared');
	}

	// Event handlers from views
	handleCircleSelected(circleId) {
		this.selectCircle(circleId);
	}

	handlePositionChanged({ id, x, y }) {
		this.dataStore.updateCircle(id, { x, y });
		this.emit('circleUpdated', { id, updates: { x, y } });
	}

	handleNameChanged({ id, name }) {
		this.dataStore.updateCircle(id, { name });
		this.emit('circleUpdated', { id, updates: { name } });
	}

	// Selection management
	selectCircle(id) {
		const previousId = this.selectedCircleId;

		// Deselect previous circle
		if (previousId) {
			const prevView = this.circleViews.get(previousId);
			if (prevView) {
				prevView.setSelected(false);
			}
		}

		// Select new circle
		this.selectedCircleId = id;
		if (id) {
			const view = this.circleViews.get(id);
			if (view) {
				view.setSelected(true);
			}

			// Auto-select a square document for this circle
			this.selectSquareDocumentForCircle(id);
		} else {
			// No circle selected, clear square document selection
			this.dataStore.setCurrentSquareDocument(null);
		}

		this.emit('circleSelected', { id, previousId });
	}

	selectSquareDocumentForCircle(circleId) {
		const squareDocuments = this.dataStore.getSquareDocumentsForCircle(circleId);
		if (squareDocuments.length > 0) {
			// Select the first square document
			this.dataStore.setCurrentSquareDocument(squareDocuments[0].id);
		} else {
			// If no square documents exist for this circle, create a default one
			const defaultSquareDoc = this.dataStore.createSquareDocument(circleId, 'Default');
			this.dataStore.setCurrentSquareDocument(defaultSquareDoc.id);
		}
	}

	deleteSelectedCircle() {
		if (!this.selectedCircleId) return false;

		return this.deleteCircle(this.selectedCircleId);
	}

	deleteCircle(id) {
		const success = this.dataStore.removeCircle(id);
		if (success) {
			this.emit('circleDeleted', { id });
		}
		return success;
	}

	// Utility methods
	getCircleView(id) {
		return this.circleViews.get(id);
	}

	getAllCircleViews() {
		return Array.from(this.circleViews.values());
	}

	getSelectedCircleId() {
		return this.selectedCircleId;
	}

	getCircleCount() {
		return this.circleViews.size;
	}

	// Get circle data (delegates to data store)
	getCircleData(id) {
		return this.dataStore.getCircle(id);
	}

	getAllCircleData() {
		return this.dataStore.getAllCircles();
	}

	// Cleanup
	destroy() {
		this.clearAllViews();
		// DataStore subscriptions should be cleaned up automatically
	}
}
