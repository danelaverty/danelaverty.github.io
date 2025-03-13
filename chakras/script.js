// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // ===== ELEMENT REFERENCES =====
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const addCircleBtn = document.getElementById('add-circle-btn');
    const addSquareBtn = document.getElementById('add-square-btn');
    const dialogOverlay = document.getElementById('dialog-overlay');
    const dialogConfirm = document.getElementById('dialog-confirm');
    const dialogCancel = document.getElementById('dialog-cancel');
    const attributeBoxes = document.querySelectorAll('.attribute-box');
    const debugPanel = document.getElementById('debug-panel');
    
    // ===== STATE VARIABLES =====
    let selectedCircle = null;
    let selectedSquare = null;
    let isDragging = false;
    let draggedElement = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let data = {
        circles: [],
        squares: []
    };
    
    // ===== CONFIG =====
    const predefinedColors = [
        '#FF0000', // Red
        '#FF7F00', // Orange
        '#FFFF00', // Yellow
        '#00FF00', // Green
        '#0000FF', // Blue
        '#4B0082', // Indigo
        '#9400D3', // Violet
        '#FF1493', // Pink
        '#00FFFF', // Cyan
        '#FFFFFF'  // White
    ];

    const chakraForms = [
	    [{ sides: 3, starFactor: 1, borderPercent: .20 }],
	    [{ sides: 3, starFactor: 1, borderPercent: .18 }, { sides: 3, starFactor: 1, borderPercent: .18, rotate: 60 }],
	    [{ sides: 4, starFactor: 1, borderPercent: .12 }, { sides: 4, starFactor: 1, borderPercent: .12, rotate: 45 }],
	    //[{ sides: 7, starFactor: 2, borderPercent: .12 }],
	    [{ sides: 5, starFactor: 1, borderPercent: .10 }, { sides: 5, starFactor: 1, borderPercent: .10, rotate: 36 }],
	    [{ sides: 11, starFactor: 3, borderPercent: .12 }],
	    [{ sides: 9, starFactor: 2, borderPercent: .12, scale: 0.8 }, { sides: 9, starFactor: 2, borderPercent: .08, reverse: 1, scale: 1.2, spinTime: 64 }],
	    [{ sides: 17, starFactor: 2, borderPercent: .08 }, { sides: 17, starFactor: 2, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }],
	    [{ sides: 21, starFactor: 8, borderPercent: .08 }, { sides: 17, starFactor: 4, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }],
	    [{ sides: 21, starFactor: 8, borderPercent: .08 }, { sides: 17, starFactor: 4, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }, { sides: 25, starFactor: 4, borderPercent: .02, scale: 1.5, spinTime: 64 }],
	    [{ sides: 30, starFactor: 1, borderPercent: .18 }, { sides: 61, starFactor: 23, borderPercent: .01, reverse: 1, scale: 3.4, spinTime: 32 }],
    ];
    
    const attributeInfo = {
	    ally: { emoji: '🧝🏻‍♂️', color: '#FF8C00' },
	    key: { emoji: '🔑', color: '#8B4513' },
	    door: { emoji: '🚪', color: '#FF0000' },
	    treasure: { emoji: '💎', color: '#0000FF' },
	    demon: { emoji: '😈', color: '#663399' },
	    sword: { emoji: '🗡️', color: '#C0C0C0' }
    };
    
    const sizes = {
        small: { circle: 30, square: 30 },
        medium: { circle: 30, square: 30 }, // Force medium to be 30 as well
        large: { circle: 30, square: 30 }   // Force large to be 30 as well
    };

    // ===== UTILITY FUNCTIONS =====
    
    function formatPolyPoint(val) {
	    return (Math.round(10000 * ((val + 1) / 2)) / 100) + '%';
    }

    function getPolyPoints(sides, starFactor, borderPercent) {
	    if (!starFactor) { starFactor = 1; }
	    if (!borderPercent) { borderPercent = .08; }
	    var t = this;
	    var eachAngle = 360 * starFactor / sides;
	    var angles = [];
	    for (var i = 0; i < sides; i++) {
		    angles.push(eachAngle * i);
	    }

	    var coordinates = [];
	    angles.forEach(function(angle) {
		    var radians = angle * (Math.PI / 180);
		    var xVal = Math.cos(radians);
		    var yVal = Math.sin(radians);
		    coordinates.push({ x: xVal, y: yVal });
	    });
	    coordinates.push({ ...coordinates[0] });

	    var reverseShrunkCoordinates = [];
	    coordinates.forEach(function(coordinate) {
		    reverseShrunkCoordinates.push({ x: coordinate.x * (1 - borderPercent), y: coordinate.y * (1 - borderPercent) });
	    });
	    for (var i = reverseShrunkCoordinates.length - 1; i >= 0; i--) {
		    coordinates.push(reverseShrunkCoordinates[i]);
	    }

	    var coordinatesString = '';
	    coordinates.forEach(function(coordinate) {
		    coordinatesString += formatPolyPoint(coordinate.x) + ' ' + formatPolyPoint(coordinate.y) + ', '
	    });
	    return 'polygon(' + coordinatesString.substring(0, coordinatesString.length - 2) + ')';
    }

    // Add logging to help debug issues
    function debugLog(message, data) {
        console.log(`[DEBUG] ${message}`, data || '');
        
        // Also update debug panel
        if (debugPanel) {
            const logEntry = document.createElement('div');
            logEntry.textContent = `${message}: ${data ? JSON.stringify(data) : ''}`;
            debugPanel.appendChild(logEntry);
            
            // Keep only the last 10 entries
            while (debugPanel.childElementCount > 10) {
                debugPanel.removeChild(debugPanel.firstChild);
            }
            
            // Scroll to bottom
            debugPanel.scrollTop = debugPanel.scrollHeight;
        }
    }
    
    // Generate a unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // Count squares associated with a circle
    function countCircleSquares(circleId) {
        return data.squares.filter(square => square.circleId === circleId).length;
    }

    // Get chakra form based on square count
    function getChakraFormForCircle(circleId) {
        const squareCount = countCircleSquares(circleId);
        // Get the chakra form index based on square count, with a fallback to the last form if count exceeds array length
        const formIndex = Math.min(squareCount, chakraForms.length - 1);
        debugLog(`Circle ${circleId} has ${squareCount} squares, using chakraForm[${formIndex}]`);
        return chakraForms[formIndex];
    }

    // Update the chakra form for a circle
    function updateChakraFormForCircle(circleId) {
        const circle = document.querySelector(`.circle[data-id="${circleId}"]`);
        if (!circle) return;

        const chakraFormElement = getChakraFormForCircle(circleId);
        
        // Remove existing polygon container
        const existingPolygonContainer = circle.querySelector('.outer-polygon-container');
        if (existingPolygonContainer) {
            circle.removeChild(existingPolygonContainer);
        }
        
        // Create new polygon container
        const outerPolygonContainerElement = document.createElement('div');
        outerPolygonContainerElement.className = 'outer-polygon-container';

        chakraFormElement.forEach(function(chakraForm) {
            const innerPolygonContainerElement = document.createElement('div');
            innerPolygonContainerElement.className = 'inner-polygon-container';
            innerPolygonContainerElement.style.transform = 
                'rotate(' + (chakraForm.rotate || 0) + 'deg) ' +
                'scale(' + (chakraForm.scale || 1) + ')';

            const innermostPolygonContainerElement = document.createElement('div');
            innermostPolygonContainerElement.className = 'inner-polygon-container';
            innermostPolygonContainerElement.style.filter = 'drop-shadow(0 0 3px #AAA)';
            innermostPolygonContainerElement.style.mixBlendMode = 'screen';
            innermostPolygonContainerElement.style.animation = (chakraForm.reverse ? 'anglerev' : 'angle') + ' ' + (chakraForm.spinTime || 16) + 's linear infinite';

            const shapeElement = document.createElement('div');
            shapeElement.className = 'shape';
            shapeElement.style.clipPath = getPolyPoints(chakraForm.sides, chakraForm.starFactor, chakraForm.borderPercent);
            innermostPolygonContainerElement.appendChild(shapeElement);

            innerPolygonContainerElement.appendChild(innermostPolygonContainerElement);
            outerPolygonContainerElement.appendChild(innerPolygonContainerElement);
        });
        
        circle.appendChild(outerPolygonContainerElement);
        debugLog(`Updated chakra form for circle ${circleId}`);
    }

    // ===== DATA MANAGEMENT =====
    
    // Load data from localStorage
    function loadData() {
        const savedData = localStorage.getItem('chakraVisualizerData');
        if (savedData) {
            try {
                data = JSON.parse(savedData);
                debugLog('Loading saved data', { circles: data.circles.length, squares: data.squares.length });
                
                // Render saved circles
                data.circles.forEach(circleData => {
                    createCircleElement(circleData);
                });
                
                // Render saved squares (they'll be hidden initially)
                data.squares.forEach(squareData => {
                    createSquareElement(squareData);
                });
                
                // Hide all squares initially
                const allSquares = document.querySelectorAll('.square');
                allSquares.forEach(square => {
                    square.style.display = 'none';
                });
                
                debugLog('Loaded data successfully');
            } catch (e) {
                console.error("Error loading saved data:", e);
                debugLog("Error loading saved data", e.message);
            }
        } else {
            debugLog('No saved data found');
        }
    }

    // Save data to localStorage
    function saveData() {
        localStorage.setItem('chakraVisualizerData', JSON.stringify(data));
    }

    function addCircleData(circleData) {
        data.circles.push(circleData);
        saveData();
    }

    function updateCircleData(id, updates) {
        const index = data.circles.findIndex(circle => circle.id === id);
        if (index !== -1) {
            data.circles[index] = { ...data.circles[index], ...updates };
            saveData();
        }
    }

    function deleteCircleData(id) {
        data.circles = data.circles.filter(circle => circle.id !== id);
        saveData();
    }

    function addSquareData(squareData) {
        data.squares.push(squareData);
        saveData();
	updateChakraFormForCircle(squareData.circleId);
    }

    function updateSquareData(id, updates) {
        const index = data.squares.findIndex(square => square.id === id);
        if (index !== -1) {
            data.squares[index] = { ...data.squares[index], ...updates };
            saveData();
        }
    }

    function deleteSquareData(id) {
        data.squares = data.squares.filter(square => square.id !== id);
        saveData();
    }

    // ===== ATTRIBUTE FUNCTIONALITY =====
    
    // Apply an attribute to a square - simplified direct approach
    function applyAttribute(square, attributeName) {
        debugLog('Applying attribute', { squareId: square.dataset.id, attribute: attributeName });
        
        // Get the attribute info
        const attributeData = attributeInfo[attributeName];
        if (!attributeData) {
            debugLog('Unknown attribute', attributeName);
            return;
        }
        
        // 1. Change background color
        square.style.backgroundColor = attributeData.color;
        debugLog('Changed background color to', attributeData.color);
        
        // 2. Remove any existing emoji
        const existingEmoji = square.querySelector('.square-content');
        if (existingEmoji) {
            square.removeChild(existingEmoji);
            debugLog('Removed existing emoji');
        }
        
        // 3. Add new emoji
        const emojiElement = document.createElement('div');
        emojiElement.className = 'square-content';
        emojiElement.textContent = attributeData.emoji;
        square.appendChild(emojiElement);
        debugLog('Added new emoji', attributeData.emoji);
        
        // 4. Update data store
        updateSquareData(square.dataset.id, {
            attribute: attributeName,
            color: attributeData.color
        });
        debugLog('Updated square data');
        
        // Logging final state for verification
        debugLog('Square final state', {
            id: square.dataset.id,
            backgroundColor: square.style.backgroundColor,
            hasEmoji: !!square.querySelector('.square-content'),
            emojiContent: square.querySelector('.square-content')?.textContent
        });
    }
    
    // Add the silhouette image as an actual DOM element instead of a CSS background
    function addSilhouetteImage() {
        const silhouette = document.createElement('img');
        silhouette.src = 'body-silhouette-white.png';
        silhouette.id = 'body-silhouette';
        silhouette.style.position = 'absolute';
        silhouette.style.top = '40px';
        silhouette.style.left = '40px';
        silhouette.style.height = '600px';
        silhouette.style.opacity = '0.3';
        silhouette.style.pointerEvents = 'none';
        silhouette.style.zIndex = '1';
        
        // Add to the left panel
        leftPanel.appendChild(silhouette);
        console.log('Silhouette image added as DOM element');
    }
    
    // We don't need the separate drop zone setup anymore
    function setupDropZones() {
        console.log('Drop zones are now handled directly in the dragging code');
    }

    // Make a square draggable with a direct approach
    function makeSquareDraggable(square) {
        // First remove any existing event listeners to avoid duplicates
        const newSquare = document.createElement('div');
        
        // Copy all attributes from the original square
        for (let i = 0; i < square.attributes.length; i++) {
            const attr = square.attributes[i];
            newSquare.setAttribute(attr.name, attr.value);
        }
        
        // Copy innerHTML to preserve content
        newSquare.innerHTML = square.innerHTML;
        
        // Replace the old square with the new one
        if (square.parentNode) {
            square.parentNode.replaceChild(newSquare, square);
        }
        
        // Add new drag handlers
        newSquare.addEventListener('dragstart', function(event) {
            console.log('Dragstart with ID:', this.dataset.id);
            
            // Set the drag data in BOTH formats to ensure compatibility
            event.dataTransfer.setData('text', this.dataset.id);
            event.dataTransfer.setData('text/plain', this.dataset.id);
            
            // Also set a global variable as a backup
            window.lastDraggedSquareId = this.dataset.id;
            
            // Make sure the data was actually set
            const testData = event.dataTransfer.getData('text/plain');
            console.log('Drag data set successfully:', testData || 'FAILED');
        });
        
        // Re-add click handler
        newSquare.addEventListener('click', function(e) {
            e.stopPropagation();
            selectItem(this);
        });
        
        // Add the other button click handlers that were in the original square
        const nameInput = newSquare.querySelector('.item-name');
        if (nameInput) {
            nameInput.addEventListener('blur', function() {
                updateSquareData(newSquare.dataset.id, { name: this.value });
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
        }
        
        // Re-add button event listeners
        const colorBtn = newSquare.querySelector('.item-button:nth-child(1)');
        if (colorBtn) {
            colorBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const randomColor = predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
                newSquare.style.backgroundColor = randomColor;
                updateSquareData(newSquare.dataset.id, { color: randomColor });
            });
        }
        
        const sizeBtn = newSquare.querySelector('.item-button:nth-child(2)');
        if (sizeBtn) {
            sizeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                let currentSize = parseInt(newSquare.style.width, 10);
                let newSize;
                
                if (currentSize === sizes.small.square) {
                    newSize = sizes.medium.square;
                } else if (currentSize === sizes.medium.square) {
                    newSize = sizes.large.square;
                } else {
                    newSize = sizes.small.square;
                }
                
                newSquare.style.width = `${newSize}px`;
                newSquare.style.height = `${newSize}px`;
                updateSquareData(newSquare.dataset.id, { size: newSize });
            });
        }
        
        const deleteBtn = newSquare.querySelector('.item-button:nth-child(3)');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                showDeleteDialog(function() {
                    rightPanel.removeChild(newSquare);
                    deleteSquareData(newSquare.dataset.id);
                    
                    if (selectedSquare === newSquare) {
                        deselectSquare();
                    }
                });
            });
        }
        
        // Add drag functionality for positioning
        addDragFunctionality(newSquare);
        
        return newSquare;
    }

    // ===== ELEMENT CREATION =====
    
    // Create a circle element
    function createCircleElement(circleData) {
        const circle = document.createElement('div');
        circle.className = 'circle'; 
        circle.dataset.id = circleData.id;
        
        // Force size to 20px regardless of what's in the data
        const circleSize = 20;
        
        circle.style.width = `${circleSize}px`;
        circle.style.height = `${circleSize}px`;
        circle.style.left = `${circleData.x}px`;
        circle.style.top = `${circleData.y}px`;
        
        // Create the glowing background element
        const glowElement = document.createElement('div');
        glowElement.className = 'circle-glow';
        glowElement.style.backgroundColor = circleData.color;
        
        // Add the glow element as the first child
        circle.appendChild(glowElement);
        
        const particlesElement = document.createElement('div');
        particlesElement.className = 'particles';
        circle.appendChild(particlesElement);

	const angleElement = document.createElement('div');
	angleElement.className = 'angle';
	const positionElement = document.createElement('div');
	positionElement.className = 'position';
	const pulseElement = document.createElement('div');
	pulseElement.className = 'pulse';
	const particleElement = document.createElement('div');
	particleElement.className = 'particle';
        particleElement.style.backgroundColor = circleData.color;

	pulseElement.appendChild(particleElement);
	positionElement.appendChild(pulseElement);
	angleElement.appendChild(positionElement);
	particlesElement.appendChild(angleElement);
	particlesElement.appendChild(angleElement.cloneNode(true));

	const chakraFormElement = getChakraFormForCircle(circleData.id);
	const outerPolygonContainerElement = document.createElement('div');
	outerPolygonContainerElement.className = 'outer-polygon-container';

	chakraFormElement.forEach(function(chakraForm) {
		const innerPolygonContainerElement = document.createElement('div');
		innerPolygonContainerElement.className = 'inner-polygon-container';
		innerPolygonContainerElement.style.transform = 
			'rotate(' + (chakraForm.rotate || 0) + 'deg) ' +
			'scale(' + (chakraForm.scale || 1) + ')';

		const innermostPolygonContainerElement = document.createElement('div');
		innermostPolygonContainerElement.className = 'inner-polygon-container';
		innermostPolygonContainerElement.style.filter = 'drop-shadow(0 0 3px #AAA)';
		innermostPolygonContainerElement.style.mixBlendMode = 'screen';
		innermostPolygonContainerElement.style.animation = (chakraForm.reverse ? 'anglerev' : 'angle') + ' ' + (chakraForm.spinTime || 16) + 's linear infinite';

		const shapeElement = document.createElement('div');
		shapeElement.className = 'shape';
		shapeElement.style.clipPath = getPolyPoints(chakraForm.sides, chakraForm.starFactor, chakraForm.borderPercent);
		innermostPolygonContainerElement.appendChild(shapeElement);

		innerPolygonContainerElement.appendChild(innermostPolygonContainerElement);
		outerPolygonContainerElement.appendChild(innerPolygonContainerElement);
	});
	circle.appendChild(outerPolygonContainerElement);

        // Create name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'item-name';
        nameInput.value = circleData.name;
        nameInput.addEventListener('blur', function() {
            updateCircleData(circleData.id, { name: this.value });
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
            const randomColor = predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
            
            // Update the glow element's background color
            const glowElement = circle.querySelector('.circle-glow');
            if (glowElement) {
                glowElement.style.backgroundColor = randomColor;
            }
            
            updateCircleData(circleData.id, { color: randomColor });
        });
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'item-button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function(e) {
            e.stopPropagation();
            showDeleteDialog(function() {
                leftPanel.removeChild(circle);
                deleteCircleData(circleData.id);
                
                if (selectedCircle === circle) {
                    deselectCircle();
                }
            });
        });
        
        // Add buttons to container
        buttonsContainer.appendChild(colorButton);
        buttonsContainer.appendChild(deleteButton);
        
        // Add elements to circle
        circle.appendChild(buttonsContainer);
        circle.appendChild(nameInput);
        
        // Click handler for selection
        circle.addEventListener('click', function(e) {
            e.stopPropagation();
            selectItem(circle);
        });
        
        // Add drag functionality
        addDragFunctionality(circle, function(x, y) {
            updateCircleData(circleData.id, { x, y });
        });
        
        leftPanel.appendChild(circle);
        return circle;
    }

    // Create a square element with custom dragging only
    function createSquareElement(squareData) {
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
        if (squareData.attribute && attributeInfo[squareData.attribute]) {
            console.log('Adding initial attribute:', squareData.attribute);
            const squareContent = document.createElement('div');
            squareContent.className = 'square-content';
            squareContent.textContent = attributeInfo[squareData.attribute].emoji;
            square.appendChild(squareContent);
        }
        
        // Create name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'item-name';
        nameInput.value = squareData.name;
        nameInput.addEventListener('blur', function() {
            updateSquareData(squareData.id, { name: this.value });
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
            const randomColor = predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
            square.style.backgroundColor = randomColor;
            updateSquareData(squareData.id, { color: randomColor });
        });
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'item-button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function(e) {
            e.stopPropagation();
            showDeleteDialog(function() {
                rightPanel.removeChild(square);
                deleteSquareData(squareData.id);
                
                if (selectedSquare === square) {
                    deselectSquare();
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
            selectItem(square);
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
                updateSquareData(square.dataset.id, { x: newLeft, y: newTop });
                
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
                    try {
                        // Get attribute info
                        const emoji = attributeInfo[attributeType].emoji;
                        const color = attributeInfo[attributeType].color;
                        
                        // Remove any existing content
                        const oldContent = square.querySelector('.square-content');
                        if (oldContent) {
                            square.removeChild(oldContent);
                        }
                        
                        // Add new emoji content
                        const contentElement = document.createElement('div');
                        contentElement.className = 'square-content';
                        contentElement.textContent = emoji;
                        square.appendChild(contentElement);
                        
                        // Change background color
                        square.style.backgroundColor = color;
                        
                        // Update data
                        updateSquareData(square.dataset.id, {
                            attribute: attributeType,
                            color: color
                        });
                        
                        console.log('Applied', attributeType, 'to square', square.dataset.id);
                    } catch (error) {
                        console.error('Error applying attribute:', error);
                    }
                    
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

    // ===== DRAG FUNCTIONALITY =====
    
    // Add drag functionality for positioning
    function addDragFunctionality(element) {
        let startDrag = function(e) {
            // Only start dragging if the element is not being dragged for HTML5 drag and drop
            if (e.target === element) {
                e.preventDefault();
                isDragging = true;
                draggedElement = element;
                element.style.zIndex = 20;
                debugLog('Started positioning drag', element.dataset.id);
            }
        };
        
        element.addEventListener('mousedown', startDrag);
    }

    // Global mouse event handlers for positioning drag
    document.addEventListener('mousemove', function(e) {
        if (isDragging && draggedElement) {
            e.preventDefault();
            
            const parentRect = draggedElement.parentElement.getBoundingClientRect();
            
            // Calculate position considering the transform: translate(-50%, -50%)
            const x = e.clientX - parentRect.left;
            const y = e.clientY - parentRect.top;
            
            // Ensure the element stays within bounds
            const boundedX = Math.max(0, Math.min(x, parentRect.width));
            const boundedY = Math.max(0, Math.min(y, parentRect.height));
            
            draggedElement.style.left = `${boundedX}px`;
            draggedElement.style.top = `${boundedY}px`;
            
            // Call the appropriate update function based on the type of element
            if (draggedElement.classList.contains('circle')) {
                updateCircleData(draggedElement.dataset.id, { x: boundedX, y: boundedY });
            } else if (draggedElement.classList.contains('square')) {
                updateSquareData(draggedElement.dataset.id, { x: boundedX, y: boundedY });
            }
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging && draggedElement) {
            debugLog('Ended positioning drag');
            isDragging = false;
            if (draggedElement) {
                draggedElement.style.zIndex = draggedElement.classList.contains('selected') ? 15 : 10;
                draggedElement = null;
            }
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging && draggedElement) {
            isDragging = false;
            if (draggedElement) {
                draggedElement.style.zIndex = draggedElement.classList.contains('selected') ? 15 : 10;
                draggedElement = null;
            }
        }
    });

    // ===== SELECTION MANAGEMENT =====
    
    // Select an item (circle or square)
    function selectItem(item) {
        if (item.classList.contains('circle')) {
            // Deselect previously selected circle if any
            if (selectedCircle && selectedCircle !== item) {
                const prevButtons = selectedCircle.querySelector('.item-buttons');
                if (prevButtons) {
                    prevButtons.style.display = 'none';
                }
                selectedCircle.classList.remove('selected');
            }
            
            selectedCircle = item;
            const circleId = item.dataset.id;
            
            // Show buttons for the selected circle
            const buttons = item.querySelector('.item-buttons');
            if (buttons) {
                buttons.style.display = 'flex';
            }
            
            // Add selected class for visual indication
            item.classList.add('selected');
            
            // Activate right panel
            rightPanel.style.backgroundColor = 'black';
            rightPanel.classList.add('active');
            // Show the add square button
            addSquareBtn.style.display = 'flex';
            
            // Show only squares associated with this circle
            showSquaresForCircle(circleId);
        } else if (item.classList.contains('square')) {
            // Deselect previously selected square if any
            if (selectedSquare && selectedSquare !== item) {
                const prevButtons = selectedSquare.querySelector('.item-buttons');
                if (prevButtons) {
                    prevButtons.style.display = 'none';
                }
                selectedSquare.classList.remove('selected');
            }
            
            selectedSquare = item;
            
            // Show buttons for the selected square
            const buttons = item.querySelector('.item-buttons');
            if (buttons) {
                buttons.style.display = 'flex';
            }
            
            // Add selected class for visual indication
            item.classList.add('selected');
        }
    }
    
    // Show only squares associated with the selected circle
    function showSquaresForCircle(circleId) {
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
        if (selectedSquare && selectedSquare.dataset.circleId !== circleId) {
            deselectSquare();
        }
    }

    function deselectCircle() {
        if (selectedCircle) {
            const buttons = selectedCircle.querySelector('.item-buttons');
            if (buttons) {
                buttons.style.display = 'none';
            }
            
            // Remove selected class
            selectedCircle.classList.remove('selected');
            
            selectedCircle = null;
            
            // Deactivate right panel
            rightPanel.style.backgroundColor = '#333';
            rightPanel.classList.remove('active');
            // Hide the add square button
            addSquareBtn.style.display = 'none';
            
            // Hide all squares
            const allSquares = document.querySelectorAll('.square');
            allSquares.forEach(square => {
                square.style.display = 'none';
            });
            
            // Also deselect square since right panel is deactivated
            deselectSquare();
        }
    }
    
    function deselectSquare() {
        if (selectedSquare) {
            const buttons = selectedSquare.querySelector('.item-buttons');
            if (buttons) {
                buttons.style.display = 'none';
            }
            
            // Remove selected class
            selectedSquare.classList.remove('selected');
            
            selectedSquare = null;
        }
    }

    // Show delete confirmation dialog
    function showDeleteDialog(onConfirm) {
        dialogOverlay.style.display = 'flex';
        
        const confirmHandler = function() {
            onConfirm();
            dialogOverlay.style.display = 'none';
            dialogConfirm.removeEventListener('click', confirmHandler);
            dialogCancel.removeEventListener('click', cancelHandler);
        };
        
        const cancelHandler = function() {
            dialogOverlay.style.display = 'none';
            dialogConfirm.removeEventListener('click', confirmHandler);
            dialogCancel.removeEventListener('click', cancelHandler);
        };
        
        dialogConfirm.addEventListener('click', confirmHandler);
        dialogCancel.addEventListener('click', cancelHandler);
    }

    // ===== EVENT HANDLERS =====
    
    // Add circle button click handler
    addCircleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Deselect current item
        deselectCircle();
        
        // Create a new circle at a random position near the center
        const id = generateId();
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
            size: sizes.medium.circle,
            color: predefinedColors[0],
            name: '???'
        };
        
        // Create and add circle to DOM
        const circle = createCircleElement(circleData);
        
        // Add to data and save
        addCircleData(circleData);
        
        // Select the new circle
        selectItem(circle);
    });

    // Add square button click handler
    addSquareBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (!selectedCircle) {
            debugLog('Cannot create square - no circle selected');
            return;
        }
        
        // Create a new square at a random position near the center
        const id = generateId();
        const panelRect = rightPanel.getBoundingClientRect();
        const centerX = panelRect.width / 2;
        const centerY = panelRect.height / 2;
        
        // Random position within ±100px of center
        const randomOffset = () => Math.random() * 200 - 100;
        const x = Math.max(50, Math.min(panelRect.width - 100, centerX + randomOffset()));
        const y = Math.max(50, Math.min(panelRect.height - 100, centerY + randomOffset()));
        
        const squareData = {
            id: id,
            circleId: selectedCircle.dataset.id, // Associate with the selected circle
            x: x,
            y: y,
            size: sizes.medium.square,
            color: predefinedColors[0],
            name: '???',
            attribute: null // Ensure attribute field exists but is null initially
        };
        
        // Create and add square to DOM
        const square = createSquareElement(squareData);
        
        // Add to data and save
        addSquareData(squareData);
        
        // Select the new square
        selectItem(square);
    });

    // Left panel click - only deselect circle
    leftPanel.addEventListener('click', function(e) {
        // Only handle clicks directly on the panel (not on children)
        if (e.target === leftPanel) {
            deselectCircle();
        }
    });

    // Right panel click handler - only for deselection of squares
    rightPanel.addEventListener('click', function(e) {
        // Only handle clicks directly on the panel (not on children)
        if (e.target === rightPanel) {
            // Only deselect squares
            if (selectedSquare) {
                deselectSquare();
            }
        }
    });

    // ===== INITIALIZATION =====
    
    // Load saved data on page load
    loadData();
    
    // Set up the attribute grid with drag and drop zones
    setupDropZones();
    
    // Log initialization
    debugLog("Chakra Visualizer initialized");


    // Add these modifications to your script.js file

// ===== CONFIGURATION =====
// Add this to your CONFIG section
const meridianConfig = {
    x: 170,           // X position of meridian line (center of left panel)
    snapThreshold: 20, // Distance in pixels to snap to meridian
    lineColor: 'rgba(255, 255, 255, 0.3)' // Color of meridian line
};

// ===== INITIALIZATION FUNCTION =====
// Add this function to create the meridian line
function createMeridianLine() {
    const meridianLine = document.createElement('div');
    meridianLine.id = 'meridian-line';
    meridianLine.style.position = 'absolute';
    meridianLine.style.top = '0';
    meridianLine.style.left = `${meridianConfig.x}px`;
    meridianLine.style.width = '1px';
    meridianLine.style.height = '100%';
    meridianLine.style.backgroundColor = meridianConfig.lineColor;
    meridianLine.style.zIndex = '2';
    meridianLine.style.pointerEvents = 'none';
    
    // Add the meridian line to the left panel
    leftPanel.appendChild(meridianLine);
    debugLog('Meridian line created at x=' + meridianConfig.x);
}

// ===== MODIFY THE DRAG FUNCTIONALITY =====
// Replace the existing mousemove event handler with this updated version
document.addEventListener('mousemove', function(e) {
    if (isDragging && draggedElement) {
        e.preventDefault();
        
        const parentRect = draggedElement.parentElement.getBoundingClientRect();
        
        // Calculate position considering the transform: translate(-50%, -50%)
        const x = e.clientX - parentRect.left;
        const y = e.clientY - parentRect.top;
        
        // Snap to meridian line if it's a circle and close to the line
        let boundedX = Math.max(0, Math.min(x, parentRect.width));
        
        // Only apply snapping to circles in the left panel
        if (draggedElement.classList.contains('circle') && 
            draggedElement.parentElement.id === 'left-panel') {
            
            // Check if close to meridian line
            const distanceToMeridian = Math.abs(boundedX - meridianConfig.x);
            
            if (distanceToMeridian < meridianConfig.snapThreshold) {
                // Snap to meridian
                boundedX = meridianConfig.x;
                
                // Visual feedback that we're snapping (optional)
                if (!draggedElement.classList.contains('snapping')) {
                    draggedElement.classList.add('snapping');
                }
            } else if (draggedElement.classList.contains('snapping')) {
                // Remove snapping indicator when not snapping
                draggedElement.classList.remove('snapping');
            }
        }
        
        const boundedY = Math.max(0, Math.min(y, parentRect.height));
        
        draggedElement.style.left = `${boundedX}px`;
        draggedElement.style.top = `${boundedY}px`;
        
        // Call the appropriate update function based on the type of element
        if (draggedElement.classList.contains('circle')) {
            updateCircleData(draggedElement.dataset.id, { x: boundedX, y: boundedY });
        } else if (draggedElement.classList.contains('square')) {
            updateSquareData(draggedElement.dataset.id, { x: boundedX, y: boundedY });
        }
    }
});

// Make sure to add this to the initialization section of your script
// ===== INITIALIZATION =====
// Add this line to your existing initialization code after loadData();
createMeridianLine();
});


