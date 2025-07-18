// src/views/BaseView.js
// Minimal base view with essential functionality

(function(ChakraApp) {
  /**
   * Base view class
   * @param {Object} viewModel - View model instance
   * @param {Element} parentElement - Parent DOM element
   */
  ChakraApp.BaseView = function(viewModel, parentElement) {
    this.viewModel = viewModel;
    this.parentElement = parentElement;
    this.element = null;
    this._handlers = [];
  };
  
  // Base methods
  ChakraApp.BaseView.prototype = {
    render: function() {
      // Override in derived classes
      throw new Error('render() must be implemented by derived classes');
    },
    
    update: function() {
      // Override in derived classes
      throw new Error('update() must be implemented by derived classes');
    },
    
    _setupViewModelSubscription: function() {
      var self = this;
      
      if (this.viewModel && typeof this.viewModel.subscribe === 'function') {
        var unsubscribe = this.viewModel.subscribe(function(change) {
          switch (change.type) {
            case 'update':
              self.update();
              break;
            case 'select':
              if (self.element) self.element.classList.add('selected');
              break;
            case 'deselect':
              if (self.element) self.element.classList.remove('selected');
              break;
            case 'visibility':
              if (self.element) {
                self.element.style.display = change.isVisible ? 'flex' : 'none';
              }
              break;
          }
        });
        
        this._handlers.push(unsubscribe);
      }
    },
    
    _createElement: function(tag, props) {
      var el = document.createElement(tag);
      
      if (props) {
        // Apply className
        if (props.className) el.className = props.className;
        
        // Apply dataset properties
        if (props.dataset) {
          for (var key in props.dataset) {
            if (props.dataset.hasOwnProperty(key)) {
              el.dataset[key] = props.dataset[key];
            }
          }
        }
        
        // Apply styles
        if (props.style) {
          for (var prop in props.style) {
            if (props.style.hasOwnProperty(prop)) {
              el.style[prop] = props.style[prop];
            }
          }
        }
        
        // Apply content properties
        if (props.textContent !== undefined) el.textContent = props.textContent;
        if (props.innerHTML !== undefined) el.innerHTML = props.innerHTML;
        if (props.contentEditable !== undefined) el.contentEditable = props.contentEditable;
        el.spellcheck = false;
        
        // Apply event handlers
        if (props.events) {
          for (var event in props.events) {
            if (props.events.hasOwnProperty(event)) {
              el.addEventListener(event, props.events[event]);
            }
          }
        }
      }
      
      return el;
    },
    
    _addHandler: function(fn) {
      if (typeof fn === 'function') {
        this._handlers.push(fn);
      }
    },
    
    remove: function() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    },
    
    destroy: function() {
      // Remove element from DOM
      this.remove();
      
      // Clean up handlers
      for (var i = 0; i < this._handlers.length; i++) {
        if (typeof this._handlers[i] === 'function') {
          this._handlers[i]();
        }
      }
      
      // Clear references
      this.viewModel = null;
      this.parentElement = null;
      this.element = null;
      this._handlers = [];
    }
  };
})(window.ChakraApp = window.ChakraApp || {});
