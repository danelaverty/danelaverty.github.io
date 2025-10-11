export class ShinynessCalculator {
    constructor() {
        this.activationRules = {
            activated: 1.0,
            inactive: 0.0,
            inert: null
        };
        this.delayedShinyStates = new Map(); // circleId -> { shinyness, timeoutId }
        this.animationDelay = 900; // ms per hop
        this.triggerReactivityUpdate = null; // Will be set by CircleViewer
        this.delayedConnectionEnergy = new Map(); // connectionId -> Set of active energy types
        this.connectionTimeouts = new Map(); // connectionId-energyType -> timeoutId
    }

scheduleConnectionEnergy(connectionId, energyType, distance) {
    const key = `${connectionId}-${energyType}`;
    
    // Clear existing timeout for this connection-energy combo
    if (this.connectionTimeouts.has(key)) {
        clearTimeout(this.connectionTimeouts.get(key));
    }
    
    const delay = this.animationDelay * Math.max(0, distance / 2);
    
    const timeoutId = setTimeout(() => {
        // Add energy type to active set
        if (!this.delayedConnectionEnergy.has(connectionId)) {
            this.delayedConnectionEnergy.set(connectionId, new Set());
        }
        this.delayedConnectionEnergy.get(connectionId).add(energyType);
        
        // Clean up timeout reference
        this.connectionTimeouts.delete(key);
        
        // Trigger reactivity
        if (this.triggerReactivityUpdate) {
            this.triggerReactivityUpdate();
        }
    }, delay);
    
    this.connectionTimeouts.set(key, timeoutId);
}

getActiveConnectionEnergyTypes(connectionId) {
    return this.delayedConnectionEnergy.get(connectionId) || new Set();
}

    calculateShinyness(circle, energyDistanceMap = null) {
        if (!circle) return 0.0;
        
        if (circle.activation === 'inert') return null;
        if (circle.activation === 'activated') return 1.0;
        
        // For inactive circles, check both immediate and delayed shiny states
        if (circle.activation === 'inactive') {
            // Check if we have a delayed shiny state active
            const delayedState = this.delayedShinyStates.get(circle.id);
            if (delayedState && delayedState.shinyness === 1.0) {
                return 1.0;
            }
            
            // Check if we should schedule a delayed shiny effect
            if (energyDistanceMap) {
                const distances = energyDistanceMap.get(circle.id);
                if (distances && distances.exciter !== undefined && distances.exciter > 0) {
                    this.scheduleDelayedShinyness(circle.id, distances.exciter);
                }
            }
        }
        
        return 0.0;
    }

    scheduleDelayedShinyness(circleId, distance) {
        // Don't reschedule if already scheduled for this distance
        const existing = this.delayedShinyStates.get(circleId);
        if (existing && existing.scheduledForDistance === distance) {
            return;
        }
        
        // Clear any existing timeout for this circle
        this.clearDelayedState(circleId);
        
        const delay = this.animationDelay * Math.max(0, distance / 2);
        
        const timeoutId = setTimeout(() => {
            this.delayedShinyStates.set(circleId, { 
                shinyness: 1.0, 
                timeoutId: null,
                scheduledForDistance: distance
            });
            
            // Trigger Vue reactivity update
            if (this.triggerReactivityUpdate) {
                this.triggerReactivityUpdate();
            }
        }, delay);
        
        this.delayedShinyStates.set(circleId, { 
            shinyness: 0.0, 
            timeoutId: timeoutId,
            scheduledForDistance: distance
        });
    }

    clearDelayedState(circleId) {
        const existing = this.delayedShinyStates.get(circleId);
        if (existing && existing.timeoutId) {
            clearTimeout(existing.timeoutId);
        }
        this.delayedShinyStates.delete(circleId);
    }

clearConnectionEnergy(connectionId) {
    // Clear all energy types for this connection
    this.delayedConnectionEnergy.delete(connectionId);
    
    // Clear all pending timeouts for this connection
    const keysToDelete = [];
    this.connectionTimeouts.forEach((timeoutId, key) => {
        if (key.startsWith(`${connectionId}-`)) {
            clearTimeout(timeoutId);
            keysToDelete.push(key);
        }
    });
    
    keysToDelete.forEach(key => this.connectionTimeouts.delete(key));
}

clearAllDelayedStates() {
    // Clear existing circle logic (keep this part)
    this.delayedShinyStates.forEach((state, circleId) => {
        this.clearDelayedState(circleId);
    });
    
    // Clear completed connection energy states (so cascades end when connections break)
    this.delayedConnectionEnergy.clear();
}

    setReactivityTrigger(triggerFn) {
        this.triggerReactivityUpdate = triggerFn;
    }

    // Keep existing methods for compatibility
    calculateShinynessForCircles(circles, energizedConnectionsData = null) {
        const shinynessMap = new Map();
        
        for (const circle of circles) {
            const shinyness = this.calculateShinyness(circle, null); // energyDistanceMap passed separately now
            shinynessMap.set(circle.id, shinyness);
        }

        return shinynessMap;
    }

    getAdditiveOrConnectionMultiplier(circle, energizedConnectionsData) {
        // Only apply to circles with additiveOr receive mode
        if (circle.shinynessReceiveMode !== 'additiveOr') {
            return 1;
        }

        if (!energizedConnectionsData || !energizedConnectionsData.has(circle.id)) {
            return 1;
        }

        const connectionCounts = energizedConnectionsData.get(circle.id);
        if (!connectionCounts) {
            return 1;
        }

        // Count total energized connections across all energy types
        let totalEnergizedConnections = 0;
        Object.entries(connectionCounts).forEach(([key, count]) => {
            if (key.endsWith('-connections')) {
                totalEnergizedConnections += count;
            }
        });

        // If 0 or 1 connection, use base multiplier (1)
        // If 2+ connections, use connection count as multiplier
        return Math.max(1, totalEnergizedConnections);
    }
}
