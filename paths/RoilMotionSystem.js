// RoilMotionSystem-HighFrequencyMonitor.js - High-frequency monitoring to catch rapid flicker
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
    }

    debugLog(message, level = 'info', data = null) {
        if (!this.debugMode) return;
        
        const timestamp = new Date().toISOString().substr(11, 12);
        const prefix = `[RoilMotion ${timestamp}]`;
        
        switch (level) {
            case 'immediate':
                break;
            case 'frame':
                break;
            case 'expected':
                break;
        }
    }

    /**
     * Start high-frequency position monitoring using requestAnimationFrame
     */
    startHighFrequencyMonitoring() {
        if (this.monitoringActive) return;
        
        this.debugLog('Starting high-frequency monitoring');
        this.monitoringActive = true;
        this.monitorFrame();
    }

    /**
     * Stop high-frequency monitoring
     */
    stopHighFrequencyMonitoring() {
        this.monitoringActive = false;
        this.debugLog('Stopped high-frequency monitoring');
    }

    /**
     * Monitor positions every frame
     */
    monitorFrame() {
        if (!this.monitoringActive) return;
        
        this.frameCount++;
        this.checkAllPositions();
        
        requestAnimationFrame(() => this.monitorFrame());
    }

    /**
     * Check all positions and detect changes
     */
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
                
                // If position changed
                if (deltaX > 0.5 || deltaY > 0.5) {
                    const changeData = {
                        circleId,
                        from: { x: lastKnown.x.toFixed(2), y: lastKnown.y.toFixed(2) },
                        to: { x: currentX.toFixed(2), y: currentY.toFixed(2) },
                        delta: { x: deltaX.toFixed(2), y: deltaY.toFixed(2) },
                        framesSinceChange: framesSinceLastChange,
                        currentFrame: this.frameCount,
                        timestamp: Date.now(),
                        ourUpdate: this.frameCount <= this.lastUpdateFrameCount + 2, // Within 2 frames of our update
                        expectedPosition: { x: circle.x.toFixed(2), y: circle.y.toFixed(2) },
                        matchesExpected: this.matchesExpectedPosition(circle, currentX, currentY),
                        elementInfo: this.getElementInfo(element)
                    };
                    
                    // Determine if this is expected or unexpected
                    let level = 'frame';
                    let prefix = 'Frame change';
                    
                    if (!changeData.ourUpdate && !changeData.matchesExpected && (deltaX > 5 || deltaY > 5)) {
                        level = 'immediate';
                        prefix = 'FLICKER DETECTED - External position change';
                    } else if (changeData.ourUpdate || changeData.matchesExpected) {
                        level = 'expected';
                        prefix = 'Expected motion';
                    }
                    
                    this.debugLog(
                        `${prefix} for ${circleId}: (${lastKnown.x.toFixed(1)}, ${lastKnown.y.toFixed(1)}) → (${currentX.toFixed(1)}, ${currentY.toFixed(1)}) - Δ(${deltaX.toFixed(1)}, ${deltaY.toFixed(1)})`,
                        level,
                        changeData
                    );
                    
                    this.positionChanges.push(changeData);
                    if (this.positionChanges.length > this.maxChanges) {
                        this.positionChanges.shift();
                    }
                }
            }
            
            // Update last known position
            this.lastKnownPositions.set(circleId, {
                x: currentX,
                y: currentY,
                frame: this.frameCount,
                timestamp: Date.now()
            });
        });
    }

    /**
     * Check if position matches what we expect from our motion system
     */
    matchesExpectedPosition(circle, actualX, actualY) {
        const expectedX = circle.x;
        const expectedY = circle.y;
        
        const deltaFromExpected = Math.abs(actualX - expectedX) + Math.abs(actualY - expectedY);
        return deltaFromExpected < 2;
    }

    /**
     * Get detailed element information for debugging
     */
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

    /**
     * Immediate validation right after we set a position
     */
    validateImmediatePosition(circleId, element, expectedX, expectedY) {
        // Check position immediately after setting it
        setTimeout(() => {
            const computedStyle = getComputedStyle(element);
            const actualX = parseFloat(computedStyle.left) || 0;
            const actualY = parseFloat(computedStyle.top) || 0;
            
            const deltaX = Math.abs(actualX - expectedX);
            const deltaY = Math.abs(actualY - expectedY);
            
            if (deltaX > 2 || deltaY > 2) {
                this.debugLog(
                    `IMMEDIATE OVERRIDE detected for ${circleId}! Set: (${expectedX.toFixed(1)}, ${expectedY.toFixed(1)}) but got: (${actualX.toFixed(1)}, ${actualY.toFixed(1)})`,
                    'immediate',
                    {
                        circleId,
                        expected: { x: expectedX, y: expectedY },
                        actual: { x: actualX, y: actualY },
                        delta: { x: deltaX, y: deltaY },
                        elementInfo: this.getElementInfo(element)
                    }
                );
            }
        }, 0);
        
        // Also check in next frame
        requestAnimationFrame(() => {
            const computedStyle = getComputedStyle(element);
            const actualX = parseFloat(computedStyle.left) || 0;
            const actualY = parseFloat(computedStyle.top) || 0;
            
            const deltaX = Math.abs(actualX - expectedX);
            const deltaY = Math.abs(actualY - expectedY);
            
            if (deltaX > 2 || deltaY > 2) {
                this.debugLog(
                    `NEXT-FRAME OVERRIDE detected for ${circleId}! Set: (${expectedX.toFixed(1)}, ${expectedY.toFixed(1)}) but got: (${actualX.toFixed(1)}, ${actualY.toFixed(1)})`,
                    'immediate',
                    {
                        circleId,
                        expected: { x: expectedX, y: expectedY },
                        actual: { x: actualX, y: actualY },
                        delta: { x: deltaX, y: deltaY },
                        elementInfo: this.getElementInfo(element)
                    }
                );
            }
        });
    }

    addCircle(circleId, element, groupBounds = null) {
        if (!element || this.activeCircles.has(circleId)) return;

        this.debugLog(`Adding circle ${circleId} to high-frequency monitoring`);

        const bounds = groupBounds || {
            minX: -50, maxX: 50, minY: -50, maxY: 50
        };

        const currentStyle = getComputedStyle(element);
        const currentLeft = parseFloat(currentStyle.left) || 0;
        const currentTop = parseFloat(currentStyle.top) || 0;

        this.activeCircles.set(circleId, {
            element,
            bounds,
            x: currentLeft,
            y: currentTop,
            z: 0,
            baseX: currentLeft,
            baseY: currentTop,
            baseZ: 0,
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
            x: currentLeft,
            y: currentTop,
            frame: this.frameCount,
            timestamp: Date.now()
        });

        if (this.activeCircles.size === 1) {
            this.startMotion();
            this.startHighFrequencyMonitoring();
        }
    }

    removeCircle(circleId) {
        this.debugLog(`Removing circle ${circleId} from monitoring`);
        this.activeCircles.delete(circleId);
        this.lastKnownPositions.delete(circleId);
        
        if (this.activeCircles.size === 0) {
            this.stopMotion();
            this.stopHighFrequencyMonitoring();
        }
    }

    startMotion() {
        if (this.isRunning) return;

        this.debugLog('Starting roil motion system');
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.updateAllCircles();
        }, this.tickRate);
    }

    stopMotion() {
        if (!this.isRunning) return;

        this.debugLog('Stopping roil motion system');
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.stopHighFrequencyMonitoring();
    }

    updateAllCircles() {
        this.lastUpdateFrameCount = this.frameCount;
        
        this.activeCircles.forEach((circle, circleId) => {
            this.updateCirclePosition(circle, circleId);
        });
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
        try {
            element.style.left = circle.x + 'px';
            element.style.top = circle.y + 'px';
            element.style.transform = `translate(-50%, -50%) scale(${(scale - 0.2).toFixed(3)})`;
            element.style.opacity = scale * 2 - 1.5;
            
            // Validate that our position stuck
            this.validateImmediatePosition(circleId, element, circle.x, circle.y);
            
        } catch (error) {
            this.debugLog(`Error applying styles to ${circleId}`, 'error', error);
        }
        
        circle.currentScale = scale;
    }

    // Rest of the methods remain the same...
    updateCircleBasePosition(circleId, newX, newY) {
        const circle = this.activeCircles.get(circleId);
        if (circle) {
            this.debugLog(`Base position update for ${circleId}: (${newX}, ${newY})`);
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
        this.debugLog('Destroying roil motion system');
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
