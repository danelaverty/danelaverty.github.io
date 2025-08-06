// systems/ParticleSystem.js - Particle system for glow circles
export const ParticleSystem = {
    /**
     * Create particle system for glow type
     */
    create(element, circle) {
        const particlesElement = document.createElement('div');
        particlesElement.className = 'particles';
        
        this.createParticleSet(particlesElement, circle, 1);
        this.createParticleSet(particlesElement, circle, 2);
        
        element.appendChild(particlesElement);
    },

    /**
     * Create a set of particles
     */
    createParticleSet(parentElement, circle, index) {
        const angleElement = document.createElement('div');
        angleElement.className = 'angle';
        
        const positionElement = document.createElement('div');
        positionElement.className = 'position';
        
        const pulseElement = document.createElement('div');
        pulseElement.className = 'pulse';
        
        const timingCoeff = this.generateRandomTimingCoefficient(circle.id + '_' + index);
        
        if (index === 1) {
            const angleDuration = (10 * timingCoeff).toFixed(2) + 's';
            const positionDuration = (2 * timingCoeff).toFixed(2) + 's';
            angleElement.style.animation = `angle ${angleDuration} steps(5) 0s infinite`;
            positionElement.style.animation = `position ${positionDuration} linear 0s infinite`;
        } else if (index === 2) {
            const angleDuration = (4.95 * timingCoeff).toFixed(2) + 's';
            const positionDuration = (1.65 * timingCoeff).toFixed(2) + 's';
            const angleDelay = (-1.65 * timingCoeff).toFixed(2) + 's';
            angleElement.style.animation = `angle ${angleDuration} steps(3) ${angleDelay} infinite`;
            positionElement.style.animation = `position ${positionDuration} linear 0s infinite`;
        }
        
        this.createParticleElement(pulseElement, circle);
        positionElement.appendChild(pulseElement);
        angleElement.appendChild(positionElement);
        parentElement.appendChild(angleElement);
    },

    /**
     * Create individual particle element
     */
    createParticleElement(parentElement, circle) {
        const color = circle.colors?.[0] || circle.color || '#4CAF50';
        
        const particleElement = document.createElement('div');
        particleElement.className = 'particle';
        particleElement.style.backgroundColor = color;
        
        parentElement.appendChild(particleElement);
    },

    /**
     * Generate random timing coefficient
     */
    generateRandomTimingCoefficient(circleId) {
        let seed = 0;
        for (let i = 0; i < circleId.length; i++) {
            seed += circleId.charCodeAt(i);
        }
        
        let random = Math.sin(seed) * 10000;
        random = random - Math.floor(random);
        
        return 0.7 + (random * 0.8);
    }
};
