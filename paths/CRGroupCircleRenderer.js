// CRGroupCircleRenderer.js - Updated with continuous seismograph and improved mood system integration
import { getColorWithOpacity } from './colorUtils.js';
import { useDataStore } from './dataCoordinator.js';
import { SeismographComponent } from './SeismographComponent.js';

export const GroupCircleRenderer = {
    render(element, circle, belongingCirclesCount = null) {
        if (!element) return;
        
        const color = circle.colors[0] || '#4CAF50';
        
        // Get dataStore and calculate belonging circles count if not provided
        let actualBelongingCount = belongingCirclesCount;
        if (actualBelongingCount === null) {
            const dataStore = useDataStore();
            const belongingCircles = dataStore.getCirclesBelongingToGroup(circle.id);
            actualBelongingCount = belongingCircles.length;
        }
        
        const isCollapsed = circle.collapsed === true;
        const isRoilMode = circle.roilMode === 'on';
        
        const awarenessLine = document.createElement('div');
        awarenessLine.className = `awareness-line`;
        
        const groupElement = document.createElement('div');
        groupElement.className = `group-circle-container ${isCollapsed ? 'collapsed' : 'expanded'} ${circle.sizeMode === 'manual' ? 'manual-size' : 'auto-size'} ${isRoilMode ? 'roil-mode' : ''}`;
        
        // Set visual styling
        groupElement.style.borderColor = color;
        groupElement.style.backgroundColor = `color-mix(in srgb, ${color} 15%, transparent)`;
        
        // Add member count display for collapsed groups
        if (isCollapsed && actualBelongingCount > 0) {
            const countElement = document.createElement('div');
            countElement.className = 'group-member-count';
            countElement.textContent = actualBelongingCount.toString();
            countElement.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: ${color};
                font-size: 14px;
                font-weight: bold;
                pointer-events: none;
                z-index: 2;
                text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
            `;
            groupElement.appendChild(countElement);
        }
        
        // Add selection handle for roil mode groups
        if (isRoilMode) {
            const selectionHandle = document.createElement('div');
            selectionHandle.className = 'group-selection-handle';
            selectionHandle.style.cssText = `
                position: absolute;
                width: 7px;
                height: 7px;
                top: 0;
                left: 0;
                border-radius: 50%;
                background-color: rgba(155, 155, 155, 0.1);
                pointer-events: none;
                z-index: 10;
                transition: background-color 0.2s ease;
            `;
            
            // Store reference to handle for potential selection state updates
            element._selectionHandle = selectionHandle;
            element.appendChild(selectionHandle);
        }
        
        element.appendChild(groupElement);
        element.appendChild(awarenessLine);
        
        // Store current state for reference
        element._groupScale = { 
            isCollapsed: isCollapsed,
            isRoilMode: isRoilMode
        };

        // Set up seismograph with continuous updates
        GroupCircleRenderer.updateSeismographVisibility(element, circle);
    },

    /**
     * UPDATED: Enhanced seismograph logic with continuous updates and better mood system integration
     */
    updateSeismographVisibility(element, circle) {
        if (circle.showSeismograph === 'yes') {
            // Only create seismograph if one doesn't already exist
            if (!element._seismographChart) {
                const dataStore = useDataStore();

                /**
                 * ENHANCED: Optimized mood value function for continuous updates
                 * This function will be called every 150ms, so it needs to be efficient
                 */
                const getMoodValue = () => {
                    // Priority 1: Use the centralized mood system (most accurate and efficient)
                    if (dataStore.moodSystem) {
                        try {
                            const moodValue = dataStore.moodSystem.calculateGroupMoodValue(circle.id);
                            if (typeof moodValue === 'number' && !isNaN(moodValue)) {
                                return Math.max(0, Math.min(1, moodValue));
                            }
                        } catch (error) {
                            console.warn(`Error calculating mood value for group ${circle.id}:`, error);
                        }
                    }

                    // Priority 2: Fallback to manual calculation if mood system unavailable
                    try {
                        const belongingCircles = dataStore.getCirclesBelongingToGroup(circle.id);

                        if (belongingCircles.length === 0) {
                            return 0.5; // Default neutral value if no members
                        }

                        // Calculate weighted average mood value considering current display state
                        let totalMoodValue = 0;
                        let validMemberCount = 0;

                        belongingCircles.forEach(memberCircle => {
                            let moodValue;

                            // Check if member is using secondary colors
                            const memberElement = document.querySelector(`[data-entity-id="${memberCircle.id}"]`);
                            const useSecondary = memberElement?.hasAttribute('data-use-secondary-colors');

                            // Use secondary mood if flipped and available, otherwise primary
                            if (useSecondary && memberCircle.secondaryMoodValue !== undefined) {
                                moodValue = memberCircle.secondaryMoodValue;
                            } else if (memberCircle.satisfactionLocked === 'yes' && 
                                memberCircle.secondaryColors?.length > 0) {
                                // For satisfaction locked circles with secondary colors, use secondaryMoodValue
                                moodValue = memberCircle.secondaryMoodValue;
                            } else {
                                // Otherwise use primary mood value
                                moodValue = memberCircle.moodValue;
                            }

                            // Only include valid mood values (not undefined/null)
                            if (typeof moodValue === 'number' && !isNaN(moodValue)) {
                                totalMoodValue += moodValue;
                                validMemberCount++;
                            }
                        });

                        if (validMemberCount === 0) {
                            return 0.5; // Default neutral value if no valid mood values
                        }

                        // Return average, ensuring it's within 0-1 range
                        const avgMoodValue = totalMoodValue / validMemberCount;
                        return Math.max(0, Math.min(1, avgMoodValue));
                        
                    } catch (error) {
                        console.warn(`Error in fallback mood calculation for group ${circle.id}:`, error);
                        return 0.5; // Safe fallback
                    }
                };

                /**
                 * UPDATED: Create seismograph with continuous-only configuration
                 */
                const seismograph = SeismographComponent.create(element, {
                    maxPoints: 50,
                    updateInterval: 500, // Continuous 150ms updates only
                    color: circle.colors[0] || '#4CAF50',
                    dataSource: getMoodValue,
                    moodSystem: dataStore.moodSystem, // For data access only, no listeners
                    circleId: circle.id, // For debugging/identification
                });

                // Store reference for cleanup
                element._seismographChart = seismograph;

                // Start the continuous updates
                seismograph.start();

                // NEW: Add debugging method to element for troubleshooting
                if (typeof window !== 'undefined') {
                    element._debugSeismograph = () => {
                        return {
                            status: seismograph.getStatus(),
                            currentMoodValue: getMoodValue(),
                            groupId: circle.id,
                            memberCount: dataStore.getCirclesBelongingToGroup(circle.id).length
                        };
                    };
                }
            }
        } else {
            // Clean up seismograph if it exists but shouldn't be shown
            if (element._seismographChart) {
                element._seismographChart.destroy();
                element._seismographChart = null;
                
                // Clean up debug method
                delete element._debugSeismograph;
            }
        }
    },

    /**
     * NEW: Update seismograph properties without recreating it
     * Useful for when group properties change but showSeismograph stays 'yes'
     */
    updateSeismographProperties(element, circle) {
        const seismograph = element._seismographChart;
        if (!seismograph) return;

        // Update color if changed
        const newColor = circle.colors[0] || '#4CAF50';
        seismograph.updateColor(newColor);

        // Update interval if needed (you could make this configurable per group)
        // seismograph.setUpdateInterval(circle.customInterval || 150);

    },

    /**
     * NEW: Force refresh seismograph data source
     * Useful when mood system or data store changes
     */
    refreshSeismographDataSource(element, circle) {
        const seismograph = element._seismographChart;
        if (!seismograph) return;

        const dataStore = useDataStore();

        // Create updated getMoodValue function
        const getMoodValue = () => {
            if (dataStore.moodSystem) {
                try {
                    const moodValue = dataStore.moodSystem.calculateGroupMoodValue(circle.id);
                    if (typeof moodValue === 'number' && !isNaN(moodValue)) {
                        return Math.max(0, Math.min(1, moodValue));
                    }
                } catch (error) {
                    console.warn(`Error calculating mood value for group ${circle.id}:`, error);
                }
            }
            return 0.5; // Safe fallback
        };

        // Update the data source and mood system
        seismograph.setDataSource(getMoodValue);
        seismograph.setMoodSystem(dataStore.moodSystem);
    }
};

// NEW: Global debugging utilities for seismographs
if (typeof window !== 'undefined') {
    window.seismographDebug = {
        /**
         * Get status of all active seismographs
         */
        getAllStatus: () => {
            const results = [];
            document.querySelectorAll('[data-entity-id]').forEach(element => {
                if (element._seismographChart && element._debugSeismograph) {
                    results.push(element._debugSeismograph());
                }
            });
            return results;
        },

        /**
         * Get status of specific seismograph
         */
        getStatus: (circleId) => {
            const element = document.querySelector(`[data-entity-id="${circleId}"]`);
            return element?._debugSeismograph?.() || null;
        },

        /**
         * Force update interval on all seismographs
         */
        setGlobalInterval: (intervalMs) => {
            document.querySelectorAll('[data-entity-id]').forEach(element => {
                if (element._seismographChart) {
                    element._seismographChart.setUpdateInterval(intervalMs);
                }
            });
        },

        /**
         * Test mood value function for a specific group
         */
        testMoodValue: (circleId) => {
            const element = document.querySelector(`[data-entity-id="${circleId}"]`);
            const debug = element?._debugSeismograph?.();
            if (debug) {
                return {
                    circleId,
                    currentMoodValue: debug.currentMoodValue,
                    memberCount: debug.memberCount,
                    seismographRunning: debug.status.isRunning
                };
            }
            return null;
        },

        /**
         * Refresh all seismograph data sources
         */
        refreshAllDataSources: () => {
            const dataStore = useDataStore();
            const count = document.querySelectorAll('[data-entity-id]').length;
            
            document.querySelectorAll('[data-entity-id]').forEach(element => {
                const circleId = element.getAttribute('data-entity-id');
                const circle = dataStore.getCircle(circleId);
                
                if (circle?.type === 'group' && element._seismographChart) {
                    GroupCircleRenderer.refreshSeismographDataSource(element, circle);
                }
            });
        }
    };
}
