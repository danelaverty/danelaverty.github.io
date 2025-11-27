// RoilTransitionSystem.js - Smooth transitions and animations
export class RoilTransitionSystem {
    constructor() {
        this.roilGroups = new Map();
        
        // Track roilAngle transitions
        this.transitioningGroups = new Map();
        this.pausedForTransition = false;
        
        // Track roilComposure transitions and state
        this.composureTransitions = new Map();
        this.splayedGroups = new Map();
        this.pausedForComposure = new Map();
        
        // References to other systems
        this.motionCore = null;
        this.dataStore = null;
    }

    setMotionCore(motionCore) {
        this.motionCore = motionCore;
    }

    setDataStore(dataStore) {
        this.dataStore = dataStore;
    }

    // Enhanced method to smoothly transition roilAngle
    transitionRoilAngle(groupId, fromAngle, toAngle, duration = 500) {
        if (!this.dataStore || !this.motionCore) return;
        
        const group = this.dataStore.getCircle(groupId);
        if (!group || group.roilMode !== 'on') return;
        
        if (this.splayedGroups.has(groupId)) return;
        
        const groupMembers = Array.from(this.motionCore.activeCircles.entries())
            .filter(([circleId, circle]) => circle.groupId === groupId);
        
        if (groupMembers.length === 0) return;
        
        this.transitioningGroups.set(groupId, {
            fromAngle,
            toAngle,
            startTime: Date.now(),
            duration,
            members: groupMembers.map(([id]) => id)
        });
        
        this.pauseMotionForTransition();
        
        groupMembers.forEach(([circleId, circle]) => {
            const element = circle.element;
            element.style.transition = `top ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
        });
        
        groupMembers.forEach(([circleId, circle]) => {
            const newTop = this.motionCore.calculateTopForAngle(circle, toAngle);
            circle.element.style.top = newTop + 'px';
        });
        
        setTimeout(() => {
            this.resumeMotionAfterTransition(groupId);
        }, duration + 50);
    }

    // Method to smoothly transition roilComposure
    transitionRoilComposure(groupId, fromComposure, toComposure, duration = 800) {
        if (!this.dataStore || !this.motionCore) return;
        
        const group = this.dataStore.getCircle(groupId);
        if (!group || group.roilMode !== 'on') return;
        
        const allGroupMembers = Array.from(this.motionCore.activeCircles.entries())
            .filter(([circleId, circle]) => circle.groupId === groupId);
        
        const nonDroneMembers = allGroupMembers.filter(([circleId, circle]) => {
            const circleData = this.dataStore.getCircle(circleId);
            return circleData && circleData.type !== 'drone';
        });
        
        if (allGroupMembers.length === 0) return;
        
        if (toComposure === 'splayed') {
            this.transitionToSplayed(groupId, allGroupMembers, nonDroneMembers, duration);
        } else if (fromComposure === 'splayed' && toComposure === 'retracted') {
            this.transitionFromSplayed(groupId, allGroupMembers, nonDroneMembers, duration);
        }
    }

    // Transition to splayed mode
    transitionToSplayed(groupId, allGroupMembers, nonDroneMembers, duration) {
        const originalPositions = new Map();
        allGroupMembers.forEach(([circleId, circle]) => {
            originalPositions.set(circleId, {
                x: circle.x,
                y: circle.y,
                z: circle.z,
                scale: circle.currentScale || 1.0,
                opacity: parseFloat(circle.element.style.opacity) || 1.0
            });
        });
        
        this.splayedGroups.set(groupId, { originalPositions });
        this.pausedForComposure.set(groupId, true);
        
        const groupPosition = this.motionCore.getGroupAbsolutePosition(groupId, allGroupMembers[0][1].viewerWidth);
        const splayedPositions = this.calculateSplayedPositions(nonDroneMembers, groupPosition);
        
        nonDroneMembers.forEach(([circleId, circle]) => {
            const element = circle.element;
            element.style.transition = `left ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), top ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), opacity ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
        });
        
        nonDroneMembers.forEach(([circleId, circle], index) => {
            const splayedPos = splayedPositions[index];
            const element = circle.element;
            
            element.style.left = splayedPos.x + 'px';
            element.style.top = splayedPos.y + 'px';
            element.style.opacity = '1.0';
            element.style.transform = 'translate(-50%, -50%) scale(1.0)';
        });
        
        setTimeout(() => {
            nonDroneMembers.forEach(([circleId, circle]) => {
                circle.element.style.transition = '';
            });
        }, duration + 50);
    }

    // Transition from splayed back to retracted
    transitionFromSplayed(groupId, allGroupMembers, nonDroneMembers, duration) {
        const splayedData = this.splayedGroups.get(groupId);
        if (!splayedData) return;
        
        const { originalPositions } = splayedData;
        
        nonDroneMembers.forEach(([circleId, circle]) => {
            const element = circle.element;
            element.style.transition = `left ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), top ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), opacity ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
        });
        
        nonDroneMembers.forEach(([circleId, circle]) => {
            const original = originalPositions.get(circleId);
            if (!original) return;
            
            const element = circle.element;
            const group = this.dataStore.getCircle(groupId);
            
            circle.x = original.x;
            circle.y = original.y;
            circle.z = original.z;
            circle.currentScale = original.scale;
            
            element.style.left = original.x + 'px';
            element.style.top = this.motionCore.calculateTopForAngle(circle, group.roilAngle) + 'px';
            element.style.opacity = original.opacity.toString();
            element.style.transform = `translate(-50%, -50%) scale(${(original.scale - 0.2).toFixed(3)})`;
        });
        
        allGroupMembers.forEach(([circleId, circle]) => {
            const circleData = this.dataStore.getCircle(circleId);
            if (circleData && circleData.type === 'drone') {
                const original = originalPositions.get(circleId);
                if (original) {
                    circle.x = original.x;
                    circle.y = original.y;
                    circle.z = original.z;
                    circle.currentScale = original.scale;
                }
            }
        });
        
        setTimeout(() => {
            nonDroneMembers.forEach(([circleId, circle]) => {
                circle.element.style.transition = '';
            });
            
            this.splayedGroups.delete(groupId);
            this.pausedForComposure.delete(groupId);
        }, duration + 50);
    }

    // Calculate splayed positions for group members
    calculateSplayedPositions(groupMembers, groupPosition) {
        const positions = [];
        const leftColumnX = groupPosition.x - 60;
        const rightColumnX = groupPosition.x + 60;
        
        const memberCount = groupMembers.length;
        const verticalSpacing = 70;
        const numRows = Math.ceil(memberCount / 2);
        const middleRowIndex = Math.floor((numRows - 1) / 2);
        const centeringOffset = middleRowIndex * verticalSpacing;
        const startY = groupPosition.y - (centeringOffset + verticalSpacing / 2);
        
        groupMembers.forEach(([circleId, circle], index) => {
            const isLeftColumn = index % 2 === 0;
            const columnIndex = Math.floor(index / 2);
            
            const x = isLeftColumn ? leftColumnX : rightColumnX;
            const y = startY + (columnIndex * verticalSpacing);
            
            positions.push({ x, y });
        });
        
        return positions;
    }

    // Pause motion system for transitions
    pauseMotionForTransition() {
        this.pausedForTransition = true;
    }

    pauseGroup(groupId) {
        const group = this.roilGroups.get(groupId) || { isPaused: false };
        group.isPaused = true;
        this.roilGroups.set(groupId, group);
    }

    resumeGroup(groupId) {
        const group = this.roilGroups.get(groupId) || { isPaused: false };
        group.isPaused = false;
        this.roilGroups.set(groupId, group);
    }

    isGroupPaused(groupId) {
        const group = this.roilGroups.get(groupId);
        const regularPause = group ? group.isPaused : false;
        const composurePause = this.pausedForComposure.get(groupId) || false;
        return regularPause || composurePause;
    }

    // Resume motion system after transition
    resumeMotionAfterTransition(groupId) {
        const transitionInfo = this.transitioningGroups.get(groupId);
        if (transitionInfo) {
            transitionInfo.members.forEach(circleId => {
                const circle = this.motionCore.activeCircles.get(circleId);
                if (circle && circle.element) {
                    circle.element.style.transition = '';
                }
            });
        }
        
        this.transitioningGroups.delete(groupId);
        
        if (this.transitioningGroups.size === 0) {
            this.pausedForTransition = false;
        }
    }

    // Check if motion system should be paused
    shouldPauseMotion() {
        return this.pausedForTransition;
    }

    // Get debug info for transition system
    getDebugInfo() {
        return {
            pausedForTransition: this.pausedForTransition,
            activeTransitions: this.transitioningGroups.size,
            splayedGroups: this.splayedGroups.size,
            pausedForComposure: Array.from(this.pausedForComposure.entries()),
            transitionDetails: Array.from(this.transitioningGroups.entries()).map(([groupId, info]) => ({
                groupId,
                fromAngle: info.fromAngle,
                toAngle: info.toAngle,
                duration: info.duration,
                memberCount: info.members.length,
                elapsed: Date.now() - info.startTime
            })),
            splayedGroupDetails: Array.from(this.splayedGroups.entries()).map(([groupId, data]) => ({
                groupId,
                originalPositionCount: data.originalPositions.size
            }))
        };
    }

    destroy() {
        this.roilGroups.clear();
        this.transitioningGroups.clear();
        this.composureTransitions.clear();
        this.splayedGroups.clear();
        this.pausedForComposure.clear();
    }
}
