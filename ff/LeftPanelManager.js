// Enhanced LeftPanelManager.js - With Silhouette Toggle Button
(function(ChakraApp) {
	ChakraApp.LeftPanelManager = function() {
        this.leftContainer = null;
        this.leftPanels = new Map();
        this.eventSubscriptions = {};
        
        // Track minimized panels
        this.minimizedPanels = new Map();
        this.minimizedPanelsTray = null;
        
        // Individual panel width management
        this.defaultPanelWidth = 400;
        this.minPanelWidth = 100;
        this.maxPanelWidth = 800;
        this.panelWidths = new Map(); // Store individual panel widths
        
        this._transitionsEnabled = false;
        
        // Drag and drop state
        this.dragState = {
            isDragging: false,
            draggedPanel: null,
            draggedPanelId: null,
            placeholder: null,
            dragStartX: 0,
            dragStartY: 0,
            originalOrder: null
        };
        
        // Resize state
        this.resizeState = {
            isResizing: false,
            resizingPanelId: null,
            startX: 0,
            startWidth: 0,
            resizeHandle: null
        };
        
        // Track editing state for panel titles
        this.editingTitleState = {
            panelId: null,
            originalTitle: null,
            inputElement: null
        };
        
        // Track silhouette visibility per panel
        this.silhouetteVisibility = new Map();
        
        this.leftPanelControls = null;
    };
    
	ChakraApp.LeftPanelManager.prototype.init = function() {
    this._createLeftContainer();
    this._setupEventListeners();
    this._createMinimizedPanelsTray();
    
    // CRITICAL: Load panel widths BEFORE restoring panel state
    this._loadSavedPanelWidths();
    
    // CRITICAL: Restore panels BEFORE creating titles and other elements
    this._restoreSavedPanelState();
    
    this._createLeftPanelControls();
    this._updateLeftContainerWidth();

    // Create panel titles after panels are created and widths are set
    var self = this;
    this.leftPanels.forEach(function(panel, panelId) {
        self._createPanelTitle(panelId);
    });
    
    this._setupEventListeners();
    this._initializePanelSelection();
    
    // Enable transitions after a delay to prevent initial flash
    setTimeout(function() {
        self._enableTransitions();
        
        // REMOVED: No longer need force update here since App.js handles positioning correctly
    }, 150);
};

	 ChakraApp.LeftPanelManager.prototype._loadSavedPanelWidths = function() {
        try {
            var savedWidths = localStorage.getItem(this._getStorageKey('panelWidths'));
            if (savedWidths) {
                var widthsData = JSON.parse(savedWidths);
                for (var panelId in widthsData) {
                    this.panelWidths.set(parseInt(panelId), widthsData[panelId]);
                }
            }
        } catch (e) {
            console.error('Error loading panel widths:', e);
        }
    };

    // Save panel widths to localStorage
    ChakraApp.LeftPanelManager.prototype._savePanelWidths = function() {
        try {
            var widthsData = {};
            this.panelWidths.forEach(function(width, panelId) {
                widthsData[panelId] = width;
            });
            localStorage.setItem(this._getStorageKey('panelWidths'), JSON.stringify(widthsData));
        } catch (e) {
            console.error('Error saving panel widths:', e);
        }
    };

    // Get storage key for panel widths
    ChakraApp.LeftPanelManager.prototype._getStorageKey = function(keyName) {
        const instanceId = this._getInstanceId();
        return `${instanceId}.${keyName}`;
    };

    ChakraApp.LeftPanelManager.prototype._getInstanceId = function() {
        // Try to get from URL parameter first (?instance=myapp1)
        const params = new URLSearchParams(window.location.search);
        const urlInstance = params.get('instance');
        if (urlInstance) {
            return urlInstance;
        }
        
        // For file:// URLs, use the directory path
        if (window.location.protocol === 'file:') {
            const path = window.location.pathname;
            const pathParts = path.split('/');
            const dirName = pathParts[pathParts.length - 2];
            return dirName || 'default';
        }
        
        // Fall back to port-based instance ID for http/https
        const port = window.location.port || '3000';
        return `instance${port}`;
    };

    // Get width for a specific panel
ChakraApp.LeftPanelManager.prototype.getPanelWidth = function(panelId) {
    // CRITICAL: Ensure panelId is treated as integer consistently
    panelId = parseInt(panelId);
    
    
    var width = this.panelWidths.get(panelId);
    
    if (width && width > 0) {
        return width;
    }
    
    // If no cached width, check DOM immediately
    var panelElement = document.getElementById('left-panel-' + panelId);
    if (panelElement) {
        var computedStyle = window.getComputedStyle(panelElement);
        var domWidth = parseInt(computedStyle.width);
        if (!isNaN(domWidth) && domWidth > 0) {
            // Cache this width
            this.panelWidths.set(panelId, domWidth);
            return domWidth;
        }
    }
    
    // Return default and cache it
    var defaultWidth = this.defaultPanelWidth;
    this.panelWidths.set(panelId, defaultWidth);
    return defaultWidth;
};

    // Set width for a specific panel
    ChakraApp.LeftPanelManager.prototype.setPanelWidth = function(panelId, width) {
    var oldWidth = this.getPanelWidth(panelId);
    width = Math.max(this.minPanelWidth, Math.min(this.maxPanelWidth, width));
    this.panelWidths.set(panelId, width);
    
    
    // Update the panel element
    var panelData = this.leftPanels.get(panelId);
    if (panelData && panelData.element) {
        panelData.element.style.width = width + 'px';
    }
    
    // CRITICAL FIX: Only update stored circle coordinates if the width actually changed
    // and only if we're not in the middle of a drag operation
    if (oldWidth !== width && !this._isDragging()) {
        this._updateCircleCoordinatesForPanelResize(panelId, oldWidth, width);
    }
    
    // Update container width
    this._updateLeftContainerWidth();
    
    // Save to localStorage
    this._savePanelWidths();
    
    // Update circle positions for this panel (visual update only)
    this._updateCirclePositionsForPanel(panelId);
    
    // Publish event (this will also trigger ResizeController)
    ChakraApp.EventBus.publish('PANEL_WIDTH_CHANGED', {
        panelId: panelId,
        newWidth: width,
        oldWidth: oldWidth
    });
    
    return width;
};

ChakraApp.LeftPanelManager.prototype._isDragging = function() {
    // Check if window.wasDragged is set (used by drag system)
    if (window.wasDragged) {
        return true;
    }
    
    // Check if any drag state indicates dragging
    if (window.dragState && window.dragState.isDragging) {
        return true;
    }
    
    // Check if panel resize is happening
    if (this.resizeState && this.resizeState.isResizing) {
        return true;
    }
    
    return false;
};

ChakraApp.LeftPanelManager.prototype._updateCircleCoordinatesForPanelResize = function(panelId, oldWidth, newWidth) {
    
    if (!ChakraApp.appState || !ChakraApp.appState.circles) {
        return;
    }
    
    // Calculate the change in panel center position
    var oldCenterX = oldWidth / 2;
    var newCenterX = newWidth / 2;
    var centerDelta = newCenterX - oldCenterX;
    
    
    // Find all circles that belong to this panel
    var circlesUpdated = 0;
    ChakraApp.appState.circles.forEach(function(circle, circleId) {
        // Determine if this circle belongs to the resized panel
        var circlePanelId = this._getCirclePanelId(circle);
        
        if (circlePanelId === panelId) {
            // IMPORTANT: Circle coordinates are stored relative to panel center
            // When panel width changes, we need to adjust stored coordinates
            // to maintain the same ABSOLUTE position
            
            var currentStoredX = circle.x; // This is relative to old center
            var absoluteX = currentStoredX + oldCenterX; // Convert to absolute
            var newStoredX = absoluteX - newCenterX; // Convert to new center-relative
            
            
            // Update the stored coordinate
            circle.x = newStoredX;
            circlesUpdated++;
        }
    }, this);
    
    
    // Save the updated coordinates immediately
    if (circlesUpdated > 0) {
        ChakraApp.appState.saveToStorageNow();
    }
};

ChakraApp.LeftPanelManager.prototype._getCirclePanelId = function(circle) {
    if (!circle || !circle.documentId) {
        return null;
    }
    
    // Get the document this circle belongs to
    var doc = ChakraApp.appState.getDocument(circle.documentId);
    if (!doc) {
        return null;
    }
    
    // Check all panels to see which one has this circle's document selected
    var foundPanelId = null;
    ChakraApp.appState.leftPanels.forEach(function(panel, panelId) {
        var panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
        if (panelSelections && panelSelections[circle.circleType]) {
            var typeSelections = panelSelections[circle.circleType];
            if (typeSelections.list1 === circle.documentId || typeSelections.list2 === circle.documentId) {
                foundPanelId = panelId;
            }
        }
    });
    
    return foundPanelId;
};

ChakraApp.LeftPanelManager.prototype._updateCirclePositionsForPanel = function(panelId) {
    
    if (ChakraApp.app && ChakraApp.app.viewManager && ChakraApp.app.viewManager.circleViews) {
        var updatedCount = 0;
        ChakraApp.app.viewManager.circleViews.forEach(function(circleView, key) {
            // Check if this circle belongs to the specified panel
            var circlePanelId = circleView._getPanelIdFromCircleView();
            
            if (circlePanelId === panelId) {
                circleView.updatePosition();
                updatedCount++;
            }
        });
    }
};
    

    ChakraApp.LeftPanelManager.prototype._initializePanelSelection = function() {
        // Ensure a panel is selected (will select leftmost by default)
        ChakraApp.appState.ensureLeftPanelSelected();
        
        // Set up click handlers for panel selection
        this._setupPanelSelectionHandlers();
    };

    // NEW: Set up click handlers for panel selection
    ChakraApp.LeftPanelManager.prototype._setupPanelSelectionHandlers = function() {
        var self = this;
        
        // Add click handlers to existing panels
        this.leftPanels.forEach(function(panelData, panelId) {
            self._addPanelClickHandler(panelData.element, panelId);
        });
        
        // Listen for new panels being added
        ChakraApp.EventBus.subscribe('LEFT_PANEL_ADDED', function(data) {
            if (data && data.panelId !== undefined) {
                setTimeout(function() {
                    var panelElement = document.getElementById('left-panel-' + data.panelId);
                    if (panelElement) {
                        self._addPanelClickHandler(panelElement, data.panelId);
                    }
                }, 100);
            }
        });
    };

    // NEW: Add click handler to a panel for selection
    ChakraApp.LeftPanelManager.prototype._addPanelClickHandler = function(panelElement, panelId) {
        if (!panelElement || panelElement.dataset.selectionHandlerAdded) {
            return;
        }
        
        var self = this;
        
        // Add click handler to the panel (but not to buttons or other interactive elements)
        panelElement.addEventListener('click', function(e) {
            // Don't trigger selection if clicking on buttons or interactive elements
            if (e.target.closest('button') || 
                e.target.closest('.left-panel-title-input') ||
                e.target.classList.contains('left-panel-remove-btn') ||
                e.target.classList.contains('left-panel-minimize-btn') ||
                e.target.classList.contains('left-panel-silhouette-btn')) {
                return;
            }
            
            // Select this panel
            ChakraApp.appState.setSelectedLeftPanel(panelId);
        });
        
        // Mark that we've added the selection handler
        panelElement.dataset.selectionHandlerAdded = 'true';
    };

    // Enable transitions for smooth animations after initial load
    ChakraApp.LeftPanelManager.prototype._enableTransitions = function() {
        this._transitionsEnabled = true;
        
        // Add transition class to container
        if (this.leftContainer) {
            this.leftContainer.classList.add('transitions-enabled');
        }
        
        // Add transition class to all existing panels
        this.leftPanels.forEach(function(panelData) {
            if (panelData.element) {
                panelData.element.classList.add('transitions-enabled');
            }
        });
    };

    // Get current dynamic panel width from ResizeController
    ChakraApp.LeftPanelManager.prototype._getDynamicPanelWidth = function() {
        if (ChakraApp.app && ChakraApp.app.resizeController) {
            return ChakraApp.app.resizeController.getCurrentPanelWidth();
        }
        return this.dynamicPanelWidth;
    };

    ChakraApp.LeftPanelManager.prototype._restoreSavedPanelState = function() {
        if (!ChakraApp.appState.leftPanels) {
            return;
        }
        
        var self = this;
        var panelsToCreate = [];
        
        ChakraApp.appState.leftPanels.forEach(function(panel, panelId) {
            panelsToCreate.push({
                id: panelId,
                order: panel.order !== undefined ? panel.order : panelId // Use saved order or fall back to panel ID
            });
        });
        
        // IMPORTANT: Sort by order to restore correct sequence
        panelsToCreate.sort(function(a, b) { 
            return a.order - b.order; 
        });
        
        // Create panels in the correct order
        panelsToCreate.forEach(function(panelInfo) {
            self.createLeftPanel(panelInfo.id);
        });
        
        if (panelsToCreate.length > 0) {
            var maxPanelId = Math.max.apply(Math, panelsToCreate.map(p => p.id));
            if (maxPanelId >= ChakraApp.appState.nextLeftPanelId) {
                ChakraApp.appState.nextLeftPanelId = maxPanelId + 1;
            }
        }
        
        this._restoreMinimizedState();
        this._restoreSilhouetteVisibility(); // NEW: Restore silhouette visibility
    };
    
    // NEW: Restore silhouette visibility from saved state
    ChakraApp.LeftPanelManager.prototype._restoreSilhouetteVisibility = function() {
    var self = this;

    // FIXED: Ensure AppState map exists before accessing it
    if (!ChakraApp.appState.leftPanelSilhouetteVisibility) {
        ChakraApp.appState.leftPanelSilhouetteVisibility = new Map();
    }

    var silhouetteData = ChakraApp.appState.leftPanelSilhouetteVisibility;
    var hasExistingData = silhouetteData && silhouetteData.size > 0;
    
    if (hasExistingData) {
        silhouetteData.forEach(function(isVisible, panelId) {
            self.silhouetteVisibility.set(panelId, isVisible);
            // Defer the visual updates until the panels are fully created
            setTimeout(function() {
                self._updateSilhouetteVisibility(panelId, isVisible);
                self._updateSilhouetteButton(panelId, isVisible);
            }, 100);
        });
    } else {
        // DON'T initialize defaults here - let createLeftPanel handle it
        // This prevents conflicting with the restoration process
    }
    
    // REMOVED: No automatic save here since we're just restoring, not changing state
};
    
    ChakraApp.LeftPanelManager.prototype._createMinimizedPanelsTray = function() {
        if (this.minimizedPanelsTray) {
            return;
        }
        
        this.minimizedPanelsTray = document.createElement('div');
        this.minimizedPanelsTray.className = 'minimized-panels-tray';
        this.minimizedPanelsTray.id = 'minimized-panels-tray';
        
        var label = document.createElement('span');
        label.className = 'minimized-panels-label';
        //this.minimizedPanelsTray.appendChild(label);
        
        document.body.appendChild(this.minimizedPanelsTray);
    };
    
    ChakraApp.LeftPanelManager.prototype._updateTrayVisibility = function() {
        if (!this.minimizedPanelsTray) {
            return;
        }
        
        var hasMinimizedPanels = this.minimizedPanels.size > 0;
        
        if (hasMinimizedPanels) {
            this.minimizedPanelsTray.classList.add('visible');
        } else {
            this.minimizedPanelsTray.classList.remove('visible');
        }
    };
    
    ChakraApp.LeftPanelManager.prototype._createMinimizedPanelIcon = function(panelId) {
        var icon = document.createElement('div');
        icon.className = 'minimized-panel-icon';
        icon.dataset.panelId = panelId;
        icon.textContent = this._getPanelTitle(panelId) || 'Panel ' + panelId;
        
        var tooltip = document.createElement('div');
        tooltip.className = 'minimized-panel-tooltip';
        tooltip.textContent = this._getPanelTitle(panelId) || 'Panel ' + panelId;
        icon.appendChild(tooltip);
        
        var self = this;
        icon.addEventListener('click', function() {
            self.restorePanel(panelId);
        });
        
        return icon;
    };
    
    // UPDATED: Get panel title considering custom names
    ChakraApp.LeftPanelManager.prototype._getPanelTitle = function(panelId) {
        // First check if there's a custom name
        var customName = ChakraApp.appState.getLeftPanelCustomName(panelId);
        if (customName) {
            return customName;
        }
        
        // Fall back to element text or generated title
        var titleElement = document.getElementById('left-panel-title-' + panelId);
        if (titleElement && !titleElement.classList.contains('untitled')) {
            return titleElement.textContent;
        }
        return 'Panel ' + panelId;
    };
    
    ChakraApp.LeftPanelManager.prototype.minimizePanel = function(panelId) {
        var panelData = this.leftPanels.get(panelId);
        if (!panelData || !panelData.element) {
            return false;
        }
        
        panelData.element.classList.add('minimizing');
        
        var self = this;
        setTimeout(function() {
            panelData.element.classList.remove('minimizing');
            panelData.element.classList.add('minimized');
            
            self.minimizedPanels.set(panelId, panelData);
            self.leftPanels.delete(panelId);
            
            if (ChakraApp.appState.leftPanels.has(panelId)) {
                var panelState = ChakraApp.appState.leftPanels.get(panelId);
                panelState.minimized = true;
                ChakraApp.appState.leftPanels.set(panelId, panelState);
                ChakraApp.appState.saveToStorage();
            }
            
            var icon = self._createMinimizedPanelIcon(panelId);
            self.minimizedPanelsTray.appendChild(icon);
            
            // Update container width for dynamic layout
            self._updateLeftContainerWidth();
            self._updateTrayVisibility();
            
            ChakraApp.EventBus.publish('LEFT_PANEL_MINIMIZED', { panelId: panelId });
            
        }, 400);
        
        return true;
    };
    
    ChakraApp.LeftPanelManager.prototype.restorePanel = function(panelId) {
        var panelData = this.minimizedPanels.get(panelId);
        if (!panelData || !panelData.element) {
            return false;
        }
        
        this.minimizedPanels.delete(panelId);
        this.leftPanels.set(panelId, panelData);
        
        if (ChakraApp.appState.leftPanels.has(panelId)) {
            var panelState = ChakraApp.appState.leftPanels.get(panelId);
            panelState.minimized = false;
            ChakraApp.appState.leftPanels.set(panelId, panelState);
            ChakraApp.appState.saveToStorage();
        }
        
        var icon = this.minimizedPanelsTray.querySelector('[data-panel-id="' + panelId + '"]');
        if (icon) {
            icon.remove();
        }
        
        panelData.element.classList.remove('minimized');
        panelData.element.classList.add('restoring');
        
        var self = this;
        setTimeout(function() {
            panelData.element.classList.remove('restoring');
            
            // Update container width for dynamic layout
            self._updateLeftContainerWidth();
            self._updateTrayVisibility();
            
            ChakraApp.EventBus.publish('LEFT_PANEL_RESTORED', { panelId: panelId });
            
        }, 400);
        
        return true;
    };
    
    ChakraApp.LeftPanelManager.prototype._restoreMinimizedState = function() {
        var self = this;
        
        if (!this.minimizedPanelsTray) {
            console.warn('Minimized panels tray not found, creating it now');
            this._createMinimizedPanelsTray();
        }
        
        if (ChakraApp.appState.leftPanels) {
            ChakraApp.appState.leftPanels.forEach(function(panelState, panelId) {
                if (panelState.minimized === true) {
                    var panelData = self.leftPanels.get(panelId);
                    if (panelData && panelData.element) {
                        panelData.element.classList.add('minimized');
                        self.minimizedPanels.set(panelId, panelData);
                        self.leftPanels.delete(panelId);
                        
                        if (self.minimizedPanelsTray) {
                            var icon = self._createMinimizedPanelIcon(panelId);
                            self.minimizedPanelsTray.appendChild(icon);
                        } else {
                            console.error('Cannot add minimized panel icon - tray is null');
                        }
                    }
                }
            });
        }
        
        this._updateLeftContainerWidth();
        this._updateTrayVisibility();
    };
    
    ChakraApp.LeftPanelManager.prototype._createLeftContainer = function() {
        this.leftContainer = document.getElementById('left-container');
        
        if (this.leftContainer) {
            this.leftContainer.className = 'left-container';
            this.leftContainer.style.display = 'flex';
            this.leftContainer.style.height = '100%';
            this.leftContainer.style.flexDirection = 'row';
            
            this.leftContainer.innerHTML = '';
            return;
        }
        
        console.error('Could not find left-container element');
    };
    
ChakraApp.LeftPanelManager.prototype.createLeftPanel = function(panelId) {
        var panel = document.createElement('div');
        panel.id = 'left-panel-' + panelId;
        panel.className = 'left-panel';
        panel.dataset.panelIndex = panelId;
        panel.style.height = '100%';
        panel.style.flexShrink = '0';
        panel.style.position = 'relative';
        
        // Set individual panel width
        var panelWidth = this.getPanelWidth(panelId);
        panel.style.width = panelWidth + 'px';
        
        // Check if transitions should be enabled (after initial load)
        if (this._transitionsEnabled) {
            panel.classList.add('transitions-enabled');
        }
        
        // Border logic - panels have border-right except the last one
        var isFirstPanel = this.leftPanels.size === 0;
        if (!isFirstPanel) {
            panel.style.borderLeft = '1px solid #444';
        }
        
        // Create zoom container
        var zoomContainer = document.createElement('div');
        zoomContainer.id = 'zoom-container-left-' + panelId;
        zoomContainer.className = 'zoom-container';
        zoomContainer.dataset.panelId = 'left-' + panelId;
        zoomContainer.style.position = 'relative';
        zoomContainer.style.width = '100%';
        zoomContainer.style.height = '100%';
        zoomContainer.style.overflow = 'hidden';
        
        panel.appendChild(zoomContainer);
        
        if (this.leftContainer) {
            this.leftContainer.appendChild(panel);
        } else {
            console.error('leftContainer is null, cannot append panel');
            return null;
        }
        
        // Add resize handle (except for the last panel)
        this._addResizeHandle(panel, panelId);
        
        // Register the panel in LeftPanelManager
        this.leftPanels.set(panelId, {
            element: panel,
            zoomContainer: zoomContainer,
            panelId: panelId
        });
        
        // Ensure the panel exists in AppState
        if (!ChakraApp.appState.leftPanels.has(panelId)) {
            ChakraApp.appState.leftPanels.set(panelId, {
                id: panelId,
                visible: true,
                zoomLevel: null,
                minimized: false,
                order: this._getNextPanelOrder()
            });
        }
        
        // Initialize header type for new panels (default to 'standard')
        if (ChakraApp.appState.leftPanelHeaderTypes && !ChakraApp.appState.leftPanelHeaderTypes.has(panelId)) {
            ChakraApp.appState.setLeftPanelHeaderType(panelId, 'standard');
        }
        
        // Ensure panel selections exist
        if (!ChakraApp.appState.leftPanelSelections.has(panelId)) {
            ChakraApp.appState.leftPanelSelections.set(panelId, ChakraApp.appState._createEmptySelections());
        }
        
        // Initialize silhouette visibility (default to visible)
        if (!this.silhouetteVisibility.has(panelId)) {
            var savedVisibility = null;
            if (ChakraApp.appState.leftPanelSilhouetteVisibility && 
                ChakraApp.appState.leftPanelSilhouetteVisibility.has(panelId)) {
                savedVisibility = ChakraApp.appState.leftPanelSilhouetteVisibility.get(panelId);
            }
            
            var initialVisibility = savedVisibility !== null ? savedVisibility : true;
            this.silhouetteVisibility.set(panelId, initialVisibility);
            
            if (savedVisibility === null) {
                if (!ChakraApp.appState.leftPanelSilhouetteVisibility) {
                    ChakraApp.appState.leftPanelSilhouetteVisibility = new Map();
                }
                ChakraApp.appState.leftPanelSilhouetteVisibility.set(panelId, initialVisibility);
                ChakraApp.appState.saveToStorageNow();
            }
        }
        
        // Apply all enhancements
        this._enhancePanelElement(panel, zoomContainer, panelId);
        
        // Update container width
        this._updateLeftContainerWidth();
        
        this._createPanelTitle(panelId);

        if (panel) {
            this._addPanelClickHandler(panel, panelId);
            
            // If this is the first panel or no panel is selected, select it
            if (this.leftPanels.size === 1 || ChakraApp.appState.getSelectedLeftPanelId() === null) {
                ChakraApp.appState.setSelectedLeftPanel(panelId);
            }
        }
        
        return panel;
    };

    // Add resize handle to a panel
    ChakraApp.LeftPanelManager.prototype._addResizeHandle = function(panelElement, panelId) {
        var resizeHandle = document.createElement('div');
        resizeHandle.className = 'panel-resize-handle';
        resizeHandle.dataset.panelId = panelId;
        
        // Style the resize handle
        Object.assign(resizeHandle.style, {
            position: 'absolute',
            top: '0',
            bottom: '0',
            cursor: 'ew-resize',
            zIndex: '999',
            borderRight: '1px solid #444'
        });

        // Add hover effect
        resizeHandle.addEventListener('mouseenter', () => {
            resizeHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        });

        resizeHandle.addEventListener('mouseleave', () => {
            if (!this.resizeState.isResizing) {
            resizeHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
        });

        // Add resize event listeners
        this._addResizeEventListeners(resizeHandle, panelId);
        
        panelElement.appendChild(resizeHandle);
    };

    // Add resize event listeners to a handle
    ChakraApp.LeftPanelManager.prototype._addResizeEventListeners = function(resizeHandle, panelId) {
        var self = this;

        resizeHandle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self._startResize(e, panelId, resizeHandle);
        });

        // Global mouse events (added to document)
        document.addEventListener('mousemove', function(e) {
            self._handleResize(e);
        });

        document.addEventListener('mouseup', function(e) {
            self._endResize(e);
        });
    };

    // Start resizing a panel
    ChakraApp.LeftPanelManager.prototype._startResize = function(e, panelId, resizeHandle) {
        this.resizeState.isResizing = true;
        this.resizeState.resizingPanelId = panelId;
        this.resizeState.startX = e.clientX;
        this.resizeState.startWidth = this.getPanelWidth(panelId);
        this.resizeState.resizeHandle = resizeHandle;
        
        resizeHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        
        // Disable transitions during resizing
        this._disableTransitionsDuringResize();
    };

    // Handle panel resize
    ChakraApp.LeftPanelManager.prototype._handleResize = function(e) {
        if (!this.resizeState.isResizing) return;

        e.preventDefault();
        var deltaX = e.clientX - this.resizeState.startX;
        var newWidth = this.resizeState.startWidth + deltaX;

        // Apply constraints
        newWidth = Math.max(this.minPanelWidth, newWidth);
        newWidth = Math.min(this.maxPanelWidth, newWidth);

        // Update the panel width
        this.setPanelWidth(this.resizeState.resizingPanelId, newWidth);
    };

    // End panel resize
    ChakraApp.LeftPanelManager.prototype._endResize = function(e) {
        if (!this.resizeState.isResizing) return;

        this.resizeState.isResizing = false;
        
        if (this.resizeState.resizeHandle) {
            this.resizeState.resizeHandle.style.backgroundColor = 'transparent';
        }
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // Re-enable transitions
        this._enableTransitionsAfterResize();

        // Reset resize state
        this.resizeState.resizingPanelId = null;
        this.resizeState.resizeHandle = null;
    };

    // Disable transitions during resize
    ChakraApp.LeftPanelManager.prototype._disableTransitionsDuringResize = function() {
        if (this.leftContainer) {
            this.leftContainer.classList.add('no-transition');
        }
        
        document.querySelectorAll('.left-panel').forEach(function(panel) {
            panel.classList.add('no-transition');
        });
    };

    // Re-enable transitions after resize
    ChakraApp.LeftPanelManager.prototype._enableTransitionsAfterResize = function() {
        var self = this;
        
        setTimeout(function() {
            if (self.leftContainer) {
                self.leftContainer.classList.remove('no-transition');
            }
            
            document.querySelectorAll('.left-panel').forEach(function(panel) {
                panel.classList.remove('no-transition');
            });
        }, 50);
    };

    ChakraApp.LeftPanelManager.prototype._setupHeaderToggleEvents = function() {
        var self = this;
        
        this.eventSubscriptions.headerTypeChanged = ChakraApp.EventBus.subscribe(
            'LEFT_PANEL_HEADER_TYPE_CHANGED',
            function(data) {
                if (data && data.panelId !== undefined) {
                    // Update panel title when header type changes (only if no custom name)
                    var customName = ChakraApp.appState.getLeftPanelCustomName(data.panelId);
                    if (!customName) {
                        self._updatePanelTitle(data.panelId);
                    }
                }
            }
        );
    };

    // NEW: Get next panel order for proper sequencing
    ChakraApp.LeftPanelManager.prototype._getNextPanelOrder = function() {
        var maxOrder = -1;
        
        ChakraApp.appState.leftPanels.forEach(function(panelState) {
            if (panelState.order !== undefined && panelState.order > maxOrder) {
                maxOrder = panelState.order;
            }
        });
        
        return maxOrder + 1;
    };

    ChakraApp.LeftPanelManager.prototype._enhancePanelElement = function(panelElement, zoomContainer, panelId) {
        if (!panelElement.querySelector('.left-panel-remove-btn')) {
            this._addRemoveButton(panelElement, panelId);
        }
        
        if (!panelElement.querySelector('.left-panel-minimize-btn')) {
            this._addMinimizeButton(panelElement, panelId);
        }
        
        // NEW: Add silhouette toggle button
        if (!panelElement.querySelector('.left-panel-silhouette-btn')) {
            this._addSilhouetteToggleButton(panelElement, panelId);
        }
        
        if (zoomContainer && !zoomContainer.querySelector('.silhouette-svg')) {
            this._createSilhouetteElements(zoomContainer, panelId);
        }
        
        this._initializePanelControls(panelId);
    };

    ChakraApp.LeftPanelManager.prototype._addRemoveButton = function(panelElement, panelId) {
        var removeBtn = document.createElement('button');
        removeBtn.className = 'left-panel-remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove this panel';
        
        var self = this;
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent panel selection when clicking remove button
            
            // Get panel title for confirmation message
            var panelTitle = self._getPanelTitle(panelId);
            var confirmMessage = 'Are you sure you want to remove "' + panelTitle + '"?';
            
            // Show confirmation dialog
            if (confirm(confirmMessage)) {
                self.removeLeftPanel(panelId);
            }
        });
        
        panelElement.appendChild(removeBtn);
    };
    
    ChakraApp.LeftPanelManager.prototype._addMinimizeButton = function(panelElement, panelId) {
        var minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'left-panel-minimize-btn';
        minimizeBtn.innerHTML = '−';
        minimizeBtn.title = 'Minimize this panel';
        
        var self = this;
        minimizeBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent panel selection when clicking minimize button
            self.minimizePanel(panelId);
        });
        
        panelElement.appendChild(minimizeBtn);
    };

    ChakraApp.LeftPanelManager.prototype._addSilhouetteToggleButton = function(panelElement, panelId) {
        var silhouetteBtn = document.createElement('button');
        silhouetteBtn.className = 'left-panel-silhouette-btn';
        silhouetteBtn.innerHTML = '∘';
        silhouetteBtn.title = 'Toggle background silhouettes';
        
        // Set initial state based on current visibility
        var isVisible = this.silhouetteVisibility.get(panelId);
        if (isVisible === false) {
            silhouetteBtn.classList.add('silhouettes-hidden');
            silhouetteBtn.innerHTML = '∘';
            silhouetteBtn.title = 'Show background silhouettes';
        }
        
        var self = this;
        silhouetteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent panel selection when clicking silhouette button
            self.toggleSilhouetteVisibility(panelId);
        });
        
        panelElement.appendChild(silhouetteBtn);
    };

ChakraApp.LeftPanelManager.prototype.toggleSilhouetteVisibility = function(panelId) {
    var currentVisibility = this.silhouetteVisibility.get(panelId);
    var newVisibility = currentVisibility !== false ? false : true; // Default to true if undefined
    
    
    this.silhouetteVisibility.set(panelId, newVisibility);
    
    // FIXED: Always ensure AppState map exists
    if (!ChakraApp.appState.leftPanelSilhouetteVisibility) {
        ChakraApp.appState.leftPanelSilhouetteVisibility = new Map();
    }
    ChakraApp.appState.leftPanelSilhouetteVisibility.set(panelId, newVisibility);
    
    
    // IMPORTANT: Use immediate save to ensure persistence
    var saved = ChakraApp.appState.saveToStorageNow();
    
    // Update the visual state
    this._updateSilhouetteVisibility(panelId, newVisibility);
    
    // Update button appearance
    this._updateSilhouetteButton(panelId, newVisibility);
    
    // Publish event for other components that might need to know
    ChakraApp.EventBus.publish('LEFT_PANEL_SILHOUETTE_TOGGLED', {
        panelId: panelId,
        visible: newVisibility
    });
};

    // NEW: Update the visual visibility of silhouettes
    ChakraApp.LeftPanelManager.prototype._updateSilhouetteVisibility = function(panelId, isVisible) {
        // Find the panel (could be in regular panels or minimized panels)
        var panelData = this.leftPanels.get(panelId) || this.minimizedPanels.get(panelId);
        if (!panelData || !panelData.zoomContainer) {
            return;
        }
        
        // Find all silhouette elements in this panel
        var silhouettes = panelData.zoomContainer.querySelectorAll('.silhouette-svg');
        
        silhouettes.forEach(function(silhouette) {
            if (isVisible) {
                silhouette.style.display = '';
                silhouette.style.opacity = '';
            } else {
                silhouette.style.display = 'none';
            }
        });
    };

    // NEW: Update the silhouette toggle button appearance
    ChakraApp.LeftPanelManager.prototype._updateSilhouetteButton = function(panelId, isVisible) {
        var panelData = this.leftPanels.get(panelId) || this.minimizedPanels.get(panelId);
        if (!panelData || !panelData.element) {
            return;
        }
        
        var button = panelData.element.querySelector('.left-panel-silhouette-btn');
        if (!button) {
            return;
        }
        
        if (isVisible) {
            button.classList.remove('silhouettes-hidden');
            button.innerHTML = '∘';
            button.title = 'Hide background silhouettes';
        } else {
            button.classList.add('silhouettes-hidden');
            button.innerHTML = '∘';
            button.title = 'Show background silhouettes';
        }
    };

    // UPDATED: Create editable panel title
    ChakraApp.LeftPanelManager.prototype._createPanelTitle = function(panelId) {
        const panel = this.leftPanels.get(panelId) || this.minimizedPanels.get(panelId);
        if (!panel || !panel.element) return null;

        const existingTitle = panel.element.querySelector('.left-panel-title');
        if (existingTitle) {
            existingTitle.remove();
        }

        const titleElement = document.createElement('div');
        titleElement.className = 'left-panel-title';
        titleElement.id = 'left-panel-title-' + panelId;
        
        // Check if there's a custom name first
        var customName = ChakraApp.appState.getLeftPanelCustomName(panelId);
        if (customName) {
            titleElement.textContent = customName;
            titleElement.classList.remove('untitled');
            titleElement.classList.add('custom-name');
        } else {
            titleElement.textContent = 'untitled';
            titleElement.classList.add('untitled');
        }
        
        // NEW: Make title draggable and add drag styling
        titleElement.draggable = true;
        titleElement.style.cursor = 'grab';
        titleElement.style.userSelect = 'none';
        titleElement.dataset.panelId = panelId;
        
        // NEW: Add click event for editing
        this._addTitleEditingListeners(titleElement, panelId);
        
        // NEW: Add drag event listeners
        this._addDragEventListeners(titleElement, panelId);

        panel.element.appendChild(titleElement);
        
        // Only update title if no custom name exists
        if (!customName) {
            this._updatePanelTitle(panelId);
        }

        return titleElement;
    };

    // NEW: Add editing functionality to panel titles
    ChakraApp.LeftPanelManager.prototype._addTitleEditingListeners = function(titleElement, panelId) {
        var self = this;
        
        // Double-click or single click to edit
        titleElement.addEventListener('click', function(e) {
            // Don't start editing if we're dragging
            if (self.dragState.isDragging) return;
            
            e.stopPropagation();
            self._startEditingTitle(panelId);
        });
        
        // Prevent drag when editing
        titleElement.addEventListener('mousedown', function(e) {
            if (self.editingTitleState.panelId === panelId) {
                e.preventDefault();
                return false;
            }
        });
    };

    // NEW: Start editing a panel title
    ChakraApp.LeftPanelManager.prototype._startEditingTitle = function(panelId) {
        // Don't start editing if already editing another title
        if (this.editingTitleState.panelId !== null) {
            this._finishEditingTitle(false); // Cancel current edit
        }
        
        var titleElement = document.getElementById('left-panel-title-' + panelId);
        if (!titleElement) return;
        
        // Store current state
        this.editingTitleState.panelId = panelId;
        this.editingTitleState.originalTitle = titleElement.textContent;
        
        // Create input element
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'left-panel-title-input';
        input.value = titleElement.textContent === 'untitled' ? '' : titleElement.textContent;
        input.placeholder = 'Enter panel name...';
        
        // Style the input to match the title
        input.style.width = '100%';
        input.style.background = 'rgba(255, 255, 255, 0.1)';
        input.style.border = '1px solid #666';
        input.style.color = '#fff';
        input.style.fontSize = '12px';
        input.style.padding = '2px 4px';
        input.style.borderRadius = '3px';
        input.style.outline = 'none';
        
        // Replace title with input
        titleElement.style.display = 'none';
        titleElement.parentNode.appendChild(input);
        
        this.editingTitleState.inputElement = input;
        
        // Focus and select all text
        input.focus();
        input.select();
        
        // Add event listeners
        var self = this;
        
        input.addEventListener('blur', function() {
            self._finishEditingTitle(true);
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                self._finishEditingTitle(true);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                self._finishEditingTitle(false);
            }
        });
        
        // Disable dragging while editing
        titleElement.draggable = false;
    };

    // NEW: Finish editing a panel title
    ChakraApp.LeftPanelManager.prototype._finishEditingTitle = function(save) {
        if (this.editingTitleState.panelId === null) return;
        
        var panelId = this.editingTitleState.panelId;
        var titleElement = document.getElementById('left-panel-title-' + panelId);
        var input = this.editingTitleState.inputElement;
        
        if (!titleElement || !input) {
            this._resetEditingState();
            return;
        }
        
        var newTitle = '';
        if (save && input.value.trim()) {
            newTitle = input.value.trim();
            
            // Save custom name to AppState
            ChakraApp.appState.setLeftPanelCustomName(panelId, newTitle);
            
            // Update title element
            titleElement.textContent = newTitle;
            titleElement.classList.remove('untitled');
            titleElement.classList.add('custom-name');
            
        } else if (save && !input.value.trim()) {
            // User cleared the input - remove custom name and revert to auto-generated
            ChakraApp.appState.setLeftPanelCustomName(panelId, null);
            titleElement.classList.remove('custom-name');
            titleElement.classList.add('untitled');
            
            // Update with auto-generated title
            this._updatePanelTitle(panelId, true); // Force update even with custom name cleared
            
        } else {
            // Cancel - revert to original
            titleElement.textContent = this.editingTitleState.originalTitle;
        }
        
        // Remove input and show title
        input.remove();
        titleElement.style.display = '';
        titleElement.draggable = true;
        
        // Update minimized icon if panel is minimized
        this._updateMinimizedPanelIcon(panelId);
        
        // Reset editing state
        this._resetEditingState();
        
        // Save to storage
        ChakraApp.appState.saveToStorage();
    };

    // NEW: Reset editing state
    ChakraApp.LeftPanelManager.prototype._resetEditingState = function() {
        this.editingTitleState.panelId = null;
        this.editingTitleState.originalTitle = null;
        this.editingTitleState.inputElement = null;
    };

    // NEW: Update minimized panel icon text
    ChakraApp.LeftPanelManager.prototype._updateMinimizedPanelIcon = function(panelId) {
        if (!this.minimizedPanelsTray) return;
        
        var icon = this.minimizedPanelsTray.querySelector('[data-panel-id="' + panelId + '"]');
        if (icon) {
            var title = this._getPanelTitle(panelId);
            icon.textContent = title;
            
            var tooltip = icon.querySelector('.minimized-panel-tooltip');
            if (tooltip) {
                tooltip.textContent = title;
            }
        }
    };

    // NEW: Add drag event listeners to panel title
    ChakraApp.LeftPanelManager.prototype._addDragEventListeners = function(titleElement, panelId) {
        var self = this;
        
        titleElement.addEventListener('dragstart', function(e) {
            // Don't drag if we're editing
            if (self.editingTitleState.panelId === panelId) {
                e.preventDefault();
                return false;
            }
            self._handleDragStart(e, panelId);
        });
        
        titleElement.addEventListener('dragend', function(e) {
            self._handleDragEnd(e, panelId);
        });
        
        // Add drag-over styling when dragging
        titleElement.addEventListener('mousedown', function() {
            if (self.editingTitleState.panelId !== panelId) {
                titleElement.style.cursor = 'grabbing';
            }
        });
        
        titleElement.addEventListener('mouseup', function() {
            if (self.editingTitleState.panelId !== panelId) {
                titleElement.style.cursor = 'grab';
            }
        });
    };

    // NEW: Handle drag start
    ChakraApp.LeftPanelManager.prototype._handleDragStart = function(e, panelId) {
        var panel = this.leftPanels.get(panelId);
        if (!panel) return;
        
        // Store drag state
        this.dragState.isDragging = true;
        this.dragState.draggedPanel = panel;
        this.dragState.draggedPanelId = panelId;
        this.dragState.dragStartX = e.clientX;
        this.dragState.dragStartY = e.clientY;
        this.dragState.originalOrder = this._getCurrentPanelOrder();
        
        // Set drag data
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', panelId.toString());
        
        // Add dragging visual feedback
        panel.element.classList.add('dragging');
        
        // Create drop zones between panels
        this._createDropZones();
        
        // Make other panels aware of the drag
        this.leftPanels.forEach(function(otherPanel, otherPanelId) {
            if (otherPanelId !== panelId) {
                otherPanel.element.classList.add('drop-target');
            }
        });
    };

    // NEW: Handle drag end
    ChakraApp.LeftPanelManager.prototype._handleDragEnd = function(e, panelId) {
        var panel = this.leftPanels.get(panelId);
        if (panel) {
            panel.element.classList.remove('dragging');
        }
        
        // Remove drop target styling from all panels
        this.leftPanels.forEach(function(panel) {
            panel.element.classList.remove('drop-target');
        });
        
        // Clean up drop zones
        this._removeDropZones();
        
        // Reset drag state
        this.dragState.isDragging = false;
        this.dragState.draggedPanel = null;
        this.dragState.draggedPanelId = null;
        this.dragState.originalOrder = null;
    };

    ChakraApp.LeftPanelManager.prototype._createDropZones = function() {
        var self = this;
        var allPanels = Array.from(this.leftPanels.values());
        
        // FIXED: Store the ACTUAL current container width before we modify it
        var currentStyle = window.getComputedStyle(self.leftContainer);
        var originalWidth = parseInt(currentStyle.width);
        self.dragState.originalContainerWidth = originalWidth;
        
        
        // Temporarily expand the container to make room for drop zones
        var expandedWidth = originalWidth + 40;
        self.leftContainer.style.width = expandedWidth + 'px';
        self.leftContainer.style.minWidth = expandedWidth + 'px';
        
        
        // Create drop zones before each panel (except the dragged one)
        allPanels.forEach(function(panel, index) {
            // Skip the dragged panel
            if (panel.panelId === self.dragState.draggedPanelId) {
                return;
            }
            
            // Create drop zone before this panel
            var dropZoneBefore = document.createElement('div');
            dropZoneBefore.className = 'panel-drop-zone drop-zone-before';
            dropZoneBefore.dataset.insertBefore = panel.panelId;
            
            // Add visible styling so you can see the drop zone
            dropZoneBefore.style.width = '20px';
            dropZoneBefore.style.height = '100%';
            dropZoneBefore.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
            dropZoneBefore.style.border = '2px dashed #0f0';
            dropZoneBefore.style.boxSizing = 'border-box';
            dropZoneBefore.style.flexShrink = '0';
            dropZoneBefore.style.display = 'block';
            
            self._addDropZoneListeners(dropZoneBefore);
            
            // Insert before the panel
            self.leftContainer.insertBefore(dropZoneBefore, panel.element);
        });
        
        // ALWAYS create drop zone at the end - make it look identical to the others
        var dropZoneAfter = document.createElement('div');
        dropZoneAfter.className = 'panel-drop-zone drop-zone-after';
        dropZoneAfter.dataset.insertAfter = 'last';
        dropZoneAfter.id = 'end-drop-zone';
        
        // Make it look identical to the other drop zones
        dropZoneAfter.style.width = '20px';
        dropZoneAfter.style.height = '100%';
        dropZoneAfter.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
        dropZoneAfter.style.border = '2px dashed #0f0';
        dropZoneAfter.style.boxSizing = 'border-box';
        dropZoneAfter.style.flexShrink = '0';
        dropZoneAfter.style.display = 'block';
        dropZoneAfter.style.position = 'relative';
        
        self._addDropZoneListeners(dropZoneAfter);
        
        // Append to the very end of the container
        self.leftContainer.appendChild(dropZoneAfter);
        
    };

    // NEW: Add event listeners to drop zones
    ChakraApp.LeftPanelManager.prototype._addDropZoneListeners = function(dropZone) {
        var self = this;
        
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            dropZone.classList.add('drop-zone-active');
        });
        
        dropZone.addEventListener('dragleave', function(e) {
            dropZone.classList.remove('drop-zone-active');
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            
            var draggedPanelId = parseInt(e.dataTransfer.getData('text/plain'));
            
            if (dropZone.dataset.insertBefore) {
                var targetPanelId = parseInt(dropZone.dataset.insertBefore);
                self._reorderPanel(draggedPanelId, 'before', targetPanelId);
            } else if (dropZone.dataset.insertAfter === 'last') {
                self._reorderPanel(draggedPanelId, 'last');
            }
            
            dropZone.classList.remove('drop-zone-active');
        });
    };

    // NEW: Remove all drop zones
    ChakraApp.LeftPanelManager.prototype._removeDropZones = function() {
        // Remove all drop zones from the DOM
        var dropZones = this.leftContainer.querySelectorAll('.panel-drop-zone');
        dropZones.forEach(function(zone) {
            zone.remove();
        });
        
        // CRITICAL: Restore the exact original width we stored during drag start
        if (this.dragState.originalContainerWidth !== null && this.dragState.originalContainerWidth !== undefined) {
            this.leftContainer.style.width = this.dragState.originalContainerWidth + 'px';
            this.leftContainer.style.minWidth = this.dragState.originalContainerWidth + 'px';
            
            // Verify restoration worked
            var restoredWidth = window.getComputedStyle(this.leftContainer).width;
        } else {
            console.warn('No original width stored! Using fallback calculation...');
            this._updateLeftContainerWidth();
            
            var fallbackWidth = window.getComputedStyle(this.leftContainer).width;
        }
        
        // Update the resize controller to reposition the divider
        if (ChakraApp.app && ChakraApp.app.resizeController) {
            ChakraApp.app.resizeController._updateDividerPosition();
        }
    };

    // NEW: Get current panel order
    ChakraApp.LeftPanelManager.prototype._getCurrentPanelOrder = function() {
        var order = [];
        var panels = this.leftContainer.querySelectorAll('.left-panel');
        
        panels.forEach(function(panelElement) {
            var panelId = parseInt(panelElement.dataset.panelIndex);
            if (!isNaN(panelId)) {
                order.push(panelId);
            }
        });
        
        return order;
    };

    // NEW: Reorder panel in DOM and state
    ChakraApp.LeftPanelManager.prototype._reorderPanel = function(draggedPanelId, position, targetPanelId) {
        var draggedPanel = this.leftPanels.get(draggedPanelId);
        if (!draggedPanel) {
            console.error('Dragged panel not found:', draggedPanelId);
            return;
        }
        
        // Remove dragged panel from DOM temporarily
        draggedPanel.element.remove();
        
        if (position === 'before' && targetPanelId) {
            var targetPanel = this.leftPanels.get(targetPanelId);
            if (targetPanel) {
                this.leftContainer.insertBefore(draggedPanel.element, targetPanel.element);
            }
        } else if (position === 'last') {
            this.leftContainer.appendChild(draggedPanel.element);
        }
        
        // Update order in state AND save immediately
        this._updatePanelOrderInState();
        
        // FIXED: Save the new order immediately to localStorage
        ChakraApp.appState.saveToStorageNow();
    };

    // NEW: Update panel order in AppState
    ChakraApp.LeftPanelManager.prototype._updatePanelOrderInState = function() {
        var currentOrder = this._getCurrentPanelOrder();
        
        currentOrder.forEach(function(panelId, index) {
            if (ChakraApp.appState.leftPanels.has(panelId)) {
                var panelState = ChakraApp.appState.leftPanels.get(panelId);
                var oldOrder = panelState.order;
                panelState.order = index;
                ChakraApp.appState.leftPanels.set(panelId, panelState);
            }
        });
        
        // Publish event to notify other components
        ChakraApp.EventBus.publish('LEFT_PANELS_REORDERED', { 
            newOrder: currentOrder 
        });
    };

    // UPDATED: Only update title if no custom name exists
    ChakraApp.LeftPanelManager.prototype._updatePanelTitle = function(panelId, forceUpdate) {
        const titleElement = document.getElementById('left-panel-title-' + panelId);
        if (!titleElement) return;

        // Check if there's a custom name and we're not forcing an update
        var customName = ChakraApp.appState.getLeftPanelCustomName(panelId);
        if (customName && !forceUpdate) {
            titleElement.textContent = customName;
            titleElement.classList.remove('untitled');
            titleElement.classList.add('custom-name');
            return;
        }

        const panelSelections = ChakraApp.appState.getLeftPanelSelections(panelId);
        if (!panelSelections) {
            titleElement.textContent = 'untitled';
            titleElement.classList.add('untitled');
            titleElement.classList.remove('custom-name');
            return;
        }

        const titleParts = [];
        const circleTypePrefixes = this._getCircleTypePrefixes();

        ChakraApp.Config.circleTypes.forEach(function(circleType) {
            const typeId = circleType.id;
            const typeSelections = panelSelections[typeId];
            
            if (typeSelections) {
                const selectedDocIds = [];
                if (typeSelections.list1 && ChakraApp.appState.listTypeVisibility['list1'] !== false) {
                    selectedDocIds.push(typeSelections.list1);
                }
                if (typeSelections.list2 && ChakraApp.appState.listTypeVisibility['list2'] !== false) {
                    selectedDocIds.push(typeSelections.list2);
                }

                selectedDocIds.forEach(function(docId) {
                    const doc = ChakraApp.appState.getDocument(docId);
                    if (doc) {
                        titleParts.push(doc.name);
                    }
                });
            }
        });

        if (titleParts.length === 0) {
            titleElement.innerHTML = 'untitled';
            titleElement.classList.add('untitled');
            titleElement.classList.remove('custom-name');
        } else {
            const formattedParts = titleParts.map(function(part) {
                return part;
            });

            titleElement.innerHTML = formattedParts.join(' | ');
            titleElement.classList.remove('untitled');
            titleElement.classList.remove('custom-name');
        }

        titleElement.title = titleParts.join(' | ') || 'untitled';
        
        var minimizedIcon = this.minimizedPanelsTray && 
                           this.minimizedPanelsTray.querySelector('[data-panel-id="' + panelId + '"]');
        if (minimizedIcon) {
            var tooltip = minimizedIcon.querySelector('.minimized-panel-tooltip');
            if (tooltip) {
                tooltip.textContent = titleParts.join(' | ') || 'Panel ' + panelId;
            }
        }
    };

    ChakraApp.LeftPanelManager.prototype._getCircleTypePrefixes = function() {
        return {
            'standard': 'F',
            'star': 'M',        
            'triangle': 'T',
            'gem': 'C'
        };
    };

    // UPDATED: Only update titles for panels without custom names
    ChakraApp.LeftPanelManager.prototype._updateAllPanelTitles = function() {
        const self = this;
        this.leftPanels.forEach(function(panel, panelId) {
            // Only update if no custom name exists
            var customName = ChakraApp.appState.getLeftPanelCustomName(panelId);
            if (!customName) {
                self._updatePanelTitle(panelId);
            }
        });
        
        this.minimizedPanels.forEach(function(panel, panelId) {
            // Only update if no custom name exists
            var customName = ChakraApp.appState.getLeftPanelCustomName(panelId);
            if (!customName) {
                self._updatePanelTitle(panelId);
            }
        });
    };
    
    ChakraApp.LeftPanelManager.prototype._createSilhouetteElements = function(container, panelId) {
        var silhouettes = [
            { id: 'silhouette-filled-black-' + panelId, idClass: 'silhouette-filled-black', src: 'silhouette-filled-black.svg' },
            { id: 'silhouette-outline-' + panelId, idClass: 'silhouette-outline', src: 'silhouette.svg' },
            { id: 'silhouette-filled-' + panelId, idClass: 'silhouette-filled', src: 'silhouette-filled.svg' }
        ];
        
        silhouettes.forEach(function(silhouette) {
            var obj = document.createElement('object');
            obj.data = silhouette.src;
            obj.className = 'silhouette-svg ' + silhouette.idClass;
            obj.id = silhouette.id;
            obj.type = 'image/svg+xml';
            container.appendChild(obj);
        });
        
        // Apply initial visibility state
        var isVisible = this.silhouetteVisibility.get(panelId);
        if (isVisible === false) {
            this._updateSilhouetteVisibility(panelId, false);
        }
    };
    
    ChakraApp.LeftPanelManager.prototype._initializePanelControls = function(panelId) {
        setTimeout(function() {
            if (ChakraApp.app && ChakraApp.app.controllers && ChakraApp.app.controllers.ui) {
                ChakraApp.app.controllers.ui._initializePanelControls(panelId);
            }
        }, 100);
    };
    
    ChakraApp.LeftPanelManager.prototype._createLeftPanelControls = function() {
        var controlsContainer = document.createElement('div');
        controlsContainer.id = 'left-panel-controls';
        controlsContainer.style.position = 'fixed';
        controlsContainer.style.bottom = '10px';
        controlsContainer.style.zIndex = '1000';
        controlsContainer.style.display = 'flex';
        controlsContainer.style.gap = '5px';
        
        var addButton = document.createElement('button');
        addButton.textContent = '+';
        addButton.title = 'Add Left Panel';
        addButton.className = 'btn-round';
        addButton.style.fontSize = '14px';
        addButton.style.width = '20px';
        addButton.style.height = '20px';
        addButton.style.border = 'none';
        addButton.style.backgroundColor = '#444';
        addButton.style.color = '#AAA';
        
        var self = this;
        addButton.addEventListener('click', function() {
            self.addLeftPanel();
        });
        
        controlsContainer.appendChild(addButton);
        document.body.appendChild(controlsContainer);
        
        // NEW: Store reference and set initial position
        this.leftPanelControls = controlsContainer;
        this._updateControlsPosition();
    };

    ChakraApp.LeftPanelManager.prototype._updateControlsPosition = function() {
        if (!this.leftPanelControls || !this.leftContainer) {
            return;
        }
        
        var computedStyle = window.getComputedStyle(this.leftContainer);
        var totalWidth = parseInt(computedStyle.width) || 0;
        var leftPosition = totalWidth + 10; // 10px gap
        
        this.leftPanelControls.style.left = leftPosition + 'px';
    };
    
    ChakraApp.LeftPanelManager.prototype.addLeftPanel = function() {
        var panelId = ChakraApp.appState.addLeftPanel();
        this.createLeftPanel(panelId);
        this._updateLeftContainerWidth();
        
        ChakraApp.appState.saveToStorage();
        
        var self = this;
        setTimeout(function() {
            ChakraApp.EventBus.publish('LEFT_PANEL_ADDED', { panelId: panelId });
        }, 50);
        
        return panelId;
    };

ChakraApp.LeftPanelManager.prototype.removeLeftPanel = function(panelId) {
        var panelData = this.minimizedPanels.get(panelId);
        var isMinimized = false;
        
        if (panelData) {
            isMinimized = true;
        } else {
            panelData = this.leftPanels.get(panelId);
        }
        
        if (panelData && panelData.element) {
            panelData.element.remove();
            
            if (isMinimized) {
                this.minimizedPanels.delete(panelId);
                
                var icon = this.minimizedPanelsTray.querySelector('[data-panel-id="' + panelId + '"]');
                if (icon) {
                    icon.remove();
                }
                
                this._updateTrayVisibility();
            } else {
                this.leftPanels.delete(panelId);
            }
            
            // Clean up panel width
            this.panelWidths.delete(panelId);
            
            // Clean up silhouette visibility tracking
            this.silhouetteVisibility.delete(panelId);
        
            // Clean up from AppState
            if (ChakraApp.appState.leftPanelSilhouetteVisibility) {
                ChakraApp.appState.leftPanelSilhouetteVisibility.delete(panelId);
            }
            
            ChakraApp.appState.removeLeftPanel(panelId);
            
            // Save panel widths after removal
            this._savePanelWidths();
            
            // Update panel order after removal and save immediately
            setTimeout(() => {
                this._updatePanelOrderInState();
                ChakraApp.appState.saveToStorageNow();
            }, 50);
            
            this._updateLeftContainerWidth();
            ChakraApp.appState.ensureLeftPanelSelected();
            return true;
        }
        return false;
    };
    
    // Updated to use dynamic panel widths
 ChakraApp.LeftPanelManager.prototype._updateLeftContainerWidth = function() {
        var totalWidth = 0;
        
        this.leftPanels.forEach(function(panelData, panelId) {
            var panelWidth = this.getPanelWidth(panelId);
            totalWidth += panelWidth;
        }, this);
        
        if (this.leftContainer) {
            this.leftContainer.style.width = totalWidth + 'px';
            this.leftContainer.style.minWidth = totalWidth + 'px';
            
            if (this.minimizedPanels.size > 0) {
                this.leftContainer.classList.add('has-minimized-panels');
            } else {
                this.leftContainer.classList.remove('has-minimized-panels');
            }
        }
        
        var centerContainer = document.getElementById('center-container');
        if (centerContainer) {
            centerContainer.style.marginLeft = '0px';
        }
        
        var mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.style.display = 'flex';
            mainContainer.style.width = '100%';
            mainContainer.style.height = '100%';
        }
        
        // Update controls position
        var self = this;
        if (this.leftContainer && this._transitionsEnabled) {
            var onTransitionEnd = function(e) {
                if (e.target === self.leftContainer && e.propertyName === 'width') {
                    self.leftContainer.removeEventListener('transitionend', onTransitionEnd);
                    self._updateControlsPosition();
                }
            };
            
            this.leftContainer.addEventListener('transitionend', onTransitionEnd);
            
            setTimeout(function() {
                self.leftContainer.removeEventListener('transitionend', onTransitionEnd);
                self._updateControlsPosition();
            }, 400);
        } else {
            this._updateControlsPosition();
        }
    };
    
    // Method to update all panel widths when ResizeController changes the width
    ChakraApp.LeftPanelManager.prototype.updatePanelWidths = function(newWidth) {
        this.dynamicPanelWidth = newWidth;
        
        // Update all visible panels
        var self = this;
        this.leftPanels.forEach(function(panelData) {
            if (panelData.element) {
                panelData.element.style.width = newWidth + 'px';
            }
        });
        
        // Update container width
        this._updateLeftContainerWidth();
    };
    
    ChakraApp.LeftPanelManager.prototype._setupEventListeners = function() {
        const self = this;

        if (!this.eventSubscriptions) {
            this.eventSubscriptions = {};
        }

        this.eventSubscriptions.documentSelected = ChakraApp.EventBus.subscribe(
            'LEFT_PANEL_DOCUMENT_SELECTED',
            function(data) {
                if (data && data.panelId !== undefined) {
                    // Only update if no custom name exists
                    var customName = ChakraApp.appState.getLeftPanelCustomName(data.panelId);
                    if (!customName) {
                        self._updatePanelTitle(data.panelId);
                    }
                }
            }
        );

        this.eventSubscriptions.documentDeselected = ChakraApp.EventBus.subscribe(
            ChakraApp.EventTypes.DOCUMENT_DESELECTED,
            function(doc) {
                self._updateAllPanelTitles();
            }
        );

        this.eventSubscriptions.documentUpdated = ChakraApp.EventBus.subscribe(
            ChakraApp.EventTypes.DOCUMENT_UPDATED,
            function(doc) {
                self._updateAllPanelTitles();
            }
        );

        this.eventSubscriptions.documentDeleted = ChakraApp.EventBus.subscribe(
            ChakraApp.EventTypes.DOCUMENT_DELETED,
            function(doc) {
                self._updateAllPanelTitles();
            }
        );

        this.eventSubscriptions.stateLoaded = ChakraApp.EventBus.subscribe(
            ChakraApp.EventTypes.STATE_LOADED,
            function() {
                setTimeout(function() {
                    self._updateAllPanelTitles();
                }, 100);
            }
        );

        ChakraApp.LeftPanelManager.prototype._onPanelSelectionChanged = function(newPanelId, oldPanelId) {
            // Update any visual indicators or UI elements that depend on panel selection
            // You can add additional visual feedback here if needed
            // For example, highlighting the selected panel border, etc.
        };

        this.eventSubscriptions.panelSelected = ChakraApp.EventBus.subscribe(
            'LEFT_PANEL_SELECTED',
            function(data) {
                // Update any panel-specific UI elements if needed
                self._onPanelSelectionChanged(data.panelId, data.previousPanelId);
            }
        );
        
        // NEW: Add header toggle event listener
        this._setupHeaderToggleEvents();
    };
    
    ChakraApp.LeftPanelManager.prototype.destroy = function() {
        Object.values(this.eventSubscriptions).forEach(function(unsubscribe) {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        
        this.eventSubscriptions = {};
        this.leftPanels.clear();
        this.minimizedPanels.clear();
        this.silhouetteVisibility.clear(); // NEW: Clean up silhouette visibility tracking
        
        if (this.minimizedPanelsTray && this.minimizedPanelsTray.parentNode) {
            this.minimizedPanelsTray.parentNode.removeChild(this.minimizedPanelsTray);
        }
        
        if (this.leftPanelControls && this.leftPanelControls.parentNode) {
            this.leftPanelControls.parentNode.removeChild(this.leftPanelControls);
        }
    };
    
})(window.ChakraApp = window.ChakraApp || {});
