class DataStore {
	constructor() {
		this.storageKey = `circleApp_${window.location.pathname}`;
		this.data = {
			circleDocuments: new Map(),
			squareDocuments: new Map(),
			circles: new Map(),
			squares: new Map(),
			currentCircleDocumentId: null,
			currentSquareDocumentId: null,
			nextCircleId: 1,
			nextSquareId: 1,
			nextCircleDocumentId: 1,
			nextSquareDocumentId: 1
		};
		this.subscribers = new Map();
		this.loadFromStorage();
		this.ensureDefaultCircleDocument();
	}

	// Subscription system for reactive updates
	subscribe(path, callback) {
		if (!this.subscribers.has(path)) {
			this.subscribers.set(path, []);
		}
		this.subscribers.get(path).push(callback);
		
		// Return unsubscribe function
		return () => {
			const callbacks = this.subscribers.get(path);
			if (callbacks) {
				const index = callbacks.indexOf(callback);
				if (index > -1) {
					callbacks.splice(index, 1);
				}
			}
		};
	}

	// Notify subscribers when data changes
	notify(path, data) {
		const callbacks = this.subscribers.get(path) || [];
		callbacks.forEach(callback => {
			try {
				callback(data);
			} catch (error) {
				console.error(`Error in subscriber for '${path}':`, error);
			}
		});
	}

	// CircleDocument Management
	generateCircleDocumentId() {
		return `circleDoc_${this.data.nextCircleDocumentId++}`;
	}

	generateUniqueCircleDocumentName(baseName = null) {
		const base = baseName || this.getCurrentDate();
		const existingNames = new Set(this.getAllCircleDocuments().map(doc => doc.name));
		
		if (!existingNames.has(base)) {
			return base;
		}
		
		let counter = 1;
		let uniqueName;
		do {
			uniqueName = `${base} (${counter})`;
			counter++;
		} while (existingNames.has(uniqueName));
		
		return uniqueName;
	}

	createCircleDocument(name = null) {
		const id = this.generateCircleDocumentId();
		const documentName = this.generateUniqueCircleDocumentName(name);
		const document = {
			id: id,
			name: documentName,
			createdAt: new Date().toISOString()
		};

		this.data.circleDocuments.set(id, document);
		this.saveToStorage();
		this.notify('circleDocuments', this.getAllCircleDocuments());
		return document;
	}

	getCircleDocument(id) {
		return this.data.circleDocuments.get(id);
	}

	getAllCircleDocuments() {
		return Array.from(this.data.circleDocuments.values());
	}

	deleteCircleDocument(id) {
		if (this.data.circleDocuments.size <= 1) {
			return false; // Don't allow deleting the last document
		}

		// Remove the document
		this.data.circleDocuments.delete(id);

		// Remove all circles for this document
		this.removeCirclesForDocument(id);

		// Remove all square documents for circles in this document
		this.removeSquareDocumentsForCircleDocument(id);

		// If we deleted the current document, select another one
		if (this.data.currentCircleDocumentId === id) {
			const remaining = this.getAllCircleDocuments();
			this.data.currentCircleDocumentId = remaining.length > 0 ? remaining[0].id : null;
			this.data.currentSquareDocumentId = null; // Clear square document selection
		}

		this.saveToStorage();
		this.notify('circleDocuments', this.getAllCircleDocuments());
		this.notify('currentCircleDocument', this.getCurrentCircleDocument());
		this.notify('currentSquareDocument', null);
		return true;
	}

	setCurrentCircleDocument(id) {
		if (this.data.circleDocuments.has(id)) {
			this.data.currentCircleDocumentId = id;
			this.data.currentSquareDocumentId = null; // Clear square document selection
			this.saveToStorage();
			this.notify('currentCircleDocument', this.getCurrentCircleDocument());
			this.notify('currentSquareDocument', null);
			return true;
		}
		return false;
	}

	getCurrentCircleDocument() {
		if (!this.data.currentCircleDocumentId || !this.data.circleDocuments.has(this.data.currentCircleDocumentId)) {
			const doc = this.createCircleDocument();
			this.data.currentCircleDocumentId = doc.id;
		}
		return this.data.circleDocuments.get(this.data.currentCircleDocumentId);
	}

	getCurrentCircleDocumentId() {
		const doc = this.getCurrentCircleDocument();
		return doc ? doc.id : null;
	}

	updateCircleDocumentName(id, name) {
		const document = this.data.circleDocuments.get(id);
		if (document) {
			document.name = name;
			this.saveToStorage();
			this.notify('circleDocuments', this.getAllCircleDocuments());
			return true;
		}
		return false;
	}

	// SquareDocument Management
	generateSquareDocumentId() {
		return `squareDoc_${this.data.nextSquareDocumentId++}`;
	}

	generateUniqueSquareDocumentName(circleId, baseName = null) {
		const base = baseName || 'Square Document';
		const existingNames = new Set(this.getSquareDocumentsForCircle(circleId).map(doc => doc.name));
		
		if (!existingNames.has(base)) {
			return base;
		}
		
		let counter = 1;
		let uniqueName;
		do {
			uniqueName = `${base} (${counter})`;
			counter++;
		} while (existingNames.has(uniqueName));
		
		return uniqueName;
	}

	createSquareDocument(circleId, name = null) {
		const id = this.generateSquareDocumentId();
		const documentName = this.generateUniqueSquareDocumentName(circleId, name);
		const document = {
			id: id,
			name: documentName,
			circleId: circleId,
			createdAt: new Date().toISOString()
		};

		this.data.squareDocuments.set(id, document);
		this.saveToStorage();
		this.notify('squareDocuments', this.getSquareDocumentsForCircle(circleId));
		return document;
	}

	getSquareDocument(id) {
		return this.data.squareDocuments.get(id);
	}

	getSquareDocumentsForCircle(circleId) {
		return Array.from(this.data.squareDocuments.values()).filter(doc => doc.circleId === circleId);
	}

	getAllSquareDocuments() {
		return Array.from(this.data.squareDocuments.values());
	}

	deleteSquareDocument(id) {
		const squareDoc = this.data.squareDocuments.get(id);
		if (!squareDoc) return false;

		const remainingDocs = this.getSquareDocumentsForCircle(squareDoc.circleId);
		if (remainingDocs.length <= 1) {
			return false; // Don't allow deleting the last square document for a circle
		}

		// Remove the document
		this.data.squareDocuments.delete(id);

		// Remove all squares for this document
		this.removeSquaresForDocument(id);

		// If we deleted the current square document, select another one
		if (this.data.currentSquareDocumentId === id) {
			const remaining = this.getSquareDocumentsForCircle(squareDoc.circleId);
			this.data.currentSquareDocumentId = remaining.length > 0 ? remaining[0].id : null;
		}

		this.saveToStorage();
		this.notify('squareDocuments', this.getSquareDocumentsForCircle(squareDoc.circleId));
		this.notify('currentSquareDocument', this.getCurrentSquareDocument());
		return true;
	}

	setCurrentSquareDocument(id) {
	// Allow setting to null (for deselecting)
	if (id === null || this.data.squareDocuments.has(id)) {
		this.data.currentSquareDocumentId = id;
		this.saveToStorage();
		this.notify('currentSquareDocument', this.getCurrentSquareDocument());
		return true;
	}
	return false;
}

	getCurrentSquareDocument() {
		if (this.data.currentSquareDocumentId && this.data.squareDocuments.has(this.data.currentSquareDocumentId)) {
			return this.data.squareDocuments.get(this.data.currentSquareDocumentId);
		}
		return null;
	}

	getCurrentSquareDocumentId() {
		const doc = this.getCurrentSquareDocument();
		return doc ? doc.id : null;
	}

	updateSquareDocumentName(id, name) {
		const document = this.data.squareDocuments.get(id);
		if (document) {
			document.name = name;
			this.saveToStorage();
			this.notify('squareDocuments', this.getSquareDocumentsForCircle(document.circleId));
			return true;
		}
		return false;
	}

	// Circle Management
	generateCircleId() {
		return `circle_${this.data.nextCircleId++}`;
	}

	addCircle(circleData) {
		const circle = {
			id: circleData.id || this.generateCircleId(),
			x: circleData.x || 0,
			y: circleData.y || 0,
			name: circleData.name || '???',
			documentId: circleData.documentId || this.getCurrentCircleDocumentId()
		};

		this.data.circles.set(circle.id, circle);
		
		// Create a default square document for this circle
		const defaultSquareDoc = this.createSquareDocument(circle.id, 'Default');
		
		this.saveToStorage();
		this.notify('circles', this.getCirclesForDocument(circle.documentId));
		this.notify(`circle:${circle.id}`, circle);
		return circle;
	}

	removeCircle(id) {
		const circle = this.data.circles.get(id);
		if (circle) {
			// Remove all square documents for this circle
			this.removeSquareDocumentsForCircle(id);
			
			this.data.circles.delete(id);
			this.saveToStorage();
			this.notify('circles', this.getCirclesForDocument(circle.documentId));
			this.notify(`circle:${id}`, null);
			return true;
		}
		return false;
	}

	updateCircle(id, updates) {
		const circle = this.data.circles.get(id);
		if (circle) {
			Object.assign(circle, updates);
			this.saveToStorage();
			this.notify('circles', this.getCirclesForDocument(circle.documentId));
			this.notify(`circle:${id}`, circle);
			return circle;
		}
		return null;
	}

	getCircle(id) {
		return this.data.circles.get(id);
	}

	getAllCircles() {
		return Array.from(this.data.circles.values());
	}

	getCirclesForDocument(documentId) {
		return this.getAllCircles().filter(circle => circle.documentId === documentId);
	}

	removeCirclesForDocument(documentId) {
		const circlesToRemove = [];
		for (const [id, circle] of this.data.circles) {
			if (circle.documentId === documentId) {
				circlesToRemove.push(id);
			}
		}

		circlesToRemove.forEach(id => {
			this.removeCircle(id); // This will also remove square documents
		});

		return circlesToRemove;
	}

	// Square Management
	generateSquareId() {
		return `square_${this.data.nextSquareId++}`;
	}

	addSquare(squareData) {
		const square = {
			id: squareData.id || this.generateSquareId(),
			x: squareData.x || 0,
			y: squareData.y || 0,
			name: squareData.name || '???',
			documentId: squareData.documentId || this.getCurrentSquareDocumentId()
		};

		this.data.squares.set(square.id, square);
		this.saveToStorage();
		this.notify('squares', this.getSquaresForDocument(square.documentId));
		this.notify(`square:${square.id}`, square);
		return square;
	}

	removeSquare(id) {
		const square = this.data.squares.get(id);
		if (square) {
			this.data.squares.delete(id);
			this.saveToStorage();
			this.notify('squares', this.getSquaresForDocument(square.documentId));
			this.notify(`square:${id}`, null);
			return true;
		}
		return false;
	}

	updateSquare(id, updates) {
		const square = this.data.squares.get(id);
		if (square) {
			Object.assign(square, updates);
			this.saveToStorage();
			this.notify('squares', this.getSquaresForDocument(square.documentId));
			this.notify(`square:${id}`, square);
			return square;
		}
		return null;
	}

	getSquare(id) {
		return this.data.squares.get(id);
	}

	getAllSquares() {
		return Array.from(this.data.squares.values());
	}

	getSquaresForDocument(documentId) {
		return this.getAllSquares().filter(square => square.documentId === documentId);
	}

	removeSquaresForDocument(documentId) {
		const squaresToRemove = [];
		for (const [id, square] of this.data.squares) {
			if (square.documentId === documentId) {
				squaresToRemove.push(id);
			}
		}

		squaresToRemove.forEach(id => {
			this.data.squares.delete(id);
		});

		if (squaresToRemove.length > 0) {
			this.saveToStorage();
			this.notify('squares', this.getSquaresForDocument(documentId));
		}

		return squaresToRemove;
	}

	removeSquareDocumentsForCircle(circleId) {
		const docsToRemove = this.getSquareDocumentsForCircle(circleId);
		docsToRemove.forEach(doc => {
			this.removeSquaresForDocument(doc.id);
			this.data.squareDocuments.delete(doc.id);
		});

		if (docsToRemove.length > 0) {
			this.saveToStorage();
		}

		return docsToRemove;
	}

	removeSquareDocumentsForCircleDocument(circleDocumentId) {
		const circles = this.getCirclesForDocument(circleDocumentId);
		circles.forEach(circle => {
			this.removeSquareDocumentsForCircle(circle.id);
		});
	}

	// Helper methods
	getCurrentDate() {
		const now = new Date();
		return now.toISOString().split('T')[0];
	}

	ensureDefaultCircleDocument() {
		if (this.data.circleDocuments.size === 0) {
			const doc = this.createCircleDocument();
			this.data.currentCircleDocumentId = doc.id;
		}
	}

	// Storage methods
	saveToStorage() {
		try {
			const data = {
				circleDocuments: Array.from(this.data.circleDocuments.entries()),
				squareDocuments: Array.from(this.data.squareDocuments.entries()),
				circles: Array.from(this.data.circles.entries()),
				squares: Array.from(this.data.squares.entries()),
				currentCircleDocumentId: this.data.currentCircleDocumentId,
				currentSquareDocumentId: this.data.currentSquareDocumentId,
				nextCircleId: this.data.nextCircleId,
				nextSquareId: this.data.nextSquareId,
				nextCircleDocumentId: this.data.nextCircleDocumentId,
				nextSquareDocumentId: this.data.nextSquareDocumentId
			};
			localStorage.setItem(this.storageKey, JSON.stringify(data));
		} catch (error) {
			console.error('Failed to save to storage:', error);
		}
	}

	loadFromStorage() {
		try {
			const saved = localStorage.getItem(this.storageKey);
			if (saved) {
				const data = JSON.parse(saved);
				
				// Handle legacy data migration
				if (data.documents) {
					// Migrate old documents to circleDocuments
					this.data.circleDocuments = new Map(data.documents || []);
					this.data.currentCircleDocumentId = data.currentDocumentId;
					this.data.nextCircleDocumentId = data.nextDocumentId || 1;
				} else {
					this.data.circleDocuments = new Map(data.circleDocuments || []);
					this.data.currentCircleDocumentId = data.currentCircleDocumentId;
					this.data.nextCircleDocumentId = data.nextCircleDocumentId || 1;
				}
				
				this.data.squareDocuments = new Map(data.squareDocuments || []);
				this.data.circles = new Map(data.circles || []);
				this.data.squares = new Map(data.squares || []);
				this.data.currentSquareDocumentId = data.currentSquareDocumentId;
				this.data.nextCircleId = data.nextCircleId || 1;
				this.data.nextSquareId = data.nextSquareId || 1;
				this.data.nextSquareDocumentId = data.nextSquareDocumentId || 1;
			}
		} catch (error) {
			console.error('Failed to load from storage:', error);
		}
	}

	// Debug/utility methods
	getStats() {
		return {
			circleDocuments: this.data.circleDocuments.size,
			squareDocuments: this.data.squareDocuments.size,
			circles: this.data.circles.size,
			squares: this.data.squares.size,
			currentCircleDocument: this.data.currentCircleDocumentId,
			currentSquareDocument: this.data.currentSquareDocumentId
		};
	}

	// Clear all data (useful for testing/reset)
	clear() {
		this.data.circleDocuments.clear();
		this.data.squareDocuments.clear();
		this.data.circles.clear();
		this.data.squares.clear();
		this.data.currentCircleDocumentId = null;
		this.data.currentSquareDocumentId = null;
		this.data.nextCircleId = 1;
		this.data.nextSquareId = 1;
		this.data.nextCircleDocumentId = 1;
		this.data.nextSquareDocumentId = 1;
		this.saveToStorage();
		this.notify('circleDocuments', []);
		this.notify('squareDocuments', []);
		this.notify('circles', []);
		this.notify('squares', []);
	}

	// Legacy compatibility methods (for CircleDocuments)
	createDocument(name) { return this.createCircleDocument(name); }
	getCurrentDocument() { return this.getCurrentCircleDocument(); }
	getCurrentDocumentId() { return this.getCurrentCircleDocumentId(); }
	getAllDocuments() { return this.getAllCircleDocuments(); }
	setCurrentDocument(id) { return this.setCurrentCircleDocument(id); }
	deleteDocument(id) { return this.deleteCircleDocument(id); }
	updateDocumentName(id, name) { return this.updateCircleDocumentName(id, name); }
}
