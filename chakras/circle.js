// circle.js - Circle-related functionality for the Chakra Visualizer

const CircleManager = {
    // Selected circle reference
    selectedCircle: null,
    
    // Get chakra form based on square count
    getChakraFormForCircle: function(circleId, circleName) {
        const squareCount = DataManager.countCircleSquares(circleId) + (circleName === Config.defaultName ? 0 : 1);
        // Get the chakra form index based on square count, with a fallback to the last form if count exceeds array length
        const formIndex = Math.min(squareCount, Config.chakraForms.length - 1);
        Utils.debugLog(`Circle ${circleId} has ${squareCount} squares, using chakraForm[${formIndex}]`);
        return Config.chakraForms[formIndex];
    },
    
    // Update the chakra form for a circle
    updateChakraFormForCircle: function(circleId) {
        const circle = document.querySelector(`.circle[data-id="${circleId}"]`);
        if (!circle) return;
        
        // Get the current name from the input element
        const nameInput = circle.querySelector('.item-name');
        const circleName = nameInput ? nameInput.value : Config.defaultName;
        
        const chakraFormElement = this.getChakraFormForCircle(circleId, circleName);
        
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
            shapeElement.style.clipPath = Utils.getPolyPoints(chakraForm.sides, chakraForm.starFactor, chakraForm.borderPercent);
            innermostPolygonContainerElement.appendChild(shapeElement);

            innerPolygonContainerElement.appendChild(innermostPolygonContainerElement);
            outerPolygonContainerElement.appendChild(innerPolygonContainerElement);
        });
        
        circle.appendChild(outerPolygonContainerElement);
        Utils.debugLog(`Updated chakra form for circle ${circleId}`);
    },
    
    // Create a circle element
    createCircleElement: function(circleData) {
        const leftPanel = document.getElementById('left-panel');
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

        const chakraFormElement = this.getChakraFormForCircle(circleData.id, circleData.name);
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
            shapeElement.style.clipPath = Utils.getPolyPoints(chakraForm.sides, chakraForm.starFactor, chakraForm.borderPercent);
            innermostPolygonContainerElement.appendChild(shapeElement);

            innerPolygonContainerElement.appendChild(innermostPolygonContainerElement);
            outerPolygonContainerElement.appendChild(innerPolygonContainerElement);
        });
        circle.appendChild(outerPolygonContainerElement);

        // Create name input
        const nameElement = document.createElement('div');
        nameElement.className = 'item-name';
        nameElement.contentEditable = true;
        nameElement.textContent = circleData.name;
        nameElement.addEventListener('blur', function() {
            DataManager.updateCircleData(circleData.id, { name: this.textContent });
            // Add this line to update the chakra form when the name changes
            CircleManager.updateChakraFormForCircle(circleData.id);
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
        
        // Add name element to circle
        circle.appendChild(nameElement);
        
        // Click handler for selection
        circle.addEventListener('click', function(e) {
            e.stopPropagation();
            UIManager.selectItem(circle);
        });
        
        // Add drag functionality
        UIManager.addDragFunctionality(circle);
        
        leftPanel.appendChild(circle);
        return circle;
    }
};
