// square.js - Square-related functionality for the Chakra Visualizer

const SquareManager = {
    // Selected square reference
    selectedSquare: null,
    
    // Create a square element
    createSquareElement: function(squareData) {
        const bottomPanel = document.getElementById('bottom-panel');
        
        // Create the square
        const square = document.createElement('div');
        square.className = 'square';
        square.dataset.id = squareData.id;
        square.dataset.circleId = squareData.circleId;
        
        // Force size to 30px regardless of what's in the data
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
	const nameElement = document.createElement('div');
	nameElement.className = 'item-name';
	nameElement.contentEditable = true;
	nameElement.textContent = squareData.name;
	nameElement.addEventListener('blur', function() {
		const newName = this.textContent;
		DataManager.updateSquareData(squareData.id, { name: newName });

		// Check if this is the closest square to its circle
		const circleElement = document.querySelector(`.circle[data-id="${squareData.circleId}"]`);
		if (circleElement) {
			const closestIndicator = circleElement.querySelector('.closest-square-indicator');
			if (closestIndicator && closestIndicator.textContent.includes('Closest:')) {
				// If the text already contains this square's old name, update it
				const circleName = circleElement.querySelector('.item-name').textContent;
				// Check if this circle's data has this square as closest
				const circleData = DataManager.data.circles.find(c => c.id === squareData.circleId);
				if (circleData && circleData.closestSquareName === this.textContent) {
					DataManager.updateCircleData(squareData.circleId, { 
						closestSquareName: newName 
					});
					closestIndicator.textContent = `Closest: ${newName}`;
				}
			}
		}
	});
	nameElement.addEventListener('keydown', function(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			this.blur();
		}
	});
	nameElement.addEventListener('click', function(e) {
		e.stopPropagation();
	});

        // Add name element to square (no buttons container anymore)
        square.appendChild(nameElement);
        
        // Track if we're actually dragging or just clicking
        let isRealDrag = false;
        
        // Add click handler for selection - only when it's a genuine click, not after dragging
        square.addEventListener('click', function(e) {
            e.stopPropagation();
            // Only select if we weren't just dragging
            if (!isRealDrag && !UIManager.wasDragged) {
                UIManager.selectItem(square);
            }
            
            // Reset drag state after handling the click
            isRealDrag = false;
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
                isRealDrag = false; // Reset at the start of potential drag
                startX = e.clientX;
                startY = e.clientY;
                square.style.zIndex = 20;
                console.log('Started dragging square', square.dataset.id);
            }
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                e.preventDefault();
                
                // Set the real drag flag once there's actual movement
                isRealDrag = true;
                
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                startX = e.clientX;
                startY = e.clientY;
                
                const currentLeft = parseInt(square.style.left) || 0;
                const currentTop = parseInt(square.style.top) || 0;
                
                // Calculate new position
                const newLeft = Math.max(0, Math.min(bottomPanel.clientWidth - square.clientWidth, currentLeft + dx));
                const newTop = Math.max(0, Math.min(bottomPanel.clientHeight - square.clientHeight, currentTop + dy));
                
                // Apply new position
                square.style.left = `${newLeft}px`;
                square.style.top = `${newTop}px`;
                
                // Update data
                DataManager.updateSquareData(square.dataset.id, { x: newLeft, y: newTop });

		ConnectionManager.updateSquareConnections(square);
                
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
                
                // If we actually dragged (moved) the square
                if (isRealDrag) {
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
                    
                    // Keep the isRealDrag flag true so the subsequent click event doesn't select
                }
                
                isDragging = false;
                square.style.zIndex = square.classList.contains('selected') ? 15 : 10;
                
                // Reset the real drag flag after a delay to allow click to process
                setTimeout(() => {
                    isRealDrag = false;
                }, 50);
            }
        });
        
        // Add to the DOM
        bottomPanel.appendChild(square);
        return square;
    }
};
