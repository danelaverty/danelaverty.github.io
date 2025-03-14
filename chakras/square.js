// square.js - Square-related functionality for the Chakra Visualizer

const SquareManager = {
    // Selected square reference
    selectedSquare: null,
    
    // Create a square element
    createSquareElement: function(squareData) {
        const rightPanel = document.getElementById('right-panel');
        
        // Create the square
        const square = document.createElement('div');
        square.className = 'square';
        square.dataset.id = squareData.id;
        square.dataset.circleId = squareData.circleId;
        
        // Force size to 20px regardless of what's in the data
        const squareSize = 30;
        
        // Set position and styling
        square.style.width = `${squareSize}px`;
        square.style.height = `${squareSize}px`;
        square.style.left = `${squareData.x}px`;
        square.style.top = `${squareData.y}px`;
        square.style.backgroundColor = squareData.color;
        
        // Add attribute emoji if it exists
        if (squareData.attribute && Config.attributeInfo[squareData.attribute]) {
            console.log('Adding initial attribute:', squareData.attribute);
            const squareContent = document.createElement('div');
            squareContent.className = 'square-content';
            squareContent.textContent = Config.attributeInfo[squareData.attribute].emoji;
            square.appendChild(squareContent);
        }
        
        // Create name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'item-name';
        nameInput.value = squareData.name;
        nameInput.addEventListener('blur', function() {
            DataManager.updateSquareData(squareData.id, { name: this.value });
        });
        nameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
        nameInput.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Create buttons container (initially hidden)
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'item-buttons';
        buttonsContainer.style.display = 'none';
        
        // Random color button
        const colorButton = document.createElement('button');
        colorButton.className = 'item-button';
        colorButton.textContent = 'Color';
        colorButton.addEventListener('click', function(e) {
            e.stopPropagation();
            const randomColor = Config.predefinedColors[Math.floor(Math.random() * Config.predefinedColors.length)];
            square.style.backgroundColor = randomColor;
            DataManager.updateSquareData(squareData.id, { color: randomColor });
        });
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'item-button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function(e) {
            e.stopPropagation();
            Utils.showDeleteDialog(function() {
                rightPanel.removeChild(square);
                DataManager.deleteSquareData(squareData.id);
                
                if (SquareManager.selectedSquare === square) {
                    UIManager.deselectSquare();
                }
            });
        });
        
        // Add buttons to container
        buttonsContainer.appendChild(colorButton);
        buttonsContainer.appendChild(deleteButton);
        
        // Add elements to square
        square.appendChild(buttonsContainer);
        square.appendChild(nameInput);
        
        // Add click handler for selection
        square.addEventListener('click', function(e) {
            e.stopPropagation();
            UIManager.selectItem(square);
        });
        
        // Custom drag functionality with attribute box detection
        let isDragging = false;
        let currentHoverBox = null;
        let startX, startY;
        
        square.addEventListener('mousedown', function(e) {
            // Only start dragging if it's a direct click on the square (not on children)
            if (e.target === square) {
                e.preventDefault();
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                square.style.zIndex = 20;
                console.log('Started dragging square', square.dataset.id);
            }
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                e.preventDefault();
                
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                startX = e.clientX;
                startY = e.clientY;
                
                const currentLeft = parseInt(square.style.left) || 0;
                const currentTop = parseInt(square.style.top) || 0;
                
                // Calculate new position
                const newLeft = Math.max(0, Math.min(rightPanel.clientWidth - square.clientWidth, currentLeft + dx));
                const newTop = Math.max(0, Math.min(rightPanel.clientHeight - square.clientHeight, currentTop + dy));
                
                // Apply new position
                square.style.left = `${newLeft}px`;
                square.style.top = `${newTop}px`;
                
                // Update data
                DataManager.updateSquareData(square.dataset.id, { x: newLeft, y: newTop });
                
                // Check if over an attribute box
                const squareRect = square.getBoundingClientRect();
                let hoveredBox = null;
                
                // Get all attribute boxes
                const attributeBoxes = document.querySelectorAll('.attribute-box');
                
                // Check each attribute box for intersection
                attributeBoxes.forEach(box => {
                    const boxRect = box.getBoundingClientRect();
                    
                    // Simple intersection check
                    if (squareRect.left < boxRect.right && 
                        squareRect.right > boxRect.left &&
                        squareRect.top < boxRect.bottom &&
                        squareRect.bottom > boxRect.top) {
                        hoveredBox = box;
                    }
                });
                
                // Update highlight
                if (currentHoverBox && currentHoverBox !== hoveredBox) {
                    currentHoverBox.classList.remove('highlight');
                }
                
                if (hoveredBox) {
                    hoveredBox.classList.add('highlight');
                    console.log('Hovering over', hoveredBox.dataset.attribute);
                }
                
                currentHoverBox = hoveredBox;
            }
        });
        
        document.addEventListener('mouseup', function(e) {
            if (isDragging) {
                console.log('Stopped dragging square', square.dataset.id);
                
                // Check if we're over an attribute box
                if (currentHoverBox) {
                    const attributeType = currentHoverBox.dataset.attribute;
                    console.log('Dropping on', attributeType);
                    
                    // Apply the attribute
                    AttributeManager.applyAttribute(square, attributeType);
                    
                    // Remove highlight
                    currentHoverBox.classList.remove('highlight');
                    currentHoverBox = null;
                }
                
                isDragging = false;
                square.style.zIndex = square.classList.contains('selected') ? 15 : 10;
            }
        });
        
        // Add to the DOM
        rightPanel.appendChild(square);
        return square;
    }
};
