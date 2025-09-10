// ExplicitEnergyDetector.js - OPTIMIZED: High-performance energy effects from explicit connections
import { EnergyEffectsCoordinator } from './EnergyEffectsCoordinator.js';

export class ExplicitEnergyDetector {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.calculator = new EnergyEffectsCoordinator();
        
        // Performance optimization: Connection indexing and caching
        this.connectionsByCircle = new Map(); // circleId -> Connection[]
        this.energyEffectsByCircle = new Map(); // circleId -> cached effects
        this.circleDataCache = new Map(); // circleId -> { circle, energyTypes, activation }
        this.lastUpdateTimestamp = 0;
        this.isDirty = true;
        
        // Track which viewers have been indexed
        this.indexedViewers = new Set();
        this.viewerConnectionCounts = new Map(); // viewerId -> connection count for change detection
    }

    /**
     * Check if a circle has a specific energy type (optimized with caching)
     */
    hasEnergyType(circle, energyType) {
        return circle.energyTypes && circle.energyTypes.includes(energyType);
    }

    /**
     * Check if a circle is activated (optimized with caching)
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
     * OPTIMIZED: Build connection index for a viewer (called only when connections change)
     * @param {string} viewerId - The viewer ID to index
     */
    buildConnectionIndex(viewerId) {
        const entityType = `circle-${viewerId}`;
        const allConnections = this.dataStore.getExplicitConnectionsForEntityType(entityType);
        
        // Clear existing indexes for this viewer
        this.clearViewerIndex(viewerId);
        
        // Build new indexes
        allConnections.forEach(connection => {
            // Index by entity1
            if (!this.connectionsByCircle.has(connection.entity1Id)) {
                this.connectionsByCircle.set(connection.entity1Id, []);
            }
            this.connectionsByCircle.get(connection.entity1Id).push(connection);
            
            // Index by entity2
            if (!this.connectionsByCircle.has(connection.entity2Id)) {
                this.connectionsByCircle.set(connection.entity2Id, []);
            }
            this.connectionsByCircle.get(connection.entity2Id).push(connection);
        });
        
        this.indexedViewers.add(viewerId);
        this.viewerConnectionCounts.set(viewerId, allConnections.length);
    }

    /**
     * Clear connection index for a specific viewer
     */
    clearViewerIndex(viewerId) {
        // Get all circles for this viewer to clear their connections
        const circles = this.dataStore.getCirclesForViewer ? this.dataStore.getCirclesForViewer(viewerId) : [];
        
        circles.forEach(circle => {
            this.connectionsByCircle.delete(circle.id);
            this.energyEffectsByCircle.delete(circle.id);
            this.circleDataCache.delete(circle.id);
        });
        
        this.indexedViewers.delete(viewerId);
        this.viewerConnectionCounts.delete(viewerId);
    }

    /**
     * OPTIMIZED: Check if viewer index needs updating
     */
    shouldUpdateViewerIndex(viewerId) {
        if (!this.indexedViewers.has(viewerId)) {
            return true;
        }
        
        // Quick change detection: compare connection count
        const entityType = `circle-${viewerId}`;
        const currentConnections = this.dataStore.getExplicitConnectionsForEntityType(entityType);
        const currentCount = currentConnections.length;
        const cachedCount = this.viewerConnectionCounts.get(viewerId) || 0;
        
        return currentCount !== cachedCount;
    }

    /**
     * OPTIMIZED: Get cached circle data or fetch and cache it
     */
    getCachedCircleData(circleId) {
        if (!this.circleDataCache.has(circleId)) {
            const circle = this.dataStore.getCircle(circleId);
            if (circle) {
                this.circleDataCache.set(circleId, {
                    circle,
                    energyTypes: circle.energyTypes || [],
                    activation: circle.activation,
                    isActivated: this.isCircleActivated(circle)
                });
            }
        }
        return this.circleDataCache.get(circleId);
    }

    /**
     * OPTIMIZED: Get connections for a circle using index
     */
    getConnectionsForCircle(circleId) {
        return this.connectionsByCircle.get(circleId) || [];
    }

    /**
     * OPTIMIZED: Find all active exciters/igniters connected to a target circle
     * @param {string} targetCircleId - The circle being affected
     * @param {string} viewerId - The viewer ID
     * @returns {Array} Array of exciter effect objects
     */
    findConnectedExciters(targetCircleId, viewerId) {
        // Ensure index is up to date
        if (this.shouldUpdateViewerIndex(viewerId)) {
            this.buildConnectionIndex(viewerId);
        }

        const connections = this.getConnectionsForCircle(targetCircleId);
        const exciterEffects = [];

        connections.forEach(connection => {
            // Determine which circle is the potential exciter
            const otherCircleId = connection.entity1Id === targetCircleId ? 
                connection.entity2Id : connection.entity1Id;
            
            const cachedData = this.getCachedCircleData(otherCircleId);
            if (!cachedData) return;

            const { energyTypes, isActivated } = cachedData;

            // Check if the other circle is an active exciter or igniter
            const isExciter = energyTypes.includes('exciter');
            const isIgniter = energyTypes.includes('igniter');

            if ((isExciter || isIgniter) && isActivated) {
                const effect = this.calculator.createExciterEffectFromConnection(isIgniter);
                effect.sourceCircleId = otherCircleId;
                effect.connectionId = connection.id;
                exciterEffects.push(effect);
            }
        });

        return exciterEffects;
    }

    /**
     * OPTIMIZED: Find all active dampeners connected to a target circle
     * @param {string} targetCircleId - The circle being affected
     * @param {string} viewerId - The viewer ID
     * @returns {Array} Array of dampener effect objects
     */
    findConnectedDampeners(targetCircleId, viewerId) {
        // Ensure index is up to date
        if (this.shouldUpdateViewerIndex(viewerId)) {
            this.buildConnectionIndex(viewerId);
        }

        const connections = this.getConnectionsForCircle(targetCircleId);
        const dampenerEffects = [];

        connections.forEach(connection => {
            // Determine which circle is the potential dampener
            const otherCircleId = connection.entity1Id === targetCircleId ? 
                connection.entity2Id : connection.entity1Id;
            
            const cachedData = this.getCachedCircleData(otherCircleId);
            if (!cachedData) return;

            const { energyTypes, isActivated } = cachedData;

            // Check if the other circle is an active dampener
            const isDampener = energyTypes.includes('dampener');

            if (isDampener && isActivated) {
                const effect = this.calculator.createDampenerEffectFromConnection();
                effect.sourceCircleId = otherCircleId;
                effect.connectionId = connection.id;
                dampenerEffects.push(effect);
            }
        });

        return dampenerEffects;
    }

    /**
     * OPTIMIZED: Calculate energy effects for a target circle with caching
     * @param {Object} targetCircle - The circle being affected
     * @param {string} viewerId - The viewer ID
     * @returns {Object|null} Energy effect data or null if no effects
     */
    calculateExplicitEnergyEffects(targetCircle, viewerId) {
        if (!targetCircle || !this.isGlowCircle(targetCircle)) {
            return null;
        }

        // Skip inert circles
        if (targetCircle.activation === 'inert') {
            return null;
        }

        // Check cache first
        const cacheKey = `${targetCircle.id}_${viewerId}`;
        if (this.energyEffectsByCircle.has(cacheKey) && !this.isDirty) {
            return this.energyEffectsByCircle.get(cacheKey);
        }

        // Find connected energy sources
        const exciterEffects = this.findConnectedExciters(targetCircle.id, viewerId);
        const dampenerEffects = this.findConnectedDampeners(targetCircle.id, viewerId);

        // Early exit if no effects
        if (exciterEffects.length === 0 && dampenerEffects.length === 0) {
            this.energyEffectsByCircle.set(cacheKey, null);
            return null;
        }

        // Use the shared calculator to determine final effects
        const isActivated = this.isCircleActivated(targetCircle);
        const baseScale = isActivated ? 1.01 : 0.7; // Match proximity system defaults

        const result = this.calculator.calculateEnergyEffects({
            targetCircle,
            exciterEffects,
            dampenerEffects,
            baseScale
        });

        // Cache the result
        this.energyEffectsByCircle.set(cacheKey, result);
        return result;
    }

    /**
     * OPTIMIZED: Batch calculate all explicit effects for circles in a viewer
     * @param {Array} circlesInViewer - All circles in the viewer
     * @param {string} viewerId - The viewer ID
     * @returns {Map} Map of circleId -> effect data
     */
    calculateAllExplicitEffects(circlesInViewer, viewerId) {
        const effects = new Map();

        // Early exit if no circles
        if (!circlesInViewer || circlesInViewer.length === 0) {
            return effects;
        }

        // Early exit if viewer has no connections
        if (this.shouldUpdateViewerIndex(viewerId)) {
            this.buildConnectionIndex(viewerId);
        }
        
        // Quick check: if no connections in this viewer, return empty
        const connectionCount = this.viewerConnectionCounts.get(viewerId) || 0;
        if (connectionCount === 0) {
            return effects;
        }

        // Batch update circle cache for all circles in viewer
        circlesInViewer.forEach(circle => {
            this.getCachedCircleData(circle.id);
        });

        // Calculate effects for circles that have connections
        circlesInViewer.forEach(circle => {
            const hasConnections = this.connectionsByCircle.has(circle.id);
            if (hasConnections) {
                const effect = this.calculateExplicitEnergyEffects(circle, viewerId);
                if (effect) {
                    effects.set(circle.id, effect);
                }
            }
        });

        return effects;
    }

    /**
     * OPTIMIZED: Check if a specific circle has any explicit energy connections (cached)
     * @param {string} circleId - The circle to check
     * @param {string} viewerId - The viewer ID
     * @returns {boolean} True if the circle has explicit energy connections
     */
    hasExplicitEnergyConnections(circleId, viewerId) {
        // Ensure index is current
        if (this.shouldUpdateViewerIndex(viewerId)) {
            this.buildConnectionIndex(viewerId);
        }

        const connections = this.getConnectionsForCircle(circleId);
        
        // Quick check: any connections at all?
        if (connections.length === 0) {
            return false;
        }

        // Check if any connections involve energy types
        for (const connection of connections) {
            const otherCircleId = connection.entity1Id === circleId ? 
                connection.entity2Id : connection.entity1Id;
            
            const cachedData = this.getCachedCircleData(otherCircleId);
            if (!cachedData) continue;

            const { energyTypes, isActivated } = cachedData;
            
            if (isActivated && (
                energyTypes.includes('exciter') || 
                energyTypes.includes('igniter') || 
                energyTypes.includes('dampener')
            )) {
                return true;
            }
        }

        return false;
    }

    /**
     * Invalidate caches when data changes
     */
    invalidateCache(viewerId = null) {
        this.isDirty = true;
        this.lastUpdateTimestamp = Date.now();
        
        if (viewerId) {
            // Clear caches for specific viewer
            this.clearViewerIndex(viewerId);
        } else {
            // Clear all caches
            this.connectionsByCircle.clear();
            this.energyEffectsByCircle.clear();
            this.circleDataCache.clear();
            this.indexedViewers.clear();
            this.viewerConnectionCounts.clear();
        }
    }

    /**
     * Mark caches as clean (called after successful update)
     */
    markClean() {
        this.isDirty = false;
    }

    /**
     * Get debug information about explicit energy connections for a circle
     * @param {string} circleId - The circle to check
     * @param {string} viewerId - The viewer ID
     * @returns {Object} Debug information
     */
    getDebugInfo(circleId, viewerId) {
        const connections = this.getConnectionsForCircle(circleId);
        const exciterEffects = this.findConnectedExciters(circleId, viewerId);
        const dampenerEffects = this.findConnectedDampeners(circleId, viewerId);
        
        return {
            circleId,
            viewerId,
            totalConnections: connections.length,
            exciterConnections: exciterEffects.length,
            dampenerConnections: dampenerEffects.length,
            cacheStats: {
                indexedViewers: Array.from(this.indexedViewers),
                cachedCircles: this.circleDataCache.size,
                cachedEffects: this.energyEffectsByCircle.size,
                isDirty: this.isDirty,
                lastUpdate: this.lastUpdateTimestamp
            },
            connections: connections.map(conn => ({
                id: conn.id,
                otherCircleId: conn.entity1Id === circleId ? conn.entity2Id : conn.entity1Id,
                directionality: conn.directionality || 'none'
            })),
            exciterEffects,
            dampenerEffects
        };
    }
}
