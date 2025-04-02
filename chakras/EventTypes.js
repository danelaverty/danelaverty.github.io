// src/events/EventTypes.js
// Define all event types in one place for consistency

(function(ChakraApp) {
  // Event type constants
  ChakraApp.EventTypes = {
    // Circle events
    CIRCLE_CREATED: 'circle:created',
    CIRCLE_UPDATED: 'circle:updated',
    CIRCLE_DELETED: 'circle:deleted',
    CIRCLE_SELECTED: 'circle:selected',
    CIRCLE_DESELECTED: 'circle:deselected',
    
    // Square events
    SQUARE_CREATED: 'square:created',
    SQUARE_UPDATED: 'square:updated',
    SQUARE_DELETED: 'square:deleted',
    SQUARE_SELECTED: 'square:selected',
    SQUARE_DESELECTED: 'square:deselected',
    
    // UI events
    ZOOM_CHANGED: 'ui:zoom_changed',
    PANEL_VISIBILITY_CHANGED: 'ui:panel_visibility_changed',
    
    // State events
    STATE_LOADED: 'state:loaded',
    STATE_SAVED: 'state:saved',
    
    // Connection events
    CONNECTION_UPDATED: 'connection:updated'
  };
})(window.ChakraApp = window.ChakraApp || {});
