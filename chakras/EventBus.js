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
