class SquareDocumentDropdown {
	constructor(dataStore, onSquareDocumentChange) {
		this.dataStore = dataStore;
		this.onSquareDocumentChange = onSquareDocumentChange;
		this.isOpen = false;
		this.currentCircleId = null;
		this.addStyles();
		this.createElement();
		this.setupDataSubscriptions();
	}

	addStyles() {
		const dropdownCSS = `
			.square-document-selector {
				position: fixed;
				bottom: 20px;
				right: 80px;
				z-index: 1001;
			}

			.square-document-button {
				width: 50px;
				height: 50px;
				border-radius: 50%;
				background-color: #333;
				color: white;
				border: 2px solid #666;
				font-size: 20px;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.square-document-button:hover {
				background-color: #555;
			}

			.square-document-button:disabled {
				background-color: #222;
				border-color: #444;
				color: #666;
				cursor: not-allowed;
			}

			.square-document-dropdown {
				position: absolute;
				bottom: 60px;
				right: 0;
				min-width: 200px;
				background-color: #2a2a2a;
				border: 1px solid #666;
				border-radius: 8px;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
				max-height: 300px;
				overflow-y: auto;
			}

			.square-dropdown-item {
				padding: 12px 16px;
				color: white;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: space-between;
				border-bottom: 1px solid #444;
			}

			.square-dropdown-item:last-child {
				border-bottom: none;
			}

			.square-dropdown-item:hover {
				background-color: #3a3a3a;
			}

			.square-dropdown-item.selected {
				background-color: #FF6B6B;
			}

			.square-dropdown-item.new-square-document {
				color: #FF6B6B;
				font-weight: bold;
				justify-content: center;
			}

			.square-dropdown-item.new-square-document:hover {
				background-color: #FF6B6B;
				color: white;
			}

			.square-dropdown-separator {
				height: 1px;
				background-color: #666;
				margin: 4px 0;
			}

			.square-document-name {
				flex: 1;
				margin-right: 8px;
			}

			.square-edit-button, .square-delete-button {
				background: none;
				border: none;
				color: white;
				cursor: pointer;
				padding: 4px;
				margin-left: 4px;
				border-radius: 3px;
				font-size: 12px;
			}

			.square-edit-button:hover, .square-delete-button:hover {
				background-color: #555;
			}

			.square-delete-button:hover {
				background-color: #d32f2f;
			}

			.square-document-name-input {
				background-color: #444;
				border: 1px solid #666;
				color: white;
				padding: 4px 8px;
				border-radius: 3px;
				font-size: 14px;
				width: 120px;
			}

			.square-document-name-input:focus {
				outline: none;
				border-color: #FF6B6B;
			}

			.no-circle-message {
				padding: 12px 16px;
				color: #999;
				text-align: center;
				font-style: italic;
			}
		`;
		StyleManager.addGlobalStyles(dropdownCSS, 'square-document-dropdown-styles');
	}

	setupDataSubscriptions() {
		// Listen for changes to square documents
		this.dataStore.subscribe('squareDocuments', () => {
			if (this.isOpen) {
				this.updateDropdown();
			}
		});

		// Listen for circle selection changes
		this.dataStore.subscribe('currentCircleDocument', () => {
			this.updateButtonState();
		});
	}

	createElement() {
		// Create the button
		this.button = document.createElement('button');
		this.button.className = 'square-document-button';
		this.button.innerHTML = '📄';
		this.button.disabled = true; // Initially disabled
		this.button.addEventListener('click', this.toggleDropdown.bind(this));

		// Create the dropdown
		this.dropdown = document.createElement('div');
		this.dropdown.className = 'square-document-dropdown';
		this.dropdown.style.display = 'none';

		// Create container
		this.container = document.createElement('div');
		this.container.className = 'square-document-selector';
		this.container.appendChild(this.button);
		this.container.appendChild(this.dropdown);

		// Close dropdown when clicking outside
		document.addEventListener('click', (e) => {
			if (!this.container.contains(e.target)) {
				this.closeDropdown();
			}
		});

		this.updateButtonState();
		return this.container;
	}

	updateButtonState() {
		const selectedCircleId = this.getSelectedCircleId();
		const hasSelectedCircle = selectedCircleId !== null;
		
		this.button.disabled = !hasSelectedCircle;
		this.currentCircleId = selectedCircleId;
		
		if (hasSelectedCircle) {
			this.button.title = 'Manage square documents';
		} else {
			this.button.title = 'Select a circle first';
		}
	}

	getSelectedCircleId() {
		// We need to get this from the circle manager through the app controller
		// For now, we'll check if there's a current square document and get its circle
		const currentSquareDoc = this.dataStore.getCurrentSquareDocument();
		return currentSquareDoc ? currentSquareDoc.circleId : null;
	}

	toggleDropdown() {
		if (this.button.disabled) return;
		
		if (this.isOpen) {
			this.closeDropdown();
		} else {
			this.openDropdown();
		}
	}

	openDropdown() {
		if (this.button.disabled) return;
		
		this.isOpen = true;
		this.dropdown.style.display = 'block';
		this.updateDropdown();
	}

	closeDropdown() {
		this.isOpen = false;
		this.dropdown.style.display = 'none';
	}

	updateDropdown() {
		this.dropdown.innerHTML = '';

		if (!this.currentCircleId) {
			// No circle selected
			const noCircleMsg = document.createElement('div');
			noCircleMsg.className = 'no-circle-message';
			noCircleMsg.textContent = 'Select a circle first';
			this.dropdown.appendChild(noCircleMsg);
			return;
		}

		const squareDocuments = this.dataStore.getSquareDocumentsForCircle(this.currentCircleId);
		const currentSquareDocId = this.dataStore.getCurrentSquareDocumentId();

		// Add existing square documents
		squareDocuments.forEach(doc => {
			const item = document.createElement('div');
			item.className = 'square-dropdown-item';
			if (doc.id === currentSquareDocId) {
				item.classList.add('selected');
			}

			// Create document name span
			const nameSpan = document.createElement('span');
			nameSpan.textContent = doc.name;
			nameSpan.className = 'square-document-name';
			nameSpan.addEventListener('click', () => {
				this.selectSquareDocument(doc.id);
			});

			// Create edit button
			const editBtn = document.createElement('button');
			editBtn.textContent = '✏️';
			editBtn.className = 'square-edit-button';
			editBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.editSquareDocumentName(doc.id, nameSpan);
			});

			// Create delete button (only if more than one document exists)
			if (squareDocuments.length > 1) {
				const deleteBtn = document.createElement('button');
				deleteBtn.textContent = '🗑️';
				deleteBtn.className = 'square-delete-button';
				deleteBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					this.deleteSquareDocument(doc.id);
				});
				item.appendChild(deleteBtn);
			}

			item.appendChild(nameSpan);
			item.appendChild(editBtn);
			this.dropdown.appendChild(item);
		});

		// Add separator
		const separator = document.createElement('div');
		separator.className = 'square-dropdown-separator';
		this.dropdown.appendChild(separator);

		// Add "New Square Document" option
		const newDocItem = document.createElement('div');
		newDocItem.className = 'square-dropdown-item new-square-document';
		newDocItem.textContent = '+ New Square Document';
		newDocItem.addEventListener('click', () => {
			this.createNewSquareDocument();
		});
		this.dropdown.appendChild(newDocItem);
	}

	selectSquareDocument(id) {
		this.dataStore.setCurrentSquareDocument(id);
		this.closeDropdown();
		if (this.onSquareDocumentChange) {
			this.onSquareDocumentChange(id);
		}
	}

	createNewSquareDocument() {
		if (!this.currentCircleId) return;
		
		const doc = this.dataStore.createSquareDocument(this.currentCircleId);
		this.selectSquareDocument(doc.id);
	}

	editSquareDocumentName(docId, nameElement) {
		const currentName = nameElement.textContent;
		const input = document.createElement('input');
		input.type = 'text';
		input.value = currentName;
		input.className = 'square-document-name-input';

		const saveEdit = () => {
			const newName = input.value.trim() || currentName;
			this.dataStore.updateSquareDocumentName(docId, newName);
			nameElement.textContent = newName;
			nameElement.style.display = 'inline';
			input.remove();
		};

		const cancelEdit = () => {
			nameElement.style.display = 'inline';
			input.remove();
		};

		input.addEventListener('blur', saveEdit);
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				saveEdit();
			} else if (e.key === 'Escape') {
				cancelEdit();
			}
		});

		nameElement.style.display = 'none';
		nameElement.parentNode.insertBefore(input, nameElement);
		input.focus();
		input.select();
	}

	deleteSquareDocument(docId) {
		if (confirm('Are you sure you want to delete this square document? All squares in it will be removed.')) {
			if (this.dataStore.deleteSquareDocument(docId)) {
				// Update the dropdown immediately to reflect the deletion
				this.updateDropdown();
				
				// Notify about square document change
				if (this.onSquareDocumentChange) {
					this.onSquareDocumentChange(this.dataStore.getCurrentSquareDocumentId());
				}
			}
		}
	}

	updateButtonText() {
		const currentSquareDoc = this.dataStore.getCurrentSquareDocument();
		if (currentSquareDoc) {
			this.button.title = `Current square document: ${currentSquareDoc.name}`;
		}
	}

	// Method to be called when circle selection changes
	setSelectedCircleId(circleId) {
		this.currentCircleId = circleId;
		this.updateButtonState();
		if (this.isOpen) {
			this.updateDropdown();
		}
	}
}
