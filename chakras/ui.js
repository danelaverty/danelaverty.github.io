// ui.js - UI elements and interactions for the Chakra Visualizer

const UIManager = {
    // Dragging state
    isDragging: false,
    draggedElement: null,
    
    // Create the meridian line
    createMeridianLine: function() {
        const leftPanel = document.getElementById('left-panel');
        const meridianLine = document.createElement('div');
        meridianLine.id = 'meridian-line';
        meridianLine.style.position = 'absolute';
        meridianLine.style.top = '0';
        meridianLine.style.left = `${Config.meridian.x}px`;
        meridianLine.style.width = '1px';
        meridianLine.style.height = '100%';
        meridianLine.style.backgroundColor = Config.meridian.lineColor;
        meridianLine.style.zIndex = '2';
        meridianLine.style.pointerEvents = 'none';
        
        // Add the meridian line to the left panel
        leftPanel.appendChild(meridianLine);
        Utils.debugLog('Meridian line created at x=' + Config.meridian.x);
    },
    
    // Add drag functionality for positioning
    addDragFunctionality: function(element) {
        let startDrag = function(e) {
            // Only start dragging if the element is not being dragged for HTML5 drag and drop
            if (e.target === element) {
                e.preventDefault();
                UIManager.isDragging = true;
                UIManager.wasDragged = false; // Reset the dragged flag on mousedown
                UIManager.draggedElement = element;
                element.style.zIndex = 20;
                Utils.debugLog('Started positioning drag', element.dataset.id);
            }
        };
        
        element.addEventListener('mousedown', startDrag);
    },

    // Select an item (circle or square) - only when it's a true click, not a drag
    selectItem: function(item) {
        // Skip selection if we're at the end of a drag operation
        if (this.wasDragged) {
            return;
        }
        
        const bottomPanel = document.getElementById('bottom-panel');
        
        if (item.classList.contains('circle')) {
            // Deselect previously selected circle if any
            if (CircleManager.selectedCircle && CircleManager.selectedCircle !== item) {
                CircleManager.selectedCircle.classList.remove('selected');
            }
            
            CircleManager.selectedCircle = item;
            const circleId = item.dataset.id;
            
            // Add selected class for visual indication
            item.classList.add('selected');
            
            // Show action buttons
            this.toggleActionButtons(true);
            
            // Dim all other circles
            this.dimOtherCircles(circleId);
            
            // Activate bottom panel content
            bottomPanel.classList.add('active');
            
            // Show the attribute grid
            this.toggleAttributeGrid(true);
            
            // Show only squares associated with this circle
            this.showSquaresForCircle(circleId);
            
            // Enable attribute boxes since a circle is selected
            this.toggleAttributeBoxInteractivity(true);

	    ConnectionManager.updateCircleWithClosestName();
        } else if (item.classList.contains('square')) {
            // Deselect previously selected square if any
            if (SquareManager.selectedSquare && SquareManager.selectedSquare !== item) {
                const prevButtons = SquareManager.selectedSquare.querySelector('.item-buttons');
                if (prevButtons) {
                    prevButtons.style.display = 'none';
                }
                SquareManager.selectedSquare.classList.remove('selected');
            }
            
            SquareManager.selectedSquare = item;
            
            // We no longer show buttons for selected squares
            // Buttons have been removed as deletion can be handled with key press
            
            // Add selected class for visual indication
            item.classList.add('selected');
        }
    },

    createColorPicker: function() {
        // Create color picker container
        const colorPicker = document.createElement('div');
        colorPicker.id = 'color-picker';
        colorPicker.className = 'color-picker-modal';

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'color-picker-close';
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Close';
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            colorPicker.style.display = 'none';
        });
        colorPicker.appendChild(closeBtn);

        // Optional header
        const header = document.createElement('div');
        header.className = 'color-picker-header';
        header.textContent = 'Crystal Colors';
        colorPicker.appendChild(header);

        // Create color picker content
        const colorPickerContent = document.createElement('div');
        colorPickerContent.className = 'color-picker-content';

        // Set up color families with crystal names - 12 in each column
        const colorFamilies = [
        { name: "Warm Crystals", colors: [
            { color: '#FF0050', crystal: 'Ruby' },
                { color: '#FF0000', crystal: 'Garnet' },
                { color: '#FFAAAA', crystal: 'Rose Quartz' },
                { color: '#FF5234', crystal: 'Carnelian' },
                { color: '#FFAC00', crystal: 'Amber' },
                { color: '#FFE700', crystal: 'Citrine' },
                { color: '#B87333', crystal: 'Tiger\'s Eye' },
                { color: '#CD7F32', crystal: 'Sunstone' },
                { color: '#D35400', crystal: 'Fire Agate' },
                { color: '#A52A2A', crystal: 'Smoky Quartz' },
                { color: '#FFFFFF', crystal: 'Clear Quartz' },
                { color: '#FFC0CB', crystal: 'Rhodochrosite' }
            ], bg: '#FFF5F5' },

        { name: "Cool Crystals", colors: [
            { color: '#D0FF00', crystal: 'Peridot' },
            { color: '#00FF00', crystal: 'Emerald' },
            { color: '#00FFD0', crystal: 'Aquamarine' },
            { color: '#99EEFF', crystal: 'Turquoise' },
            { color: '#0000FF', crystal: 'Sapphire' },
            { color: '#AA2BFF', crystal: 'Amethyst' },
            { color: '#FF00FF', crystal: 'Sugilite' },
            { color: '#800080', crystal: 'Charoite' },
            { color: '#483D8B', crystal: 'Lapis Lazuli' },
            { color: '#999999', crystal: 'Hematite' },
            { color: '#000000', crystal: 'Obsidian' },
            { color: '#40E0D0', crystal: 'Amazonite' }
            ], bg: '#F5F5FF' }
        ];

        // Create grid for two column layout - directly use the two color families as columns
        const colorGrid = document.createElement('div');
        colorGrid.className = 'color-grid';

        // Process each color family (now just two - warm and cool)
        colorFamilies.forEach((family) => {
            // Create family container
            const familyContainer = document.createElement('div');
            familyContainer.className = 'color-family';
            familyContainer.style.backgroundColor = family.bg;

            // Create family label
            const familyLabel = document.createElement('div');
            familyLabel.className = 'family-name';
            familyLabel.textContent = family.name;
            familyContainer.appendChild(familyLabel);

            // Create color swatches container
            const swatchesContainer = document.createElement('div');
            swatchesContainer.className = 'swatches-container';

            // Add color options with crystal names on the left
            family.colors.forEach(item => {
                const colorOption = document.createElement('div');
                colorOption.className = 'color-option';

                // Create crystal name label (left)
                const crystalLabel = document.createElement('div');
                crystalLabel.className = 'crystal-name';
                crystalLabel.textContent = item.crystal;

                // Create color swatch (right)
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = item.color;
                swatch.dataset.color = item.color;
                swatch.title = `${item.crystal}: ${item.color}`;

                // Add click event to apply color
                colorOption.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (CircleManager.selectedCircle) {
                        const selectedColor = item.color;

                        // Update the glow element's background color
                        const glowElement = CircleManager.selectedCircle.querySelector('.circle-glow');
                        if (glowElement) {
                            glowElement.style.backgroundColor = selectedColor;
                        }

                        // Update particles color
                        const particles = CircleManager.selectedCircle.querySelectorAll('.particle');
                        particles.forEach(particle => {
                            particle.style.backgroundColor = selectedColor;
                        });

                        DataManager.updateCircleData(CircleManager.selectedCircle.dataset.id, { 
                            color: selectedColor,
                            crystal: item.crystal // Store the crystal name with the circle
                        });

                        // Close color picker
                        colorPicker.style.display = 'none';
                    }
                });

                // Add elements to color option
                colorOption.appendChild(crystalLabel);
                colorOption.appendChild(swatch);
                swatchesContainer.appendChild(colorOption);
            });

            familyContainer.appendChild(swatchesContainer);
            colorGrid.appendChild(familyContainer);
        });

        colorPickerContent.appendChild(colorGrid);
        colorPicker.appendChild(colorPickerContent);
        document.body.appendChild(colorPicker);

        // Hide color picker when clicking outside
        document.addEventListener('click', function(e) {
            if (colorPicker.style.display === 'block' && 
                !colorPicker.contains(e.target) && 
                e.target.id !== 'color-change-btn') {
                    colorPicker.style.display = 'none';
                }
        });

        return colorPicker;
    },
    
    // Create and add the action buttons (initially hidden)
    createActionButtons: function() {
        // Get references to the new panels
        const leftPanel = document.getElementById('left-panel');
        const topPanel = document.getElementById('top-panel');
        const addCircleBtn = document.getElementById('add-circle-btn');
        
        // Create color change button
        const colorChangeBtn = document.createElement('button');
        colorChangeBtn.id = 'color-change-btn';
        colorChangeBtn.className = 'action-btn';
        colorChangeBtn.innerHTML = '🎨'; // Color palette emoji
        colorChangeBtn.style.display = 'none'; // Initially hidden
        colorChangeBtn.title = "Change Color";
        
        // Create delete button
        const deleteCircleBtn = document.createElement('button');
        deleteCircleBtn.id = 'delete-circle-btn';
        deleteCircleBtn.className = 'action-btn';
        deleteCircleBtn.innerHTML = '🗑️'; // Trash emoji
        deleteCircleBtn.style.display = 'none'; // Initially hidden
        deleteCircleBtn.title = "Delete Circle";
        
        // Add buttons to top panel instead of left panel
        topPanel.appendChild(colorChangeBtn);
        topPanel.appendChild(deleteCircleBtn);
        
        // Create color picker
        const colorPicker = this.createColorPicker();
        
        // Add event listeners
        colorChangeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (CircleManager.selectedCircle) {
                // Show the color picker
                colorPicker.style.display = 'block';
                
                // Position the color picker near the button
                const btnRect = colorChangeBtn.getBoundingClientRect();
                
                // Position below the button
                let leftPos = btnRect.left;
                let topPos = btnRect.bottom + 10; // Position below with some offset
                
                // Make sure it stays within the viewport
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const pickerWidth = 280; // Should match the width in CSS
                const pickerHeight = Math.min(500, viewportHeight * 0.8); // Approximate max height
                
                // Adjust if would go off-screen to the right
                if (leftPos + pickerWidth > viewportWidth) {
                    leftPos = Math.max(10, viewportWidth - pickerWidth - 10);
                }
                
                // Adjust if would go off-screen at the bottom
                if (topPos + pickerHeight > viewportHeight) {
                    topPos = Math.max(10, viewportHeight - pickerHeight - 10);
                }
                
                // Apply the calculated position
                colorPicker.style.left = `${leftPos}px`;
                colorPicker.style.top = `${topPos}px`;
            }
        });
        
        deleteCircleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (CircleManager.selectedCircle) {
                Utils.showDeleteDialog(function() {
                    leftPanel.removeChild(CircleManager.selectedCircle);
                    DataManager.deleteCircleData(CircleManager.selectedCircle.dataset.id);
                    UIManager.deselectCircle();
                });
            }
        });
    },
   
    // Handle keyboard shortcuts
    setupKeyboardShortcuts: function() {
	    document.addEventListener('keydown', function(e) {
		    // Check if we're currently editing a contenteditable element
		    const activeElement = document.activeElement;
		    const isEditingContentEditable = activeElement && 
		    (activeElement.isContentEditable || 
		     activeElement.tagName.toLowerCase() === 'input' || 
		     activeElement.tagName.toLowerCase() === 'textarea');

	    // If we're editing, don't process delete key events
	    if (isEditingContentEditable) {
		    return; // Exit early - let the default behavior handle it
	    }

	    // Delete key - delete selected item
	    if (e.key === 'Delete') {
		    e.preventDefault();

		    // Prioritize square deletion if a square is selected
		    // This makes sense because a square can only be selected when a circle is selected,
		    // so the square is likely the user's current focus
		    if (SquareManager.selectedSquare) {
			    const bottomPanel = document.getElementById('bottom-panel');
			    Utils.showDeleteDialog(function() {
				    bottomPanel.removeChild(SquareManager.selectedSquare);
				    DataManager.deleteSquareData(SquareManager.selectedSquare.dataset.id);
				    UIManager.deselectSquare();
			    });
		    }
		    // If only a circle is selected
		    else if (CircleManager.selectedCircle) {
			    const leftPanel = document.getElementById('left-panel');
			    Utils.showDeleteDialog(function() {
				    leftPanel.removeChild(CircleManager.selectedCircle);
				    DataManager.deleteCircleData(CircleManager.selectedCircle.dataset.id);
				    UIManager.deselectCircle();
			    });
		    }
	    }
	    });
    },
    
    // Add drag functionality for positioning
    addDragFunctionality: function(element) {
        let startDrag = function(e) {
            // Only start dragging if the element is not being dragged for HTML5 drag and drop
            if (e.target === element) {
                e.preventDefault();
                UIManager.isDragging = true;
                UIManager.draggedElement = element;
                element.style.zIndex = 20;
                Utils.debugLog('Started positioning drag', element.dataset.id);
            }
        };
        
        element.addEventListener('mousedown', startDrag);
    },

    // Dim all circles except the selected one
    dimOtherCircles: function(selectedCircleId) {
        const allCircles = document.querySelectorAll('.circle');
        
        allCircles.forEach(circle => {
            if (circle.dataset.id !== selectedCircleId) {
                circle.classList.add('dimmed');
            } else {
                circle.classList.remove('dimmed');
            }
        });
        
        Utils.debugLog('Dimmed other circles, keeping', selectedCircleId);
    },
    
    // Reset dimming on all circles
    resetCircleDimming: function() {
        const allCircles = document.querySelectorAll('.circle');
        
        allCircles.forEach(circle => {
            circle.classList.remove('dimmed');
        });
        
        Utils.debugLog('Reset circle dimming');
    },

    // Show or hide the attribute grid
    toggleAttributeGrid: function(show) {
        const attributeGrid = document.getElementById('attribute-grid');
        if (show) {
            attributeGrid.classList.add('visible');
        } else {
            attributeGrid.classList.remove('visible');
        }
    },
    
    // Show/hide action buttons based on circle selection
    toggleActionButtons: function(show) {
        const colorChangeBtn = document.getElementById('color-change-btn');
        const deleteCircleBtn = document.getElementById('delete-circle-btn');
        
        if (colorChangeBtn && deleteCircleBtn) {
            if (show) {
                colorChangeBtn.style.display = 'flex';
                deleteCircleBtn.style.display = 'flex';
            } else {
                colorChangeBtn.style.display = 'none';
                deleteCircleBtn.style.display = 'none';
            }
        }
    },

    // Setup top panel controls
    setupTopPanelControls: function() {
        const topPanel = document.getElementById('top-panel');
        
        // Create a container for the panel title
        const titleContainer = document.createElement('div');
        titleContainer.className = 'panel-title';
        
        // Create a container for future buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'top-panel-controls';
        buttonContainer.className = 'top-panel-controls';
        
        // Add a sample button that will appear for all circles (we can add more later)
        const infoButton = document.createElement('button');
        infoButton.id = 'info-btn';
        infoButton.className = 'action-btn';
        infoButton.innerHTML = 'ℹ️'; // Info emoji
        infoButton.title = "Information";
        infoButton.style.display = 'none'; // Initially hidden, will show when circle is selected
        
        // Add event listener for the info button (just a placeholder)
        infoButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (CircleManager.selectedCircle) {
                const circleData = DataManager.data.circles.find(c => c.id === CircleManager.selectedCircle.dataset.id);
                alert(`Chakra Info: ${circleData.name}\nPosition: (${circleData.x}, ${circleData.y})\nSquares: ${DataManager.countCircleSquares(circleData.id)}`);
            }
        });
        
        // Add elements to the top panel
        buttonContainer.appendChild(infoButton);
        topPanel.appendChild(titleContainer);
        topPanel.appendChild(buttonContainer);
        
        // Add this to the toggleActionButtons method to show/hide the info button
        const originalToggleActionButtons = this.toggleActionButtons;
        this.toggleActionButtons = function(show) {
            originalToggleActionButtons.call(this, show);
            
            // Also toggle the info button
            if (infoButton) {
                infoButton.style.display = show ? 'flex' : 'none';
            }
        };
    },

    // Select an item (circle or square)
    selectItem: function(item) {
        const bottomPanel = document.getElementById('bottom-panel');
        
        if (item.classList.contains('circle')) {
            // Deselect previously selected circle if any
            if (CircleManager.selectedCircle && CircleManager.selectedCircle !== item) {
                CircleManager.selectedCircle.classList.remove('selected');
            }
            
            CircleManager.selectedCircle = item;
            const circleId = item.dataset.id;
            
            // Add selected class for visual indication
            item.classList.add('selected');
            
            // Show action buttons
            this.toggleActionButtons(true);
            
            // Dim all other circles
            this.dimOtherCircles(circleId);
            
            // Activate bottom panel content
            bottomPanel.classList.add('active');
            
            // Show the attribute grid
            this.toggleAttributeGrid(true);
            
            // Show only squares associated with this circle
            this.showSquaresForCircle(circleId);
            
            // Enable attribute boxes since a circle is selected
            this.toggleAttributeBoxInteractivity(true);
        } else if (item.classList.contains('square')) {
            // Deselect previously selected square if any
            if (SquareManager.selectedSquare && SquareManager.selectedSquare !== item) {
                const prevButtons = SquareManager.selectedSquare.querySelector('.item-buttons');
                if (prevButtons) {
                    prevButtons.style.display = 'none';
                }
                SquareManager.selectedSquare.classList.remove('selected');
            }
            
            SquareManager.selectedSquare = item;
            
                            // We no longer show buttons for selected squares
                // Buttons have been removed as deletion can be handled with key press
            
            // Add selected class for visual indication
            item.classList.add('selected');
        }
    },
    
    // Toggle attribute box interactivity
    toggleAttributeBoxInteractivity: function(enabled) {
        const attributeBoxes = document.querySelectorAll('.attribute-box');
        attributeBoxes.forEach(box => {
            if (enabled) {
                box.classList.add('interactive');
            } else {
                box.classList.remove('interactive');
            }
        });
    },
    
    // Show only squares associated with the selected circle
    showSquaresForCircle: function(circleId) {
	    // Hide all squares first, including any special Me squares
	    const allSquares = document.querySelectorAll('.square');
	    allSquares.forEach(square => {
		    square.style.display = 'none';
	    });

	    // Show only squares associated with this circle
	    const relatedSquares = document.querySelectorAll(`.square[data-circle-id="${circleId}"]`);
	    relatedSquares.forEach(square => {
		    square.style.display = 'flex';
	    });

	    // Deselect square if it's not visible
	    if (SquareManager.selectedSquare && SquareManager.selectedSquare.dataset.circleId !== circleId) {
		    this.deselectSquare();
	    }

	    // Remove any existing "Me" squares first to avoid duplicates
	    const existingMeSquares = document.querySelectorAll('.special-me-square');
	    existingMeSquares.forEach(square => {
		    if (square.dataset.circleId !== circleId) {
			    // Only remove Me squares from other circles
			    square.style.display = 'none';
		    }
	    });

	    // Create or display the special "Me" square for this circle only
	    this.createSpecialMeSquare(circleId);

	    // Update connections with proper timing
	    ConnectionManager.updateAllConnections();

	    // Force a second update after a delay to ensure everything is positioned correctly
	    setTimeout(() => {
		    // This second call helps ensure the highlight is applied after everything is rendered
		    ConnectionManager.updateAllConnections();
		    ConnectionManager.highlightShortestMeConnection();
	    }, 150);
    },
    
    deselectCircle: function() {
        const bottomPanel = document.getElementById('bottom-panel');
        
        if (CircleManager.selectedCircle) {
            // Remove selected class
            CircleManager.selectedCircle.classList.remove('selected');
            
            // Reset dimming on all circles
            this.resetCircleDimming();
            
            // Hide action buttons
            this.toggleActionButtons(false);
            
            CircleManager.selectedCircle = null;
            
            // Deactivate bottom panel content
            bottomPanel.classList.remove('active');
            
            // Hide the attribute grid 
            this.toggleAttributeGrid(false);
            
            // Hide all squares
            const allSquares = document.querySelectorAll('.square');
            allSquares.forEach(square => {
                square.style.display = 'none';
            });
	    ConnectionManager.clearAllLines();
            
            // Also deselect square since bottom panel is deactivated
            this.deselectSquare();
            
            // Disable attribute boxes since no circle is selected
            this.toggleAttributeBoxInteractivity(false);
        }
    },
    
    deselectSquare: function() {
        if (SquareManager.selectedSquare) {
            // No need to hide buttons since they've been removed
            
            // Remove selected class
            SquareManager.selectedSquare.classList.remove('selected');
            
            SquareManager.selectedSquare = null;
        }
    },
    
    // Setup panel click handlers for deselection
    setupPanelClickHandlers: function() {
        const leftPanel = document.getElementById('left-panel');
        const bottomPanel = document.getElementById('bottom-panel');
        
        // Left panel click - only deselect circle
        leftPanel.addEventListener('click', function(e) {
            // Only handle clicks directly on the panel (not on children)
            if (e.target === leftPanel) {
                UIManager.deselectCircle();
            }
        });

        // Bottom panel click handler - only for deselection of squares
        bottomPanel.addEventListener('click', function(e) {
            // Only handle clicks directly on the panel (not on children)
            if (e.target === bottomPanel) {
                // Only deselect squares
                if (SquareManager.selectedSquare) {
                    UIManager.deselectSquare();
                }
            }
        });
    },
    
    // Setup attribute boxes as creation buttons
    setupAttributeBoxCreation: function() {
        const attributeBoxes = document.querySelectorAll('.attribute-box');
        const bottomPanel = document.getElementById('bottom-panel');
        
        attributeBoxes.forEach(box => {
            box.classList.add('create-button');
            
            box.addEventListener('click', function() {
                // Only create square if a circle is selected
                if (!CircleManager.selectedCircle) {
                    Utils.debugLog('Cannot create square - no circle selected');
                    return;
                }
                
                // Get the attribute type from the box
                const attributeType = this.dataset.attribute;
                
                // Create a new square at a random position near the center
                const id = Utils.generateId();
                const panelRect = bottomPanel.getBoundingClientRect();
                const centerX = panelRect.width / 2;
                const centerY = panelRect.height / 2;
                
                // Random position within ±100px of center
                const randomOffset = () => Math.random() * 200 - 100;
                const x = Math.max(50, Math.min(panelRect.width - 100, centerX + randomOffset()));
                const y = Math.max(50, Math.min(panelRect.height - 100, centerY + randomOffset()));
                
                // Get the attribute color from the Config
                const attributeColor = Config.attributeInfo[attributeType].color;
                
                const squareData = {
                    id: id,
                    circleId: CircleManager.selectedCircle.dataset.id,
                    x: x,
                    y: y,
                    size: Config.sizes.medium.square,
                    color: attributeColor,
                    name: '???',
                    attribute: attributeType
                };
                
                // Create and add square to DOM
                const square = SquareManager.createSquareElement(squareData);
                
                // Add to data and save
                DataManager.addSquareData(squareData);
                
                // Select the new square
                UIManager.selectItem(square);
            });
        });
        
        // Initially disable attribute boxes until a circle is selected
        this.toggleAttributeBoxInteractivity(false);
        
        // Initially hide the attribute grid
        this.toggleAttributeGrid(false);
    },
    
    // Setup button handlers
    setupButtonHandlers: function() {
        const addCircleBtn = document.getElementById('add-circle-btn');
        const leftPanel = document.getElementById('left-panel');
        
        // Add circle button click handler
        addCircleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Deselect current item
            UIManager.deselectCircle();
            
            // Create a new circle at a random position near the center
            const id = Utils.generateId();
            const panelRect = leftPanel.getBoundingClientRect();
            const centerX = panelRect.width / 2;
            const centerY = panelRect.height / 2;
            
            // Random position within ±100px of center
            const randomOffset = () => Math.random() * 200 - 100;
            const x = Math.max(50, Math.min(panelRect.width - 100, centerX + randomOffset()));
            const y = Math.max(50, Math.min(panelRect.height - 100, centerY + randomOffset()));
            
            const circleData = {
                id: id,
                x: x,
                y: y,
                size: Config.sizes.medium.circle,
                color: Config.predefinedColors[0],
                name: Config.defaultName,
            };
            
            // Create and add circle to DOM
            const circle = CircleManager.createCircleElement(circleData);
            
            // Add to data and save
            DataManager.addCircleData(circleData);
            
            // Select the new circle
            UIManager.selectItem(circle);
        });
    },

    // Create the special "Me" square for a given circle
    createSpecialMeSquare: function(circleId) {
	    const bottomPanel = document.getElementById('bottom-panel');

	    // Check if a "Me" square already exists for this circle
	    const existingMeSquare = document.querySelector(`.special-me-square[data-circle-id="${circleId}"]`);
	    if (existingMeSquare) {
		    // If it exists, just make sure it's visible
		    existingMeSquare.style.display = 'flex';
		    return existingMeSquare;
	    }

	    // Create special Me square
	    const meSquare = document.createElement('div');
	    meSquare.className = 'square special-me-square';
	    meSquare.dataset.id = 'me-' + circleId; // Unique ID based on the circle
	    meSquare.dataset.circleId = circleId;

	    // Get square position from data or use default position
	    const meSquareData = DataManager.data.meSquares ? 
		    DataManager.data.meSquares.find(sq => sq.circleId === circleId) : null;

	    const meX = meSquareData ? meSquareData.x : 200;
	    const meY = meSquareData ? meSquareData.y : 200;

	    // Set position and style
	    meSquare.style.width = '30px';
	    meSquare.style.height = '30px';
	    meSquare.style.left = `${meX}px`;
	    meSquare.style.top = `${meY}px`;
	    meSquare.style.backgroundColor = '#FFCC88'; // Light skin tone color
	    meSquare.style.cursor = 'move'; // Change cursor to indicate it's draggable

	    // Add the nonbinary light skinned person emoji
	    const emojiElement = document.createElement('div');
	    emojiElement.className = 'square-content';
	    emojiElement.textContent = '🧑🏼'; // Nonbinary light skinned person emoji
	    meSquare.appendChild(emojiElement);

	    // Add name label
	    const nameElement = document.createElement('div');
	    nameElement.className = 'item-name';
	    nameElement.textContent = 'Me';
	    nameElement.contentEditable = false; // Make it non-editable
	    meSquare.appendChild(nameElement);

	    // Add special styling
	    meSquare.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
	    meSquare.style.border = '1px solid rgba(255, 255, 255, 0.7)';

	    // Add drag functionality
	    let isDragging = false;
	    let startX, startY;

	    meSquare.addEventListener('mousedown', function(e) {
		    e.preventDefault();
		    e.stopPropagation();

		    // Start dragging
		    isDragging = true;
		    startX = e.clientX;
		    startY = e.clientY;

		    // Increase z-index while dragging
		    meSquare.style.zIndex = '20';

		    // Add selected effect
		    meSquare.classList.add('selected');

		    Utils.debugLog('Started dragging Me square');
	    });

	    document.addEventListener('mousemove', function(e) {
		    if (!isDragging) return;

		    e.preventDefault();

		    // Direct position calculation instead of delta-based movement
		    const bottomPanelRect = bottomPanel.getBoundingClientRect();
		    const newLeft = e.clientX - bottomPanelRect.left - 15; // Half of width (30/2)
		    const newTop = e.clientY - bottomPanelRect.top - 15;  // Half of height

		    // Apply bounds checking
		    const boundedLeft = Math.max(0, Math.min(bottomPanelRect.width - 30, newLeft));
		    const boundedTop = Math.max(0, Math.min(bottomPanelRect.height - 30, newTop));

		    // Apply new position
		    meSquare.style.left = `${boundedLeft}px`;
		    meSquare.style.top = `${boundedTop}px`;

		    // Update data less frequently for better performance
		    if (e.movementX % 3 === 0 || e.movementY % 3 === 0) {
			    // Save to DataManager
			    DataManager.updateMeSquarePosition(circleId, boundedLeft, boundedTop);

			    // Only update connections occasionally during drag for performance
			    ConnectionManager.updateSquareConnections(meSquare);
		    }
	    });

	    document.addEventListener('mouseup', function() {
		    if (!isDragging) return;

		    isDragging = false;
		    meSquare.style.zIndex = '5';

		    // Update connections after drag is complete
		    ConnectionManager.updateAllConnections();

		    Utils.debugLog('Stopped dragging Me square');
	    });

	    // Click handler (for selection visual)
	    meSquare.addEventListener('click', function(e) {
		    e.stopPropagation();

		    // Toggle selection visual
		    if (meSquare.classList.contains('selected') && !isDragging) {
			    meSquare.classList.remove('selected');
		    } else {
			    // Deselect any other square first
			    const selectedSquares = document.querySelectorAll('.square.selected');
			    selectedSquares.forEach(sq => sq.classList.remove('selected'));

			    meSquare.classList.add('selected');
		    }

		    // Update connections
		    ConnectionManager.updateAllConnections();

		    // Explicitly force a highlight update after a short delay
		    setTimeout(() => {
			    ConnectionManager.highlightShortestMeConnection();
		    }, 50);
	    });

	    // Add to bottom panel
	    bottomPanel.appendChild(meSquare);

	    setTimeout(() => {
		    ConnectionManager.updateAllConnections();
	    }, 50);

	    return meSquare;
    }
};
