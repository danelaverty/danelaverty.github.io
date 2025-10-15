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
        this.delayedDampenerConnections = new Map(); // connectionId -> timeout info
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

    scheduleDampenerConnection(connectionId) {
        // Clear existing timeout for this connection
        if (this.delayedDampenerConnections.has(connectionId)) {
            const existing = this.delayedDampenerConnections.get(connectionId);
            if (existing.timeoutId) {
                clearTimeout(existing.timeoutId);
            }
        }
        
        // Dampener energy doesn't cascade, so it's always immediate (distance 0)
        // But we still add a small delay for visual effect
        const delay = this.animationDelay * 0.5; // Half delay for dampener
        
        const timeoutId = setTimeout(() => {
            this.delayedDampenerConnections.set(connectionId, {
                active: true,
                timeoutId: null
            });
            
            // Trigger reactivity
            if (this.triggerReactivityUpdate) {
                this.triggerReactivityUpdate();
            }
        }, delay);
        
        this.delayedDampenerConnections.set(connectionId, {
            active: false,
            timeoutId: timeoutId
        });
    }

    getActiveConnectionEnergyTypes(connectionId) {
        return this.delayedConnectionEnergy.get(connectionId) || new Set();
    }

    isDampenerConnectionActive(connectionId) {
        const state = this.delayedDampenerConnections.get(connectionId);
        return state && state.active === true;
    }

    calculateShinyness(circle, energyDistanceMap = null, dampenedCircles = null) {
        if (!circle) return 0.0;
        
        if (circle.activation === 'inert') return null;
        
        // Check if this circle is dampened
        if (dampenedCircles && dampenedCircles.has(circle.id)) {
            // Dampened circles are always dull (0.0)
            return 0.0;
        }
        
        // For ACTIVATED circles (not dampened)
        if (circle.activation === 'activated') {
            return 1.0; // Always shiny
        }
        
        // For INACTIVE circles
        if (circle.activation === 'inactive') {
            // Check if we have a delayed shiny state active
            const delayedState = this.delayedShinyStates.get(circle.id);
            if (delayedState && delayedState.shinyness === 1.0) {
                return 1.0;
            }
            
            // Check if we should schedule a delayed shiny effect from exciter energy
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

    clearDampenerConnection(connectionId) {
        const existing = this.delayedDampenerConnections.get(connectionId);
        if (existing && existing.timeoutId) {
            clearTimeout(existing.timeoutId);
        }
        this.delayedDampenerConnections.delete(connectionId);
    }

    clearAllDelayedStates() {
        // Clear existing circle logic
        this.delayedShinyStates.forEach((state, circleId) => {
            this.clearDelayedState(circleId);
        });
        
        // Clear completed connection energy states
        this.delayedConnectionEnergy.clear();
        
        // Clear dampener connections
        this.delayedDampenerConnections.forEach((state, connectionId) => {
            this.clearDampenerConnection(connectionId);
        });
    }

    setReactivityTrigger(triggerFn) {
        this.triggerReactivityUpdate = triggerFn;
    }

    // Keep existing methods for compatibility
    calculateShinynessForCircles(circles, energyDistanceMap = null, dampenedCircles = null) {
        const shinynessMap = new Map();
        
        for (const circle of circles) {
            const shinyness = this.calculateShinyness(circle, energyDistanceMap, dampenedCircles);
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
