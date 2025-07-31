// Handles all DOM manipulation for a circle
class CircleView extends EventEmitter {
	constructor(model) {
		super();
		this.model = model;
		this.element = null;
		this.nameElement = null;
		this.circleElement = null;
		this.draggable = null;
		this.isSelected = false;
		this.addStyles();
		this.createElement();
	}

	addStyles() {
		const circleCSS = `
			.circle-container {
				position: absolute;
				display: flex;
				flex-direction: column;
				align-items: center;
				cursor: move;
			}

			.circle {
				width: 60px;
				height: 60px;
				border-radius: 50%;
				background-color: #4CAF50;
				border: 3px solid #45a049;
				margin-bottom: 5px;
				transition: border-color 0.2s ease, box-shadow 0.2s ease;
			}

			.circle.selected {
				border-color: #ffff00;
				box-shadow: 0 0 10px #ffff00;
			}

			.circle.highlight {
				animation: circle-highlight 1s ease-in-out;
			}

			@keyframes circle-highlight {
				0%, 100% { transform: scale(1); }
				50% { transform: scale(1.1); }
			}

			.circle-name {
				color: white;
				font-size: 14px;
				text-align: center;
				min-width: 60px;
				padding: 2px 4px;
				border-radius: 3px;
				cursor: text;
				transition: background-color 0.2s ease;
			}

			.circle-name[contenteditable="true"] {
				background-color: #333;
				outline: 1px solid #666;
			}

			.dragging {
				opacity: 0.8;
				z-index: 999;
			}
		`;
		StyleManager.addGlobalStyles(circleCSS, 'circle-view-styles');
	}

	createElement() {
		// Create main container
		this.element = document.createElement('div');
		this.element.className = 'circle-container';
		this.element.setAttribute('data-circle-id', this.model.id);
		this.updatePosition();

		// Create circle element
		this.circleElement = document.createElement('div');
		this.circleElement.className = 'circle';

		// Create name element
		this.nameElement = document.createElement('div');
		this.nameElement.className = 'circle-name';
		this.nameElement.textContent = this.model.name;

		// Set up event listeners
		this.setupEventListeners();

		// Assemble elements
		this.element.appendChild(this.circleElement);
		this.element.appendChild(this.nameElement);

		// Create draggable behavior
		this.draggable = new Draggable(this.element, (x, y) => {
			this.emit('positionChanged', { id: this.model.id, x, y });
		});

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
		if (this.circleElement) {
			if (selected) {
				this.circleElement.classList.add('selected');
			} else {
				this.circleElement.classList.remove('selected');
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
		if (this.circleElement) {
			this.circleElement.classList.add('highlight');
			setTimeout(() => {
				this.circleElement.classList.remove('highlight');
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
		this.circleElement = null;
		this.model = null;

		// Remove all event listeners (EventEmitter cleanup)
		this.listeners.clear();
	}
}
