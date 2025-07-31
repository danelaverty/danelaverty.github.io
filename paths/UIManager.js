class UIManager extends EventEmitter {
	constructor(dataStore) {
		super();
		this.dataStore = dataStore;
		this.documentDropdown = null;
		this.appElement = null;
		this.addButton = null;
		this.addSquareButton = null;
		this.leftContainer = null;
		this.rightContainer = null;
		this.squareDocumentDropdown = null;
		this.addStyles();
	}

	addStyles() {
		const uiCSS = `
			/* Split screen layout */
			.app-split {
    display: flex;
    width: 100vw;
    height: 100vh;
    position: fixed;  /* Add this to prevent shrinking */
    top: 0;
    left: 0;
    flex-shrink: 0;
    overflow: hidden; /* Prevent content from affecting container size */
}

.left-container {
    width: 50vw;
    height: 100vh;
    position: relative;
    background-color: #111;
    border-right: 2px solid #333;
    flex-shrink: 0;
    flex-grow: 0;
    flex-basis: 50vw;
    min-width: 50vw;  /* Add this to enforce minimum width */
    max-width: 50vw;  /* Add this to enforce maximum width */
    overflow: hidden; /* Prevent content overflow from affecting size */
}

.right-container {
    width: 50vw;
    height: 100vh;
    position: relative;
    background-color: #0a0a0a;
    flex-shrink: 0;
    flex-grow: 0;
    flex-basis: 50vw;
    min-width: 50vw;  /* Add this to enforce minimum width */
    max-width: 50vw;  /* Add this to enforce maximum width */
    overflow: hidden; /* Prevent content overflow from affecting size */
}

/* Also update the square name editing styles to be more contained */
.square-name[contenteditable="true"] {
    background-color: #333;
    outline: 1px solid #666;
    white-space: nowrap;     /* Changed from 'normal' to prevent wrapping */
    overflow: hidden;        /* Keep it contained */
    text-overflow: ellipsis; /* Handle overflow gracefully */
    min-height: 1.2em;
    max-width: 120px;        /* Enforce maximum width */
    word-break: break-all;   /* Allow breaking long words */
}

.add-button {
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #333;
    color: white;
    border: 2px solid #666;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.add-button:hover {
    background-color: #555;
}

.add-square-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 10%;
    background-color: #444;
    color: white;
    border: 2px solid #777;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.add-square-button:hover {
    background-color: #666;
}

.add-square-button:disabled {
    background-color: #222;
    border-color: #444;
    color: #666;
    cursor: not-allowed;
}

/* Container labels */
.container-label {
    position: absolute;
    top: 10px;
    left: 10px;
    color: #666;
    font-size: 12px;
    z-index: 100;
}

.right-container .container-label {
    color: #555;
}
		`;
		StyleManager.addGlobalStyles(uiCSS, 'ui-manager-styles');
	}

	initialize() {
		this.appElement = document.getElementById('app');
		this.addButton = document.getElementById('addButton');

		if (!this.appElement || !this.addButton) {
			throw new Error('Required DOM elements not found');
		}

		this.createSplitLayout();
		this.setupEventListeners();
		this.createDocumentDropdown();
		this.createSquareDocumentDropdown();
		this.createAddSquareButton();
	}

	createSplitLayout() {
		// Clear existing content
		this.appElement.innerHTML = '';

		// Create split layout
		const splitContainer = document.createElement('div');
		splitContainer.className = 'app-split';

		// Left container for circles
		this.leftContainer = document.createElement('div');
		this.leftContainer.className = 'left-container';

		// Right container for squares
		this.rightContainer = document.createElement('div');
		this.rightContainer.className = 'right-container';

		splitContainer.appendChild(this.leftContainer);
		splitContainer.appendChild(this.rightContainer);
		this.appElement.appendChild(splitContainer);

		// Re-add the original add button to the left container
		this.addButton.style.position = 'fixed';
		this.leftContainer.appendChild(this.addButton);
	}

	createAddSquareButton() {
		this.addSquareButton = document.createElement('button');
		this.addSquareButton.className = 'add-square-button';
		this.addSquareButton.innerHTML = '■';
		this.addSquareButton.title = 'Add Square';
		this.addSquareButton.disabled = true; // Initially disabled

		this.rightContainer.appendChild(this.addSquareButton);

		this.addSquareButton.addEventListener('click', () => {
			this.emit('addSquareRequested');
		});
	}

setupEventListeners() {
	// Add button click handler
	this.addButton.addEventListener('click', () => {
		this.emit('addCircleRequested');
	});

	// Global click handler for deselecting
	document.addEventListener('click', (e) => {
		const isCircle = e.target.closest('.circle-container');
		const isSquare = e.target.closest('.square-container');
		const isInLeftContainer = e.target.closest('.left-container');
		const isInRightContainer = e.target.closest('.right-container');
		
		// Deselect circles when clicking empty space in left container
		if (isInLeftContainer && !isCircle && !isSquare) {
			this.emit('deselectRequested');
		}
		
		// Deselect squares when clicking empty space in right container
		if (isInRightContainer && !isCircle && !isSquare) {
			this.emit('deselectSquareRequested');
		}
	});
}

	createDocumentDropdown() {
		this.documentDropdown = new DocumentDropdown(
			this.dataStore,
			this.handleDocumentChange.bind(this)
		);
		
		// Insert the document selector in the left container
		this.leftContainer.appendChild(this.documentDropdown.container);
	}

createSquareDocumentDropdown() {
	this.squareDocumentDropdown = new SquareDocumentDropdown(
		this.dataStore,
		this.handleSquareDocumentChange.bind(this)
	);

	
	// Insert the square document selector in the right container
	this.rightContainer.appendChild(this.squareDocumentDropdown.container);
}

	handleSquareDocumentChange(squareDocumentId) {
	this.emit('squareDocumentChanged', squareDocumentId);
	if (this.squareDocumentDropdown) {
		this.squareDocumentDropdown.updateButtonText();
	}
}

updateSquareDocumentDropdown(selectedCircleId) {
	if (this.squareDocumentDropdown) {
		this.squareDocumentDropdown.setSelectedCircleId(selectedCircleId);
	}
}

	handleDocumentChange(documentId) {
		this.emit('documentChanged', documentId);
		this.documentDropdown.updateButtonText();
	}

	addCircleToDOM(element) {
		if (!element || !this.leftContainer) {
			console.error('Cannot add circle to DOM: missing element or container');
			return;
		}
		this.leftContainer.appendChild(element);
	}

addSquareToDOM(element) {
	if (!element || !this.rightContainer) {
		console.error('Cannot add square to DOM: missing element or container');
		return;
	}
	
	// Get the current position values
	const currentLeft = parseInt(element.style.left) || 0;
	const currentTop = parseInt(element.style.top) || 0;
	
	// Get container dimensions
	const containerRect = this.rightContainer.getBoundingClientRect();
	const containerWidth = containerRect.width;
	const containerHeight = containerRect.height;
	
	// Ensure squares stay within the right container bounds
	// No need to adjust for container offset since squares are positioned relative to their container
	const constrainedLeft = Math.max(0, Math.min(currentLeft, containerWidth - 80));
	const constrainedTop = Math.max(0, Math.min(currentTop, containerHeight - 80));
	
	element.style.left = `${constrainedLeft}px`;
	element.style.top = `${constrainedTop}px`;
	
	this.rightContainer.appendChild(element);
}

	removeCircleFromDOM(element) {
		if (element && element.parentNode) {
			element.parentNode.removeChild(element);
		}
	}

	removeSquareFromDOM(element) {
		if (element && element.parentNode) {
			element.parentNode.removeChild(element);
		}
	}

	updateDocumentDropdown() {
		if (this.documentDropdown) {
			this.documentDropdown.updateButtonText();
		}
	}

	updateSquareButtonState(enabled) {
		if (this.addSquareButton) {
			this.addSquareButton.disabled = !enabled;
		}
	}

	showError(message) {
		// Simple error display - could be enhanced with a proper notification system
		console.error(message);
		// TODO: Implement user-friendly error notifications
	}

	showSuccess(message) {
		// Simple success display - could be enhanced with a proper notification system
		console.log(message);
		// TODO: Implement user-friendly success notifications
	}

	destroy() {
		// Clean up event listeners and references
		if (this.documentDropdown) {
			this.documentDropdown = null;
		}
		if (this.squareDocumentDropdown) {
		this.squareDocumentDropdown = null;
	}
		this.appElement = null;
		this.addButton = null;
		this.addSquareButton = null;
		this.leftContainer = null;
		this.rightContainer = null;
	}
}
