// EnergyDistanceCalculator.js - Calculates energy propagation distances with dampening support
export class EnergyDistanceCalculator {
    constructor() {
        this.energyTypes = ['exciter', 'dampener'];
    }

    calculateEnergyDistanceForAllCirclesInCircleViewer(circles, explicitConnections) {
        // STEP 1: Create a map of circles with energy distance tracking
        const circleMap = new Map();
        circles.forEach(circle => {
            circleMap.set(circle.id, {
                circle: circle,
                neighbors: new Set(),
                neighborConnections: new Map(), // Map neighbor ID to connection object
                energyDistance: {} // Will store { exciter: distance } (no dampener distances)
            });
        });

        // STEP 2: Populate neighbors based on explicit connections
        explicitConnections.forEach(connection => {
            const entity1Data = circleMap.get(connection.entity1Id);
            const entity2Data = circleMap.get(connection.entity2Id);
            
            if (entity1Data && entity2Data) {
                entity1Data.neighbors.add(connection.entity2Id);
                entity2Data.neighbors.add(connection.entity1Id);
                
                // Store connection references for directionality checking
                entity1Data.neighborConnections.set(connection.entity2Id, connection);
                entity2Data.neighborConnections.set(connection.entity1Id, connection);
            }
        });

        // STEP 3: Identify activated dampeners
        const activatedDampeners = new Set();
        circleMap.forEach((circleData, circleId) => {
            const circle = circleData.circle;
            if (circle.activation === 'activated' && 
                circle.energyTypes && 
                circle.energyTypes.includes('dampener')) {
                activatedDampeners.add(circleId);
            }
        });

        // STEP 4: Mark dampened dampeners (dampeners receiving from immediate neighbor dampeners)
        const dampenedCircles = new Set();
        const dampenerConnections = new Map(); // Track dampening connections for visualization
        
        activatedDampeners.forEach(dampenerId => {
            const dampenerData = circleMap.get(dampenerId);
            const dampenerCircle = dampenerData.circle;
            
            // Check each immediate neighbor
            dampenerData.neighbors.forEach(neighborId => {
                const neighborData = circleMap.get(neighborId);
                const neighborCircle = neighborData.circle;
                
                // Check if neighbor is also an activated dampener
                if (activatedDampeners.has(neighborId)) {
                    // Check if energy flow is allowed through this connection (dampener -> this dampener)
                    const connection = neighborData.neighborConnections.get(dampenerId);
                    const flowAllowed = this.canEnergyFlowThroughConnection(
                        connection,
                        neighborId,  // from neighbor dampener
                        dampenerId,  // to this dampener
                        'dampener',
                        circleMap
                    );
                    
                    if (flowAllowed) {
                        // This dampener is dampened by a neighbor dampener
                        dampenedCircles.add(dampenerId);
                        
                        // Track this dampening connection for visualization
                        const connectionId = connection ? connection.id : `proximity-${neighborId}-${dampenerId}`;
                        dampenerConnections.set(connectionId, {
                            dampenerId: neighborId,
                            targetId: dampenerId
                        });
                    }
                }
            });
        });

        // STEP 5: Mark other dampened circles (any circle receiving from non-dampened dampeners)
        const nonDampenedDampeners = new Set([...activatedDampeners].filter(id => !dampenedCircles.has(id)));
        
        nonDampenedDampeners.forEach(dampenerId => {
            const dampenerData = circleMap.get(dampenerId);
            
            // Check each immediate neighbor
            dampenerData.neighbors.forEach(neighborId => {
                const neighborData = circleMap.get(neighborId);
                const neighborCircle = neighborData.circle;
                
                // Check if energy flow is allowed through this connection (dampener -> neighbor)
                const connection = dampenerData.neighborConnections.get(neighborId);
                const flowAllowed = this.canEnergyFlowThroughConnection(
                    connection,
                    dampenerId,
                    neighborId,
                    'dampener',
                    circleMap
                );
                
                if (flowAllowed) {
                    // This neighbor is dampened
                    dampenedCircles.add(neighborId);
                    
                    // Track this dampening connection for visualization
                    const connectionId = connection ? connection.id : `proximity-${dampenerId}-${neighborId}`;
                    dampenerConnections.set(connectionId, {
                        dampenerId: dampenerId,
                        targetId: neighborId
                    });
                }
            });
        });

        // STEP 6: Find active exciters and set their energy distance to 0 (excluding dampened circles)
        circleMap.forEach((circleData, circleId) => {
            const circle = circleData.circle;
            
            // Skip dampened circles - they can't send exciter energy
            if (dampenedCircles.has(circleId)) {
                return;
            }
            
            if (circle.activation === 'activated' && 
                circle.energyTypes && 
                circle.energyTypes.includes('exciter')) {
                circleData.energyDistance['exciter'] = 0;
            }
        });

        // STEP 7: Propagate exciter energy in waves (excluding dampened circles)
        let currentDistance = 0;
        let hasChanges = true;

        while (hasChanges) {
            hasChanges = false;

            // Find all circles at current distance for exciter energy
            const circlesAtCurrentDistance = [];
            circleMap.forEach((circleData, circleId) => {
                if (circleData.energyDistance['exciter'] === currentDistance) {
                    circlesAtCurrentDistance.push({
                        circleId,
                        circleData
                    });
                }
            });

            // Propagate exciter energy from circles at current distance to their neighbors
            circlesAtCurrentDistance.forEach(({ circleId, circleData }) => {
                const sourceCircle = circleData.circle;
                
                // Skip dampened circles - they can't propagate exciter energy
                if (dampenedCircles.has(circleId)) {
                    return;
                }
                
                // Check if this circle can propagate exciter energy
                const canPropagate = this.canCirclePropagateEnergyType(sourceCircle, 'exciter');
                
                if (canPropagate) {
                    circleData.neighbors.forEach(neighborId => {
                        const neighborData = circleMap.get(neighborId);
                        
                        // Skip dampened neighbors - they can't receive or propagate exciter energy
                        if (dampenedCircles.has(neighborId)) {
                            return;
                        }
                        
                        if (neighborData) {
                            // Check if energy flow is allowed through this connection
                            const connection = circleData.neighborConnections.get(neighborId);
                            const flowAllowed = this.canEnergyFlowThroughConnection(
                                connection,
                                circleId,
                                neighborId,
                                'exciter',
                                circleMap
                            );
                            
                            if (flowAllowed) {
                                const newDistance = currentDistance + 2;
                                
                                // Only set if neighbor doesn't have exciter energy yet, or if new distance is lower
                                if (neighborData.energyDistance['exciter'] === undefined || 
                                    neighborData.energyDistance['exciter'] > newDistance) {
                                    neighborData.energyDistance['exciter'] = newDistance;
                                    hasChanges = true;
                                }
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

        // STEP 8: Calculate energy distances for explicit connections (exciter only)
        const connectionEnergyDistances = this.calculateConnectionEnergyDistances(explicitConnections, circleMap, dampenedCircles);

        // STEP 9: Convert to final result map
        const resultMap = new Map();
        circleMap.forEach((circleData, circleId) => {
            resultMap.set(circleId, circleData.energyDistance);
        });

        return {
            circles: resultMap,
            connections: connectionEnergyDistances,
            dampenedCircles: dampenedCircles,
            dampenerConnections: dampenerConnections
        };
    }

    /**
     * Check if energy can flow through a connection based on directionality
     */
    canEnergyFlowThroughConnection(connection, sourceCircleId, targetCircleId, energyType, circleMap) {
        // If no connection object, this is a proximity connection - always allow
        if (!connection) {
            return true;
        }

        // If connection has no directionality or is 'none' or 'both', always allow
        const directionality = connection.directionality;
        if (!directionality || directionality === 'none' || directionality === 'both') {
            return true;
        }

        // Determine actual flow direction based on entity1/entity2 in the connection
        const isFlowingEntity1ToEntity2 = (sourceCircleId === connection.entity1Id && targetCircleId === connection.entity2Id);
        const isFlowingEntity2ToEntity1 = (sourceCircleId === connection.entity2Id && targetCircleId === connection.entity1Id);

        // Check if directionality allows this flow
        if (directionality === 'out') {
            // 'out' allows entity1 → entity2 only
            return isFlowingEntity1ToEntity2;
        } else if (directionality === 'in') {
            // 'in' allows entity2 → entity1 only
            return isFlowingEntity2ToEntity1;
        }

        // Shouldn't reach here, but default to allowing flow
        return true;
    }

    calculateConnectionEnergyDistances(explicitConnections, circleMap, dampenedCircles) {
        const connectionEnergyDistances = new Map();

        explicitConnections.forEach(connection => {
            const entity1Data = circleMap.get(connection.entity1Id);
            const entity2Data = circleMap.get(connection.entity2Id);

            if (entity1Data && entity2Data) {
                const connectionEnergyDistance = {};

                // Only calculate exciter energy (dampener doesn't cascade)
                const distance1 = entity1Data.energyDistance['exciter'];
                const distance2 = entity2Data.energyDistance['exciter'];

                // Only calculate connection distance if both circles have exciter energy and neither is dampened
                if (distance1 !== undefined && distance2 !== undefined &&
                    !dampenedCircles.has(connection.entity1Id) && 
                    !dampenedCircles.has(connection.entity2Id)) {
                    
                    // Check if energy can actually propagate through this connection
                    const circle1CanPropagate = this.canCirclePropagateEnergyType(entity1Data.circle, 'exciter');
                    const circle2CanPropagate = this.canCirclePropagateEnergyType(entity2Data.circle, 'exciter');
                    
                    if (circle1CanPropagate || circle2CanPropagate) {
                        // Connection gets the average of the two distances (which will be an odd number)
                        connectionEnergyDistance['exciter'] = (distance1 + distance2) / 2;
                    }
                }

                if (Object.keys(connectionEnergyDistance).length > 0) {
                    connectionEnergyDistances.set(connection.id, connectionEnergyDistance);
                }
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

        return Object.entries(energyDistance)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([energyType, distance]) => {
                const shortName = energyType[0] || energyType.charAt(0).toUpperCase();
                return `${shortName}:${distance}`;
            })
            .join(' ');
    }

    updateEnergyTypes(newEnergyTypes) {
        this.energyTypes = [...newEnergyTypes];
    }
}
