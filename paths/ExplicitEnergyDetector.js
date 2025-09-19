// ExplicitEnergyDetector.js - REFACTORED: Main coordinator for energy effects with modular components
import { EnergyEffectsCoordinator } from './EnergyEffectsCoordinator.js';
import { EEDConnectionIndexManager } from './EEDConnectionIndexManager.js';
import { EEDCircleDataCache } from './EEDCircleDataCache.js';
import { EEDCascadeEffectCalculator } from './EEDCascadeEffectCalculator.js';

export class ExplicitEnergyDetector {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.calculator = new EnergyEffectsCoordinator();
        
        // Initialize modular components
        this.connectionIndexManager = new EEDConnectionIndexManager(dataStore);
        this.circleDataCache = new EEDCircleDataCache(dataStore);
        this.cascadeEffectCalculator = new EEDCascadeEffectCalculator(
            this.connectionIndexManager, 
            this.circleDataCache
        );
        
        // Main energy effects cache
        this.energyEffectsByCircle = new Map(); // circleId -> cached effects
        
        // Performance tracking
        this.lastUpdateTimestamp = 0;
        this.isDirty = true;
    }

    /**
     * Calculate energy effects for a target circle with caching
     * @param {Object} targetCircle - The circle being affected
     * @param {string} viewerId - The viewer ID
     * @returns {Object|null} Energy effect data or null if no effects
     */
    calculateExplicitEnergyEffects(targetCircle, viewerId) {
        if (!targetCircle || !this.circleDataCache.isGlowCircle(targetCircle)) {
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

        // Find connected energy sources with cascading
        const exciterEffects = this.cascadeEffectCalculator.findConnectedExciters(targetCircle.id, viewerId);
        const dampenerEffects = this.cascadeEffectCalculator.findConnectedDampeners(targetCircle.id, viewerId);

        // Early exit if no effects
        if (exciterEffects.length === 0 && dampenerEffects.length === 0) {
            this.energyEffectsByCircle.set(cacheKey, null);
            return null;
        }

        // Use the shared calculator to determine final effects with receive mode support
        const isActivated = this.circleDataCache.isCircleActivated(targetCircle);
        const baseScale = isActivated ? 1.01 : 0.7; // Match proximity system defaults

        const result = this.calculator.calculateEnergyEffects({
            targetCircle,
            exciterEffects,
            dampenerEffects,
            baseScale
        });

        // Add cascading debug info to result
        if (result) {
            result.cascadeInfo = {
                totalExciters: exciterEffects.length,
                cascadedExciters: exciterEffects.filter(e => e.isCascaded).length,
                totalDampeners: dampenerEffects.length,
                cascadedDampeners: dampenerEffects.filter(e => e.isCascaded).length,
                maxCascadeDepth: Math.max(
                    ...exciterEffects.map(e => e.cascadeDepth || 0),
                    ...dampenerEffects.map(e => e.cascadeDepth || 0),
                    0
                )
            };
        }

        // Cache the result
        this.energyEffectsByCircle.set(cacheKey, result);
        return result;
    }

    /**
     * Batch calculate all explicit effects for circles in a viewer
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
        if (!this.connectionIndexManager.hasConnections(viewerId)) {
            return effects;
        }

        // Batch update circle cache for all circles in viewer
        circlesInViewer.forEach(circle => {
            this.circleDataCache.getCachedCircleData(circle.id);
        });

        // Calculate effects for circles that have connections
        circlesInViewer.forEach(circle => {
            const hasConnections = this.connectionIndexManager.hasConnectionsForCircle(circle.id);
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
     * Check if a specific circle has any explicit energy connections
     * @param {string} circleId - The circle to check
     * @param {string} viewerId - The viewer ID
     * @returns {boolean} True if the circle has explicit energy connections
     */
    hasExplicitEnergyConnections(circleId, viewerId) {
        // Ensure index is current
        this.connectionIndexManager.ensureIndexCurrent(viewerId);

        const connections = this.connectionIndexManager.getConnectionsForCircle(circleId);
        
        // Quick check: any connections at all?
        if (connections.length === 0) {
            return false;
        }

        // Check if any connections involve energy types
        for (const connection of connections) {
            const otherCircleId = connection.entity1Id === circleId ? 
                connection.entity2Id : connection.entity1Id;
            
            const cachedData = this.circleDataCache.getCachedCircleData(otherCircleId);
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
            this.connectionIndexManager.clearViewerIndex(viewerId);
            
            // Clear related circle data (get circles for this viewer)
            const circles = this.dataStore.getCirclesForViewer ? 
                this.dataStore.getCirclesForViewer(viewerId) : [];
            this.circleDataCache.clearCircleCache(circles.map(c => c.id));
            
            // Clear cascade caches for this viewer
            this.cascadeEffectCalculator.clearViewerCascadeCaches(viewerId);
            
            // Clear energy effects cache for this viewer's circles
            for (const [key] of this.energyEffectsByCircle) {
                if (key.includes(`_${viewerId}`)) {
                    this.energyEffectsByCircle.delete(key);
                }
            }
        } else {
            // Clear all caches
            this.connectionIndexManager.clearAllIndexes();
            this.circleDataCache.clearCircleCache();
            this.cascadeEffectCalculator.clearCascadeCaches();
            this.energyEffectsByCircle.clear();
        }
    }

    /**
     * Mark caches as clean (called after successful update)
     */
    markClean() {
        this.isDirty = false;
    }

    /**
     * Get debug information about explicit energy connections for a circle including cascade info
     * @param {string} circleId - The circle to check
     * @param {string} viewerId - The viewer ID
     * @returns {Object} Debug information with cascade details
     */
    getDebugInfo(circleId, viewerId) {
        const exciterEffects = this.cascadeEffectCalculator.findConnectedExciters(circleId, viewerId);
        const dampenerEffects = this.cascadeEffectCalculator.findConnectedDampeners(circleId, viewerId);
        
        // Get connection metadata
        const exciterMetadata = this.circleDataCache.calculateConnectionMetadata(
            circleId, 
            'exciter', 
            (cId) => this.connectionIndexManager.getConnectionsForCircle(cId)
        );
        const dampenerMetadata = this.circleDataCache.calculateConnectionMetadata(
            circleId, 
            'dampener', 
            (cId) => this.connectionIndexManager.getConnectionsForCircle(cId)
        );
        
        // Analyze cascade information
        const cascadeInfo = {
            totalExciters: exciterEffects.length,
            directExciters: exciterEffects.filter(e => !e.isCascaded).length,
            cascadedExciters: exciterEffects.filter(e => e.isCascaded).length,
            totalDampeners: dampenerEffects.length,
            directDampeners: dampenerEffects.filter(e => !e.isCascaded).length,
            cascadedDampeners: dampenerEffects.filter(e => e.isCascaded).length,
            maxExciterDepth: Math.max(...exciterEffects.map(e => e.cascadeDepth || 0), 0),
            maxDampenerDepth: Math.max(...dampenerEffects.map(e => e.cascadeDepth || 0), 0),
            cascadeSources: [
                ...new Set([
                    ...exciterEffects.filter(e => e.cascadeSource).map(e => e.cascadeSource),
                    ...dampenerEffects.filter(e => e.cascadeSource).map(e => e.cascadeSource)
                ])
            ]
        };
        
        // Get component debug info
        const connectionDebugInfo = this.connectionIndexManager.getConnectionDebugInfo(circleId, viewerId);
        const indexStats = this.connectionIndexManager.getIndexStats();
        const cacheStats = this.circleDataCache.getCacheStats();
        const cascadeStats = this.cascadeEffectCalculator.getCascadeStats();
        
        return {
            circleId,
            viewerId,
            totalConnections: connectionDebugInfo.totalConnections,
            exciterConnections: exciterEffects.length,
            dampenerConnections: dampenerEffects.length,
            cascadeInfo,
            connectionCascadeStates: this.cascadeEffectCalculator.getActiveCascadeConnectionsForViewer(viewerId),
            connectionMetadata: {
                exciter: exciterMetadata,
                dampener: dampenerMetadata
            },
            componentStats: {
                connectionIndex: indexStats,
                circleDataCache: cacheStats,
                cascadeEffects: cascadeStats,
                energyEffectsCache: this.energyEffectsByCircle.size,
                isDirty: this.isDirty,
                lastUpdate: this.lastUpdateTimestamp
            },
            connections: connectionDebugInfo.connections.map(conn => ({
                ...conn,
                cascadeState: this.cascadeEffectCalculator.getConnectionCascadeState(conn.id)
            })),
            exciterEffects: exciterEffects.map(e => ({
                ...e,
                isCascaded: e.isCascaded || false,
                cascadeDepth: e.cascadeDepth || 0,
                cascadeSource: e.cascadeSource || null
            })),
            dampenerEffects: dampenerEffects.map(e => ({
                ...e,
                isCascaded: e.isCascaded || false,
                cascadeDepth: e.cascadeDepth || 0,
                cascadeSource: e.cascadeSource || null
            }))
        };
    }

    /**
     * Get performance and cache statistics for all components
     */
    getPerformanceStats() {
        return {
            connectionIndex: this.connectionIndexManager.getIndexStats(),
            circleDataCache: this.circleDataCache.getCacheStats(),
            cascadeEffects: this.cascadeEffectCalculator.getCascadeStats(),
            energyEffectsCache: this.energyEffectsByCircle.size,
            isDirty: this.isDirty,
            lastUpdate: this.lastUpdateTimestamp
        };
    }
}
