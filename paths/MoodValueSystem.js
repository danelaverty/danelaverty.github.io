// MoodValueSystem.js - Enhanced with comprehensive debugging
import { getMoodValueForColor } from './colorFamilies.js';
import { roilMotionSystem } from './RoilMotionCore.js';

export class MoodValueSystem {
    constructor(entityStore) {
        this.entityStore = entityStore;
        this.isDirty = false;
        this.recalculationScheduled = false;
        
        // Timer-based update system
        this.updateInterval = 1000; // ms
        this.updateTimer = null;
        this.isRunning = false;
        this.listeners = new Set();
        this.lastUpdateTime = 0;
        
        // Performance tracking
        this.updateCount = 0;
        this.lastCalculationResults = null;
        
        // NEW: Debug tracking
        this.debugEnabled = true;
        this.debugStats = {
            cycleCount: 0,
            eventEmissionCount: 0,
            listenerCallCount: 0,
            lastListenerCallTime: 0,
            recentEvents: [], // Keep last 10 events
            recentCycles: []   // Keep last 10 cycles
        };
    }

    debugLog(message, data = null) {
        if (!this.debugEnabled) return;
        
        const timestamp = Date.now();
        const logEntry = {
            timestamp,
            time: new Date(timestamp).toLocaleTimeString(),
            message,
            data
        };
        
        // Store recent logs
        this.debugStats.recentEvents.push(logEntry);
        if (this.debugStats.recentEvents.length > 10) {
            this.debugStats.recentEvents.shift();
        }
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.scheduleNextUpdate();
        
        this.debugLog('🎯 MoodValueSystem STARTED', {
            interval: this.updateInterval,
            listenerCount: this.listeners.size
        });
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }
        
        this.debugLog('🎯 MoodValueSystem STOPPED');
    }

    scheduleNextUpdate() {
        if (!this.isRunning) return;
        
        this.updateTimer = setTimeout(() => {
            this.performUpdateCycle();
            this.scheduleNextUpdate();
        }, this.updateInterval);
    }

performUpdateCycle() {
    this.debugStats.cycleCount++;
    const startTime = performance.now();

    this.debugLog(`🔊 CYCLE ${this.debugStats.cycleCount} START`, {
        isDirty: this.isDirty,
        listenerCount: this.listeners.size
    });

    let results = null;

    // NEW: Check if we have any groups (not just roil groups)
    const hasGroups = this.hasAnyGroups();
    const hasRoilGroups = this.hasActiveRoilGroups();

    // MODIFIED: Always recalculate if dirty, OR if we have any groups (not just roil groups)
    // This ensures all groups get continuous polling-based updates every 150ms
    if (this.isDirty || hasGroups) {
        // Force dirty state to ensure recalculation
        this.isDirty = true;
        results = this.recalculateAll();

        this.debugLog(`🔊 CYCLE ${this.debugStats.cycleCount} CALCULATION COMPLETE`, {
            results,
            hasRoilGroups,
            hasGroups,
            calculationTime: (performance.now() - startTime).toFixed(2) + 'ms'
        });

        // Always emit events when we have results
        if (results) {
            const eventDetails = {
                timestamp: Date.now(),
                changedCircles: results.changedCircles,
                totalCircles: results.totalCircles,
                calculationTime: performance.now() - startTime,
                triggeredByRoil: hasRoilGroups && !this.isDirty,
                triggeredByGroups: hasGroups // NEW: Track when triggered by any groups
            };

            this.debugLog(`📡 EMITTING EVENT`, eventDetails);
            this.emitMoodValuesChanged(eventDetails);
        } else {
            this.debugLog(`⚠️ NO RESULTS - NOT EMITTING EVENT`);
        }
    } else {
        this.debugLog(`⏸️ SKIPPING CYCLE - NOT DIRTY AND NO GROUPS`);
    }

    this.updateCount++;
    this.lastUpdateTime = startTime;
    this.lastCalculationResults = results;

    // Store cycle info
    const cycleInfo = {
        cycleNumber: this.debugStats.cycleCount,
        timestamp: Date.now(),
        results,
        hasRoilGroups,
        hasGroups, // NEW: Track presence of any groups
        calculationTime: performance.now() - startTime,
        eventEmitted: !!(this.isDirty || hasGroups) && !!results
    };

    this.debugStats.recentCycles.push(cycleInfo);
    if (this.debugStats.recentCycles.length > 10) {
        this.debugStats.recentCycles.shift();
    }
}

// NEW: Helper method to check for any groups (not just roil groups)
hasAnyGroups() {
    const allCircles = Array.from(this.entityStore.data.circles.values());
    return allCircles.some(circle => circle.type === 'group');
}

    hasActiveRoilGroups() {
        const allCircles = Array.from(this.entityStore.data.circles.values());
        return allCircles.some(circle => 
            circle.type === 'group' && 
            circle.roilMode === 'on' && 
            this.entityStore.getCirclesBelongingToGroup(circle.id).length > 0
        );
    }

    addListener(callback) {
        this.listeners.add(callback);
        this.debugLog(`👂 LISTENER ADDED`, {
            totalListeners: this.listeners.size,
            listenerType: callback.name || 'anonymous'
        });
    }

    removeListener(callback) {
        this.listeners.delete(callback);
        this.debugLog(`👂 LISTENER REMOVED`, {
            totalListeners: this.listeners.size
        });
    }

    emitMoodValuesChanged(details) {
        this.debugStats.eventEmissionCount++;
        this.debugStats.lastListenerCallTime = Date.now();
        
        this.debugLog(`📡 CALLING ${this.listeners.size} LISTENERS`, {
            details,
            emissionNumber: this.debugStats.eventEmissionCount
        });
        
        this.listeners.forEach((callback, index) => {
            try {
                this.debugStats.listenerCallCount++;
                this.debugLog(`📞 CALLING LISTENER ${index + 1}`, {
                    listenerType: callback.name || 'anonymous'
                });
                callback(details);
                this.debugLog(`✅ LISTENER ${index + 1} SUCCESS`);
            } catch (error) {
                this.debugLog(`❌ LISTENER ${index + 1} ERROR`, error);
                console.error('Error in mood value listener:', error);
            }
        });
        
        this.debugLog(`📡 ALL LISTENERS CALLED`);
    }

    setUpdateInterval(intervalMs) {
        this.updateInterval = intervalMs;
        
        if (this.isRunning) {
            this.stop();
            this.start();
        }
        
        this.debugLog(`🔄 INTERVAL CHANGED`, { newInterval: intervalMs });
    }

    // Core mood value calculation logic (with debug)
    calculateMoodValue(circle) {
        if (!circle) return undefined;

        switch (circle.type) {
            case 'group':
                return this.calculateGroupMoodValue(circle.id);
            
            default:
                return this.calculateColorBasedMoodValue(circle.colors);
        }
    }

    calculateColorBasedMoodValue(colors) {
        if (!colors || !Array.isArray(colors)) return undefined;
        if (colors.length > 1) return undefined;
        return getMoodValueForColor(colors[0]);
    }

    calculateGroupMoodValue(groupId) {
        const members = this.entityStore.getCirclesBelongingToGroup(groupId);

        if (members.length === 0) {
            return undefined;
        }

        if (members.length === 1) {
            const member = members[0];
            const element = document.querySelector(`[data-entity-id="${member.id}"]`);
            const useSecondary = element?.hasAttribute('data-use-secondary-colors');

            return useSecondary && member.secondaryMoodValue !== undefined 
                ? member.secondaryMoodValue 
                : member.moodValue;
        }

        // Get effective mood values and current z-positions for multiple members
        const memberData = [];

        for (const member of members) {
            const element = document.querySelector(`[data-entity-id="${member.id}"]`);
            const useSecondary = element?.hasAttribute('data-use-secondary-colors');

            let moodValue = useSecondary && member.secondaryMoodValue !== undefined 
                ? member.secondaryMoodValue 
                : member.moodValue;

            if (moodValue === undefined) continue;

let zPosition = 0;

try {
    if (typeof roilMotionSystem !== 'undefined' && 
        roilMotionSystem.activeCircles && 
        roilMotionSystem.activeCircles.has(member.id)) {
        
        const activeCircle = roilMotionSystem.activeCircles.get(member.id);
        if (activeCircle && typeof activeCircle.z === 'number') {
            zPosition = activeCircle.z;
        }
    }
} catch (error) {
    console.log(`Error getting z-position for member ${member.id}:`, error); // Debug log
}

            memberData.push({
                id: member.id,
                moodValue: moodValue,
                zPosition: zPosition
            });
        }

        if (memberData.length === 0) return undefined;
        if (memberData.length === 1) return memberData[0].moodValue;

// Calculate weighted average based on z-positions using absolute bounds
const Z_MIN = -10;
const Z_MAX = 20;
const Z_RANGE = Z_MAX - Z_MIN;

// Calculate exponentially weighted average based on z-position
// Higher z-position (closer to camera) gets exponentially more weight
const weightStrength = 3.0;
let weightedSum = 0;
let totalWeight = 0;

for (const member of memberData) {
    // Normalize z-position to 0-1 range using absolute bounds (0 = furthest back, 1 = closest to camera)
    const normalizedZ = (member.zPosition - Z_MIN) / Z_RANGE;
    
    // Clamp to 0-1 range just in case
    const clampedZ = Math.max(0, Math.min(1, normalizedZ));

            // Calculate exponential weight (closer members have much more influence)
            const weight = Math.exp(clampedZ * weightStrength);

            weightedSum += member.moodValue * weight;
            totalWeight += weight;
        }

        // Return weighted average, clamped to valid mood range
        const result = Math.max(0, Math.min(1, weightedSum / totalWeight));
        return result;
    }

    calculateSecondaryMoodValue(circle) {
        return this.calculateColorBasedMoodValue(circle.secondaryColors);
    }

    updateCircleMoodValue(circleId) {
        const circle = this.entityStore.getCircle(circleId);
        if (!circle) return false;

        const newMoodValue = this.calculateMoodValue(circle);
        const newSecondaryMoodValue = this.calculateSecondaryMoodValue(circle);

        let changed = false;

        if (circle.moodValue !== newMoodValue) {
            circle.moodValue = newMoodValue;
            changed = true;
        }

        if (circle.secondaryMoodValue !== newSecondaryMoodValue) {
            circle.secondaryMoodValue = newSecondaryMoodValue;
            changed = true;
        }

        return changed;
    }

    markDirty() {
        this.isDirty = true;
        this.debugLog('🔄 MARKED DIRTY');
    }

    recalculateAll() {
        const allCircles = Array.from(this.entityStore.data.circles.values());
        
        const sortedCircles = allCircles.sort((a, b) => {
            if (a.type === 'group' && b.type !== 'group') return 1;
            if (a.type !== 'group' && b.type === 'group') return -1;
            return 0;
        });

        let changedCount = 0;
        sortedCircles.forEach(circle => {
            if (this.updateCircleMoodValue(circle.id)) {
                changedCount++;
            }
        });

        this.isDirty = false;
        
        const results = {
            totalCircles: allCircles.length,
            changedCircles: changedCount
        };
        
        this.debugLog(`🔄 RECALCULATED ALL`, results);
        
        return results;
    }

    recalculateNow() {
        this.isDirty = true;
        return this.recalculateAll();
    }

    // Event handlers that mark dirty
    onCircleColorsChanged(circleId) {
        this.markDirty();
        this.debugLog(`🎨 CIRCLE COLORS CHANGED`, { circleId });
    }

    onCircleTypeChanged(circleId) {
        this.markDirty();
        this.debugLog(`🔄 CIRCLE TYPE CHANGED`, { circleId });
    }

    onCircleGroupMembershipChanged(circleId, oldGroupId, newGroupId) {
        this.markDirty();
        this.debugLog(`👥 MEMBERSHIP CHANGED`, { circleId, oldGroupId, newGroupId });
    }

    onCircleDeleted(circleId, wasGroupMember, wasGroup) {
        this.markDirty();
        this.debugLog(`🗑️ CIRCLE DELETED`, { circleId, wasGroupMember, wasGroup });
    }

    onCircleCreated(circleId) {
        const circle = this.entityStore.getCircle(circleId);
        if (circle && circle.belongsToID) {
            this.markDirty();
            this.debugLog(`➕ CIRCLE CREATED`, { circleId, belongsToGroup: circle.belongsToID });
        }
    }

    getSystemStatus() {
        return {
            isDirty: this.isDirty,
            isRunning: this.isRunning,
            updateInterval: this.updateInterval,
            totalCircles: this.entityStore.data.circles.size,
            groupCount: Array.from(this.entityStore.data.circles.values())
                .filter(c => c.type === 'group').length,
            ...this.getPerformanceStats()
        };
    }

    getPerformanceStats() {
        return {
            updateCount: this.updateCount,
            lastUpdateTime: this.lastUpdateTime,
            lastResults: this.lastCalculationResults,
            listenerCount: this.listeners.size,
            timeSinceLastUpdate: this.lastUpdateTime ? Date.now() - this.lastUpdateTime : null,
            debugStats: this.debugStats
        };
    }

    // NEW: Debug utilities
    enableDebug() {
        this.debugEnabled = true;
        this.debugLog('🐛 DEBUG ENABLED');
    }

    disableDebug() {
        this.debugEnabled = false;
    }

    getDebugReport() {
        return {
            systemStatus: this.getSystemStatus(),
            recentCycles: this.debugStats.recentCycles,
            recentEvents: this.debugStats.recentEvents,
            summary: {
                totalCycles: this.debugStats.cycleCount,
                totalEventEmissions: this.debugStats.eventEmissionCount,
                totalListenerCalls: this.debugStats.listenerCallCount,
                avgListenerCallsPerEmission: this.debugStats.eventEmissionCount > 0 
                    ? (this.debugStats.listenerCallCount / this.debugStats.eventEmissionCount).toFixed(2) 
                    : 0
            }
        };
    }

    clearDebugStats() {
        this.debugStats = {
            cycleCount: 0,
            eventEmissionCount: 0,
            listenerCallCount: 0,
            lastListenerCallTime: 0,
            recentEvents: [],
            recentCycles: []
        };
        this.debugLog('🧹 DEBUG STATS CLEARED');
    }

    validateMoodValues() {
        const issues = [];
        const allCircles = Array.from(this.entityStore.data.circles.values());

        allCircles.forEach(circle => {
            const expectedMood = this.calculateMoodValue(circle);
            if (circle.moodValue !== expectedMood) {
                issues.push({
                    circleId: circle.id,
                    circleName: circle.name,
                    circleType: circle.type,
                    currentMood: circle.moodValue,
                    expectedMood: expectedMood
                });
            }
        });

        return issues;
    }

    getDependentCircles(circleId) {
        const circle = this.entityStore.getCircle(circleId);
        if (!circle) return [];

        const dependents = [];

        if (circle.belongsToID) {
            const parentGroup = this.entityStore.getCircle(circle.belongsToID);
            if (parentGroup && parentGroup.type === 'group') {
                dependents.push(parentGroup);
                dependents.push(...this.getDependentCircles(parentGroup.id));
            }
        }

        return dependents;
    }

    destroy() {
        this.stop();
        this.listeners.clear();
        this.entityStore = null;
        this.debugLog('💀 MOOD SYSTEM DESTROYED');
    }
}

// Enhanced entityStore integration (unchanged except for debug calls)
export const enhanceEntityStoreWithMoodSystem = (entityStore) => {
    const moodSystem = new MoodValueSystem(entityStore);

    entityStore.moodSystem = moodSystem;

    const originalUpdateEntity = entityStore.updateEntity;
    entityStore.updateEntity = function(entityType, id, updates) {
        if (entityType !== 'circle') {
            return originalUpdateEntity.call(this, entityType, id, updates);
        }

        const oldEntity = this.getCircle(id);
        const oldColors = oldEntity?.colors;
        const oldType = oldEntity?.type;
        const oldBelongsToID = oldEntity?.belongsToID;

        const result = originalUpdateEntity.call(this, entityType, id, updates);

        if (result) {
            if (updates.colors !== undefined && JSON.stringify(updates.colors) !== JSON.stringify(oldColors)) {
                moodSystem.onCircleColorsChanged(id);
            }
            
            if (updates.type !== undefined && updates.type !== oldType) {
                moodSystem.onCircleTypeChanged(id);
            }
            
            if (updates.belongsToID !== undefined && updates.belongsToID !== oldBelongsToID) {
                moodSystem.onCircleGroupMembershipChanged(id, oldBelongsToID, updates.belongsToID);
            }
        }

        return result;
    };

    const originalDeleteCircle = entityStore.deleteCircle;
    entityStore.deleteCircle = function(id, updateCallback) {
        const circle = this.getCircle(id);
        if (circle) {
            const wasGroupMember = !!circle.belongsToID;
            const wasGroup = circle.type === 'group';
            
            const result = originalDeleteCircle.call(this, id, updateCallback);
            
            if (result) {
                moodSystem.onCircleDeleted(id, wasGroupMember, wasGroup);
            }
            
            return result;
        }
        return false;
    };

    const originalCreateCircle = entityStore.createCircle;
    entityStore.createCircle = function(...args) {
        const result = originalCreateCircle.apply(this, args);
        if (result) {
            moodSystem.onCircleCreated(result.id);
        }
        return result;
    };

    // Enhanced convenience methods
    entityStore.recalculateMoodValues = () => moodSystem.recalculateNow();
    entityStore.getMoodSystemStatus = () => moodSystem.getSystemStatus();
    entityStore.validateMoodValues = () => moodSystem.validateMoodValues();
    entityStore.startMoodSystem = () => moodSystem.start();
    entityStore.stopMoodSystem = () => moodSystem.stop();
    entityStore.setMoodUpdateInterval = (intervalMs) => moodSystem.setUpdateInterval(intervalMs);
    
    // NEW: Debug methods
    entityStore.getMoodDebugReport = () => moodSystem.getDebugReport();
    entityStore.clearMoodDebugStats = () => moodSystem.clearDebugStats();
    entityStore.enableMoodDebug = () => moodSystem.enableDebug();
    entityStore.disableMoodDebug = () => moodSystem.disableDebug();

    return moodSystem;
};
