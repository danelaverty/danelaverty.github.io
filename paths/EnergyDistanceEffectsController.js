// EnergyDistanceEffectsController.js - Manages delayed cascade effects for energy distance visualization
export class EnergyDistanceEffectsController {
    constructor() {
        this.activeEffects = new Map(); // entityId -> { effectType: energyType, startTime: timestamp }
        this.scheduledTimeouts = new Set();
        this.animationDelay = 900; // ms per hop
        this.currentAnimationId = 0;
        this.energizedConnections = new Map();
    }

    findConnectionById(connectionId) {
        return this.connectionsArray?.find(conn => conn.id === connectionId) || null;
    }

clearAllActiveEffects(onCircleEffectChange, onConnectionEffectChange) {
    this.activeEffects.forEach((effect, key) => {
        const [entityType, entityId] = key.split('-', 2);

        if (entityType === 'connection') {
            // Clear energized marker from connection object
            const connection = this.findConnectionById(entityId);
            if (connection && connection.energizedWith) {
                delete connection.energizedWith;
            }
            onConnectionEffectChange(entityId, effect.effectType, effect.energyType, false);
        } else if (entityType === 'circle') {
            onCircleEffectChange(entityId, effect.effectType, effect.energyType, false);
        }
    });

    this.energizedConnections.clear();
}

getEnergizedTypesForConnection(connectionId) {
    return this.energizedConnections.get(connectionId) || [];
}

    startEnergyCascade(energyDistancesData, onCircleEffectChange, onConnectionEffectChange, connectionsArray = null) {
        this.connectionsArray = connectionsArray;

        // Cancel any existing animation
        this.cancelCurrentAnimation();
        this.clearAllActiveEffects(onCircleEffectChange, onConnectionEffectChange);
        
        const animationId = ++this.currentAnimationId;
        const { circles, connections } = energyDistancesData;

        if (circles.size === 0 && connections.size === 0) {
            return; // No effects to apply
        }
        
        // Group effects by distance for timing
        const effectsByDistance = this.groupEffectsByDistance(circles, connections);
        
        // Schedule effects at appropriate delays
        Object.keys(effectsByDistance).forEach(distance => {
            const distanceNum = parseInt(distance);
            const delay = this.calculateDelay(distanceNum);

const timeoutId = setTimeout(() => {
    // Check if this animation is still current FIRST
    if (animationId !== this.currentAnimationId) {
        return;
    }
    
    // Additional check: verify this timeout is still in our scheduled set
    if (!this.scheduledTimeouts.has(timeoutId)) {
        return;
    }

    // Remove from scheduled set after confirming we should proceed
    this.scheduledTimeouts.delete(timeoutId);

    this.applyEffectsAtDistance(
        effectsByDistance[distance],
        distanceNum,
        onCircleEffectChange,
        onConnectionEffectChange
    );
}, delay);

            this.scheduledTimeouts.add(timeoutId);
        });
    }

    /**
     * Group effects by their distance for timing purposes
     */
    groupEffectsByDistance(circles, connections) {
        const effectsByDistance = {};
        
        // Process circles
        circles.forEach((energyDistance, circleId) => {
            Object.entries(energyDistance).forEach(([energyType, distance]) => {
                if (!effectsByDistance[distance]) {
                    effectsByDistance[distance] = { circles: [], connections: [] };
                }
                
                effectsByDistance[distance].circles.push({
                    id: circleId,
                    energyType,
                    distance,
                    effectType: this.getCircleEffectType(energyType)
                });
            });
        });
        
        // Process connections
        connections.forEach((energyDistance, connectionId) => {
            Object.entries(energyDistance).forEach(([energyType, distance]) => {
                if (!effectsByDistance[distance]) {
                    effectsByDistance[distance] = { circles: [], connections: [] };
                }
                
                effectsByDistance[distance].connections.push({
                    id: connectionId,
                    energyType,
                    distance,
                    effectType: this.getConnectionEffectType(energyType)
                });
            });
        });
        
        return effectsByDistance;
    }

    /**
     * Calculate delay based on distance
     */
    calculateDelay(distance) {
        // Distance 0 = immediate, distance 1 = 0ms, distance 2 = 900ms, etc.
        if (distance <= 1) return 0;
        return this.animationDelay * (distance - 1);
    }

    /**
     * Determine what visual effect a circle should get based on energy type
     */
    getCircleEffectType(energyType) {
        switch (energyType) {
            case 'exciter':
                return 'activate-shiny'; // Make inactive circles shiny
            case 'dampener':
                return 'deactivate-shiny'; // Make active circles non-shiny
            default:
                return null;
        }
    }

    /**
     * Determine what CSS class a connection should get based on energy type
     */
    getConnectionEffectType(energyType) {
        switch (energyType) {
            case 'exciter':
                return 'exciter-connection';
            case 'dampener':
                return 'dampener-connection';
            case 'stabilizer':
                return 'stabilizer-connection';
            case 'amplifier':
                return 'amplifier-connection';
            default:
                return null;
        }
    }

    /**
     * Apply visual effects at a specific distance
     */
applyEffectsAtDistance(effects, distance, onCircleEffectChange, onConnectionEffectChange) {
    const timestamp = Date.now();
    
    
    // Apply circle effects
    effects.circles.forEach(effect => {
        if (effect.effectType) {
            this.activeEffects.set(`circle-${effect.id}`, {
                effectType: effect.effectType,
                energyType: effect.energyType,
                startTime: timestamp,
                distance: distance
            });
            
            onCircleEffectChange(effect.id, effect.effectType, effect.energyType, true);
        }
    });
    
    // Apply connection effects
    effects.connections.forEach(effect => {
        
        if (effect.effectType) {
            this.activeEffects.set(`connection-${effect.id}`, {
                effectType: effect.effectType,
                energyType: effect.energyType,
                startTime: timestamp,
                distance: distance
            });

            const connection = this.findConnectionById(effect.id);
            if (connection) {
                // Store energized state internally instead of on the connection object
                if (!this.energizedConnections.has(effect.id)) {
                    this.energizedConnections.set(effect.id, []);
                }
                if (!this.energizedConnections.get(effect.id).includes(effect.energyType)) {
                    this.energizedConnections.get(effect.id).push(effect.energyType);
                }
            }
            
            onConnectionEffectChange(effect.id, effect.effectType, effect.energyType, true);
        }
    });
}

    /**
     * Cancel current animation and clear all effects
     */
cancelCurrentAnimation() {
    // Clear all scheduled timeouts
    this.scheduledTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
    });
    this.scheduledTimeouts.clear();
    
    // Increment animation ID to invalidate any running timeouts
    this.currentAnimationId++;
}

    /**
     * Get current active effects for an entity
     */
    getActiveEffectsForEntity(entityId, entityType) {
        const key = `${entityType}-${entityId}`;
        return this.activeEffects.get(key) || null;
    }

    /**
     * Check if an entity currently has a specific effect active
     */
    hasActiveEffect(entityId, entityType, effectType) {
        const effects = this.getActiveEffectsForEntity(entityId, entityType);
        return effects && effects.effectType === effectType;
    }

    /**
     * Get all currently active effects (for debugging)
     */
    getAllActiveEffects() {
        return new Map(this.activeEffects);
    }

    /**
     * Update animation timing
     */
    setAnimationDelay(delayMs) {
        this.animationDelay = delayMs;
    }

    /**
     * Check if any animations are currently running
     */
    isAnimating() {
        return this.scheduledTimeouts.size > 0;
    }
}
