// RoilMotionCore.js - Core motion system with coordinator responsibilities
import { RoilEventSystem } from './RoilEventSystem.js';
import { RoilTransitionSystem } from './RoilTransitionSystem.js';

export class RoilMotionCore {
    constructor() {
        this.activeCircles = new Map(); 
        this.interval = null;
        this.isRunning = false;
        this.tickRate = 50;
        
        // Store dataStore reference for lookups
        this.dataStore = null;
        
        // Initialize subsystems
        this.eventSystem = new RoilEventSystem();
        this.transitionSystem = new RoilTransitionSystem();
        
        // Set up cross-references between systems
        this.setupSystemReferences();
        
        // Simple debug tracking (minimal version)
        this.frameCount = 0;
    }

    setupSystemReferences() {
        // Event system needs access to core and data store
        this.eventSystem.setMotionCore(this);
        
        // Transition system needs access to core and data store
        this.transitionSystem.setMotionCore(this);
        
        // Data store will be set later via setDataStore
    }

    setDataStore(dataStore) {
        this.dataStore = dataStore;
        this.eventSystem.setDataStore(dataStore);
        this.transitionSystem.setDataStore(dataStore);
    }

    getGroupAbsolutePosition(groupId, viewerWidth) {
        if (!this.dataStore) return { x: 0, y: 0 };
        
        const group = this.dataStore.getCircle(groupId);
        if (!group) return { x: 0, y: 0 };
        
        const centerX = viewerWidth / 2;
        const absoluteX = centerX + group.x;
        const absoluteY = group.y;
        
        return { x: absoluteX, y: absoluteY };
    }

    // Calculate clock-face position in degrees (0° = 12:00, 90° = 3:00, etc.)
    calculateClockPosition(circle) {
        const normalizedPhase = (circle.zOrbitPhase % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        let degrees = (normalizedPhase * 180 / Math.PI + 360) % 360;
        return degrees;
    }

    // Calculate top position for a given roilAngle
    calculateTopForAngle(circle, roilAngle) {
        if (roilAngle === 'tilt') {
            return circle.y - (2 * circle.z);
        } else { // 'side'
            return 290 - (8 * circle.z);
        }
    }

    addCircle(circleId, element, groupBounds = null, groupId = null, viewerWidth = null, viewerId = null) {
        if (!element || this.activeCircles.has(circleId)) return;

        let groupOffset = { x: 0, y: 0 };
        if (groupId && viewerWidth) {
            groupOffset = this.getGroupAbsolutePosition(groupId, viewerWidth);
        }

        const bounds = groupBounds || {
            minX: -50, maxX: 50, minY: -50, maxY: 50
        };

        const baseX = groupOffset.x;
        const baseY = groupOffset.y;

        this.activeCircles.set(circleId, {
            element,
            bounds,
            x: baseX,
            y: baseY,
            z: 0,
            baseX: baseX,
            baseY: baseY,
            baseZ: 0,
            groupId: groupId,
            viewerWidth: viewerWidth,
            viewerId: viewerId,
            orbitRadius: 8 + Math.random() * 20 * 2,
            orbitSpeed: 0.008 + Math.random() * 0.015,
            orbitPhase: Math.random() * Math.PI * 2,
            driftSpeed: 0.002 + Math.random() * 0.005,
            driftPhase: Math.random() * Math.PI * 2,
            driftRadius: 15 + Math.random() * 25 * 2,
            zOrbitRadius: 10 + Math.random() * 15,
            zOrbitSpeed: 0.005 + Math.random() * 0.01,
            zOrbitPhase: Math.random() * Math.PI * 2,
            zDriftSpeed: 0.001 + Math.random() * 0.003,
            zDriftPhase: Math.random() * Math.PI * 2,
            zDriftRadius: 8 + Math.random() * 12,
            baseScale: 1.0,
            minScale: 0.6,
            maxScale: 1.4,
            verticalBias: (Math.random() - 0.5) * 0.3,
            time: Math.random() * 100
        });

        // Set up event points through event system
        this.eventSystem.setupEventPoints(circleId, element);

        if (this.activeCircles.size === 1) {
            this.startMotion();
        }
    }

    removeCircle(circleId) {
        const circle = this.activeCircles.get(circleId);
        if (circle && circle.element) {
            circle.element.style.opacity = '1';
        }
        this.activeCircles.delete(circleId);
        
        // Clean up in event system
        this.eventSystem.removeEventPoints(circleId);
        
        if (this.activeCircles.size === 0) {
            this.stopMotion();
        }
    }

    updateAllCircles() {
        // Check if motion should be paused due to transitions
        if (this.transitionSystem.shouldPauseMotion()) {
            return;
        }
        
        this.frameCount++;
        
        this.activeCircles.forEach((circle, circleId) => {
            if (circle.groupId && circle.viewerWidth) {
                const newGroupOffset = this.getGroupAbsolutePosition(circle.groupId, circle.viewerWidth);
                circle.baseX = newGroupOffset.x;
                circle.baseY = newGroupOffset.y;
            }
            
            this.updateCirclePosition(circle, circleId);
            
            // Check event points through event system
            this.eventSystem.checkEventPoints(circleId, circle);
        });
    }

    startMotion() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.interval = setInterval(() => {
            this.updateAllCircles();
        }, this.tickRate);
    }

    stopMotion() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    updateCirclePosition(circle, circleId) {
        const { element, bounds } = circle;
        const group = this.dataStore.getCircle(circle.groupId);

        // Don't update positions if group is paused (check with transition system)
        if (this.transitionSystem.isGroupPaused(circle.groupId)) {
            return;
        }
        
        circle.time += 1;
        
        circle.orbitPhase += circle.orbitSpeed * group.roilSpeed;
        const orbitX = Math.cos(circle.orbitPhase) * circle.orbitRadius;
        const orbitY = Math.sin(circle.orbitPhase) * circle.orbitRadius;

        circle.driftPhase += circle.driftSpeed;
        const driftX = 0;
        const driftY = 0;
        
        circle.zOrbitPhase += circle.zOrbitSpeed * group.roilSpeed;
        const zOrbit = Math.cos(circle.zOrbitPhase) * circle.zOrbitRadius;

        let circularOffsetX = 0;
        if (group && group.roilAngle === 'side') {
            const horizontalRadius = circle.orbitRadius * 4.8;
            circularOffsetX = Math.sin(circle.zOrbitPhase) * horizontalRadius;
        }

        const targetX = circle.baseX + orbitX + driftX + circularOffsetX;
        
        circle.zDriftPhase += circle.zDriftSpeed;
        const zDrift = 0;
        
        const verticalOffset = Math.sin(circle.time * 0.01) * circle.verticalBias * 5;
        
        const targetY = circle.baseY + orbitY + driftY + verticalOffset;
        const targetZ = circle.baseZ + zOrbit + zDrift;
        
        circle.x += (targetX - circle.x) * 0.08;
        circle.y += (targetY - circle.y) * 0.08;
        circle.z += (targetZ - circle.z) * 0.06;
        
        // Boundary constraints
        if (circle.x < bounds.minX) {
            circle.baseX += (bounds.minX + 20 - circle.baseX) * 0.02;
        } else if (circle.x > bounds.maxX) {
            circle.baseX += (bounds.maxX - 20 - circle.baseX) * 0.02;
        }
        
        if (circle.y < bounds.minY) {
            circle.baseY += (bounds.minY + 20 - circle.baseY) * 0.02;
        } else if (circle.y > bounds.maxY) {
            circle.baseY += (bounds.maxY - 20 - circle.baseY) * 0.02;
        }
        
        const zMin = -30, zMax = 30;
        if (circle.z < zMin) {
            circle.baseZ += (zMin + 10 - circle.baseZ) * 0.02;
        } else if (circle.z > zMax) {
            circle.baseZ += (zMax - 10 - circle.baseZ) * 0.02;
        }
        
        const normalizedZ = (circle.z + 30) / 60;
        const scale = circle.minScale + (normalizedZ * (circle.maxScale - circle.minScale));
        
        // Apply styles - use current roilAngle from group
        element.style.left = circle.x + 'px';
        element.style.top = this.calculateTopForAngle(circle, group.roilAngle) + 'px';
        element.style.transform = `translate(-50%, -50%) scale(${(scale - 0.3).toFixed(3)})`;
        var elementOpacity = scale * 2.8 - 2.6;
        element.style.opacity = elementOpacity;
        
        circle.currentScale = scale;
    }

    updateCircleBasePosition(circleId, newX, newY) {
        const circle = this.activeCircles.get(circleId);
        if (circle) {
            circle.baseX = newX;
            circle.baseY = newY;
            circle.x = newX;
            circle.y = newY;
        }
    }

    updateMultipleCircleBasePositions(updates) {
        updates.forEach(({ circleId, x, y }) => {
            this.updateCircleBasePosition(circleId, x, y);
        });
    }

setCircleBuoyancy(circleId, buoyancy) {
    const circle = this.activeCircles.get(circleId);
    if (circle) {
        circle.verticalBias = (buoyancy - 0.5) * 0.5;
        circle.baseZ = (buoyancy - 0.5) * 20;
        
        // Get the buoyancy type from dataStore to set orbit sizes
        const dataStoreCircle = this.dataStore.getCircle(circleId);
        if (dataStoreCircle) {
            const buoyancyType = dataStoreCircle.buoyancy;
            
            switch(buoyancyType) {
                case 'normal':
                    circle.orbitRadius = 11;
                    circle.zOrbitRadius = 12;
                    break;
                case 'buoyant':
                    circle.orbitRadius = -4;  // This seems odd - might want to use Math.abs?
                    circle.zOrbitRadius = -2;
                    break;
                case 'antibuoyant':
                    circle.orbitRadius = -4;
                    circle.zOrbitRadius = -2;
                    break;
                default:
                    // Fallback to normal
                    circle.orbitRadius = 11;
                    circle.zOrbitRadius = 12;
            }
        }
    }
}

    updateCircleBuoyancy(circleId) {
        const circle = this.activeCircles.get(circleId);
        if (!circle || !this.dataStore) return;

        const dataStoreCircle = this.dataStore.getCircle(circleId);
        if (!dataStoreCircle) return;

        const buoyancyMap = {
            'normal': 0.8,
            'buoyant': 1.8,
            'antibuoyant': 0.2,
        };

        const buoyancyValue = buoyancyMap[dataStoreCircle.buoyancy] ?? 0.8;
        this.setCircleBuoyancy(circleId, buoyancyValue);
    }

    setCircleDepthRange(circleId, minScale = 0.6, maxScale = 1.4) {
        const circle = this.activeCircles.get(circleId);
        if (circle) {
            circle.minScale = minScale;
            circle.maxScale = maxScale;
        }
    }

    getCircleScale(circleId) {
        const circle = this.activeCircles.get(circleId);
        return circle ? circle.currentScale : null;
    }

    // === COORDINATOR METHODS - Delegate to subsystems ===

    // Inventory checking (delegate to event system)
    checkInventoryForEmoji(targetEmoji, viewerId) {
        return this.eventSystem.checkInventoryForEmoji(targetEmoji, viewerId);
    }

    // Transition methods (delegate to transition system)
    transitionRoilAngle(groupId, fromAngle, toAngle, duration = 500) {
        return this.transitionSystem.transitionRoilAngle(groupId, fromAngle, toAngle, duration);
    }

    transitionRoilComposure(groupId, fromComposure, toComposure, duration = 800) {
        return this.transitionSystem.transitionRoilComposure(groupId, fromComposure, toComposure, duration);
    }

    pauseGroup(groupId) {
        return this.transitionSystem.pauseGroup(groupId);
    }

    resumeGroup(groupId) {
        return this.transitionSystem.resumeGroup(groupId);
    }

    isGroupPaused(groupId) {
        return this.transitionSystem.isGroupPaused(groupId);
    }

    // === COMBINED DEBUG INFO ===
    getDebugInfo() {
        const coreInfo = {
            activeCircleCount: this.activeCircles.size,
            isRunning: this.isRunning,
            tickRate: this.tickRate,
            currentFrame: this.frameCount
        };

        const eventInfo = this.eventSystem.getDebugInfo();
        const transitionInfo = this.transitionSystem.getDebugInfo();

        return {
            core: coreInfo,
            events: eventInfo,
            transitions: transitionInfo
        };
    }

    destroy() {
        this.stopMotion();
        this.activeCircles.clear();
        
        // Clean up subsystems
        this.eventSystem.destroy();
        this.transitionSystem.destroy();
    }
}

// Create and export the singleton instance
export const roilMotionSystem = new RoilMotionCore();
