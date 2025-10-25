// groupScaleCalculator.js - Shared utility for calculating group shape scaling
export const calculateGroupShapeScale = (group, dataStore) => {
    if (group.collapsed) return 1;
    
    const groupCircles = dataStore.getCirclesBelongingToGroup(group.id);
    const belongingCount = groupCircles.length;
    
    const baseSize = 32;
    const scaleFactor = Math.sqrt(Math.max(1, belongingCount + 1)) * 1.3;
    const scaledSize = Math.max(baseSize, baseSize * scaleFactor * 0.8);
    
    return scaledSize / baseSize;
};
