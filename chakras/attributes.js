// attributes.js - Attribute functionality for the Chakra Visualizer

const AttributeManager = {
    // Apply an attribute to a square
    applyAttribute: function(square, attributeName) {
        Utils.debugLog('Applying attribute', { squareId: square.dataset.id, attribute: attributeName });
        
        // Get the attribute info
        const attributeData = Config.attributeInfo[attributeName];
        if (!attributeData) {
            Utils.debugLog('Unknown attribute', attributeName);
            return;
        }
        
        // 1. Change background color
        square.style.backgroundColor = attributeData.color;
        Utils.debugLog('Changed background color to', attributeData.color);
        
        // 2. Remove any existing emoji
        const existingEmoji = square.querySelector('.square-content');
        if (existingEmoji) {
            square.removeChild(existingEmoji);
            Utils.debugLog('Removed existing emoji');
        }
        
        // 3. Add new emoji
        const emojiElement = document.createElement('div');
        emojiElement.className = 'square-content';
        emojiElement.textContent = attributeData.emoji;
        square.appendChild(emojiElement);
        Utils.debugLog('Added new emoji', attributeData.emoji);
        
        // 4. Update data store
        DataManager.updateSquareData(square.dataset.id, {
            attribute: attributeName,
            color: attributeData.color
        });
        Utils.debugLog('Updated square data');
        
        // Logging final state for verification
        Utils.debugLog('Square final state', {
            id: square.dataset.id,
            backgroundColor: square.style.backgroundColor,
            hasEmoji: !!square.querySelector('.square-content'),
            emojiContent: square.querySelector('.square-content')?.textContent
        });
    },
    
    // Setup attribute drop zones
    setupDropZones: function() {
        const attributeBoxes = document.querySelectorAll('.attribute-box');
        Utils.debugLog('Setting up attribute drop zones');
        
        // Add event listeners for highlighting when squares are dragged over
        attributeBoxes.forEach(box => {
            box.addEventListener('dragenter', function(e) {
                e.preventDefault();
                this.classList.add('highlight');
            });
            
            box.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('highlight');
            });
            
            box.addEventListener('dragover', function(e) {
                e.preventDefault(); // Necessary to allow dropping
            });
            
            box.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('highlight');
                
                const squareId = e.dataTransfer.getData('text') || window.lastDraggedSquareId;
                if (!squareId) {
                    console.error('No square ID found in drop data');
                    return;
                }
                
                const square = document.querySelector(`.square[data-id="${squareId}"]`);
                if (square) {
                    const attributeType = this.dataset.attribute;
                    AttributeManager.applyAttribute(square, attributeType);
                }
            });
        });
    }
};
