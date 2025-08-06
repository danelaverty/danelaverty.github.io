// systems/ChakraFormSystem.js - Chakra form system for glow circles
export const ChakraFormSystem = {
    /**
     * Create chakra form for glow circles
     */
    create(element, circle, squareCount) {
        const chakraForm = this.getChakraFormForSquareCount(squareCount);
        
        if (!chakraForm || chakraForm.length === 0) return;
        
        const outerContainer = document.createElement('div');
        outerContainer.className = 'outer-polygon-container';
        
        for (let i = 0; i < chakraForm.length; i++) {
            this.createChakraFormShape(outerContainer, chakraForm[i]);
        }
        
        element.appendChild(outerContainer);
    },

    /**
     * Get chakra form configuration for square count
     */
    getChakraFormForSquareCount(squareCount) {
        const chakraForms = [
            [{ sides: 3, starFactor: 1, borderPercent: 0.18, rotate: 0, scale: 0.01 }],
            [{ sides: 3, starFactor: 1, borderPercent: 0.18, rotate: 0, scale: 0.9 }],
            [
                { sides: 4, starFactor: 1, borderPercent: 0.12 },
                { sides: 4, starFactor: 1, borderPercent: 0.12, rotate: 45 }
            ],
            [
                { sides: 5, starFactor: 1, borderPercent: 0.10 },
                { sides: 5, starFactor: 1, borderPercent: 0.10, rotate: 36 }
            ],
            [{ sides: 11, starFactor: 3, borderPercent: 0.12 }],
            [
                { sides: 7, starFactor: 2, borderPercent: 0.12, rotate: 0, scale: 0.4 },
                { sides: 9, starFactor: 2, borderPercent: 0.08, rotate: 0, scale: 1.2, reverse: true, spinTime: 64 }
            ],
        ];
        
        return chakraForms[Math.min(squareCount, chakraForms.length - 1)] || [];
    },

    /**
     * Create individual chakra form shape
     */
    createChakraFormShape(outerContainer, form) {
        const innerContainer = document.createElement('div');
        innerContainer.className = 'inner-polygon-container';
        innerContainer.style.transform = `rotate(${form.rotate || 0}deg) scale(${form.scale || 1})`;
        
        const innermostContainer = document.createElement('div');
        innermostContainer.className = 'inner-polygon-container';
        innermostContainer.style.filter = 'drop-shadow(0 0 3px #AAA)';
        innermostContainer.style.mixBlendMode = 'screen';
        
        const animationName = form.reverse ? 'anglerev' : 'angle';
        const spinTime = form.spinTime || 16;
        innermostContainer.style.animation = `${animationName} ${spinTime}s linear infinite`;
        
        const shapeElement = document.createElement('div');
        shapeElement.className = 'shape';
        shapeElement.style.clipPath = this.getPolyPoints(form.sides, form.starFactor, form.borderPercent);
        
        innermostContainer.appendChild(shapeElement);
        innerContainer.appendChild(innermostContainer);
        outerContainer.appendChild(innerContainer);
    },

    formatPolyPoint: function(val) {
        return (Math.round(10000 * ((val + 1) / 2)) / 100) + '%';
    },

    /**
     * Generate polygon clip-path for chakra forms
     */
    getPolyPoints: function(sides, starFactor, borderPercent) {
        starFactor = starFactor || 1;
        borderPercent = borderPercent || 0.08;
        
        var eachAngle = 360 * starFactor / sides;
        var angles = [];
        
        for (var i = 0; i < sides; i++) {
            angles.push(eachAngle * i);
        }
        
        var coordinates = [];
        for (var j = 0; j < angles.length; j++) {
            var angle = angles[j];
            var radians = angle * (Math.PI / 180);
            var xVal = Math.cos(radians);
            var yVal = Math.sin(radians);
            coordinates.push({ x: xVal, y: yVal });
        }
        
        // Add first point again to close the shape
        coordinates.push({
            x: coordinates[0].x, 
            y: coordinates[0].y
        });
        
        var reverseShrunkCoordinates = [];
        for (var k = 0; k < coordinates.length; k++) {
            var coordinate = coordinates[k];
            reverseShrunkCoordinates.push({
                x: coordinate.x * (1 - borderPercent),
                y: coordinate.y * (1 - borderPercent)
            });
        }
        
        // Add points in reverse order
        for (var l = reverseShrunkCoordinates.length - 1; l >= 0; l--) {
            coordinates.push(reverseShrunkCoordinates[l]);
        }
        
        var coordinatesString = '';
        var self = this;
        coordinates.forEach(function(coordinate) {
            coordinatesString += self.formatPolyPoint(coordinate.x) + ' ' + self.formatPolyPoint(coordinate.y) + ', ';
        });
        
        // Remove trailing comma and space
        return 'polygon(' + coordinatesString.substring(0, coordinatesString.length - 2) + ')';
    }
    }
