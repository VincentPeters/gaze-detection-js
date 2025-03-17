/**
 * Face Panel Event Handler
 *
 * Custom event handlers specific to face panel windows.
 */

import logger from '../../../utils/logger/index.js';
import windowEventHandler from '../WindowEventHandler.js';
import { WindowEventTypes } from '../WindowEventHandler.js';
import windowManager from '../windowManager.js';

// Create a logger for the face panel event handler
const log = logger.createLogger('FacePanelEvents');

/**
 * Face panel specific event handler
 */
const FacePanelEventHandler = {
  name: 'FacePanelEventHandler',

  /**
   * Register the custom event handlers for a face panel window
   * @param {BrowserWindow} window - The face panel window instance
   */
  register(window) {
    if (!window) return;

    log.info(`Registering custom event handlers for face panel window ID ${window.id}`);

    // Attach panel visibility handler
    this.attachVisibilityHandler(window);

    // Attach panel focus tracking
    this.attachFocusTracker(window);

    // Attach drag and drop handlers
    this.attachDragDropHandlers(window);

    // Store references to attached handlers for cleanup
    window._customHandlers = window._customHandlers || {};
    window._customHandlers.facePanel = true;

    log.info(`Custom event handlers registered for face panel window ID ${window.id}`);
  },

  /**
   * Unregister the custom event handlers for a face panel window
   * @param {BrowserWindow} window - The face panel window instance
   */
  unregister(window) {
    if (!window || !window._customHandlers || !window._customHandlers.facePanel) return;

    log.info(`Unregistering custom event handlers for face panel window ID ${window.id}`);

    // The actual event handlers will be auto-removed when the window is destroyed
    // Just clean up our tracking
    delete window._customHandlers.facePanel;

    log.info(`Custom event handlers unregistered for face panel window ID ${window.id}`);
  },

  /**
   * Attach visibility handlers
   * @param {BrowserWindow} window - The face panel window
   */
  attachVisibilityHandler(window) {
    // Keep track of visibility state
    window.visibilityState = {
      isVisible: window.isVisible(),
      isMinimized: window.isMinimized(),
      isMaximized: window.isMaximized()
    };

    // Track visibility changes
    window.on('show', () => {
      window.visibilityState.isVisible = true;
      log.debug(`Face panel window ${window.id} shown`);

      // Notify renderer that window is now visible
      window.webContents.send('panel:visibility-changed', {
        isVisible: true,
        id: window.panelId,
        windowId: window.id
      });
    });

    window.on('hide', () => {
      window.visibilityState.isVisible = false;
      log.debug(`Face panel window ${window.id} hidden`);

      // Notify renderer that window is now hidden
      window.webContents.send('panel:visibility-changed', {
        isVisible: false,
        id: window.panelId,
        windowId: window.id
      });
    });

    // Track minimize/maximize state
    window.on('minimize', () => {
      window.visibilityState.isMinimized = true;
      log.debug(`Face panel window ${window.id} minimized`);
    });

    window.on('maximize', () => {
      window.visibilityState.isMaximized = true;
      log.debug(`Face panel window ${window.id} maximized`);
    });

    window.on('restore', () => {
      window.visibilityState.isMinimized = false;
      window.visibilityState.isMaximized = false;
      log.debug(`Face panel window ${window.id} restored`);
    });

    window.on('unmaximize', () => {
      window.visibilityState.isMaximized = false;
      log.debug(`Face panel window ${window.id} unmaximized`);
    });
  },

  /**
   * Attach focus tracking
   * @param {BrowserWindow} window - The face panel window
   */
  attachFocusTracker(window) {
    // Track focus states to handle synchronized viewing
    window.on('focus', () => {
      // Get the main window
      const mainWindow = windowManager.getMainWindow();

      // Notify main window that a face panel has been focused
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('panel:focused', {
          panelId: window.panelId,
          windowId: window.id
        });
      }

      // Store the last focused panel ID in the global state
      window.webContents.send('state:set', {
        domain: 'ui',
        key: 'lastFocusedPanelId',
        value: window.panelId
      });
    });

    window.on('blur', () => {
      // Notify the panel that it has lost focus
      window.webContents.send('panel:blurred', {
        panelId: window.panelId,
        windowId: window.id
      });
    });
  },

  /**
   * Attach drag and drop handlers
   * @param {BrowserWindow} window - The face panel window
   */
  attachDragDropHandlers(window) {
    // Handle file drag and drop
    window.webContents.on('will-navigate', (event) => {
      // Prevent navigation via drag and drop of files
      event.preventDefault();
    });

    // Set up handlers for drag operations
    window.webContents.on('ipc-message', (event, channel, data) => {
      if (channel === 'panel:drag-start') {
        // Panel is being dragged (custom drag from within the app)
        log.debug(`Face panel ${window.panelId} drag started`);

        // Track drag state on window
        window.isDragging = true;
      }
      else if (channel === 'panel:drag-end') {
        // Panel drag has ended
        log.debug(`Face panel ${window.panelId} drag ended`);

        // Update drag state
        window.isDragging = false;

        // If drop target was provided, handle the drop
        if (data && data.dropTarget) {
          this.handlePanelDrop(window, data.dropTarget);
        }
      }
    });
  },

  /**
   * Handle panel drop onto a target
   * @param {BrowserWindow} window - The face panel window being dropped
   * @param {Object} dropTarget - Information about the drop target
   */
  handlePanelDrop(window, dropTarget) {
    const { targetType, targetId } = dropTarget;

    log.debug(`Face panel ${window.panelId} dropped on ${targetType} ${targetId}`);

    if (targetType === 'panel') {
      // Panel dropped on another panel - handle rearrangement
      const targetWindow = windowManager.getFacePanelWindows().find(w => w.panelId === targetId);

      if (targetWindow) {
        // Get positions
        const sourcePos = window.getBounds();
        const targetPos = targetWindow.getBounds();

        // Swap positions
        window.setBounds(targetPos);
        targetWindow.setBounds(sourcePos);

        log.debug(`Swapped positions of panels ${window.panelId} and ${targetId}`);
      }
    }
    else if (targetType === 'main') {
      // Panel dropped on main window - dock it to the main window
      const mainWindow = windowManager.getMainWindow();

      if (mainWindow) {
        const mainBounds = mainWindow.getBounds();

        // Position the panel at the right side of the main window
        window.setBounds({
          x: mainBounds.x + mainBounds.width - 350,
          y: mainBounds.y + 50,
          width: 320,
          height: 240
        });

        log.debug(`Docked panel ${window.panelId} to main window`);
      }
    }
  }
};

// Register the face panel event handler with the WindowEventHandler
windowEventHandler.addCustomHandler('face-panel', FacePanelEventHandler);

export default FacePanelEventHandler;
