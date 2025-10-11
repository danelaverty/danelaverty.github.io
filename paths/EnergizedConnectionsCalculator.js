// EnergizedConnectionsCalculator.js - Calculates the number of energized connections per circle by energy type
export class EnergizedConnectionsCalculator {
    constructor() {
        this.energyTypes = ['exciter', 'dampener'];
    }

    /**
     * Calculate energized connections for all circles in a viewer
     * @param {Array} circles - Array of circle objects
     * @param {Array} explicitConnections - Array of explicit connection objects
     * @returns {Map} Map of circle ID to energized connection counts by type
     */
    calculateEnergizedConnectionsForCircles(circles, explicitConnections) {
        const result = new Map();
        
        // Initialize result map with empty counts for all circles
        circles.forEach(circle => {
            const counts = {};
            this.energyTypes.forEach(energyType => {
                counts[`${energyType}-connections`] = 0;
            });
            result.set(circle.id, counts);
        });

        // Process each explicit connection to see if it's energized
        let energizedConnectionsFound = 0;
        explicitConnections.forEach((connection, index) => {
            // Get energized types from the controller instead of the connection object
            let energizedTypes = [];
            energizedTypes = connection.energizedWith || [];

            if (energizedTypes && energizedTypes.length > 0) {
                energizedConnectionsFound++;
                
                const entity1Id = connection.entity1Id;
                const entity2Id = connection.entity2Id;
                
                // For each energy type this connection is energized with
                energizedTypes.forEach(energyType => {
                    const connectionKey = `${energyType}-connections`;
                    
                    // Increment count for both connected circles
                    if (result.has(entity1Id)) {
                        const oldCount = result.get(entity1Id)[connectionKey];
                        result.get(entity1Id)[connectionKey]++;
                    }
                    
                    if (result.has(entity2Id)) {
                        const oldCount = result.get(entity2Id)[connectionKey];
                        result.get(entity2Id)[connectionKey]++;
                    }
                });
            }
        });

        // Log final results
        result.forEach((counts, circleId) => {
            const totalConnections = Object.values(counts).reduce((sum, count) => sum + count, 0);
        });
        
        const totalEnergizedAcrossAllCircles = Array.from(result.values())
            .reduce((total, counts) => total + Object.values(counts).reduce((sum, count) => sum + count, 0), 0);

        return result;
    }

    /**
     * Determine if a connection is truly energized for a given energy type
     * A connection is energized if it's carrying energy between circles that both have that energy type
     */
    isConnectionEnergized(connection, energyType, connectionEnergyDistances, circleEnergyDistances) {
        const connectionEnergy = connectionEnergyDistances.get(connection.id);
        
        // Connection must have energy distance data for this energy type
        if (!connectionEnergy || connectionEnergy[energyType] === undefined) {
            return false;
        }

        // Both connected circles must have energy distance data for this energy type
        const circle1Energy = circleEnergyDistances.get(connection.entity1Id);
        const circle2Energy = circleEnergyDistances.get(connection.entity2Id);
        
        if (!circle1Energy || !circle2Energy || 
            circle1Energy[energyType] === undefined || 
            circle2Energy[energyType] === undefined) {
            return false;
        }

        // Connection energy distance should be the average of the two circle distances
        // This confirms energy is actually flowing through this connection
        const expectedConnectionDistance = (circle1Energy[energyType] + circle2Energy[energyType]) / 2;
        const actualConnectionDistance = connectionEnergy[energyType];
        
        // Allow for small floating point differences
        const tolerance = 0.1;
        return Math.abs(expectedConnectionDistance - actualConnectionDistance) < tolerance;
    }

    /**
     * Get energized connection count for a specific circle and energy type
     */
    getEnergizedConnectionCount(circleId, energyType, energizedConnectionsMap) {
        const circleData = energizedConnectionsMap.get(circleId);
        if (!circleData) {
            return 0;
        }
        
        const connectionKey = `${energyType}-connections`;
        return circleData[connectionKey] || 0;
    }

    /**
     * Get total energized connections for a circle (all energy types combined)
     */
    getTotalEnergizedConnections(circleId, energizedConnectionsMap) {
        const circleData = energizedConnectionsMap.get(circleId);
        if (!circleData) {
            return 0;
        }
        
        return Object.values(circleData).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Update available energy types
     */
    updateEnergyTypes(newEnergyTypes) {
        this.energyTypes = [...newEnergyTypes];
    }

    /**
     * Format energized connections for display/debugging
     */
    formatEnergizedConnectionsForDisplay(energizedConnections) {
        if (!energizedConnections || Object.keys(energizedConnections).length === 0) {
            return 'No energized connections';
        }

        return Object.entries(energizedConnections)
            .filter(([key, count]) => count > 0)
            .map(([key, count]) => {
                const energyType = key.replace('-connections', '');
                const shortName = energyType.charAt(0).toUpperCase();
                return `${shortName}:${count}`;
            })
            .join(' ');
    }
}
