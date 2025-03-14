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
    
    // Create the color picker modal
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
        //colorPicker.appendChild(closeBtn);
        
        // Create color picker content
        const colorPickerContent = document.createElement('div');
        colorPickerContent.className = 'color-picker-content';
        
        // Set up simplified color families with 4 colors each
        const colorFamilies = [
            { name: "Scarlet", colors: ['#FF0050'], bg: '#FFF0F0' },
            { name: "Red", colors: ['#FF0000'], bg: '#FFF0F0' },
            { name: "Pink", colors: ['#FFAAAA'], bg: '#FFF5F7' },
            { name: "Vermilion", colors: ['#FF5234'], bg: '#FFF0F0' },
            { name: "Orange", colors: ['#FFAC00'], bg: '#FFF5F0' },
            { name: "Yellow", colors: ['#FFE700'], bg: '#FFFDF0' },
            { name: "Chartreuse", colors: ['#D0FF00'], bg: '#FFFDF0' },
            { name: "Green", colors: ['#00FF00'], bg: '#F0FFF0' },
            { name: "Aqua", colors: ['#00FFD0'], bg: '#F0FFF0' },
            { name: "Teal", colors: ['#99EEFF'], bg: '#F0FFFF' },
            { name: "Blue", colors: ['#0000FF'], bg: '#F0F8FF' },
            { name: "Purple", colors: ['#AA2BFF'], bg: '#F8F0FF' },
            { name: "Magenta", colors: ['#FF00FF'], bg: '#FFF0FF' },
            { name: "Brown", colors: ['#A52A2A'], bg: '#F8F5F0' },
            { name: "White", colors: ['#FFFFFF'], bg: '#F8F8F8' },
            { name: "Gray", colors: ['#999999'], bg: '#F8F8F8' },
            { name: "Black", colors: ['#000000'], bg: '#F8F8F8' },
        ];
        
        // Create a compact grid layout for all colors
        const colorGrid = document.createElement('div');
        colorGrid.className = 'color-grid';
        
        colorFamilies.forEach(family => {
            // Create family container
            const familyContainer = document.createElement('div');
            familyContainer.className = 'color-family';
            familyContainer.style.backgroundColor = family.bg;
            
            // Create family label
            const familyLabel = document.createElement('div');
            familyLabel.className = 'family-name';
            familyLabel.textContent = family.name;
            //familyContainer.appendChild(familyLabel);
            
            // Create color swatches container
            const swatchesContainer = document.createElement('div');
            swatchesContainer.className = 'swatches-container';
            
            // Add the 4 color swatches for this family
            family.colors.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = color;
                swatch.dataset.color = color;
                swatch.title = color;
                
                // Add click event to apply color
                swatch.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (CircleManager.selectedCircle) {
                        const selectedColor = this.dataset.color;
                        
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
                        
                        DataManager.updateCircleData(CircleManager.selectedCircle.dataset.id, { color: selectedColor });
                        
                        // Close color picker
                        colorPicker.style.display = 'none';
                    }
                });
                
                swatchesContainer.appendChild(swatch);
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
        const leftPanel = document.getElementById('left-panel');
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
        
        // Add buttons to left panel
        leftPanel.appendChild(colorChangeBtn);
        leftPanel.appendChild(deleteCircleBtn);
        
        // Create color picker
        const colorPicker = this.createColorPicker();
        
        // Add event listeners
        colorChangeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (CircleManager.selectedCircle) {
                // Show the color picker
                colorPicker.style.display = 'block';
                
                // Position the color picker
                const btnRect = colorChangeBtn.getBoundingClientRect();
                colorPicker.style.left = `${btnRect.right + 10}px`;
                colorPicker.style.top = `${btnRect.top}px`;
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
            // Delete key - delete selected item
            if (e.key === 'Delete') {
                e.preventDefault();

                // Prioritize square deletion if a square is selected
                // This makes sense because a square can only be selected when a circle is selected,
                // so the square is likely the user's current focus
                if (SquareManager.selectedSquare) {
                    const rightPanel = document.getElementById('right-panel');
                    Utils.showDeleteDialog(function() {
                        rightPanel.removeChild(SquareManager.selectedSquare);
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

    // Select an item (circle or square)
    selectItem: function(item) {
        const rightPanel = document.getElementById('right-panel');
        
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
            
            // Activate right panel content
            rightPanel.classList.add('active');
            
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
            
            // Show buttons for the selected square
            const buttons = item.querySelector('.item-buttons');
            if (buttons) {
                buttons.style.display = 'flex';
            }
            
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
        // Hide all squares first
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
    },
    
    deselectCircle: function() {
        const rightPanel = document.getElementById('right-panel');
        
        if (CircleManager.selectedCircle) {
            // Remove selected class
            CircleManager.selectedCircle.classList.remove('selected');
            
            // Reset dimming on all circles
            this.resetCircleDimming();
            
            // Hide action buttons
            this.toggleActionButtons(false);
            
            CircleManager.selectedCircle = null;
            
            // Deactivate right panel content
            rightPanel.classList.remove('active');
            
            // Hide the attribute grid 
            this.toggleAttributeGrid(false);
            
            // Hide all squares
            const allSquares = document.querySelectorAll('.square');
            allSquares.forEach(square => {
                square.style.display = 'none';
            });
            
            // Also deselect square since right panel is deactivated
            this.deselectSquare();
            
            // Disable attribute boxes since no circle is selected
            this.toggleAttributeBoxInteractivity(false);
        }
    },
    
    deselectSquare: function() {
        if (SquareManager.selectedSquare) {
            const buttons = SquareManager.selectedSquare.querySelector('.item-buttons');
            if (buttons) {
                buttons.style.display = 'none';
            }
            
            // Remove selected class
            SquareManager.selectedSquare.classList.remove('selected');
            
            SquareManager.selectedSquare = null;
        }
    },
    
    // Setup panel click handlers for deselection
    setupPanelClickHandlers: function() {
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        // Left panel click - only deselect circle
        leftPanel.addEventListener('click', function(e) {
            // Only handle clicks directly on the panel (not on children)
            if (e.target === leftPanel) {
                UIManager.deselectCircle();
            }
        });

        // Right panel click handler - only for deselection of squares
        rightPanel.addEventListener('click', function(e) {
            // Only handle clicks directly on the panel (not on children)
            if (e.target === rightPanel) {
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
        const rightPanel = document.getElementById('right-panel');
        
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
                const panelRect = rightPanel.getBoundingClientRect();
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
    }
};
