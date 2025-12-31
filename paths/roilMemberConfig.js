// roilMemberConfig.js - Shared configuration for roil member creation
export const roilAddMemberControlsConfig = {
    normal: [
        { color: 'hsl(0, 100%, 80%)', buoyancy: 'normal', triggerAngle: 180 },
        { color: 'hsl(48, 100%, 80%)', buoyancy: 'normal', triggerAngle: 0 },
    ],
    normalConcerned: [
        { color: 'hsl(0, 100%, 80%)', buoyancy: 'normal' },
    ],
    angry: [
        { color: 'hsl(0, 100%, 60%)', buoyancy: 'buoyant' },
    ],
};

export const getBuoyancyIcon = (buoyancy) => {
    switch (buoyancy) {
        case 'buoyant': return '⬆';
        case 'antibuoyant': return '⬇';
        case 'normal':
        default: return '⬍';
    }
};

export const isValidMemberType = (memberType) => {
    const config = roilAddMemberControlsConfig[memberType];
    return config && Array.isArray(config) && config.length > 0;
};

export const getAvailableMemberTypes = () => {
    return Object.keys(roilAddMemberControlsConfig);
};

export const getMemberTypeStates = (memberType) => {
    return roilAddMemberControlsConfig[memberType] || null;
};
