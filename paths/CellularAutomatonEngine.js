// CellularAutomatonEngine.js - Manages cellular automaton iteration for energy propagation

import { EnergyStateCalculator } from './EnergyStateCalculator.js';

export class CellularAutomatonEngine {
    constructor() {
        this.stateCalculator = new EnergyStateCalculator();
        this.circleStates = new Map();
        this.connectionStates = new Map();
        this.isRunning = false;
        this.iterationTimer = null;
        this.iterationDelay = 1000;
        this.currentPhase = 'circle';
        this.onStateChange = null;
        // Store circles and connections for immediate iteration
        this.circles = [];
        this.connections = [];
        // Batching for manual cascade mode
        this.batchedChanges = [];
        this.cascadeMode = 'Auto'; // 'Auto' or 'Manual' - match the config values
    }

    start(circles, connections, onStateChange) {
        if (this.isRunning) {
            return;
        }

        this.onStateChange = onStateChange;
        this.isRunning = true;
        this.circles = circles;
        this.connections = connections;

        this.initializeStates(circles, connections);

        var t = this;
        setTimeout(function() {
            t.scheduleNextIteration(circles, connections)
        }, 1000);
    }

    stop() {
        this.isRunning = false;
        if (this.iterationTimer) {
            clearTimeout(this.iterationTimer);
            this.iterationTimer = null;
        }
        this.batchedChanges = [];
    }

    setCascadeMode(mode) {
        const previousMode = this.cascadeMode;
        this.cascadeMode = mode;
        
        console.log('CA: setCascadeMode', mode, 'previous:', previousMode);
        
        // When switching from manual to auto, apply all pending changes
        if (previousMode === 'Manual' && mode === 'Auto') {
            console.log('CA: Switching to Auto mode, applying', this.batchedChanges.length, 'pending changes');
            this.applyAllBatchedChanges();
            // Restart automatic iterations
            if (this.isRunning) {
                this.scheduleNextIteration(this.circles, this.connections);
            }
        }
        
        // When switching from auto to manual, clear any pending timeout
        if (previousMode === 'Auto' && mode === 'Manual') {
            console.log('CA: Switching to Manual mode');
            if (this.iterationTimer) {
                clearTimeout(this.iterationTimer);
                this.iterationTimer = null;
            }
        }
    }

    initializeStates(circles, connections) {
        circles.forEach(circle => {
            this.circleStates.set(circle.id, {
                energized: 'unenergized',
                shinyness: 'default'
            });
        });

        connections.forEach(connection => {
            this.connectionStates.set(connection.id, {
                energized: 'unenergized'
            });
        });

        this.runCirclePhase(circles, connections);
        
        // In auto mode, apply changes immediately during initialization
        if (this.cascadeMode === 'Auto') {
            this.applyAllBatchedChanges();
        }
    }

    scheduleNextIteration(circles, connections) {
        if (!this.isRunning) {
            return;
        }

        // Only schedule automatic iterations in auto mode
        if (this.cascadeMode === 'Auto') {
            this.iterationTimer = setTimeout(() => {
                this.performIteration(circles, connections);
                this.scheduleNextIteration(circles, connections);
            }, this.iterationDelay);
        }
    }

    /**
     * Trigger an immediate iteration, canceling any pending scheduled iteration
     * and rescheduling the next one. Useful when data changes that should
     * immediately affect the cellular automaton state.
     */
    triggerImmediateIteration() {
        if (!this.isRunning) {
            return;
        }

        console.log('CA: triggerImmediateIteration, mode:', this.cascadeMode);

        // Clear the pending iteration
        if (this.iterationTimer) {
            clearTimeout(this.iterationTimer);
            this.iterationTimer = null;
        }

        // Perform iteration immediately
        this.performIteration(this.circles, this.connections);

        // Schedule the next regular iteration (only in auto mode)
        if (this.cascadeMode === 'Auto') {
            this.scheduleNextIteration(this.circles, this.connections);
        }
    }

performIteration(circles, connections) {
    console.log('CA: performIteration, phase:', this.currentPhase, 'mode:', this.cascadeMode);
    
    if (this.cascadeMode === 'Manual') {
        // In manual mode, run both phases together to show all possible changes
        this.runCirclePhase(circles, connections);
        this.runConnectionPhase(circles, connections);
        // Phase doesn't matter in manual mode since we run both
    } else {
        // In auto mode, alternate between phases
        if (this.currentPhase === 'circle') {
            this.runCirclePhase(circles, connections);
            this.currentPhase = 'connection';
        } else {
            this.runConnectionPhase(circles, connections);
            this.currentPhase = 'circle';
        }
    }

    console.log('CA: after phase, batched changes:', this.batchedChanges.length);

    // In auto mode, apply all changes immediately
    if (this.cascadeMode === 'Auto') {
        this.applyAllBatchedChanges();
    }

    // Notify state change
    if (this.onStateChange) {
        this.onStateChange({
            circleStates: new Map(this.circleStates),
            connectionStates: new Map(this.connectionStates),
            phase: this.currentPhase
        });
    }
}

    runCirclePhase(circles, connections) {
        const circlesMap = new Map(circles.map(c => [c.id, c]));

        circles.forEach(circle => {
            const energized = this.stateCalculator.calculateCircleEnergized(
                circle,
                connections,
                this.connectionStates
            );

            const shinyness = this.stateCalculator.calculateCircleShinyness(
                circle,
                energized
            );

            const newState = {
                energized,
                shinyness
            };

            // Check if this would actually change the state
            const currentState = this.circleStates.get(circle.id);
            if (!currentState || 
                currentState.energized !== newState.energized || 
                currentState.shinyness !== newState.shinyness) {
                
                // Batch the change instead of applying immediately
                this.batchedChanges.push({
                    type: 'circle',
                    id: circle.id,
                    state: newState
                });
            }
        });
    }

    runConnectionPhase(circles, connections) {
        const circlesMap = new Map(circles.map(c => [c.id, c]));

        connections.forEach(connection => {
            const energized = this.stateCalculator.calculateConnectionEnergized(
                connection,
                circlesMap,
                this.circleStates
            );

            const newState = {
                energized
            };

            // Check if this would actually change the state
            const currentState = this.connectionStates.get(connection.id);
            if (!currentState || currentState.energized !== newState.energized) {
                
                // Batch the change instead of applying immediately
                this.batchedChanges.push({
                    type: 'connection',
                    id: connection.id,
                    state: newState
                });
            }
        });
    }

/**
 * Apply a specific batched change by index
 */
applyBatchedChangeByIndex(index) {
    if (index < 0 || index >= this.batchedChanges.length) {
        console.log('CA: invalid index', index);
        return false;
    }

    // Remove the change at the specified index
    const change = this.batchedChanges.splice(index, 1)[0];
    
    console.log('CA: applying batched change at index', index, change.type, change.id);
    
    if (change.type === 'circle') {
        this.circleStates.set(change.id, change.state);
    } else if (change.type === 'connection') {
        this.connectionStates.set(change.id, change.state);
    }

    // In manual mode, clear remaining batched changes and recalculate all potential changes
    if (this.cascadeMode === 'Manual') {
        this.batchedChanges = [];
        this.performIteration(this.circles, this.connections);
    }

    // Notify state change
    if (this.onStateChange) {
        this.onStateChange({
            circleStates: new Map(this.circleStates),
            connectionStates: new Map(this.connectionStates),
            phase: this.currentPhase
        });
    }

    return true;
}

    /**
     * Apply the next batched change. Returns true if a change was applied, false if batch is empty.
     */
applyNextBatchedChange() {
    if (this.batchedChanges.length === 0) {
        return false;
    }

    const change = this.batchedChanges.shift();
    
    console.log('CA: applying batched change', change.type, change.id);
    
    if (change.type === 'circle') {
        this.circleStates.set(change.id, change.state);
    } else if (change.type === 'connection') {
        this.connectionStates.set(change.id, change.state);
    }

    // In manual mode, clear remaining batched changes and recalculate all potential changes
    if (this.cascadeMode === 'Manual') {
        this.batchedChanges = [];
        this.performIteration(this.circles, this.connections);
    }

    // Notify state change
    if (this.onStateChange) {
        this.onStateChange({
            circleStates: new Map(this.circleStates),
            connectionStates: new Map(this.connectionStates),
            phase: this.currentPhase
        });
    }

    return true;
}

    /**
     * Apply all remaining batched changes at once
     */
    applyAllBatchedChanges() {
        const changeCount = this.batchedChanges.length;
        if (changeCount > 0) {
            console.log('CA: applying all', changeCount, 'batched changes');
        }
        
        while (this.batchedChanges.length > 0) {
            const change = this.batchedChanges.shift();
            
            if (change.type === 'circle') {
                this.circleStates.set(change.id, change.state);
            } else if (change.type === 'connection') {
                this.connectionStates.set(change.id, change.state);
            }
        }

        // Single notification after all changes applied (only if there were changes)
        if (changeCount > 0 && this.onStateChange) {
            this.onStateChange({
                circleStates: new Map(this.circleStates),
                connectionStates: new Map(this.connectionStates),
                phase: this.currentPhase
            });
        }
    }

/**
 * Execute one step in manual mode:
 * - If there are batched changes, apply the next one (which will recalculate)
 * - If no batched changes, perform the next iteration (runs both phases)
 */
stepManual() {
    if (!this.isRunning || this.cascadeMode !== 'Manual') {
        console.log('CA: stepManual called but not in correct state', {
            isRunning: this.isRunning,
            cascadeMode: this.cascadeMode
        });
        return;
    }

    console.log('CA: stepManual, batched changes:', this.batchedChanges.length);

    // If there are pending changes, apply the next one
    if (this.batchedChanges.length > 0) {
        this.applyNextBatchedChange();
    } else {
        // No pending changes, perform the next iteration (both phases in manual mode)
        this.performIteration(this.circles, this.connections);
    }
}

    /**
     * Get the number of batched changes waiting to be applied
     */
    getBatchedChangeCount() {
        return this.batchedChanges.length;
    }

getBatchedChanges() {
    return this.batchedChanges.map(change => {
        let oldState;
        if (change.type === 'circle') {
            oldState = this.circleStates.get(change.id) || { energized: 'unenergized', shinyness: 'default' };
            return {
                type: change.type,
                id: change.id,
                changes: [
                    ...(oldState.energized !== change.state.energized ? [{
                        property: 'energized',
                        oldValue: oldState.energized,
                        newValue: change.state.energized
                    }] : []),
                    ...(oldState.shinyness !== change.state.shinyness ? [{
                        property: 'shinyness',
                        oldValue: oldState.shinyness,
                        newValue: change.state.shinyness
                    }] : [])
                ]
            };
        } else if (change.type === 'connection') {
            oldState = this.connectionStates.get(change.id) || { energized: 'unenergized' };
            return {
                type: change.type,
                id: change.id,
                changes: oldState.energized !== change.state.energized ? [{
                    property: 'energized',
                    oldValue: oldState.energized,
                    newValue: change.state.energized
                }] : []
            };
        }
    });
}

    /**
     * Check if there are any batched changes or if we can iterate
     */
    canStep() {
        return this.isRunning && this.cascadeMode === 'Manual';
    }

    getCircleState(circleId) {
        return this.circleStates.get(circleId) || {
            energized: 'unenergized',
            shinyness: 'default'
        };
    }

    getConnectionState(connectionId) {
        return this.connectionStates.get(connectionId) || {
            energized: 'unenergized'
        };
    }

    getCircleShininessNumeric(circleId) {
        const state = this.getCircleState(circleId);
        return this.stateCalculator.convertShininessToNumeric(state.shinyness);
    }

    getAllCircleShininessNumeric() {
        const numericMap = new Map();
        this.circleStates.forEach((state, circleId) => {
            numericMap.set(circleId, this.stateCalculator.convertShininessToNumeric(state.shinyness));
        });
        return numericMap;
    }

    updateData(circles, connections) {
        if (!this.isRunning) {
            return;
        }

        // Update stored references
        this.circles = circles;
        this.connections = connections;

        const circleIds = new Set(circles.map(c => c.id));
        const connectionIds = new Set(connections.map(c => c.id));

        this.circleStates.forEach((_, id) => {
            if (!circleIds.has(id)) {
                this.circleStates.delete(id);
            }
        });

        this.connectionStates.forEach((_, id) => {
            if (!connectionIds.has(id)) {
                this.connectionStates.delete(id);
            }
        });

        circles.forEach(circle => {
            if (!this.circleStates.has(circle.id)) {
                this.circleStates.set(circle.id, {
                    energized: 'unenergized',
                    shinyness: 'default'
                });
            }
        });

        connections.forEach(connection => {
            if (!this.connectionStates.has(connection.id)) {
                this.connectionStates.set(connection.id, {
                    energized: 'unenergized'
                });
            }
        });
    }

    getConnectionEnergyClasses(connectionId) {
        const state = this.getConnectionState(connectionId);
        const classes = [];

        if (state.energized === 'excited') {
            classes.push('exciter-connection');
        } else if (state.energized === 'dampened') {
            classes.push('dampener-connection');
        }

        return classes;
    }

    isActive() {
        return this.isRunning;
    }

    getCurrentPhase() {
        return this.currentPhase;
    }
}
