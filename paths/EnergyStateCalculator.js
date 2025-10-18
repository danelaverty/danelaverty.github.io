// EnergyStateCalculator.js - Calculates energized states using cellular automaton rules

export class EnergyStateCalculator {
    constructor() {
        this.ENERGY_TYPES = {
            EXCITER: 'exciter',
            DAMPENER: 'dampener'
        };
    }

    /**
     * Calculate energized state for a circle based on cellular automaton rules
     * Rules applied in order:
     * 1. Has a dampened inbound connection? "dampened"
     * 2. Is an activated non-dampened exciter? "excited"
     * 3. Has an excited inbound connection? "excited"
     * 4. Else, "unenergized"
     */
    calculateCircleEnergized(circle, connections, connectionStates) {
        // Rule 1: Has a dampened inbound connection?
        const inboundConnections = this.getInboundConnectionsForCircle(circle.id, connections);
        for (const connection of inboundConnections) {
            const connectionState = connectionStates.get(connection.id);
            if (connectionState && connectionState.energized === 'dampened') {
                return 'dampened';
            }
        }

        // Rule 2: Is an activated non-dampened exciter?
        if (circle.activation === 'activated' && 
            circle.energyTypes && 
            circle.energyTypes.includes(this.ENERGY_TYPES.EXCITER)) {
            // Check if this circle itself is dampened (will be determined in next iteration)
            // For now, if we made it past rule 1, this circle is not currently dampened
            return 'excited';
        }

        // Rule 3: Has an excited inbound connection?
        for (const connection of inboundConnections) {
            const connectionState = connectionStates.get(connection.id);
            if (connectionState && connectionState.energized === 'excited') {
                return 'excited';
            }
        }

        // Rule 4: Else, unenergized
        return 'unenergized';
    }

    /**
     * Calculate energized state for a connection based on cellular automaton rules
     * Rules applied in order:
     * 1. Can carry dampener energy & has shiny dampener inbound circle? "dampened"
     * 2. Can carry exciter energy & has shiny exciter inbound circle? "excited"
     * 3. Else, "unenergized"
     */
    calculateConnectionEnergized(connection, circles, circleStates) {
        const entity1 = circles.get(connection.entity1Id);
        const entity2 = circles.get(connection.entity2Id);

        if (!entity1 || !entity2) {
            return 'unenergized';
        }

        // Get inbound circles for this connection
        const inboundCircles = this.getInboundCirclesForConnection(connection, entity1, entity2);

        // Rule 1: Can carry dampener energy & has shiny dampener inbound circle?
        if (this.canConnectionCarryEnergyType(connection, this.ENERGY_TYPES.DAMPENER)) {
            for (const circle of inboundCircles) {
                const circleState = circleStates.get(circle.id);
                if (circleState && 
                    circleState.shinyness === 'shiny' &&
                    circle.energyTypes && 
                    circle.energyTypes.includes(this.ENERGY_TYPES.DAMPENER)) {
                    return 'dampened';
                }
            }
        }

        // Rule 2: Can carry exciter energy & has shiny exciter inbound circle?
        if (this.canConnectionCarryEnergyType(connection, this.ENERGY_TYPES.EXCITER)) {
            for (const circle of inboundCircles) {
                const circleState = circleStates.get(circle.id);
                if (circleState && 
                    circleState.shinyness === 'shiny' &&
                    circle.energyTypes && 
                    circle.energyTypes.includes(this.ENERGY_TYPES.EXCITER)) {
                    return 'excited';
                }
            }
        }

        // Rule 3: Else, unenergized
        return 'unenergized';
    }

    /**
     * Calculate shinyness for a circle based on energized state and activation
     * Rules:
     * - Is activated & non-dampened? "shiny"
     * - Is activated & dampened? "dull"
     * - Is inactive & non-excited? "dull"
     * - Is inactive & excited? "shiny"
     * - Is inert? "default"
     */
    calculateCircleShinyness(circle, energized) {
        if (circle.activation === 'inert') {
            return 'default';
        }

        if (circle.activation === 'activated') {
            return energized === 'dampened' ? 'dull' : 'shiny';
        }

        if (circle.activation === 'inactive') {
            return energized === 'excited' ? 'shiny' : 'dull';
        }

        return 'default';
    }

    /**
     * Get inbound connections for a circle
     * A connection is "inbound" to a circle if:
     * - directionality is 'none' or 'both', OR
     * - directionality points towards the circle
     */
    getInboundConnectionsForCircle(circleId, connections) {
        return connections.filter(connection => {
            // Check if circle is part of this connection
            const isEntity1 = connection.entity1Id === circleId;
            const isEntity2 = connection.entity2Id === circleId;
            
            if (!isEntity1 && !isEntity2) {
                return false;
            }

            const directionality = connection.directionality || 'none';

            // 'none' and 'both' are always inbound
            if (directionality === 'none' || directionality === 'both') {
                return true;
            }

            // 'out' means entity1 → entity2
            // So it's inbound to entity2
            if (directionality === 'out') {
                return isEntity2;
            }

            // 'in' means entity2 → entity1
            // So it's inbound to entity1
            if (directionality === 'in') {
                return isEntity1;
            }

            return false;
        });
    }

    /**
     * Get inbound circles for a connection
     * A circle is "inbound" to a connection if:
     * - directionality is 'none' or 'both', OR
     * - directionality points away from the circle
     */
    getInboundCirclesForConnection(connection, entity1, entity2) {
        const directionality = connection.directionality || 'none';
        
        // 'none' and 'both' mean all circles are inbound
        if (directionality === 'none' || directionality === 'both') {
            return [entity1, entity2];
        }

        // 'out' means entity1 → entity2
        // So entity1 is inbound (flow comes from entity1)
        if (directionality === 'out') {
            return [entity1];
        }

        // 'in' means entity2 → entity1
        // So entity2 is inbound (flow comes from entity2)
        if (directionality === 'in') {
            return [entity2];
        }

        return [];
    }

    /**
     * Check if a connection can carry a specific energy type
     * - If connection has no energyTypes specified, it can carry all types
     * - If connection has energyTypes specified, check if the type is included
     */
    canConnectionCarryEnergyType(connection, energyType) {
        // Check connectionEnergyTypes property (for explicit connections)
        if (connection.connectionEnergyTypes && connection.connectionEnergyTypes.length > 0) {
            return connection.connectionEnergyTypes.includes(energyType);
        }

        // No energy types specified = can carry all types
        return true;
    }

    /**
     * Convert shinyness state to numeric value for ShinynessEffectsTranslator
     * - "shiny" → 1.0
     * - "dull" → 0.0
     * - "default" → null (for inert circles)
     */
    convertShininessToNumeric(shinyness) {
        switch (shinyness) {
            case 'shiny':
                return 1.0;
            case 'dull':
                return 0.0;
            case 'default':
                return null;
            default:
                return 0.0;
        }
    }
}
