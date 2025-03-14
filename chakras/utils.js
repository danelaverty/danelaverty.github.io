// utils.js - Utility functions for the Chakra Visualizer

const Utils = {
    // Format polygon point values
    formatPolyPoint: function(val) {
        return (Math.round(10000 * ((val + 1) / 2)) / 100) + '%';
    },
    
    // Generate polygon points
    getPolyPoints: function(sides, starFactor, borderPercent) {
        if (!starFactor) { starFactor = 1; }
        if (!borderPercent) { borderPercent = .08; }
        
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
            coordinatesString += this.formatPolyPoint(coordinate.x) + ' ' + this.formatPolyPoint(coordinate.y) + ', '
        }, this);
        return 'polygon(' + coordinatesString.substring(0, coordinatesString.length - 2) + ')';
    },
    
    // Debug logging
    debugLog: function(message, data) {
        console.log(`[DEBUG] ${message}`, data || '');
        
        // Also update debug panel
        const debugPanel = document.getElementById('debug-panel');
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
    },
    
    // Generate a unique ID
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },
    
    // Show delete confirmation dialog
    // Show delete confirmation dialog
    showDeleteDialog: function(onConfirm) {
        const dialogOverlay = document.getElementById('dialog-overlay');
        const dialogConfirm = document.getElementById('dialog-confirm');
        const dialogCancel = document.getElementById('dialog-cancel');
        
        dialogOverlay.style.display = 'flex';
        
        const confirmHandler = function() {
            onConfirm();
            dialogOverlay.style.display = 'none';
            dialogConfirm.removeEventListener('click', confirmHandler);
            dialogCancel.removeEventListener('click', cancelHandler);
            document.removeEventListener('keydown', keyHandler);
        };
        
        const cancelHandler = function() {
            dialogOverlay.style.display = 'none';
            dialogConfirm.removeEventListener('click', confirmHandler);
            dialogCancel.removeEventListener('click', cancelHandler);
            document.removeEventListener('keydown', keyHandler);
        };
        
        // Handle keyboard events within the dialog
        const keyHandler = function(e) {
            if (e.key === 'Enter') {
                // Enter key confirms the action
                e.preventDefault();
                confirmHandler();
            } else if (e.key === 'Escape') {
                // Escape key cancels the action
                e.preventDefault();
                cancelHandler();
            }
        };
        
        // Add all event listeners
        dialogConfirm.addEventListener('click', confirmHandler);
        dialogCancel.addEventListener('click', cancelHandler);
        document.addEventListener('keydown', keyHandler);
    },
};
