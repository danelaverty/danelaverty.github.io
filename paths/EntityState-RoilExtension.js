// EntityState-RoilExtension.js - Extension to add roil functionality to EntityState
import { computed } from './vue-composition-api.js';

export const useRoilState = (props, dataStore) => {
    // Check if this circle is a member of a roil group
    const isRoilMember = computed(() => {
        if (props.entityType === 'circle' && props.entity.belongsToID) {
            const parentGroup = dataStore.getCircle(props.entity.belongsToID);
            return parentGroup && parentGroup.roilMode === 'on';
        }
        return false;
    });

    // Get the parent roil group if this is a roil member
    const roilParentGroup = computed(() => {
        if (isRoilMember.value && props.entity.belongsToID) {
            return dataStore.getCircle(props.entity.belongsToID);
        }
        return null;
    });

    return {
        isRoilMember,
        roilParentGroup
    };
};
