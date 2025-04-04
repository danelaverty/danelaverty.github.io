// src/events/EventTypes.js
// Define all event types in one place for consistency

(function(ChakraApp) {
  // Event type constants
  ChakraApp.EventTypes = {
	  // Document events
	  DOCUMENT_CREATED: 'document:created',
	DOCUMENT_UPDATED: 'document:updated',
	DOCUMENT_DELETED: 'document:deleted',
	DOCUMENT_SELECTED: 'document:selected',
	DOCUMENT_DESELECTED: 'document:deselected',
	DOCUMENT_LIST_TOGGLED: 'document:list_toggled',

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
    CONNECTION_UPDATED: 'connection:updated',

    // Clipboard events
    CLIPBOARD_UPDATED: 'clipboard:updated',
    CLIPBOARD_PASTED: 'clipboard:pasted',

    // Multi-selection events (if not already added from previous feature)
    SQUARES_MULTI_SELECTED: 'squares:multi_selected',
    SQUARES_MULTI_DESELECTED: 'squares:multi_deselected'
  };
})(window.ChakraApp = window.ChakraApp || {});
