// EnergyReceivedIndicator.js - Component for displaying energy received from other entities with shinyness calculation
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
         * Calculate base shinyness from activation status
         */
        const calculateBaseShinyness = () => {
            const activationMap = {
                'activated': 1,
                'inactive': -1,
                'inert': 0
            };
            return activationMap[props.entity.activation] || 0;
        };

        /**
         * Calculate energy effect on shinyness
         */
        const calculateEnergyEffect = () => {
            let energyEffect = 0;
            
            energyData.value.forEach(effect => {
                if (effect.energyType === 'exciter' || effect.energyType === 'igniter') {
                    energyEffect += effect.amount * 2;
                } else if (effect.energyType === 'dampener') {
                    energyEffect -= effect.amount * 2;
                }
            });
            
            return energyEffect;
        };

        /**
         * Get CSS class for shinyness value styling
         */
        const getShinynessClass = (value) => {
            if (value > 0) return 'shinyness-positive';
            if (value < 0) return 'shinyness-negative';
            return 'shinyness-neutral';
        };

        /**
         * Format shinyness value for display
         */
        const formatShinynessValue = (value) => {
            return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
        };

        /**
         * Calculate shinyness contribution for an energy effect
         * Dampeners contribute negative shinyness, others contribute positive
         */
        const calculateShinynessContribution = (effect) => {
            if (effect.energyType === 'dampener') {
                return -2 * effect.amount;
            }
            return 2 * effect.amount;
        };

        const calculateShinynessData = () => {
            const energyEffectsForShinyness = energyData.value.map(effect => ({
                energyType: effect.energyType,
                amount: effect.amount
            }));
            
            return shinynessCalculator.calculateNetShinyness(
                props.entity.activation, 
                energyEffectsForShinyness
            );
        };

        const shinynessData = computed(() => calculateShinynessData());
        const baseShinyness = computed(() => shinynessData.value.base);
        const energyEffect = computed(() => shinynessData.value.energy);
        const netShinyness = computed(() => shinynessData.value.net);

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
                
                // Try alternative methods if they exist
                if (props.dataStore.circles && props.dataStore.circles.has) {
                    const circle = props.dataStore.circles.get(entityId);
                    if (circle && circle.name) {
                        return circle.name;
                    }
                }
                
                if (props.dataStore.squares && props.dataStore.squares.has) {
                    const square = props.dataStore.squares.get(entityId);
                    if (square && square.name) {
                        return square.name;
                    }
                }
                
                // If we have access to all entities, search through them
                if (props.dataStore.getAllEntities) {
                    const entities = props.dataStore.getAllEntities();
                    const entity = entities.find(e => e.id === entityId);
                    if (entity && entity.name) {
                        return entity.name;
                    }
                }
                
                // Last resort: check if the proximity system has cached circle data
                if (proximitySystem.circles.has(entityId)) {
                    const circleData = proximitySystem.circles.get(entityId);
                    if (circleData.circle && circleData.circle.name) {
                        return circleData.circle.name;
                    }
                }
                
            } catch (error) {
                console.warn('Error getting entity name for', entityId, error);
            }
            
            return entityId;
        };

        /**
         * Get proximity-based energy effects for this entity
         */
        const getProximityEnergyEffects = () => {
            const effects = [];
            
            if (!proximitySystem.circles.has(props.entity.id)) {
                return effects;
            }

            // Get all circles in the same viewer
            const viewerCircles = Array.from(proximitySystem.circles.values())
                .filter(data => data.viewerId === props.viewerId);
            
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
            const thisPos = proximitySystem.getEffectivePosition(props.entity.id);
            if (!thisPos) return effects;

            influencerCircles.forEach(influencerData => {
                const influencerPos = proximitySystem.getEffectivePosition(influencerData.circle.id);
                if (!influencerPos) return;

                const distance = proximitySystem.calculateDistance(thisPos, influencerPos);
                if (distance <= proximitySystem.calculator.visualEffectsCalculator.config.maxDistance) {
                    const proximityStrength = proximitySystem.calculateProximityStrength(distance);
                    
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
                    });
                }
            });

            return effects;
        };

        /**
         * Get explicit connection-based energy effects for this entity
         */
const getExplicitEnergyEffects = () => {
            const effects = [];
            
            if (!proximitySystem || !props.dataStore) {
                return effects;
            }

            try {
                const explicitEffects = proximitySystem.getExplicitEffectsForCircle(
                    props.entity.id, 
                    props.viewerId
                );

                // Process exciter effects
                explicitEffects.exciterEffects.forEach(effect => {
                    if (effect.sourceCircleId) {
                        effects.push({
                            sourceId: effect.sourceCircleId,
                            sourceName: getEntityName(effect.sourceCircleId),
                            energyType: effect.isIgniter ? 'igniter' : 'exciter',
                            amount: effect.influence,
                            connectionType: 'explicit'
                        });
                    }
                });

                // Process dampener effects
                explicitEffects.dampenerEffects.forEach(effect => {
                    if (effect.sourceCircleId) {
                        effects.push({
                            sourceId: effect.sourceCircleId,
                            sourceName: getEntityName(effect.sourceCircleId),
                            energyType: 'dampener',
                            amount: effect.influence,
                            connectionType: 'explicit'
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

            // Convert to array and sort by source name
            energyData.value = Array.from(combinedEffects.values())
                .filter(effect => effect.amount > 0.01) // Filter out very small effects
                .sort((a, b) => a.sourceName.localeCompare(b.sourceName));
        };

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
            getShinynessClass,
            formatShinynessValue,
            calculateShinynessContribution,
            baseShinyness,
            energyEffect,
            netShinyness,
            getShinynessClass: shinynessCalculator.getShinynessClass.bind(shinynessCalculator),
            formatShinynessValue: shinynessCalculator.formatShinynessValue.bind(shinynessCalculator),
            calculateShinynessContribution: (effect) => shinynessCalculator.calculateEnergyShinyness([effect])
        };
    },
    template: `
        <div 
            v-if="shouldShow" 
            class="energy-received-indicator"
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
                        <td class="energy-received-cell shinyness-contribution" :class="getShinynessClass(calculateShinynessContribution(effect))">
                            {{ formatShinynessValue(calculateShinynessContribution(effect)) }}
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
