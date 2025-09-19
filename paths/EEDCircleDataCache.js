export class EEDCircleDataCache {
    constructor(dataStore) {
        this.dataStore = dataStore;
        
        // Circle data caching
        this.circleDataCache = new Map(); // circleId -> { circle, energyTypes, activation, computed flags }
        this.connectionMetadataCache = new Map(); // circleId -> { exciterCount, dampenerCount }
    }

    /**
     * Check if a circle has a specific energy type
     */
    hasEnergyType(circle, energyType) {
        return circle.energyTypes && circle.energyTypes.includes(energyType);
    }

    /**
     * Check if a circle is activated
     */
    isCircleActivated(circle) {
        return circle.activation === 'activated';
    }

    /**
     * Check if a circle is glow type (can be affected by energy)
     */
    isGlowCircle(circle) {
        return true; // All circles can be affected by energy in this system
    }

    /**
     * Get cached circle data or fetch and cache it
     */
    getCachedCircleData(circleId) {
        if (!this.circleDataCache.has(circleId)) {
            const circle = this.dataStore.getCircle(circleId);
            if (circle) {
                this.circleDataCache.set(circleId, {
                    circle,
                    energyTypes: circle.energyTypes || [],
                    activation: circle.activation,
                    isActivated: this.isCircleActivated(circle),
                    isExciter: this.hasEnergyType(circle, 'exciter'),
                    isIgniter: this.hasEnergyType(circle, 'igniter'),
                    isDampener: this.hasEnergyType(circle, 'dampener')
                });
            }
        }
        return this.circleDataCache.get(circleId);
    }

    /**
     * Calculate connection metadata for shinynessReceiveMode
     * @param {string} targetCircleId - The circle receiving energy
     * @param {string} energyType - 'exciter', 'igniter', or 'dampener'
     * @param {Function} getConnectionsForCircle - Function to get connections for a circle
     * @returns {Object} { totalConnected, activeCount }
     */
    calculateConnectionMetadata(targetCircleId, energyType, getConnectionsForCircle) {
        const cacheKey = `${targetCircleId}_${energyType}`;
        
        if (this.connectionMetadataCache.has(cacheKey)) {
            return this.connectionMetadataCache.get(cacheKey);
        }

        const connections = getConnectionsForCircle(targetCircleId);
        let totalConnected = 0;
        let activeCount = 0;

        connections.forEach(connection => {
            const otherCircleId = connection.entity1Id === targetCircleId ? 
                connection.entity2Id : connection.entity1Id;
            
            const cachedData = this.getCachedCircleData(otherCircleId);
            if (!cachedData) return;

            const { energyTypes, isActivated } = cachedData;

            // Check if this connection involves the specified energy type
            const hasEnergyType = energyTypes.includes(energyType) || 
                (energyType === 'exciter' && energyTypes.includes('igniter'));

            if (hasEnergyType) {
                totalConnected++;
                if (isActivated) {
                    activeCount++;
                }
            }
        });

        const metadata = { totalConnected, activeCount };
        this.connectionMetadataCache.set(cacheKey, metadata);
        return metadata;
    }

    /**
     * Clear circle data cache for specific circles
     */
    clearCircleCache(circleIds) {
        if (Array.isArray(circleIds)) {
            circleIds.forEach(circleId => {
                this.circleDataCache.delete(circleId);
            });
        } else {
            this.circleDataCache.clear();
        }
        
        // Clear related metadata cache
        this.connectionMetadataCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            cachedCircles: this.circleDataCache.size,
            cachedMetadata: this.connectionMetadataCache.size
        };
    }
}
