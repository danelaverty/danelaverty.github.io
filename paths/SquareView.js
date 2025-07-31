// Handles all DOM manipulation for a square
class SquareView extends EventEmitter {
	constructor(model) {
		super();
		this.model = model;
		this.element = null;
		this.nameElement = null;
		this.squareElement = null;
		this.draggable = null;
		this.isSelected = false;
		this.addStyles();
		this.createElement();
	}

	addStyles() {
		const squareCSS = `
			.square-container {
				position: absolute;
				display: flex;
				flex-direction: column;
				align-items: center;
				cursor: move;
			}

			.square {
				width: 60px;
				height: 60px;
				background-color: #FF6B6B;
				border: 3px solid #FF5252;
				margin-bottom: 5px;
				transition: border-color 0.2s ease, box-shadow 0.2s ease;
			}

			.square.selected {
				border-color: #ffff00;
				box-shadow: 0 0 10px #ffff00;
			}

			.square.highlight {
				animation: square-highlight 1s ease-in-out;
			}

			@keyframes square-highlight {
				0%, 100% { transform: scale(1); }
				50% { transform: scale(1.1); }
			}

			.square-name {
				color: white;
				font-size: 14px;
				text-align: center;
				min-width: 60px;
				max-width: 120px;
				padding: 2px 4px;
				border-radius: 3px;
				cursor: text;
				transition: background-color 0.2s ease;
				word-wrap: break-word;
				overflow-wrap: break-word;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.square-name[contenteditable="true"] {
				background-color: #333;
				outline: 1px solid #666;
				white-space: normal;
				overflow: visible;
				text-overflow: initial;
				min-height: 1.2em;
			}

			.dragging {
				opacity: 0.8;
				z-index: 999;
			}
		`;
		StyleManager.addGlobalStyles(squareCSS, 'square-view-styles');
	}

	createElement() {
	// Create main container
	this.element = document.createElement('div');
	this.element.className = 'square-container';
	this.element.setAttribute('data-square-id', this.model.id);
	this.updatePosition();

	// Create square element
	this.squareElement = document.createElement('div');
	this.squareElement.className = 'square';

	// Create name element
	this.nameElement = document.createElement('div');
	this.nameElement.className = 'square-name';
	this.nameElement.textContent = this.model.name;

	// Set up event listeners
	this.setupEventListeners();

	// Assemble elements
	this.element.appendChild(this.squareElement);
	this.element.appendChild(this.nameElement);

	// Create draggable behavior with container awareness
	// Find the right container as the parent container for relative positioning
	const findRightContainer = () => {
		return document.querySelector('.right-container');
	};

	this.draggable = new Draggable(this.element, (x, y) => {
		this.emit('positionChanged', { id: this.model.id, x, y });
	}, findRightContainer());

	return this.element;
}

	setupEventListeners() {
		// Click to select
		this.element.addEventListener('click', () => {
			this.emit('selected', this.model.id);
		});

		// Name editing
		this.nameElement.addEventListener('click', this.handleNameClick.bind(this));
		this.nameElement.addEventListener('blur', this.handleNameBlur.bind(this));
		this.nameElement.addEventListener('keydown', this.handleNameKeydown.bind(this));
	}

	handleNameClick(e) {
		e.stopPropagation();
		this.startNameEdit();
	}

	handleNameBlur() {
		this.finishNameEdit();
	}

	handleNameKeydown(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			this.nameElement.blur();
		} else if (e.key === 'Escape') {
			this.cancelNameEdit();
		}
	}

	startNameEdit() {
		this.nameElement.contentEditable = true;
		this.nameElement.focus();

		// Select all text
		const range = document.createRange();
		range.selectNodeContents(this.nameElement);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);

		// Store original name for potential cancellation
		this.originalName = this.model.name;
	}

	finishNameEdit() {
		this.nameElement.contentEditable = false;
		const newName = this.nameElement.textContent.trim() || '???';
		
		if (newName !== this.model.name) {
			this.emit('nameChanged', { id: this.model.id, name: newName });
		}
		
		// Update display regardless (in case of whitespace cleanup)
		this.nameElement.textContent = newName;
	}

	cancelNameEdit() {
		this.nameElement.contentEditable = false;
		this.nameElement.textContent = this.originalName;
		delete this.originalName;
	}

	// Update methods called when model changes
	updateFromModel(model) {
		this.model = model;
		this.updatePosition();
		this.updateName();
	}

	updatePosition() {
		if (this.element) {
			this.element.style.left = `${this.model.x}px`;
			this.element.style.top = `${this.model.y}px`;
		}
	}

	updateName() {
		if (this.nameElement && this.nameElement.contentEditable !== 'true') {
			this.nameElement.textContent = this.model.name;
		}
	}

	setSelected(selected) {
		this.isSelected = selected;
		if (this.squareElement) {
			if (selected) {
				this.squareElement.classList.add('selected');
			} else {
				this.squareElement.classList.remove('selected');
			}
		}
	}

	getSelected() {
		return this.isSelected;
	}

	// Utility methods
	getBounds() {
		if (this.element) {
			return this.element.getBoundingClientRect();
		}
		return null;
	}

	focus() {
		if (this.element) {
			this.element.focus();
		}
	}

	// Animation methods
	highlight(duration = 1000) {
		if (this.squareElement) {
			this.squareElement.classList.add('highlight');
			setTimeout(() => {
				this.squareElement.classList.remove('highlight');
			}, duration);
		}
	}

	// Cleanup
	destroy() {
		// Remove from DOM
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}

		// Clean up draggable
		if (this.draggable) {
			this.draggable = null;
		}

		// Clear references
		this.element = null;
		this.nameElement = null;
		this.squareElement = null;
		this.model = null;

		// Remove all event listeners (EventEmitter cleanup)
		this.listeners.clear();
	}
}
