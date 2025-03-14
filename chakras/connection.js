// connection.js - Connection lines functionality for the Chakra Visualizer

const ConnectionManager = {
    // Store line elements for quick reference
    lines: {},
    
    // Track the closest square to the Me square
    closestSquareToMe: null,
    
    // Initialize the connection lines system
    initialize: function() {
        // Create a container for all lines
        const bottomPanel = document.getElementById('bottom-panel');
        const lineContainer = document.createElement('div');
        lineContainer.id = 'line-container';
        lineContainer.style.position = 'absolute';
        lineContainer.style.top = '0';
        lineContainer.style.left = '0';
        lineContainer.style.width = '100%';
        lineContainer.style.height = '100%';
        lineContainer.style.pointerEvents = 'none'; // Make sure it doesn't interfere with click events
        lineContainer.style.zIndex = '5'; // Below squares but above background
        
        // Add to bottom panel before any squares (to ensure squares are above lines)
        bottomPanel.insertBefore(lineContainer, bottomPanel.firstChild);
        
        Utils.debugLog('Connection lines system initialized');
    },
    
    // Create or update all connections for visible squares
    updateAllConnections: function() {
	    // Get all visible squares
	    const visibleSquares = Array.from(document.querySelectorAll('.square'))
		    .filter(square => square.style.display !== 'none');

	    // Clear existing lines
	    this.clearAllLines();

	    // Create lines between each pair of squares
	    for (let i = 0; i < visibleSquares.length; i++) {
		    for (let j = i + 1; j < visibleSquares.length; j++) {
			    const square1 = visibleSquares[i];
			    const square2 = visibleSquares[j];
			    this.createConnection(square1, square2);
		    }
	    }

	    // Highlight the shortest visible connection from the "Me" square
	    // Add a slight delay to ensure all lines are created and positioned first
	    setTimeout(() => {
		    this.highlightShortestMeConnection();
	    }, 50);
    },
    
    // Find and highlight the shortest visible connection from the Me square
    // and update the circle display
    highlightShortestMeConnection: function() {
	    // Find the visible Me square
	    const meSquare = Array.from(document.querySelectorAll('.special-me-square'))
		    .find(square => square.style.display !== 'none');

	    if (!meSquare) {
		    Utils.debugLog('No visible Me square found for highlighting connections');
		    return;
	    }

	    const meSquareId = meSquare.dataset.id;
	    const circleId = meSquare.dataset.circleId;
	    Utils.debugLog(`Highlighting connections for Me square: ${meSquareId}`);

	    let shortestLine = null;
	    let shortestLength = Infinity;
	    let closestSquare = null;

	    // Get maxLineLength from config
	    const maxLineLength = Config.connections ? Config.connections.maxLineLength : 100;

	    // Check all visible lines connected to the Me square
	    Object.entries(this.lines).forEach(([lineId, line]) => {
		    // Skip hidden lines
		    if (line.style.display === 'none') return;

		    // Log the line for debugging
		    Utils.debugLog(`Checking line: ${lineId}, display: ${line.style.display}, width: ${line.style.width}`);

		    // Check if this line is connected to the Me square
		    if (lineId.includes(meSquareId)) {
			    // Get the width (length) of the line
			    const lineLength = parseFloat(line.style.width);
			    Utils.debugLog(`Line ${lineId} connected to Me, length: ${lineLength}`);

			    // Only consider lines shorter than maxLineLength
			    if (lineLength <= maxLineLength && lineLength < shortestLength) {
				    shortestLength = lineLength;
				    shortestLine = line;

				    // Find the other square connected to this line
				    const squareIds = lineId.replace('line-', '').split('-');
				    const otherSquareId = squareIds[0] === meSquareId ? squareIds[1] : squareIds[0];
				    closestSquare = document.querySelector(`.square[data-id="${otherSquareId}"]`);

				    Utils.debugLog(`New shortest line found: ${lineId}, to square: ${otherSquareId}`);
			    }
		    }
	    });

	    // Remove highlight from all lines
	    Object.values(this.lines).forEach(line => {
		    line.classList.remove('connecting-line-highlight');
	    });

	    // Add highlight to the shortest line if it exists
	    if (shortestLine) {
		    shortestLine.classList.add('connecting-line-highlight');
		    Utils.debugLog(`Applied 'connecting-line-highlight' to line: ${shortestLine.id}`);
	    } else {
		    Utils.debugLog('No shortest line found to highlight');
	    }

	    // Get the circle element
	    const circleElement = document.querySelector(`.circle[data-id="${circleId}"]`);
	    if (!circleElement) return;

	    // Get or create the closest square indicator element
	    let closestIndicator = circleElement.querySelector('.closest-square-indicator');
	    if (!closestIndicator) {
		    closestIndicator = document.createElement('div');
		    closestIndicator.className = 'closest-square-indicator';
		    circleElement.appendChild(closestIndicator);
	    }

	    // If we found a closest square within range
	    if (closestSquare) {
		    // Update the closest square reference
		    this.closestSquareToMe = closestSquare;

		    // Get the name of the closest square
		    const closestName = closestSquare.querySelector('.item-name').textContent || 'Unknown';

		    // Update the indicator text - remove "Closest: " prefix
		    closestIndicator.textContent = closestName;

		    // Save to circle data
		    DataManager.updateCircleData(circleId, {
			    closestSquareName: closestName
		    });

		    Utils.debugLog(`Set closest square for circle ${circleId} to ${closestName}`);
	    } else {
		    // No square within range
		    this.closestSquareToMe = null;

		    // Clear the closest indicator
		    closestIndicator.textContent = "";
		    closestIndicator.style.display = "none";

		    // Remove from circle data
		    DataManager.updateCircleData(circleId, {
			    closestSquareName: null
		    });

		    Utils.debugLog(`No closest square within range for circle ${circleId}`);
	    }
    },
    
    // Calculate distance between two DOM elements (using their centers)
    calculateDistance: function(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();
        
        const x1 = rect1.left + rect1.width / 2;
        const y1 = rect1.top + rect1.height / 2;
        const x2 = rect2.left + rect2.width / 2;
        const y2 = rect2.top + rect2.height / 2;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // Create or update a connection between two squares
    createConnection: function(square1, square2) {
        const lineId = this.getLineId(square1.dataset.id, square2.dataset.id);
        let line = document.getElementById(lineId);
        
        // If line doesn't exist, create it
        if (!line) {
            line = document.createElement('div');
            line.id = lineId;
            line.className = 'connection-line';
            line.style.position = 'absolute';
            line.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            line.style.height = '1px';
            line.style.transformOrigin = 'left center';
            line.style.zIndex = '1';
            
            // Store reference in our lines object
            this.lines[lineId] = line;
            
            // Add to line container
            document.getElementById('line-container').appendChild(line);
        }
        
        // Update the line position
        this.updateLinePosition(square1, square2, line);
    },
    
    // Update a line's position based on the connected squares
    updateLinePosition: function(square1, square2, line) {
        const square1Rect = square1.getBoundingClientRect();
        const square2Rect = square2.getBoundingClientRect();
        const containerRect = document.getElementById('bottom-panel').getBoundingClientRect();
        
        // Calculate center points of squares relative to the container
        const x1 = square1Rect.left + square1Rect.width / 2 - containerRect.left;
        const y1 = square1Rect.top + square1Rect.height / 2 - containerRect.top;
        const x2 = square2Rect.left + square2Rect.width / 2 - containerRect.left;
        const y2 = square2Rect.top + square2Rect.height / 2 - containerRect.top;
        
        // Calculate line length and angle
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        // Get max line length from config (default to 100 if not defined)
        const maxLineLength = Config.connections ? Config.connections.maxLineLength : 100;
        
        // Hide lines that are longer than the specified max length
        if (length > maxLineLength) {
            line.style.display = 'none';
        } else {
            line.style.display = 'block';
            
            // Apply the calculated values
            line.style.width = `${length}px`;
            line.style.left = `${x1}px`;
            line.style.top = `${y1}px`;
            line.style.transform = `rotate(${angle}deg)`;
        }
    },
    
    // Update a specific square's connections
    updateSquareConnections: function(square) {
        const squareId = square.dataset.id;
        const circleId = square.dataset.circleId;
        
        // Get all other visible squares for the same circle
        const otherSquares = Array.from(document.querySelectorAll(`.square[data-circle-id="${circleId}"]`))
            .filter(otherSquare => {
                return otherSquare.dataset.id !== squareId && 
                      otherSquare.style.display !== 'none';
            });
        
        // Update connections to each other square
        otherSquares.forEach(otherSquare => {
            this.createConnection(square, otherSquare);
        });
        
        // After updating connections, refresh the shortest Me connection highlight
        // Use setTimeout to ensure all line positions are updated first
        setTimeout(() => {
            this.highlightShortestMeConnection();
        }, 10);
    },
    
    // Generate a consistent line ID for two squares
    getLineId: function(id1, id2) {
        // Sort IDs to ensure consistent order regardless of which square is first
        const sortedIds = [id1, id2].sort();
        return `line-${sortedIds[0]}-${sortedIds[1]}`;
    },
    
    // Clear all lines
    clearAllLines: function() {
        const lineContainer = document.getElementById('line-container');
        if (lineContainer) {
            lineContainer.innerHTML = '';
            this.lines = {};
        }
    },

    // Remove lines connected to a specific square
    removeSquareConnections: function(squareId) {
        Object.keys(this.lines).forEach(lineId => {
            if (lineId.includes(squareId)) {
                const line = this.lines[lineId];
                if (line && line.parentNode) {
                    line.parentNode.removeChild(line);
                }
                delete this.lines[lineId];
            }
        });
    },

    // Update the selected circle with the closest square's name
    // In connection.js
updateCircleWithClosestName: function() {
    // If no closest square is found, exit
    if (!this.closestSquareToMe) return;
    
    // Get the current circle ID from the closest square's circleId attribute
    const circleId = this.closestSquareToMe.dataset.circleId;
    if (!circleId) return;
    
    // Find the circle element
    const circleElement = document.querySelector(`.circle[data-id="${circleId}"]`);
    if (!circleElement) return;
    
    // Get the name of the closest square
    const closestName = this.closestSquareToMe.querySelector('.item-name').textContent || 'Unknown';
    
    // Update the circle data with the closest square name
    DataManager.updateCircleData(circleId, {
        closestSquareName: closestName
    });
    
    // Get or create the closest square indicator element
    let closestIndicator = circleElement.querySelector('.closest-square-indicator');
    
    if (!closestIndicator) {
        closestIndicator = document.createElement('div');
        closestIndicator.className = 'closest-square-indicator';
        circleElement.appendChild(closestIndicator);
    }
    
    // Update the indicator text
    closestIndicator.textContent = `Closest: ${closestName}`;
},

    // Clear the closest square indicator when deselecting
    clearClosestIndicator: function() {
        // We're no longer clearing the indicators when deselecting
        // This function is kept for backwards compatibility
        // Indicators should remain visible at all times, even when no circle is selected
    },

    // Initialize the connection lines and closest indicators for all circles
    updateAllCircleIndicators: function() {
	    // First update all connections to find the closest Me connection
	    this.updateAllConnections();

	    // For each circle, find its closest square
	    const circles = document.querySelectorAll('.circle');

	    // Get maxLineLength from config
	    const maxLineLength = Config.connections ? Config.connections.maxLineLength : 100;

	    circles.forEach(circle => {
		    const circleId = circle.dataset.id;

		    // Get all visible squares for this circle
		    const squares = Array.from(document.querySelectorAll(`.square[data-circle-id="${circleId}"]`))
		    .filter(square => square.style.display !== 'none');

	    // Find the Me square for this circle
	    const meSquare = document.querySelector(`.special-me-square[data-circle-id="${circleId}"]`);
	    if (!meSquare || meSquare.style.display === 'none') return;

	    // Get or create the closest square indicator element
	    let closestIndicator = circle.querySelector('.closest-square-indicator');
	    if (!closestIndicator) {
		    closestIndicator = document.createElement('div');
		    closestIndicator.className = 'closest-square-indicator';
		    circle.appendChild(closestIndicator);
	    }

	    // If no regular squares (not including Me)
	    if (squares.length <= 1) {
		    // Clear the closest indicator
		    closestIndicator.textContent = "";
		    closestIndicator.style.display = "none";

		    // Remove from circle data
		    DataManager.updateCircleData(circleId, {
			    closestSquareName: null
		    });
		    return;
	    }

	    // Find the closest visible square to the Me square
	    let closestDistance = Infinity;
	    let closestSquare = null;

	    squares.forEach(square => {
		    if (square === meSquare) return; // Skip the Me square itself

		    const distance = this.calculateDistance(square, meSquare);

		    // Only consider squares within the maxLineLength distance
		    if (distance <= maxLineLength && distance < closestDistance) {
			    closestDistance = distance;
			    closestSquare = square;
		    }
	    });

	    // Update indicator with the closest square's name if found
	    if (closestSquare) {
		    const squareName = closestSquare.querySelector('.item-name').textContent || 'Unknown';
		    closestIndicator.textContent = squareName; // Remove "Closest: " prefix
		    closestIndicator.style.display = "block";

		    // Save to circle data
		    DataManager.updateCircleData(circleId, {
			    closestSquareName: squareName
		    });
	    } else {
		    // No square within range
		    closestIndicator.textContent = "";
		    closestIndicator.style.display = "none";

		    // Remove from circle data
		    DataManager.updateCircleData(circleId, {
			    closestSquareName: null
		    });
	    }
	    });
    }
};
