// src/events/EventBus.js
// Event bus implementation using IIFE pattern

(function(ChakraApp) {
  // Private event listeners collection
  let listeners = new Map();
  
  // EventBus singleton
  ChakraApp.EventBus = {
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    subscribe: function(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      
      listeners.get(event).add(callback);
      
      // Return unsubscribe function
      return function() {
        if (listeners.has(event)) {
          listeners.get(event).delete(callback);
        }
      };
    },

    /**
     * Publish an event
     * @param {string} event - Event name
     * @param {any} data - Event data
     */
    publish: function(event, data) {
      if (listeners.has(event)) {
        listeners.get(event).forEach(function(callback) {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in event listener for "${event}":`, error);
          }
        });
      }
    },

    /**
     * Clear all listeners for an event
     * @param {string} event - Event name
     */
    clear: function(event) {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    }
  };

  // Create an Observable base object for change notifications
  ChakraApp.Observable = function() {
    this.observers = new Set();
    
    /**
     * Subscribe to changes
     * @param {Function} observer - Change handler
     * @returns {Function} Unsubscribe function
     */
    this.subscribe = function(observer) {
      this.observers.add(observer);
      
      // Return unsubscribe function
      var self = this;
      return function() {
        self.observers.delete(observer);
      };
    };

    /**
     * Notify all observers of changes
     * @param {any} data - Changed data
     */
    this.notify = function(data) {
      var observers = this.observers;
      observers.forEach(function(observer) {
        try {
          observer(data);
        } catch (error) {
          console.error('Error in observer:', error);
        }
      });
    };
  };

})(window.ChakraApp = window.ChakraApp || {});

// src/events/EventTypes.js
// Define all event types in one place for consistency

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

    // Tab events
    TAB_CREATED: 'tab:created',
    TAB_UPDATED: 'tab:updated',
    TAB_DELETED: 'tab:deleted',
    TAB_SELECTED: 'tab:selected',
    TAB_DESELECTED: 'tab:deselected',
    
    // UI events
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
    SQUARES_MULTI_DESELECTED: 'squares:multi_deselected',

    PANELS_CREATED: 'panels_created',
  };
})(window.ChakraApp = window.ChakraApp || {});
