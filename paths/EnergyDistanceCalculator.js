// EnergyDistanceCalculator.js - Calculates energy propagation distances for circles based on activation and energy types
export class EnergyDistanceCalculator {
    constructor() {
        // Available energy types - should match your energy types configuration
        this.energyTypes = ['exciter', 'dampener', 'stabilizer', 'amplifier'];
    }

    calculateEnergyDistanceForAllCirclesInCircleViewer(circles, explicitConnections) {
        // STEP 1: Create a map of circles with energy distance tracking
        const circleMap = new Map();
        circles.forEach(circle => {
            circleMap.set(circle.id, {
                circle: circle,
                neighbors: new Set(),
                energyDistance: {} // Will store { energyType: distance }
            });
        });

        // STEP 2: Populate neighbors based on explicit connections
        explicitConnections.forEach(connection => {
            const entity1Data = circleMap.get(connection.entity1Id);
            const entity2Data = circleMap.get(connection.entity2Id);
            
            if (entity1Data && entity2Data) {
                entity1Data.neighbors.add(connection.entity2Id);
                entity2Data.neighbors.add(connection.entity1Id);
            }
        });

        // STEP 3: Find active circles with energy types and set their energy distance to 0
        circleMap.forEach((circleData, circleId) => {
            const circle = circleData.circle;
            if (circle.activation === 'activated' && circle.energyTypes && circle.energyTypes.length > 0) {
                circle.energyTypes.forEach(energyType => {
                    circleData.energyDistance[energyType] = 0;
                });
            }
        });

        // STEP 4: Propagate energy in waves, incrementing by 2 each time
        let currentDistance = 0;
        let hasChanges = true;

        while (hasChanges) {
            hasChanges = false;

            // Find all circles at current distance for any energy type
            const circlesAtCurrentDistance = [];
            circleMap.forEach((circleData, circleId) => {
                this.energyTypes.forEach(energyType => {
                    if (circleData.energyDistance[energyType] === currentDistance) {
                        circlesAtCurrentDistance.push({
                            circleId,
                            circleData,
                            energyType
                        });
                    }
                });
            });

            // Propagate energy from circles at current distance to their neighbors
            circlesAtCurrentDistance.forEach(({ circleId, circleData, energyType }) => {
                const sourceCircle = circleData.circle;
                
                // Check if this circle can propagate this energy type
                const canPropagate = this.canCirclePropagateEnergyType(sourceCircle, energyType);
                
                if (canPropagate) {
                    circleData.neighbors.forEach(neighborId => {
                        const neighborData = circleMap.get(neighborId);
                        if (neighborData) {
                            const newDistance = currentDistance + 2;
                            
                            // Only set if neighbor doesn't have this energy type yet, or if new distance is lower
                            if (neighborData.energyDistance[energyType] === undefined || 
                                neighborData.energyDistance[energyType] > newDistance) {
                                neighborData.energyDistance[energyType] = newDistance;
                                hasChanges = true;
                            }
                        }
                    });
                }
            });

            currentDistance += 2;
            
            // Safety valve to prevent infinite loops
            if (currentDistance > 100) {
                console.warn('EnergyDistanceCalculator: Reached maximum iteration limit');
                break;
            }
        }

        // STEP 5: Calculate energy distances for explicit connections
        const connectionEnergyDistances = this.calculateConnectionEnergyDistances(explicitConnections, circleMap);

        // STEP 6: Convert to final result map
        const resultMap = new Map();
        circleMap.forEach((circleData, circleId) => {
            resultMap.set(circleId, circleData.energyDistance);
        });

        return {
            circles: resultMap,
            connections: connectionEnergyDistances
        };
    }

    calculateConnectionEnergyDistances(explicitConnections, circleMap) {
        const connectionEnergyDistances = new Map();

        explicitConnections.forEach(connection => {
            const entity1Data = circleMap.get(connection.entity1Id);
            const entity2Data = circleMap.get(connection.entity2Id);

            if (entity1Data && entity2Data) {
                const connectionEnergyDistance = {};

                // Get all energy types present in either connected circle
                const allEnergyTypes = new Set([
                    ...Object.keys(entity1Data.energyDistance),
                    ...Object.keys(entity2Data.energyDistance)
                ]);

                allEnergyTypes.forEach(energyType => {
                    const distance1 = entity1Data.energyDistance[energyType];
                    const distance2 = entity2Data.energyDistance[energyType];

                    // Only calculate connection distance if both circles have this energy type
                    if (distance1 !== undefined && distance2 !== undefined) {
                        // Connection gets the average of the two distances (which will be an odd number)
                        connectionEnergyDistance[energyType] = (distance1 + distance2) / 2;
                    }
                });

                connectionEnergyDistances.set(connection.id, connectionEnergyDistance);
            }
        });

        return connectionEnergyDistances;
    }

    canCirclePropagateEnergyType(circle, energyType) {
        // Inert circles cannot propagate any energy
        if (circle.activation === 'inert') {
            return false;
        }

        // Circle must have the energy type to propagate it
        if (!circle.energyTypes || !circle.energyTypes.includes(energyType)) {
            return false;
        }

        return true;
    }

    formatEnergyDistanceForDisplay(energyDistance) {
        if (!energyDistance || Object.keys(energyDistance).length === 0) {
            return '';
        }

        const shortNames = {
            exciter: 'E',
            dampener: 'D',
            stabilizer: 'S',
            amplifier: 'A'
        };

        return Object.entries(energyDistance)
            .sort(([a], [b]) => a.localeCompare(b)) // Sort alphabetically for consistency
            .map(([energyType, distance]) => {
                const shortName = shortNames[energyType] || energyType.charAt(0).toUpperCase();
                return `${shortName}:${distance}`;
            })
            .join(' ');
    }

    updateEnergyTypes(newEnergyTypes) {
        this.energyTypes = [...newEnergyTypes];
    }
}
