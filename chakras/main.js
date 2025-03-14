// main.js - Initialize the Chakra Visualizer

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add our additional CSS
    addAdditionalCSS();
    
    Utils.debugLog('App initialized');
    
    // Set up the top panel controls
    UIManager.setupTopPanelControls();
    
    // Create the meridian line
    UIManager.createMeridianLine();
    
    // Create action buttons
    UIManager.createActionButtons();
    
    // Dynamically create the attribute grid based on Config.attributeInfo
    createDynamicAttributeGrid();
    
    // Setup event listeners
    UIManager.setupKeyboardShortcuts();
    UIManager.setupPanelClickHandlers();
    UIManager.setupButtonHandlers();
    UIManager.setupAttributeBoxCreation();
    ConnectionManager.initialize();
    setTimeout(() => {
	    ConnectionManager.updateAllCircleIndicators();
    }, 500);
    
    // Setup drag events for the document
    document.addEventListener('mousemove', function(e) {
        if (UIManager.isDragging && UIManager.draggedElement) {
            e.preventDefault();
            
            // Set the dragged flag to true when actual movement occurs
            UIManager.wasDragged = true;
            
            // Move the dragged element
            const newX = e.clientX;
            const newY = e.clientY;
            
            // Check if it's a circle (left panel) or square (bottom panel)
            if (UIManager.draggedElement.classList.contains('circle')) {
                const leftPanel = document.getElementById('left-panel');
                const leftPanelRect = leftPanel.getBoundingClientRect();
                
                // Calculate new position relative to the left panel
                const relativePosX = newX - leftPanelRect.left;
                const relativePosY = newY - leftPanelRect.top;
                
                // Check if position is within bounds of left panel
                if (relativePosX >= 0 && relativePosX <= leftPanelRect.width &&
                    relativePosY >= 0 && relativePosY <= leftPanelRect.height) {
                    UIManager.draggedElement.style.left = `${relativePosX}px`;
                    UIManager.draggedElement.style.top = `${relativePosY}px`;
                    
                    // Check for meridian snap
                    const meridianX = Config.meridian.x;
                    const distanceToMeridian = Math.abs(relativePosX - meridianX);
                    
                    if (distanceToMeridian < Config.meridian.snapThreshold) {
                        UIManager.draggedElement.style.left = `${meridianX}px`;
                        UIManager.draggedElement.classList.add('snapping');
                    } else {
                        UIManager.draggedElement.classList.remove('snapping');
                    }
                    
                    // Update data
                    DataManager.updateCircleData(UIManager.draggedElement.dataset.id, {
                        x: parseInt(UIManager.draggedElement.style.left),
                        y: parseInt(UIManager.draggedElement.style.top)
                    });
                }
            } else if (UIManager.draggedElement.classList.contains('square')) {
                // Use bottom panel instead of right panel
                const bottomPanel = document.getElementById('bottom-panel');
                const bottomPanelRect = bottomPanel.getBoundingClientRect();
                
                // Calculate new position relative to the bottom panel
                const relativePosX = newX - bottomPanelRect.left;
                const relativePosY = newY - bottomPanelRect.top;
                
                // Check if position is within bounds of bottom panel
                if (relativePosX >= 0 && relativePosX <= bottomPanelRect.width &&
                    relativePosY >= 0 && relativePosY <= bottomPanelRect.height) {
                    UIManager.draggedElement.style.left = `${relativePosX}px`;
                    UIManager.draggedElement.style.top = `${relativePosY}px`;
                    
                    // Update data
                    DataManager.updateSquareData(UIManager.draggedElement.dataset.id, {
                        x: parseInt(UIManager.draggedElement.style.left),
                        y: parseInt(UIManager.draggedElement.style.top)
                    });
                }
            }
        }
    });
    
    document.addEventListener('mouseup', function(e) {
        if (UIManager.isDragging && UIManager.draggedElement) {
            // Store a reference to the element before clearing it
            const element = UIManager.draggedElement;
            
            // Clean up the drag state
            UIManager.isDragging = false;
            UIManager.draggedElement.style.zIndex = UIManager.draggedElement.classList.contains('selected') ? 15 : 10;
            UIManager.draggedElement = null;
            
            // Reset the wasDragged flag after a short delay to allow any click events to process
            setTimeout(function() {
                UIManager.wasDragged = false;
            }, 50);
        }
    });
    
    // Setup attribute drop zones
    AttributeManager.setupDropZones();
    
    // Load data from localStorage
    DataManager.loadData();
    
    Utils.debugLog('App ready');
});

// Function to add additional CSS
function addAdditionalCSS() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
    /* Top panel title and controls */
    .panel-title {
        color: white;
        font-size: 16px;
        font-weight: bold;
        margin-right: 20px;
    }

    .top-panel-controls {
        display: flex;
        gap: 10px;
    }

    /* Style for buttons in the top panel */
    #top-panel .action-btn {
        width: 35px;
        height: 35px;
        background-color: #333;
        transition: all 0.2s ease;
    }

    #top-panel .action-btn:hover {
        background-color: #555;
        transform: scale(1.05);
    }
    
    /* Updated attribute box styles */
    .attribute-box {
        height: auto !important;
        padding: 1px !important;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    
    .attribute-name {
        font-size: 11px;
        font-weight: bold;
        margin-bottom: 2px;
    }
    
    .attribute-box .emoji {
        font-size: 22px;
        margin: 2px 0;
    }
    
    .attribute-desc {
        font-size: 9px;
        opacity: 0.85;
        margin-top: 2px;
        line-height: 1.1;
	text-align: center;
    }
    
    /* Adjust attribute grid layout */
    #attribute-grid {
        grid-template-rows: auto !important;
        grid-template-columns: repeat(6, 1fr) !important;
        padding: 10px !important;
        gap: 8px !important;
	width: 500px;
    }
    `;
    document.head.appendChild(styleElement);
}

// Function to dynamically create the attribute grid from Config.attributeInfo
function createDynamicAttributeGrid() {
    // Get reference to the attribute grid container
    const attributeGrid = document.getElementById('attribute-grid');
    
    // Clear any existing content
    while (attributeGrid.firstChild) {
        attributeGrid.removeChild(attributeGrid.firstChild);
    }
    
    // Loop through each attribute in the config
    Object.entries(Config.attributeInfo).forEach(([key, attr]) => {
        // Create the attribute box
        const attrBox = document.createElement('div');
        attrBox.id = `${key}-box`;
        attrBox.className = 'attribute-box create-button';
        attrBox.dataset.attribute = key;
        
        // Set background color from config
        attrBox.style.backgroundColor = attr.color;
        
        // Add text color adjustments for better readability
        // For dark background colors, use white text
        if (attr.color === '#0000FF' || attr.color === '#663399') {
            attrBox.style.color = 'white';
            attrBox.style.textShadow = '0 0 3px rgba(0, 0, 0, 0.5)';
        }
        
        // Create display name element (now at the top)
        const nameDiv = document.createElement('div');
        nameDiv.className = 'attribute-name';
        nameDiv.textContent = attr.displayName;
        
        // Create emoji element (in the middle)
        const emojiDiv = document.createElement('div');
        emojiDiv.className = 'emoji';
        emojiDiv.textContent = attr.emoji;
        
        // Create description element (at the bottom)
        const descDiv = document.createElement('div');
        descDiv.className = 'attribute-desc';
        descDiv.textContent = attr.description;
        
        // Append children to the attribute box in the new order
        attrBox.appendChild(nameDiv);
        attrBox.appendChild(emojiDiv);
        attrBox.appendChild(descDiv);
        
        // Add to grid
        attributeGrid.appendChild(attrBox);
    });
    
    Utils.debugLog('Attribute grid dynamically created');
}
