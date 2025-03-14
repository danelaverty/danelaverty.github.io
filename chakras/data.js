// data.js - Data management for the Chakra Visualizer

const DataManager = {
    // Data storage
    data: {
        circles: [],
        squares: []
    },
    
    // Load data from localStorage
    loadData: function() {
        const savedData = localStorage.getItem('chakraVisualizerData');
        if (savedData) {
            try {
                this.data = JSON.parse(savedData);
                Utils.debugLog('Loading saved data', { circles: this.data.circles.length, squares: this.data.squares.length });
                
                // Render saved circles
                this.data.circles.forEach(circleData => {
                    CircleManager.createCircleElement(circleData);
                });
                
                // Render saved squares (they'll be hidden initially)
                this.data.squares.forEach(squareData => {
                    SquareManager.createSquareElement(squareData);
                });
                
                // Hide all squares initially
                const allSquares = document.querySelectorAll('.square');
                allSquares.forEach(square => {
                    square.style.display = 'none';
                });
                
                Utils.debugLog('Loaded data successfully');
            } catch (e) {
                console.error("Error loading saved data:", e);
                Utils.debugLog("Error loading saved data", e.message);
            }
        } else {
            Utils.debugLog('No saved data found');
        }
    },
    
    // Save data to localStorage
    saveData: function() {
        localStorage.setItem('chakraVisualizerData', JSON.stringify(this.data));
    },
    
    // Circle data operations
    addCircleData: function(circleData) {
        this.data.circles.push(circleData);
        this.saveData();
    },
    
    updateCircleData: function(id, updates) {
        const index = this.data.circles.findIndex(circle => circle.id === id);
        if (index !== -1) {
            this.data.circles[index] = { ...this.data.circles[index], ...updates };
            this.saveData();
        }
    },
    
    deleteCircleData: function(id) {
        this.data.circles = this.data.circles.filter(circle => circle.id !== id);
        this.saveData();
    },
    
    // Square data operations
    addSquareData: function(squareData) {
        this.data.squares.push(squareData);
        this.saveData();
        CircleManager.updateChakraFormForCircle(squareData.circleId);
    },
    
    updateSquareData: function(id, updates) {
        const index = this.data.squares.findIndex(square => square.id === id);
        if (index !== -1) {
            this.data.squares[index] = { ...this.data.squares[index], ...updates };
            this.saveData();
        }
    },
    
    deleteSquareData: function(id) {
        const square = this.data.squares.find(s => s.id === id);
        if (square) {
            const circleId = square.circleId;
            this.data.squares = this.data.squares.filter(square => square.id !== id);
            this.saveData();
            // Update the chakra form for the associated circle
            CircleManager.updateChakraFormForCircle(circleId);
        }
    },
    
    // Count squares associated with a circle
    countCircleSquares: function(circleId) {
        return this.data.squares.filter(square => square.circleId === circleId).length;
    }
};
