class DocumentDropdown {
	constructor(dataStore, onDocumentChange) {
		this.dataStore = dataStore;
		this.onDocumentChange = onDocumentChange;
		this.isOpen = false;
		this.addStyles();
		this.createElement();
	}

	addStyles() {
		const dropdownCSS = `
			.document-selector {
				position: fixed;
				bottom: 20px;
				left: 80px;
				z-index: 1001;
			}

			.document-button {
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

			.document-button:hover {
				background-color: #555;
			}

			.document-dropdown {
				position: absolute;
				bottom: 60px;
				left: 0;
				min-width: 200px;
				background-color: #2a2a2a;
				border: 1px solid #666;
				border-radius: 8px;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
				max-height: 300px;
				overflow-y: auto;
			}

			.dropdown-item {
				padding: 12px 16px;
				color: white;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: space-between;
				border-bottom: 1px solid #444;
			}

			.dropdown-item:last-child {
				border-bottom: none;
			}

			.dropdown-item:hover {
				background-color: #3a3a3a;
			}

			.dropdown-item.selected {
				background-color: #4CAF50;
			}

			.dropdown-item.new-document {
				color: #4CAF50;
				font-weight: bold;
				justify-content: center;
			}

			.dropdown-item.new-document:hover {
				background-color: #4CAF50;
				color: white;
			}

			.dropdown-separator {
				height: 1px;
				background-color: #666;
				margin: 4px 0;
			}

			.document-name {
				flex: 1;
				margin-right: 8px;
			}

			.edit-button, .delete-button {
				background: none;
				border: none;
				color: white;
				cursor: pointer;
				padding: 4px;
				margin-left: 4px;
				border-radius: 3px;
				font-size: 12px;
			}

			.edit-button:hover, .delete-button:hover {
				background-color: #555;
			}

			.delete-button:hover {
				background-color: #d32f2f;
			}

			.document-name-input {
				background-color: #444;
				border: 1px solid #666;
				color: white;
				padding: 4px 8px;
				border-radius: 3px;
				font-size: 14px;
				width: 120px;
			}

			.document-name-input:focus {
				outline: none;
				border-color: #4CAF50;
			}
		`;
		StyleManager.addGlobalStyles(dropdownCSS, 'document-dropdown-styles');
	}

	createElement() {
		// Create the button
		this.button = document.createElement('button');
		this.button.className = 'document-button';
		this.button.innerHTML = '📁';
		this.button.addEventListener('click', this.toggleDropdown.bind(this));

		// Create the dropdown
		this.dropdown = document.createElement('div');
		this.dropdown.className = 'document-dropdown';
		this.dropdown.style.display = 'none';

		// Create container
		this.container = document.createElement('div');
		this.container.className = 'document-selector';
		this.container.appendChild(this.button);
		this.container.appendChild(this.dropdown);

		// Close dropdown when clicking outside
		document.addEventListener('click', (e) => {
			if (!this.container.contains(e.target)) {
				this.closeDropdown();
			}
		});

		this.updateDropdown();
		return this.container;
	}

	toggleDropdown() {
		if (this.isOpen) {
			this.closeDropdown();
		} else {
			this.openDropdown();
		}
	}

	openDropdown() {
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

		const documents = this.dataStore.getAllCircleDocuments(); // Updated method name
		const currentDocId = this.dataStore.getCurrentCircleDocumentId(); // Updated method name

		// Add existing documents
		documents.forEach(doc => {
			const item = document.createElement('div');
			item.className = 'dropdown-item';
			if (doc.id === currentDocId) {
				item.classList.add('selected');
			}

			// Create document name span
			const nameSpan = document.createElement('span');
			nameSpan.textContent = doc.name;
			nameSpan.className = 'document-name';
			nameSpan.addEventListener('click', () => {
				this.selectDocument(doc.id);
			});

			// Create edit button
			const editBtn = document.createElement('button');
			editBtn.textContent = '✏️';
			editBtn.className = 'edit-button';
			editBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.editDocumentName(doc.id, nameSpan);
			});

			// Create delete button (only if more than one document exists)
			if (documents.length > 1) {
				const deleteBtn = document.createElement('button');
				deleteBtn.textContent = '🗑️';
				deleteBtn.className = 'delete-button';
				deleteBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					this.deleteDocument(doc.id);
				});
				item.appendChild(deleteBtn);
			}

			item.appendChild(nameSpan);
			item.appendChild(editBtn);
			this.dropdown.appendChild(item);
		});

		// Add separator
		const separator = document.createElement('div');
		separator.className = 'dropdown-separator';
		this.dropdown.appendChild(separator);

		// Add "New Document" option
		const newDocItem = document.createElement('div');
		newDocItem.className = 'dropdown-item new-document';
		newDocItem.textContent = '+ New Circle Document';
		newDocItem.addEventListener('click', () => {
			this.createNewDocument();
		});
		this.dropdown.appendChild(newDocItem);
	}

	selectDocument(id) {
		this.dataStore.setCurrentCircleDocument(id); // Updated method name
		this.closeDropdown();
		if (this.onDocumentChange) {
			this.onDocumentChange(id);
		}
	}

	createNewDocument() {
		const doc = this.dataStore.createCircleDocument(); // Updated method name
		this.selectDocument(doc.id);
	}

	editDocumentName(docId, nameElement) {
		const currentName = nameElement.textContent;
		const input = document.createElement('input');
		input.type = 'text';
		input.value = currentName;
		input.className = 'document-name-input';

		const saveEdit = () => {
			const newName = input.value.trim() || currentName;
			this.dataStore.updateCircleDocumentName(docId, newName); // Updated method name
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

	deleteDocument(docId) {
		if (confirm('Are you sure you want to delete this circle document? All circles and their squares will be removed.')) {
			if (this.dataStore.deleteCircleDocument(docId)) { // Updated method name
				// Update the dropdown immediately to reflect the deletion
				this.updateDropdown();
				
				// Notify about document change
				if (this.onDocumentChange) {
					this.onDocumentChange(this.dataStore.getCurrentCircleDocumentId()); // Updated method name
				}
			}
		}
	}

	updateButtonText() {
		const currentDoc = this.dataStore.getCurrentCircleDocument(); // Updated method name
		if (currentDoc) {
			this.button.title = `Current circle document: ${currentDoc.name}`;
		}
	}
}
