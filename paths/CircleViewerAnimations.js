// CircleViewerAnimations.js - Animation loop management, animation copies, and dimming logic
import { ref, computed } from './vue-composition-api.js';
import { useAnimationLoopManager } from './AnimationLoopManager.js';

export function useCircleViewerAnimations(viewerId, dataStore) {
    const animationManager = useAnimationLoopManager();
    const animationCopies = ref([]);

    // Combined circles (original + animation copies)
    const allCircles = computed(() => {
        const currentCircles = dataStore.getCirclesForViewer(viewerId);
        return [...currentCircles, ...animationCopies.value];
    });

    // Animation event handlers
    const handleAnimationUpdate = (event) => {
        console.log(`[CircleViewer] Animation update received:`, event.detail);
        if (event.detail.viewerId === viewerId) {
            console.log(`[CircleViewer] Updating animation copies for viewer ${viewerId}:`, event.detail.copies);
            console.log(`[CircleViewer] Previous copies:`, animationCopies.value);
            animationCopies.value = [...event.detail.copies];
            console.log(`[CircleViewer] New copies:`, animationCopies.value);
            console.log(`[CircleViewer] allCircles computed will now have:`, [...dataStore.getCirclesForViewer(viewerId), ...animationCopies.value]);
        }
    };

    const handleAnimationStopped = (event) => {
        if (event.detail.viewerId === viewerId) {
            animationCopies.value = [];
        }
    };

    // Helper function to determine if a circle should be dimmed during animation
    const isCircleDimmed = (circle) => {
        if (!circle.isAnimationCopy && circle._isAnimationDimmed) {
            return true;
        }
        return false;
    };

    // Helper function to determine if a circle is an animation copy
    const isAnimationCopy = (circle) => {
        return circle.isAnimationCopy === true;
    };

    const onMounted = () => {
        // Listen for animation events
        window.addEventListener('animationLoopUpdate', handleAnimationUpdate);
        window.addEventListener('animationLoopStopped', handleAnimationStopped);
        
        // Initialize animation copies if loop is already running
        animationCopies.value = animationManager.getAnimationCopies(viewerId);
    };

    const onUnmounted = () => {
        // Clean up animation event listeners
        window.removeEventListener('animationLoopUpdate', handleAnimationUpdate);
        window.removeEventListener('animationLoopStopped', handleAnimationStopped);
        
        // Stop animation loop when viewer is unmounted
        animationManager.stopLoop(viewerId);
    };

    return {
        animationCopies,
        allCircles,
        isCircleDimmed,
        isAnimationCopy,
        onMounted,
        onUnmounted
    };
}
