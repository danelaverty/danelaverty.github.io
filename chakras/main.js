// main.js - Initialize the Chakra Visualizer

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Utils.debugLog('App initialized');
    
    // Create the meridian line
    UIManager.createMeridianLine();
    
    // Create action buttons
    UIManager.createActionButtons();
    
    // Setup event listeners
    UIManager.setupKeyboardShortcuts();
    UIManager.setupPanelClickHandlers();
    UIManager.setupButtonHandlers();
    UIManager.setupAttributeBoxCreation();
    
    // Setup drag events for the document
    document.addEventListener('mousemove', function(e) {
        if (UIManager.isDragging && UIManager.draggedElement) {
            e.preventDefault();
            
            // Move the dragged element
            const newX = e.clientX;
            const newY = e.clientY;
            
            // Check if it's a circle (left panel) or square (right panel)
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
                const rightPanel = document.getElementById('right-panel');
                const rightPanelRect = rightPanel.getBoundingClientRect();
                
                // Calculate new position relative to the right panel
                const relativePosX = newX - rightPanelRect.left;
                const relativePosY = newY - rightPanelRect.top;
                
                // Check if position is within bounds of right panel
                if (relativePosX >= 0 && relativePosX <= rightPanelRect.width &&
                    relativePosY >= 0 && relativePosY <= rightPanelRect.height) {
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
            UIManager.isDragging = false;
            UIManager.draggedElement.style.zIndex = UIManager.draggedElement.classList.contains('selected') ? 15 : 10;
            UIManager.draggedElement = null;
        }
    });
    
    // Setup attribute drop zones
    AttributeManager.setupDropZones();
    
    // Load data from localStorage
    DataManager.loadData();
    
    Utils.debugLog('App ready');
});
