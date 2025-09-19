// EnergyReceivedIndicator.js - Component for displaying energy received from other entities with accurate shinyness calculation
import { computed, ref, onMounted, onUnmounted } from './vue-composition-api.js';
import { getEnergyTypeColor } from './energyTypes.js';
import { injectComponentStyles } from './styleUtils.js';
import { useEnergyProximitySystem } from './EnergyProximitySystem.js';
import { ShinynessCalculator } from './ShinynessCalculator.js';

const componentStyles = `
    .energy-received-indicator {
        position: absolute;
        top: 115%;
        left: 50%;
        transform: translateX(-50%);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        padding: 1px;
        z-index: 100;
        color: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        pointer-events: none;
        user-select: none;
        font-size: 9px;
        color: #CCC;
    }

    .energy-received-table {
        width: 100%;
        border-collapse: collapse;
    }

    .energy-received-row {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .energy-received-row:last-child {
        border-bottom: none;
    }

    .energy-received-cell {
        padding: 4px;
        vertical-align: middle;
    }

    .energy-received-source {
        max-width: 80px;
        word-wrap: break-word;
        text-align: left;
    }

    .energy-received-type {
        text-align: center;
        width: 20px;
    }

    .energy-received-dot {
        width: 2px;
        height: 2px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
        margin: 0 auto;
    }

    .energy-received-amount {
        text-align: right;
        font-family: monospace;
        color: #FFF;
        width: 40px;
    }

    .shinyness-contribution {
        text-align: right;
        font-family: monospace;
        width: 40px;
    }

    .energy-received-subtitle {
        color: #999;
        margin-bottom: 4px;
        text-align: center;
    }

    /* Connection type indicators */
    .connection-type-proximity {
        opacity: 0.8;
    }

    .connection-type-explicit {
        font-weight: bold;
    }

    .shinyness-positive {
        color: #4CAF50;
    }

    .shinyness-negative {
        color: #FF6B6B;
    }

    .shinyness-neutral {
        color: #AAA;
    }

    /* Receive mode indicators */
    .receive-mode-and {
        border-left: 2px solid #FFA500;
    }

    .receive-mode-explosive-and {
        border-left: 2px solid #FF4500;
    }
`;

injectComponentStyles('energy-received-indicator', componentStyles);

export const EnergyReceivedIndicator = {
    props: {
        entity: {
            type: Object,
            required: true
        },
        entityType: {
            type: String,
            required: true
        },
        viewerId: {
            type: String,
            required: true
        },
        dataStore: {
            type: Object,
            default: null
        }
    },
    setup(props) {
        const shinynessCalculator = new ShinynessCalculator();
        const energyData = ref([]);
        const updateInterval = ref(null);
        const proximitySystem = useEnergyProximitySystem();

        /**
         * Get the name of an entity by its ID
         */
        const getEntityName = (entityId) => {
            if (!props.dataStore) {
                console.warn('No dataStore provided to EnergyReceivedIndicator');
                return entityId;
            }
            
            try {
                // Try to get circle first
                if (props.dataStore.getCircle) {
                    const circle = props.dataStore.getCircle(entityId);
                    if (circle && circle.name) {
                        return circle.name;
                    }
                }
                
                // Try to get square
                if (props.dataStore.getSquare) {
                    const square = props.dataStore.getSquare(entityId);
                    if (square && square.name) {
                        return square.name;
                    }
                }
                
                // FIXED: Use the correct API to check circle data from the refactored proximity system
                if (proximitySystem.circleManager && proximitySystem.circleManager.getCircleData) {
                    const circleData = proximitySystem.circleManager.getCircleData(entityId);
                    if (circleData && circleData.circle && circleData.circle.name) {
                        return circleData.circle.name;
                    }
                }
                
            } catch (error) {
                console.warn('Error getting entity name for', entityId, error);
            }
            
            return entityId;
        };

        /**
         * Get proximity-based energy effects for this entity with connection metadata
         */
        const getProximityEnergyEffects = () => {
            const effects = [];
            
            // FIXED: Use the correct API to check if circle is registered
            if (!proximitySystem.circleManager || !proximitySystem.circleManager.getCircleData(props.entity.id)) {
                return effects;
            }

            // FIXED: Get all circles in the same viewer using the correct API
            const allCircles = proximitySystem.circleManager.getAllCircles();
            const viewerCircles = [];
            
            for (const [circleId, circleData] of allCircles) {
                if (circleData.viewerId === props.viewerId) {
                    viewerCircles.push(circleData);
                }
            }
            
            // Find circles that can affect this entity (exciters/igniters/dampeners)
            const influencerCircles = viewerCircles.filter(data => {
                const circle = data.circle;
                const isActivated = circle.activation === 'activated';
                const hasEnergyType = circle.energyTypes && (
                    circle.energyTypes.includes('exciter') ||
                    circle.energyTypes.includes('igniter') ||
                    circle.energyTypes.includes('dampener')
                );
                return isActivated && hasEnergyType && circle.id !== props.entity.id;
            });

            // Calculate proximity effects from each influencer
            const thisPos = proximitySystem.circleManager.getEffectivePosition(props.entity.id);
            if (!thisPos) return effects;

            influencerCircles.forEach(influencerData => {
                const influencerPos = proximitySystem.circleManager.getEffectivePosition(influencerData.circle.id);
                if (!influencerPos) return;

                // FIXED: Use the correct API for distance calculation
                const distance = proximitySystem.proximityCalculator.calculateDistance(thisPos, influencerPos);
                const maxDistance = proximitySystem.calculator.visualEffectsCalculator.config.maxDistance;
                
                if (distance <= maxDistance) {
                    const proximityStrength = proximitySystem.proximityCalculator.calculateProximityStrength(distance);
                    
                    // Convert proximity strength to 0-1 influence
                    const config = proximitySystem.calculator.visualEffectsCalculator.config;
                    const influence = (proximityStrength - config.minScale) / (config.maxScale - config.minScale);
                    
                    // Determine energy type
                    const circle = influencerData.circle;
                    let energyType = 'exciter';
                    if (circle.energyTypes.includes('igniter')) {
                        energyType = 'igniter';
                    } else if (circle.energyTypes.includes('dampener')) {
                        energyType = 'dampener';
                    }

                    effects.push({
                        sourceId: circle.id,
                        sourceName: getEntityName(circle.id),
                        energyType,
                        amount: Math.max(0, Math.min(1, influence)),
                        connectionType: 'proximity'
                        // Note: proximity effects don't have connection metadata for receive modes
                    });
                }
            });

            return effects;
        };

        /**
         * Get explicit connection-based energy effects for this entity with metadata
         */
        const getExplicitEnergyEffects = () => {
            const effects = [];
            
            if (!proximitySystem || !props.dataStore || !proximitySystem.explicitDetector) {
                return effects;
            }

            try {
                // FIXED: Use the correct method to get explicit effects
                const explicitEffectsData = proximitySystem.explicitDetector.calculateExplicitEnergyEffects(
                    props.entity, 
                    props.viewerId
                );

                if (!explicitEffectsData) {
                    return effects;
                }

                // Get the raw effects using the cascade calculator for detailed breakdown
                const exciterEffects = proximitySystem.explicitDetector.cascadeEffectCalculator.findConnectedExciters(
                    props.entity.id, 
                    props.viewerId
                );
                const dampenerEffects = proximitySystem.explicitDetector.cascadeEffectCalculator.findConnectedDampeners(
                    props.entity.id, 
                    props.viewerId
                );

                // Process exciter effects
                exciterEffects.forEach(effect => {
                    if (effect.sourceCircleId) {
                        effects.push({
                            sourceId: effect.sourceCircleId,
                            sourceName: getEntityName(effect.sourceCircleId),
                            energyType: effect.isIgniter ? 'igniter' : 'exciter',
                            amount: effect.influence || 0.5, // Default influence if not specified
                            connectionType: 'explicit',
                            connectionMeta: effect.connectionMeta // Include metadata for receive mode calculations
                        });
                    }
                });

                // Process dampener effects
                dampenerEffects.forEach(effect => {
                    if (effect.sourceCircleId) {
                        effects.push({
                            sourceId: effect.sourceCircleId,
                            sourceName: getEntityName(effect.sourceCircleId),
                            energyType: 'dampener',
                            amount: effect.influence || 0.5, // Default influence if not specified
                            connectionType: 'explicit',
                            connectionMeta: effect.connectionMeta // Include metadata for receive mode calculations
                        });
                    }
                });
            } catch (error) {
                console.warn('Error getting explicit energy effects:', error);
            }

            return effects;
        };

        /**
         * Update energy data by combining proximity and explicit effects
         * Then calculate accurate shinyness using the actual ShinynessCalculator
         */
        const updateEnergyData = () => {
            if (props.entityType !== 'circle' || props.entity.activation === 'inert') {
                energyData.value = [];
                return;
            }

            const proximityEffects = getProximityEnergyEffects();
            const explicitEffects = getExplicitEnergyEffects();
            
            // Combine and deduplicate effects (explicit takes precedence over proximity)
            const combinedEffects = new Map();
            
            // Add proximity effects first
            proximityEffects.forEach(effect => {
                const key = `${effect.sourceId}_${effect.energyType}`;
                combinedEffects.set(key, effect);
            });
            
            // Add explicit effects (will override proximity if same source+type)
            explicitEffects.forEach(effect => {
                const key = `${effect.sourceId}_${effect.energyType}`;
                combinedEffects.set(key, effect);
            });

            // Convert to array for ShinynessCalculator
            const allEffects = Array.from(combinedEffects.values())
                .filter(effect => effect.amount > 0.01); // Filter out very small effects

            // Use ShinynessCalculator to get accurate shinyness with receive mode support
            const shinynessReceiveMode = props.entity.shinynessReceiveMode || 'or';
            const shinynessResult = shinynessCalculator.calculateNetShinyness(
                props.entity.activation,
                allEffects, // Pass the effects with metadata
                shinynessReceiveMode
            );

            // Create display data using the breakdown from ShinynessCalculator
            const displayData = [];
            
            // Map breakdown back to original effects for display
            if (shinynessResult.effectBreakdown) {
                shinynessResult.effectBreakdown.forEach((breakdown, index) => {
                    // Find the corresponding original effect
                    const originalEffect = allEffects[index];
                    if (originalEffect) {
                        displayData.push({
                            sourceId: originalEffect.sourceId,
                            sourceName: originalEffect.sourceName,
                            energyType: breakdown.energyType,
                            amount: breakdown.originalAmount,
                            connectionType: originalEffect.connectionType,
                            actualShinynessContribution: breakdown.modifiedAmount,
                            receiveModifier: breakdown.receiveModifier
                        });
                    }
                });
            }

            // Sort by source name and store
            energyData.value = displayData.sort((a, b) => a.sourceName.localeCompare(b.sourceName));
        };

        /**
         * Calculate actual shinyness data using ShinynessCalculator
         */
        const calculateShinynessData = () => {
            if (props.entityType !== 'circle' || props.entity.activation === 'inert') {
                return { base: 0, energy: 0, net: 0, receiveMode: 'or' };
            }

            // Get all current energy effects
            const proximityEffects = getProximityEnergyEffects();
            const explicitEffects = getExplicitEnergyEffects();
            
            // Combine effects
            const combinedEffects = new Map();
            proximityEffects.forEach(effect => {
                const key = `${effect.sourceId}_${effect.energyType}`;
                combinedEffects.set(key, effect);
            });
            explicitEffects.forEach(effect => {
                const key = `${effect.sourceId}_${effect.energyType}`;
                combinedEffects.set(key, effect);
            });

            const allEffects = Array.from(combinedEffects.values())
                .filter(effect => effect.amount > 0.01);

            // Calculate with ShinynessCalculator
            const shinynessReceiveMode = props.entity.shinynessReceiveMode || 'or';
            return shinynessCalculator.calculateNetShinyness(
                props.entity.activation,
                allEffects,
                shinynessReceiveMode
            );
        };

        const shinynessData = computed(() => calculateShinynessData());
        const baseShinyness = computed(() => shinynessData.value.base);
        const energyEffect = computed(() => shinynessData.value.energy);
        const netShinyness = computed(() => shinynessData.value.net);
        const receiveMode = computed(() => shinynessData.value.receiveMode || 'or');

        /**
         * Start periodic updates
         */
        const startUpdates = () => {
            updateEnergyData();
            updateInterval.value = setInterval(updateEnergyData, 200); // Update every 200ms
        };

        /**
         * Stop periodic updates
         */
        const stopUpdates = () => {
            if (updateInterval.value) {
                clearInterval(updateInterval.value);
                updateInterval.value = null;
            }
        };

        // Computed property to check if we should show the indicator
        const shouldShow = computed(() => {
            return (energyData.value.length > 0 || baseShinyness.value !== 0) && 
                   props.entityType === 'circle' && 
                   props.entity.activation !== 'inert';
        });

        // Lifecycle
        onMounted(() => {
            startUpdates();
        });

        onUnmounted(() => {
            stopUpdates();
        });

        return {
            energyData,
            shouldShow,
            getEnergyTypeColor,
            updateEnergyData,
            startUpdates,
            stopUpdates,
            // Shinyness computed properties
            baseShinyness,
            energyEffect,
            netShinyness,
            receiveMode,
            getShinynessClass: shinynessCalculator.getShinynessClass.bind(shinynessCalculator),
            formatShinynessValue: shinynessCalculator.formatShinynessValue.bind(shinynessCalculator)
        };
    },
    template: `
        <div 
            v-if="shouldShow" 
            class="energy-received-indicator"
            :class="{
                'receive-mode-and': receiveMode === 'and',
                'receive-mode-explosive-and': receiveMode === 'explosiveAnd'
            }"
        >
            <table class="energy-received-table">
                <tbody>
                    <!-- Base Shinyness Header Row -->
                    <tr class="energy-received-row shinyness-row shinyness-header">
                        <td class="energy-received-cell shinyness-label" colspan="3">
                            Base
                        </td>
                        <td class="energy-received-cell shinyness-value" :class="getShinynessClass(baseShinyness)">
                            {{ formatShinynessValue(baseShinyness) }}
                        </td>
                    </tr>
                    
                    <!-- Energy Effects Rows -->
                    <tr 
                        v-for="effect in energyData" 
                        :key="effect.sourceId + '_' + effect.energyType"
                        class="energy-received-row"
                        :class="'connection-type-' + effect.connectionType"
                    >
                        <td class="energy-received-cell energy-received-source">
                            {{ effect.sourceName }}
                        </td>
                        <td class="energy-received-cell energy-received-type">
                            <div 
                                class="energy-received-dot"
                                :style="{ backgroundColor: getEnergyTypeColor(effect.energyType) }"
                                :title="effect.energyType.charAt(0).toUpperCase() + effect.energyType.slice(1)"
                            ></div>
                        </td>
                        <td class="energy-received-cell energy-received-amount">
                            {{ effect.amount.toFixed(2) }}
                        </td>
                        <td class="energy-received-cell shinyness-contribution" :class="getShinynessClass(effect.actualShinynessContribution)">
                            {{ formatShinynessValue(effect.actualShinynessContribution) }}
                        </td>
                    </tr>
                    
                    <!-- Net Shinyness Footer Row -->
                    <tr class="energy-received-row shinyness-row shinyness-footer">
                        <td class="energy-received-cell shinyness-label" colspan="3">
                            Net
                        </td>
                        <td class="energy-received-cell shinyness-value" :class="getShinynessClass(netShinyness)">
                            {{ formatShinynessValue(netShinyness) }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
};
