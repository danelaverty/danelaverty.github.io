import { EnergyEffectsCoordinator } from './EnergyEffectsCoordinator.js';

export class EEDCascadeEffectCalculator {
    constructor(connectionIndexManager, circleDataCache) {
        this.connectionIndexManager = connectionIndexManager;
        this.circleDataCache = circleDataCache;
        this.calculator = new EnergyEffectsCoordinator();
        
        // Cascading effect caches
        this.cascadeCache = new Map(); // cacheKey -> cascaded effects
        this.cascadeDepthLimit = 10; // Prevent infinite recursion
        
        // Connection cascade state tracking
        this.connectionCascadeStates = new Map(); // connectionId -> { energyType, cascadeDepth, isActive }
        this.activeConnectionsByViewer = new Map(); // viewerId -> Set of active connection IDs
    }

    /**
     * Set cascade state for a connection
     */
    setConnectionCascadeState(connectionId, energyType, cascadeDepth, isActive = true) {
        this.connectionCascadeStates.set(connectionId, {
            energyType, // 'exciter' or 'dampener'
            cascadeDepth,
            isActive,
            timestamp: Date.now()
        });
    }

    /**
     * Get cascade state for a connection
     * @param {string} connectionId - The connection ID
     * @returns {Object|null} { energyType, cascadeDepth, isActive } or null if no cascade state
     */
    getConnectionCascadeState(connectionId) {
        return this.connectionCascadeStates.get(connectionId) || null;
    }

    /**
     * Get all active cascade connections for a viewer
     * @param {string} viewerId - The viewer ID
     * @returns {Map} connectionId -> cascade state
     */
    getActiveCascadeConnectionsForViewer(viewerId) {
        const activeConnections = new Map();
        
        if (this.activeConnectionsByViewer.has(viewerId)) {
            this.activeConnectionsByViewer.get(viewerId).forEach(connectionId => {
                const state = this.connectionCascadeStates.get(connectionId);
                if (state && state.isActive) {
                    activeConnections.set(connectionId, state);
                }
            });
        }
        
        return activeConnections;
    }

    /**
     * Clear connection cascade states for a viewer
     */
    clearConnectionCascadeStates(viewerId) {
        if (this.activeConnectionsByViewer.has(viewerId)) {
            const connectionIds = this.activeConnectionsByViewer.get(viewerId);
            connectionIds.forEach(connectionId => {
                this.connectionCascadeStates.delete(connectionId);
            });
            this.activeConnectionsByViewer.delete(viewerId);
        }
    }

    /**
     * Find cascading exciter effects with connection state tracking
     * @param {string} targetCircleId - The circle receiving energy
     * @param {string} viewerId - The viewer ID
     * @param {Set} visitedCircles - Circles already processed in this cascade chain
     * @param {number} depth - Current recursion depth
     * @returns {Array} Array of exciter effect objects including cascaded ones
     */
findCascadingExciters(targetCircleId, viewerId, visitedCircles = new Set(), depth = 0) {
    // Prevent infinite recursion
    if (depth >= this.cascadeDepthLimit || visitedCircles.has(targetCircleId)) {
        return [];
    }

    // Check cache first (only for depth 0 to avoid caching partial cascades)
    const cacheKey = `exciter_${targetCircleId}_${viewerId}`;
    if (depth === 0 && this.cascadeCache.has(cacheKey)) {
        return this.cascadeCache.get(cacheKey);
    }

    // Ensure index is up to date
    this.connectionIndexManager.ensureIndexCurrent(viewerId);

    const connections = this.connectionIndexManager.getConnectionsForCircle(targetCircleId);
    const exciterEffects = [];
    
    // FIXED: Add this circle to visited set BEFORE processing connections
    const newVisitedCircles = new Set(visitedCircles);
    newVisitedCircles.add(targetCircleId);

    // Initialize active connections set for this viewer if needed
    if (!this.activeConnectionsByViewer.has(viewerId)) {
        this.activeConnectionsByViewer.set(viewerId, new Set());
    }
    const activeConnectionsSet = this.activeConnectionsByViewer.get(viewerId);

    // Get metadata for all exciter/igniter connections (only direct connections for metadata)
    const exciterMetadata = this.circleDataCache.calculateConnectionMetadata(
        targetCircleId, 
        'exciter', 
        (circleId) => this.connectionIndexManager.getConnectionsForCircle(circleId)
    );
    const igniterMetadata = this.circleDataCache.calculateConnectionMetadata(
        targetCircleId, 
        'igniter', 
        (circleId) => this.connectionIndexManager.getConnectionsForCircle(circleId)
    );
    
    // Combine metadata (since exciters and igniters are treated as the same group)
    const combinedMetadata = {
        totalConnected: exciterMetadata.totalConnected + igniterMetadata.totalConnected,
        activeCount: exciterMetadata.activeCount + igniterMetadata.activeCount
    };

    connections.forEach(connection => {
        const otherCircleId = connection.entity1Id === targetCircleId ? 
            connection.entity2Id : connection.entity1Id;
        
        // FIXED: Skip if already visited in this cascade chain (prevents infinite loops)
        if (newVisitedCircles.has(otherCircleId)) {
            return;
        }
        
        const cachedData = this.circleDataCache.getCachedCircleData(otherCircleId);
        if (!cachedData) return;

        const { isExciter, isIgniter, isActivated } = cachedData;

        // Direct activated exciter/igniter effect
        if ((isExciter || isIgniter) && isActivated) {
            const effect = this.calculator.createExciterEffectFromConnection(isIgniter);
            effect.sourceCircleId = otherCircleId;
            effect.connectionId = connection.id;
            effect.connectionMeta = combinedMetadata;
            effect.cascadeDepth = depth;
            exciterEffects.push(effect);

            // Track connection cascade state
            this.setConnectionCascadeState(connection.id, 'exciter', depth, true);
            activeConnectionsSet.add(connection.id);

            // FIXED: Cascade effect - find what this exciter/igniter affects
            // Pass the updated visited set to prevent cycles
            const cascadedEffects = this.findCascadingExciters(
                otherCircleId, 
                viewerId, 
                newVisitedCircles, // Use the updated visited set
                depth + 1
            );
            
            // Add cascaded effects with increased depth and cascade marker
            cascadedEffects.forEach(cascadedEffect => {
                cascadedEffect.isCascaded = true;
                cascadedEffect.cascadeSource = otherCircleId;
                cascadedEffect.cascadeDepth = depth + 1;
                exciterEffects.push(cascadedEffect);
                
                // Track cascaded connection state
                if (cascadedEffect.connectionId) {
                    this.setConnectionCascadeState(cascadedEffect.connectionId, 'exciter', depth + 1, true);
                    activeConnectionsSet.add(cascadedEffect.connectionId);
                }
            });
        }
        // FIXED: Inactive exciter/igniter that might receive cascaded energy
        else if ((isExciter || isIgniter) && !isActivated) {
            // FIXED: Check if this circle would be affected by other sources (recursive)
            // Pass the updated visited set to prevent infinite loops
            const indirectEffects = this.findCascadingExciters(
                otherCircleId, 
                viewerId, 
                newVisitedCircles, // Use the updated visited set that includes current circle
                depth + 1
            );
            
            // If this inactive exciter/igniter would become shiny, it cascades its effect
            if (indirectEffects.length > 0) {
                // This circle becomes shiny due to indirect effects, so it can now affect our target
                const effect = this.calculator.createExciterEffectFromConnection(isIgniter);
                effect.sourceCircleId = otherCircleId;
                effect.connectionId = connection.id;
                effect.connectionMeta = combinedMetadata;
                effect.isCascaded = true;
                effect.cascadeDepth = depth + 1;
                exciterEffects.push(effect);

                // Track cascaded connection state
                this.setConnectionCascadeState(connection.id, 'exciter', depth + 1, true);
                activeConnectionsSet.add(connection.id);
            }
        }
    });

    // Cache result only at depth 0
    if (depth === 0) {
        this.cascadeCache.set(cacheKey, exciterEffects);
    }

    return exciterEffects;
}

    /**
     * Find cascading dampener effects with connection state tracking
     * @param {string} targetCircleId - The circle receiving energy
     * @param {string} viewerId - The viewer ID
     * @param {Set} visitedCircles - Circles already processed in this cascade chain
     * @param {number} depth - Current recursion depth
     * @returns {Array} Array of dampener effect objects including cascaded ones
     */
    findCascadingDampeners(targetCircleId, viewerId, visitedCircles = new Set(), depth = 0) {
        // Prevent infinite recursion
        if (depth >= this.cascadeDepthLimit || visitedCircles.has(targetCircleId)) {
            return [];
        }

        // Check cache first (only for depth 0)
        const cacheKey = `dampener_${targetCircleId}_${viewerId}`;
        if (depth === 0 && this.cascadeCache.has(cacheKey)) {
            return this.cascadeCache.get(cacheKey);
        }

        // Ensure index is up to date
        this.connectionIndexManager.ensureIndexCurrent(viewerId);

        const connections = this.connectionIndexManager.getConnectionsForCircle(targetCircleId);
        const dampenerEffects = [];
        
        // Add this circle to visited set for this cascade chain
        const newVisitedCircles = new Set(visitedCircles);
        newVisitedCircles.add(targetCircleId);

        // Initialize active connections set for this viewer if needed
        if (!this.activeConnectionsByViewer.has(viewerId)) {
            this.activeConnectionsByViewer.set(viewerId, new Set());
        }
        const activeConnectionsSet = this.activeConnectionsByViewer.get(viewerId);

        // Get metadata for dampener connections (only direct connections for metadata)
        const dampenerMetadata = this.circleDataCache.calculateConnectionMetadata(
            targetCircleId, 
            'dampener', 
            (circleId) => this.connectionIndexManager.getConnectionsForCircle(circleId)
        );

        connections.forEach(connection => {
            const otherCircleId = connection.entity1Id === targetCircleId ? 
                connection.entity2Id : connection.entity1Id;
            
            // Skip if already processed in this cascade chain
            if (newVisitedCircles.has(otherCircleId)) {
                return;
            }
            
            const cachedData = this.circleDataCache.getCachedCircleData(otherCircleId);
            if (!cachedData) return;

            const { isDampener, isActivated } = cachedData;

            // Direct activated dampener effect
            if (isDampener && isActivated) {
                const effect = this.calculator.createDampenerEffectFromConnection();
                effect.sourceCircleId = otherCircleId;
                effect.connectionId = connection.id;
                effect.connectionMeta = dampenerMetadata;
                effect.cascadeDepth = depth;
                dampenerEffects.push(effect);

                // Track connection cascade state
                this.setConnectionCascadeState(connection.id, 'dampener', depth, true);
                activeConnectionsSet.add(connection.id);

                // Cascade effect - find what this dampener affects
                const cascadedEffects = this.findCascadingDampeners(
                    otherCircleId, 
                    viewerId, 
                    newVisitedCircles, 
                    depth + 1
                );
                
                // Add cascaded effects with increased depth and cascade marker
                cascadedEffects.forEach(cascadedEffect => {
                    cascadedEffect.isCascaded = true;
                    cascadedEffect.cascadeSource = otherCircleId;
                    cascadedEffect.cascadeDepth = depth + 1;
                    dampenerEffects.push(cascadedEffect);
                    
                    // Track cascaded connection state
                    if (cascadedEffect.connectionId) {
                        this.setConnectionCascadeState(cascadedEffect.connectionId, 'dampener', depth + 1, true);
                        activeConnectionsSet.add(cascadedEffect.connectionId);
                    }
                });
            }
            // Inactive dampener that might receive cascaded energy
            else if (isDampener && !isActivated) {
                // Check if this circle would be affected by other sources (recursive)
                const indirectEffects = this.findCascadingDampeners(
                    otherCircleId, 
                    viewerId, 
                    newVisitedCircles, 
                    depth + 1
                );
                
                // If this inactive dampener would become shiny, it cascades its effect
                if (indirectEffects.length > 0) {
                    // This circle becomes shiny due to indirect effects, so it can now affect our target
                    const effect = this.calculator.createDampenerEffectFromConnection();
                    effect.sourceCircleId = otherCircleId;
                    effect.connectionId = connection.id;
                    effect.connectionMeta = dampenerMetadata;
                    effect.isCascaded = true;
                    effect.cascadeDepth = depth + 1;
                    dampenerEffects.push(effect);

                    // Track cascaded connection state
                    this.setConnectionCascadeState(connection.id, 'dampener', depth + 1, true);
                    activeConnectionsSet.add(connection.id);
                }
            }
        });

        // Cache result only at depth 0
        if (depth === 0) {
            this.cascadeCache.set(cacheKey, dampenerEffects);
        }

        return dampenerEffects;
    }

    /**
     * Find all active exciters/igniters connected to a target circle with cascading
     * @param {string} targetCircleId - The circle being affected
     * @param {string} viewerId - The viewer ID
     * @returns {Array} Array of exciter effect objects with cascading support
     */
    findConnectedExciters(targetCircleId, viewerId) {
        return this.findCascadingExciters(targetCircleId, viewerId);
    }

    /**
     * Find all active dampeners connected to a target circle with cascading
     * @param {string} targetCircleId - The circle being affected
     * @param {string} viewerId - The viewer ID
     * @returns {Array} Array of dampener effect objects with cascading support
     */
    findConnectedDampeners(targetCircleId, viewerId) {
        return this.findCascadingDampeners(targetCircleId, viewerId);
    }

    /**
     * Clear all cascade caches
     */
    clearCascadeCaches() {
        this.cascadeCache.clear();
        this.connectionCascadeStates.clear();
        this.activeConnectionsByViewer.clear();
    }

    /**
     * Clear cascade caches for a specific viewer
     */
    clearViewerCascadeCaches(viewerId) {
        // Clear cascade cache entries for this viewer
        for (const [key] of this.cascadeCache) {
            if (key.includes(`_${viewerId}`)) {
                this.cascadeCache.delete(key);
            }
        }
        
        // Clear connection cascade states for this viewer
        this.clearConnectionCascadeStates(viewerId);
    }

    /**
     * Get cascade cache statistics
     */
    getCascadeStats() {
        return {
            cachedCascades: this.cascadeCache.size,
            connectionCascadeStates: this.connectionCascadeStates.size,
            activeViewers: this.activeConnectionsByViewer.size
        };
    }
}
