// RoilMotionSystem.js - Updated to position roil members relative to their group
export class RoilMotionSystem {
    constructor() {
        this.activeCircles = new Map(); 
        this.roilGroups = new Map();
        this.interval = null;
        this.monitoringActive = false;
        this.isRunning = false;
        this.tickRate = 50;
        
        // High-frequency monitoring
        this.debugMode = true;
        this.lastKnownPositions = new Map();
        this.positionChanges = [];
        this.maxChanges = 100;
        this.frameCount = 0;
        this.lastUpdateFrameCount = 0;
        
        // NEW: Store dataStore reference for group lookups
        this.dataStore = null;
    }

    // NEW: Method to set dataStore reference
    setDataStore(dataStore) {
        this.dataStore = dataStore;
    }

    // NEW: Get the absolute position of a roil group
    getGroupAbsolutePosition(groupId, viewerWidth) {
        if (!this.dataStore) return { x: 0, y: 0 };
        
        const group = this.dataStore.getCircle(groupId);
        if (!group) return { x: 0, y: 0 };
        
        // Calculate absolute position like EntityState does
        const centerX = viewerWidth / 2;
        const absoluteX = centerX + group.x;
        const absoluteY = group.y;
        
        return { x: absoluteX, y: absoluteY };
    }

    addCircle(circleId, element, groupBounds = null, groupId = null, viewerWidth = null) {
        if (!element || this.activeCircles.has(circleId)) return;

        let groupOffset = { x: 0, y: 0 };
        if (groupId && viewerWidth) {
            groupOffset = this.getGroupAbsolutePosition(groupId, viewerWidth);
        }

        const bounds = groupBounds || {
            minX: -50, maxX: 50, minY: -50, maxY: 50
        };

        // Use group offset as the base position instead of current element position
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
            groupId: groupId, // NEW: Store group ID for position updates
            viewerWidth: viewerWidth, // NEW: Store viewer width for position calculations
            orbitRadius: 8 + Math.random() * 20,
            orbitSpeed: 0.008 + Math.random() * 0.015,
            orbitPhase: Math.random() * Math.PI * 2,
            driftSpeed: 0.002 + Math.random() * 0.005,
            driftPhase: Math.random() * Math.PI * 2,
            driftRadius: 15 + Math.random() * 25,
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

        // Initialize position tracking
        this.lastKnownPositions.set(circleId, {
            x: baseX,
            y: baseY,
            frame: this.frameCount,
            timestamp: Date.now()
        });

        if (this.activeCircles.size === 1) {
            this.startMotion();
            this.startHighFrequencyMonitoring();
        }
    }

    updateAllCircles() {
        this.lastUpdateFrameCount = this.frameCount;
        
        this.activeCircles.forEach((circle, circleId) => {
            // NEW: Update group position before calculating motion
            if (circle.groupId && circle.viewerWidth) {
                const newGroupOffset = this.getGroupAbsolutePosition(circle.groupId, circle.viewerWidth);
                circle.baseX = newGroupOffset.x;
                circle.baseY = newGroupOffset.y;
            }
            
            this.updateCirclePosition(circle, circleId);
        });
    }

    startHighFrequencyMonitoring() {
        if (this.monitoringActive) return;
        
        this.monitoringActive = true;
        this.monitorFrame();
    }

    stopHighFrequencyMonitoring() {
        this.monitoringActive = false;
    }

    monitorFrame() {
        if (!this.monitoringActive) return;
        
        this.frameCount++;
        this.checkAllPositions();
        
        requestAnimationFrame(() => this.monitorFrame());
    }

    checkAllPositions() {
        this.activeCircles.forEach((circle, circleId) => {
            const element = circle.element;
            const computedStyle = getComputedStyle(element);
            const currentX = parseFloat(computedStyle.left) || 0;
            const currentY = parseFloat(computedStyle.top) || 0;
            
            const lastKnown = this.lastKnownPositions.get(circleId);
            
            if (lastKnown) {
                const deltaX = Math.abs(currentX - lastKnown.x);
                const deltaY = Math.abs(currentY - lastKnown.y);
                const framesSinceLastChange = this.frameCount - lastKnown.frame;
                
                if (deltaX > 0.5 || deltaY > 0.5) {
                    const changeData = {
                        circleId,
                        from: { x: lastKnown.x.toFixed(2), y: lastKnown.y.toFixed(2) },
                        to: { x: currentX.toFixed(2), y: currentY.toFixed(2) },
                        delta: { x: deltaX.toFixed(2), y: deltaY.toFixed(2) },
                        framesSinceChange: framesSinceLastChange,
                        currentFrame: this.frameCount,
                        timestamp: Date.now(),
                        ourUpdate: this.frameCount <= this.lastUpdateFrameCount + 2,
                        expectedPosition: { x: circle.x.toFixed(2), y: circle.y.toFixed(2) },
                        matchesExpected: this.matchesExpectedPosition(circle, currentX, currentY),
                        elementInfo: this.getElementInfo(element)
                    };
                    
                    let level = 'frame';
                    let prefix = 'Frame change';
                    
                    if (!changeData.ourUpdate && !changeData.matchesExpected && (deltaX > 5 || deltaY > 5)) {
                        level = 'immediate';
                        prefix = 'FLICKER DETECTED - External position change';
                    } else if (changeData.ourUpdate || changeData.matchesExpected) {
                        level = 'expected';
                        prefix = 'Expected motion';
                    }
                    
                    this.positionChanges.push(changeData);
                    if (this.positionChanges.length > this.maxChanges) {
                        this.positionChanges.shift();
                    }
                }
            }
            
            this.lastKnownPositions.set(circleId, {
                x: currentX,
                y: currentY,
                frame: this.frameCount,
                timestamp: Date.now()
            });
        });
    }

    matchesExpectedPosition(circle, actualX, actualY) {
        const expectedX = circle.x;
        const expectedY = circle.y;
        
        const deltaFromExpected = Math.abs(actualX - expectedX) + Math.abs(actualY - expectedY);
        return deltaFromExpected < 2;
    }

    getElementInfo(element) {
        return {
            classes: Array.from(element.classList),
            hasTransition: getComputedStyle(element).transition !== 'none',
            hasAnimation: getComputedStyle(element).animation !== 'none',
            isDragging: element.hasAttribute('data-dragging') || element.closest('[data-dragging]'),
            parentTag: element.parentElement?.tagName,
            inViewer: !!element.closest('.circle-viewer'),
            transform: getComputedStyle(element).transform
        };
    }

    validateImmediatePosition(circleId, element, expectedX, expectedY) {
        setTimeout(() => {
            const computedStyle = getComputedStyle(element);
            const actualX = parseFloat(computedStyle.left) || 0;
            const actualY = parseFloat(computedStyle.top) || 0;
            
            const deltaX = Math.abs(actualX - expectedX);
            const deltaY = Math.abs(actualY - expectedY);
        }, 0);
        
        requestAnimationFrame(() => {
            const computedStyle = getComputedStyle(element);
            const actualX = parseFloat(computedStyle.left) || 0;
            const actualY = parseFloat(computedStyle.top) || 0;
            
            const deltaX = Math.abs(actualX - expectedX);
            const deltaY = Math.abs(actualY - expectedY);
        });
    }

    removeCircle(circleId) {
        const circle = this.activeCircles.get(circleId);
        if (circle && circle.element) {
            // Reset opacity to full visibility
            circle.element.style.opacity = '1';
        }
        this.activeCircles.delete(circleId);
        this.lastKnownPositions.delete(circleId);
        
        if (this.activeCircles.size === 0) {
            this.stopMotion();
            this.stopHighFrequencyMonitoring();
        }
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
        this.stopHighFrequencyMonitoring();
    }

    updateCirclePosition(circle, circleId) {
        const { element, bounds } = circle;
        
        circle.time += 1;
        
        // Calculate motion (same as original)
        circle.orbitPhase += circle.orbitSpeed;
        const orbitX = Math.cos(circle.orbitPhase) * circle.orbitRadius;
        const orbitY = Math.sin(circle.orbitPhase) * circle.orbitRadius;
        
        circle.driftPhase += circle.driftSpeed;
        const driftX = Math.cos(circle.driftPhase * 0.7) * circle.driftRadius * 0.3;
        const driftY = Math.sin(circle.driftPhase * 0.4) * circle.driftRadius * 0.3;
        
        circle.zOrbitPhase += circle.zOrbitSpeed;
        const zOrbit = Math.cos(circle.zOrbitPhase) * circle.zOrbitRadius;
        
        circle.zDriftPhase += circle.zDriftSpeed;
        const zDrift = Math.sin(circle.zDriftPhase * 0.6) * circle.zDriftRadius * 0.4;
        
        const verticalOffset = Math.sin(circle.time * 0.01) * circle.verticalBias * 5;
        
        const targetX = circle.baseX + orbitX + driftX;
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
        
        // Apply styles and immediately validate
        element.style.left = circle.x + 'px';
        element.style.top = circle.y + 'px';
        element.style.transform = `translate(-50%, -50%) scale(${(scale - 0.2).toFixed(3)})`;
        element.style.opacity = scale * 2 - 1.5;
        
        this.validateImmediatePosition(circleId, element, circle.x, circle.y);
        
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
            circle.orbitRadius = 8 + (1 - buoyancy) * 15;
            circle.zOrbitRadius = 10 + (1 - buoyancy) * 10;
            circle.baseZ = (buoyancy - 0.5) * 20;
        }
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

    getFlickerReport() {
        const flickerEvents = this.positionChanges.filter(change => 
            !change.ourUpdate && !change.matchesExpected && 
            (parseFloat(change.delta.x) > 5 || parseFloat(change.delta.y) > 5)
        );
        
        return {
            totalChanges: this.positionChanges.length,
            flickerEvents: flickerEvents.length,
            recentFlickers: flickerEvents.slice(-5),
            allRecent: this.positionChanges.slice(-10),
            activeCircles: this.activeCircles.size,
            currentFrame: this.frameCount
        };
    }

    getDebugInfo() {
        return {
            activeCircleCount: this.activeCircles.size,
            isRunning: this.isRunning,
            monitoringActive: this.monitoringActive,
            currentFrame: this.frameCount,
            flickerReport: this.getFlickerReport()
        };
    }

    destroy() {
        this.stopMotion();
        this.stopHighFrequencyMonitoring();
        this.activeCircles.clear();
        this.lastKnownPositions.clear();
        this.positionChanges = [];
    }
}

export const roilMotionSystem = new RoilMotionSystem();

// Global debug interface
if (typeof window !== 'undefined') {
    window.roilDebug = {
        getFlickerReport: () => roilMotionSystem.getFlickerReport(),
        getDebugInfo: () => roilMotionSystem.getDebugInfo(),
        clearChanges: () => { roilMotionSystem.positionChanges = []; },
        enableDebug: () => { roilMotionSystem.debugMode = true; },
        disableDebug: () => { roilMotionSystem.debugMode = false; }
    };
}
