// SeismographComponent.js - Pure polling architecture, no event listeners
import { injectComponentStyles } from './styleUtils.js';
import { getMoodColor } from './colorFamilies.js';

// Component styles (unchanged)
const seismographStyles = `
    .seismograph-chart {
        position: absolute;
        top: 50%;
        left: 150%;
        transform: translate(0%, -50%);
        width: 70%;
        height: 35%;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 3px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 5;
        opacity: 0.9;
    }

    .chart-paper {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    @keyframes paperScroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(36px); }
    }

    .chart-line-container {
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .chart-point {
        position: absolute;
        width: 1.5px;
        height: 1.5px;
        background: var(--chart-color, #4CAF50);
        border-radius: 50%;
        transition: transform 0.1s ease-out;
        opacity: 0;
    }

    .chart-line-segment {
        position: absolute;
        height: 0.8px;
        transform-origin: left center;
        transition: all 0.1s ease-out;
        opacity: 0.8;
    }

    .chart-pen {
        position: absolute;
        left: 4px;
        top: 50%;
        width: 2px;
        height: 2px;
        background: #FF6B6B;
        border-radius: 50%;
        transform: translateY(-50%);
        box-shadow: 0 0 3px rgba(255, 107, 107, 0.6);
        z-index: 10;
    }

    .entity-shape.circle-shape .seismograph-chart {
        width: 75%;
        height: 40%;
    }

    .group-circle-container.collapsed .seismograph-chart {
        width: 65%;
        height: 30%;
    }
`;

injectComponentStyles('seismograph-component', seismographStyles);

export class SeismographComponent {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            maxPoints: 50,
            color: '#4CAF50',
            dataSource: null, // Function that returns current data value
            width: 150, 
            height: 60,
            updateInterval: 500, // Polling interval in ms
            circleId: null, // For debugging/identification
            ...options
        };
        
        // DOM elements
        this.element = null;
        this.lineContainer = null;
        this.pen = null;
        
        // Data tracking
        this.dataPoints = [];
        this.chartWidth = 0;
        this.chartHeight = 0;
        this.pointSpacing = 0;
        this.lastValue = null;
        
        // Polling system
        this.updateTimer = null;
        this.isRunning = false;
        
        this.init();
    }

    init() {
        this.createElement();
        this.calculateDimensions();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'seismograph-chart';
        
        this.element.style.width = `${this.options.width}px`;
        this.element.style.height = `${this.options.height}px`;
        
        this.element.innerHTML = `
            <div class="chart-paper"></div>
            <div class="chart-line-container"></div>
            <div class="chart-pen"></div>
        `;
        
        this.element.style.setProperty('--chart-color', this.options.color);
        
        this.lineContainer = this.element.querySelector('.chart-line-container');
        this.pen = this.element.querySelector('.chart-pen');
        
        this.container.appendChild(this.element);
    }

    calculateDimensions() {
        const rect = this.element.getBoundingClientRect();
        this.chartWidth = rect.width || 50;
        this.chartHeight = rect.height || 30;
        this.pointSpacing = this.chartWidth / this.options.maxPoints;
    }

    /**
     * Get current value by polling the data source
     */
    getCurrentValue() {
        if (this.options.dataSource && typeof this.options.dataSource === 'function') {
            try {
                return this.options.dataSource();
            } catch (error) {
                console.error('Error polling data source:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Polling loop - requests new data every updateInterval ms
     */
    startPolling() {
        if (this.updateTimer) return; // Already running
        
        const pollLoop = () => {
            if (!this.isRunning) return;

            // Poll for current value
            const value = this.getCurrentValue();
            
            if (value !== null && value !== undefined) {
                this.addDataPoint(value);
                this.lastValue = value;
            } else {
                // Keep paper moving even if no data available
                this.addDataPoint(0.5);
            }

            // Schedule next poll
            this.updateTimer = setTimeout(pollLoop, this.options.updateInterval);
        };

        this.isRunning = true;
        pollLoop();
    }

    /**
     * Stop polling
     */
    stopPolling() {
        this.isRunning = false;
        
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }
    }

    /**
     * Add initial data point for immediate feedback
     */
    addInitialDataPoint() {
        const value = this.getCurrentValue();
        if (value !== null && value !== undefined) {
            this.addDataPoint(value);
            this.lastValue = value;
        }
    }

    addDataPoint(value) {
        const normalizedValue = Math.max(0, Math.min(1, value));
        const y = this.chartHeight * (1 - normalizedValue);

        this.dataPoints.push({ 
            y, 
            value: normalizedValue,
            timestamp: Date.now() 
        });
        
        if (this.dataPoints.length > this.options.maxPoints) {
            this.dataPoints.shift();
            this.removeOldestVisualPoint();
        }

        this.createVisualPoint(normalizedValue);
        this.updatePenPosition(y);
        this.shiftAllPoints();
    }

    createVisualPoint(normalizedValue) {
        const point = document.createElement('div');
        point.className = 'chart-point';
        
        const y = this.chartHeight * (1 - normalizedValue);
        point.style.left = '4px';
        point.style.top = `${y - 0.75}px`;
        
        point.setAttribute('data-value', normalizedValue.toString());
        
        this.lineContainer.appendChild(point);

        const points = this.lineContainer.querySelectorAll('.chart-point');
        if (points.length > 1) {
            const prevPoint = points[points.length - 2];
            this.createLineSegment(prevPoint, point);
        }
    }

    createLineSegment(fromPoint, toPoint) {
        const line = document.createElement('div');
        line.className = 'chart-line-segment';

        const fromLeft = parseFloat(fromPoint.style.left) || 0;
        const fromTop = parseFloat(fromPoint.style.top) || 0;
        const toLeft = parseFloat(toPoint.style.left) || 0;
        const toTop = parseFloat(toPoint.style.top) || 0;

        const x1 = fromLeft;
        const y1 = fromTop + 0.75;
        const x2 = toLeft;
        const y2 = toTop + 0.75;

        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.width = `${length}px`;
        line.style.transform = `rotate(${angle}deg)`;

        const fromValue = parseFloat(fromPoint.getAttribute('data-value')) || 0;
        const toValue = parseFloat(toPoint.getAttribute('data-value')) || 0;
        const averageValue = (fromValue + toValue) / 2;
        
        const moodColor = getMoodColor(averageValue);
        line.style.background = moodColor;

        this.lineContainer.insertBefore(line, toPoint);
    }

    shiftAllPoints() {
        const children = Array.from(this.lineContainer.children);
        children.forEach(child => {
            if (child.classList.contains('chart-point')) {
                const currentLeft = parseFloat(child.style.left) || 4;
                child.style.left = `${currentLeft + this.pointSpacing}px`;
            } else if (child.classList.contains('chart-line-segment')) {
                const currentLeft = parseFloat(child.style.left) || 0;
                child.style.left = `${currentLeft + this.pointSpacing}px`;
            }
        });
    }

    removeOldestVisualPoint() {
        const points = this.lineContainer.querySelectorAll('.chart-point');
        const lines = this.lineContainer.querySelectorAll('.chart-line-segment');
        
        points.forEach(point => {
            const left = parseFloat(point.style.left) || 0;
            if (left > this.chartWidth) {
                point.remove();
            }
        });

        lines.forEach(line => {
            const left = parseFloat(line.style.left) || 0;
            if (left > this.chartWidth + 50) {
                line.remove();
            }
        });
    }

    updatePenPosition(y) {
        this.pen.style.top = `${y - 1}px`;
    }

    /**
     * Start the seismograph
     */
    start() {
        if (this.isRunning) return;
        
        // Add initial data point for immediate feedback
        this.addInitialDataPoint();
        
        // Start polling loop
        this.startPolling();
    }

    /**
     * Stop the seismograph
     */
    stop() {
        if (!this.isRunning) return;
        
        this.stopPolling();
    }

    clear() {
        this.stop();
        this.dataPoints = [];
        this.lineContainer.innerHTML = '';
        this.pen.style.top = '50%';
        this.lastValue = null;
        
        const newPen = document.createElement('div');
        newPen.className = 'chart-pen';
        newPen.style.cssText = this.pen.style.cssText;
        this.element.appendChild(newPen);
        this.pen = newPen;
    }

    updateColor(color) {
        this.options.color = color;
        this.element.style.setProperty('--chart-color', color);
    }

    setDataSource(dataSourceFunction) {
        this.options.dataSource = dataSourceFunction;
    }

    /**
     * Update polling interval
     */
    setUpdateInterval(intervalMs) {
        this.options.updateInterval = intervalMs;
        
        // If currently running, restart with new interval
        if (this.isRunning) {
            this.stopPolling();
            this.startPolling();
        }
    }

    /**
     * Get seismograph status for debugging
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            dataPointCount: this.dataPoints.length,
            lastValue: this.lastValue,
            hasDataSource: !!this.options.dataSource,
            circleId: this.options.circleId,
            updateInterval: this.options.updateInterval,
            hasActiveTimer: !!this.updateTimer
        };
    }

    destroy() {
        this.stop();
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.lineContainer = null;
        this.pen = null;
        this.dataPoints = [];
        this.options.dataSource = null;
    }

    /**
     * Static factory method
     */
    static create(container, options = {}) {
        return new SeismographComponent(container, options);
    }
}

export default SeismographComponent;
