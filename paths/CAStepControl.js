import { computed } from './vue-composition-api.js';
export const CAStepControl = {
    props: {
        batchedChangeCount: {
            type: Number,
            required: true
        },
        batchedChanges: {
            type: Array,
            required: true
        },
        canStep: {
            type: Boolean,
            required: true
        },
        circles: {
            type: Array,
            required: true
        },
        connections: {
            type: Array,
            required: true
        }
    },
    emits: ['step', 'step-specific'],  // Add new event
    setup(props, { emit }) {
        const handleStep = () => {
            if (props.canStep) {
                emit('step');
            }
        };

        // New handler for clicking specific changes
        const handleStepSpecific = (index, event) => {
            event.stopPropagation(); // Prevent triggering the general step
            if (props.canStep) {
                emit('step-specific', index);
            }
        };

        const displayText = computed(() => {
            if (props.batchedChangeCount > 0) {
                return props.batchedChangeCount.toString();
            }
            return '▶';
        });

        // Create lookup maps for efficient name retrieval
        const circleNamesMap = computed(() => {
            const map = new Map();
            props.circles.forEach(circle => {
                map.set(circle.id, circle.name);
            });
            return map;
        });

        // Helper function to get entity display name
        const getEntityDisplayName = (entityId, entityType) => {
            if (entityType === 'circle') {
                return circleNamesMap.value.get(entityId) || entityId;
            } else if (entityType === 'connection') {
                // Find the connection
                const connection = props.connections.find(c => c.id === entityId);
                if (!connection) {
                    return entityId;
                }

                // Get the names of connected entities
                // Handle both circle connections and explicit connections
                const fromId = connection.from || connection.entity1Id;
                const toId = connection.to || connection.entity2Id;
                
                const fromName = circleNamesMap.value.get(fromId) || fromId;
                const toName = circleNamesMap.value.get(toId) || toId;

                return `${fromName} - ${toName}`;
            }
            return entityId;
        };

        // Group changes by entity - show all property changes together
        const pendingChanges = computed(() => {
            const grouped = [];
            props.batchedChanges.forEach((change, index) => {
                const propertyChanges = change.changes.filter(pc => pc.property); // Only include actual changes
                if (propertyChanges.length > 0) {
                    grouped.push({
                        index: index,  // Store the original index
                        entityId: change.id,
                        entityType: change.type,
                        displayName: getEntityDisplayName(change.id, change.type),
                        changes: propertyChanges
                    });
                }
            });
            return grouped;
        });

        return {
            handleStep,
            handleStepSpecific,
            displayText,
            pendingChanges
        };
    },
    template: `
        <div 
            v-if="canStep"
            class="ca-step-control"
            @click="handleStep"
            :title="batchedChangeCount > 0 ? 'Apply next change' : 'Run next iteration'"
        >
            <span class="ca-step-text">{{ displayText }}</span>
            <div 
                v-if="pendingChanges.length > 0"
                class="pending-changes" 
                style="position: absolute; right: 0; bottom: 100%; margin-bottom: 8px; background: rgba(0, 0, 0, 0.85); border-radius: 4px; padding: 8px; max-height: 200px; overflow-y: auto; min-width: 250px; font-size: 11px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"
            >
                <div 
                    v-for="(entity, idx) in pendingChanges"
                    :key="idx"
                    class="pending-entity"
                    @click="handleStepSpecific(entity.index, $event)"
                    style="padding: 4px; cursor: pointer; transition: background-color 0.15s;"
                    :style="{ 
                        borderBottom: idx === pendingChanges.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.1)'
                    }"
                    @mouseenter="$event.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'"
                    @mouseleave="$event.currentTarget.style.backgroundColor = 'transparent'"
                >
                    <div style="font-weight: bold; color: #88ccff; margin-bottom: 2px;">{{ entity.displayName }}</div>
                    <div 
                        v-for="(change, changeIndex) in entity.changes"
                        :key="changeIndex"
                        style="margin-left: 8px; padding: 1px 0;"
                    >
                        <span style="color: #aaa;">{{ change.property }}:</span>
                        <span style="color: #ff8888; margin: 0 4px;">{{ change.oldValue }}</span>
                        <span style="color: #aaa;">→</span>
                        <span style="color: #88ff88; margin: 0 4px;">{{ change.newValue }}</span>
                    </div>
                </div>
            </div>
        </div>
    `
};
