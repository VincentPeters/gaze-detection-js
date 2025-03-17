/**
 * Window Event Handler
 *
 * This module centralizes window event handling for the application.
 * It registers event listeners for all window types and routes events
 * to appropriate handlers based on window type and event type.
 */

import { BrowserWindow, app, screen } from 'electron';
import logger from '../../utils/logger/index.js';
import windowManager from './windowManager.js';
import windowStateManager from './WindowStateManager.js';
import windowCommunicationManager from './WindowCommunicationManager.js';
import { createNotificationMessage } from '../../shared/ipc/message.js';

// Create a logger for the window event handler
const log = logger.createLogger('WindowEvents');

// Window event types
export const WindowEventTypes = {
  // Core window events
  READY: 'ready',
  FOCUS: 'focus',
  BLUR: 'blur',
  CLOSE: 'close',
  CLOSED: 'closed',
  MAXIMIZE: 'maximize',
  UNMAXIMIZE: 'unmaximize',
  MINIMIZE: 'minimize',
  RESTORE: 'restore',
  RESIZE: 'resize',
  MOVE: 'move',
  MOVED: 'moved',

  // Content-related events
  PAGE_TITLE_UPDATED: 'title-change',
  DID_FINISH_LOAD: 'loaded',
  DOM_READY: 'dom-ready',

  // System events
  ENTER_FULL_SCREEN: 'enter-fullscreen',
  LEAVE_FULL_SCREEN: 'leave-fullscreen',
  ENTER_HTML_FULL_SCREEN: 'enter-html-fullscreen',
  LEAVE_HTML_FULL_SCREEN: 'leave-html-fullscreen',

  // App-specific events
  APP_COMMAND: 'app-command',
  SYSTEM_CONTEXT_MENU: 'system-context-menu',
};

/**
 * Window Event Handler class
 */
class WindowEventHandler {
  constructor() {
    this.initialized = false;
    this.customHandlers = new Map();
    this.boundHandleDisplayChange = this.handleDisplayChange.bind(this);
  }

  /**
   * Initialize the window event handler
   */
  initialize() {
    if (this.initialized) return;

    log.info('Initializing window event handler');

    // Register application-level events
    this.registerAppEvents();

    // Register display-related events
    this.registerDisplayEvents();

    this.initialized = true;
    log.info('Window event handler initialized');
  }

  /**
   * Register application-level events
   */
  registerAppEvents() {
    // Handle app before-quit event to ensure clean shutdown
    app.on('before-quit', () => {
      log.info('Application is quitting, cleaning up window event handlers');
      this.cleanup();
    });

    // Handle window-all-closed event
    app.on('window-all-closed', () => {
      log.info('All windows closed');
    });

    // Handle will-quit event
    app.on('will-quit', () => {
      log.info('Application will quit, finalizing event handler cleanup');
    });

    // Handle activate event (macOS)
    app.on('activate', () => {
      log.info('Application activated');
      // If there are no windows open, create a window
      if (BrowserWindow.getAllWindows().length === 0) {
        windowManager.createMainWindow();
      }
    });
  }

  /**
   * Register display-related events
   */
  registerDisplayEvents() {
    // Monitor display changes (added, removed, metrics changed)
    screen.on('display-added', this.boundHandleDisplayChange);
    screen.on('display-removed', this.boundHandleDisplayChange);
    screen.on('display-metrics-changed', this.boundHandleDisplayChange);
  }

  /**
   * Handle display changes
   * @param {Event} event - The display change event
   * @param {Display} display - The affected display
   */
  handleDisplayChange(event, display) {
    log.info(`Display change detected: ${event.type}`, {
      displayId: display.id,
      bounds: display.bounds
    });

    // Validate window positions and sizes when displays change
    windowStateManager.validateAllWindowStates();

    // Notify all windows about the display change
    const messageData = {
      eventType: 'display-change',
      data: {
        changeType: event.type,
        display: {
          id: display.id,
          bounds: display.bounds,
          workArea: display.workArea,
          scaleFactor: display.scaleFactor,
          rotation: display.rotation,
          touchSupport: display.touchSupport,
          accelerometerSupport: display.accelerometerSupport,
          internal: display.internal
        }
      }
    };

    // Use window communication manager to broadcast display changes
    if (windowCommunicationManager.initialized) {
      windowCommunicationManager.broadcastWindowEvent(
        'display-change',
        'system',
        messageData.data
      );
    }
  }

  /**
   * Register event handlers for a window
   * @param {BrowserWindow} window - The window to register handlers for
   * @param {string} windowType - The type of window
   */
  registerWindowEvents(window, windowType) {
    if (!window || window.isDestroyed()) {
      log.warn('Cannot register events for destroyed or invalid window');
      return;
    }

    log.info(`Registering event handlers for window ID ${window.id} (${windowType})`);

    // Core window events
    this.registerCoreWindowEvents(window);

    // Content-related events
    this.registerContentEvents(window);

    // System events
    this.registerSystemEvents(window);

    // Register custom handlers based on window type
    this.registerCustomHandlers(window, windowType);

    log.info(`Event handlers registered for window ID ${window.id}`);
  }

  /**
   * Register core window events
   * @param {BrowserWindow} window - The window to register handlers for
   */
  registerCoreWindowEvents(window) {
    // Ready to show
    window.once('ready-to-show', () => {
      this.handleWindowEvent(window, WindowEventTypes.READY);
    });

    // Focus
    window.on('focus', () => {
      this.handleWindowEvent(window, WindowEventTypes.FOCUS);
    });

    // Blur
    window.on('blur', () => {
      this.handleWindowEvent(window, WindowEventTypes.BLUR);
    });

    // Close (before the window is closed)
    window.on('close', (event) => {
      // Check for prevented close and handle accordingly
      if (window.closePrevented) {
        event.preventDefault();
        log.info(`Close prevented for window ID ${window.id}`);

        // Emit a custom event for prevented close
        this.handleWindowEvent(window, 'close-prevented');
        return;
      }

      this.handleWindowEvent(window, WindowEventTypes.CLOSE);
    });

    // Closed (after the window is closed)
    window.on('closed', () => {
      this.handleWindowEvent(window, WindowEventTypes.CLOSED);

      // Clean up event listeners for this window
      this.unregisterWindowEvents(window);
    });

    // Maximize
    window.on('maximize', () => {
      this.handleWindowEvent(window, WindowEventTypes.MAXIMIZE);
    });

    // Unmaximize
    window.on('unmaximize', () => {
      this.handleWindowEvent(window, WindowEventTypes.UNMAXIMIZE);
    });

    // Minimize
    window.on('minimize', () => {
      this.handleWindowEvent(window, WindowEventTypes.MINIMIZE);
    });

    // Restore
    window.on('restore', () => {
      this.handleWindowEvent(window, WindowEventTypes.RESTORE);
    });

    // Resize
    window.on('resize', () => {
      const bounds = window.getBounds();
      this.handleWindowEvent(window, WindowEventTypes.RESIZE, {
        width: bounds.width,
        height: bounds.height
      });
    });

    // Move
    window.on('move', () => {
      const bounds = window.getBounds();
      this.handleWindowEvent(window, WindowEventTypes.MOVE, {
        x: bounds.x,
        y: bounds.y
      });
    });

    // Moved (fired after move is complete)
    window.on('moved', () => {
      const bounds = window.getBounds();
      this.handleWindowEvent(window, WindowEventTypes.MOVED, {
        x: bounds.x,
        y: bounds.y
      });
    });
  }

  /**
   * Register content-related events
   * @param {BrowserWindow} window - The window to register handlers for
   */
  registerContentEvents(window) {
    // Page title updated
    window.on('page-title-updated', (event, title) => {
      this.handleWindowEvent(window, WindowEventTypes.PAGE_TITLE_UPDATED, { title });
    });

    // Did finish load
    window.webContents.on('did-finish-load', () => {
      this.handleWindowEvent(window, WindowEventTypes.DID_FINISH_LOAD);
    });

    // DOM ready
    window.webContents.on('dom-ready', () => {
      this.handleWindowEvent(window, WindowEventTypes.DOM_READY);
    });
  }

  /**
   * Register system events
   * @param {BrowserWindow} window - The window to register handlers for
   */
  registerSystemEvents(window) {
    // Enter fullscreen
    window.on('enter-full-screen', () => {
      this.handleWindowEvent(window, WindowEventTypes.ENTER_FULL_SCREEN);
    });

    // Leave fullscreen
    window.on('leave-full-screen', () => {
      this.handleWindowEvent(window, WindowEventTypes.LEAVE_FULL_SCREEN);
    });

    // Enter HTML fullscreen
    window.on('enter-html-full-screen', () => {
      this.handleWindowEvent(window, WindowEventTypes.ENTER_HTML_FULL_SCREEN);
    });

    // Leave HTML fullscreen
    window.on('leave-html-full-screen', () => {
      this.handleWindowEvent(window, WindowEventTypes.LEAVE_HTML_FULL_SCREEN);
    });

    // App command (Windows specific)
    window.on('app-command', (event, command) => {
      this.handleWindowEvent(window, WindowEventTypes.APP_COMMAND, { command });
    });

    // System context menu (Windows specific)
    window.on('system-context-menu', (event, point) => {
      this.handleWindowEvent(window, WindowEventTypes.SYSTEM_CONTEXT_MENU, { point });
    });
  }

  /**
   * Register custom handlers based on window type
   * @param {BrowserWindow} window - The window to register handlers for
   * @param {string} windowType - The type of window
   */
  registerCustomHandlers(window, windowType) {
    const handlers = this.customHandlers.get(windowType) || [];

    handlers.forEach(handler => {
      try {
        handler.register(window);
        log.debug(`Registered custom handler '${handler.name}' for window type '${windowType}'`);
      } catch (error) {
        log.error(`Error registering custom handler '${handler.name}' for window type '${windowType}':`, error);
      }
    });
  }

  /**
   * Add a custom event handler for a specific window type
   * @param {string} windowType - The type of window
   * @param {Object} handler - The handler object
   * @param {string} handler.name - The name of the handler
   * @param {Function} handler.register - Function to register handlers
   * @param {Function} handler.unregister - Function to unregister handlers
   */
  addCustomHandler(windowType, handler) {
    if (!this.customHandlers.has(windowType)) {
      this.customHandlers.set(windowType, []);
    }

    this.customHandlers.get(windowType).push(handler);
    log.info(`Added custom handler '${handler.name}' for window type '${windowType}'`);
  }

  /**
   * Remove a custom event handler for a specific window type
   * @param {string} windowType - The type of window
   * @param {string} handlerName - The name of the handler to remove
   */
  removeCustomHandler(windowType, handlerName) {
    if (!this.customHandlers.has(windowType)) return;

    const handlers = this.customHandlers.get(windowType);
    const index = handlers.findIndex(h => h.name === handlerName);

    if (index !== -1) {
      handlers.splice(index, 1);
      log.info(`Removed custom handler '${handlerName}' for window type '${windowType}'`);
    }
  }

  /**
   * Unregister all event handlers for a window
   * @param {BrowserWindow} window - The window to unregister handlers for
   */
  unregisterWindowEvents(window) {
    if (!window) return;

    log.info(`Unregistering event handlers for window ID ${window.id}`);

    // Unregister custom handlers
    if (window.windowType) {
      const handlers = this.customHandlers.get(window.windowType) || [];

      handlers.forEach(handler => {
        try {
          if (handler.unregister) {
            handler.unregister(window);
          }
        } catch (error) {
          log.error(`Error unregistering custom handler '${handler.name}' for window type '${window.windowType}':`, error);
        }
      });
    }

    // The rest of the handlers will be automatically garbage collected
    // when the window is destroyed
  }

  /**
   * Handle a window event
   * @param {BrowserWindow} window - The window that triggered the event
   * @param {string} eventType - The type of event
   * @param {Object} data - Additional event data
   */
  handleWindowEvent(window, eventType, data = {}) {
    try {
      // Skip if window is null, undefined, or has been destroyed
      if (!window || window.isDestroyed?.()) return;

      const windowId = window.id;
      const windowType = window.windowType || 'unknown';

      log.debug(`Window event: ${eventType} for window ${windowId} (${windowType})`);

      // Notify via window communication manager
      if (windowCommunicationManager.initialized) {
        windowCommunicationManager.broadcastWindowEvent(eventType, windowId, data);
      } else {
        // Fallback to direct messaging if window communication manager not initialized
        this.broadcastWindowEvent(eventType, windowId, data);
      }

      // Don't try to update window state if it's a closing event
      if (eventType === WindowEventTypes.CLOSE || eventType === WindowEventTypes.CLOSED) {
        return;
      }

      // Update window state if appropriate
      if (['resize', 'move', 'maximize', 'unmaximize', 'minimize', 'restore'].includes(eventType)) {
        // WindowStateManager registers its own event handlers for tracking window state
        // So we don't need to manually update state here
      }
    } catch (error) {
      log.error(`Error handling window event ${eventType}:`, error);
    }
  }

  /**
   * Broadcast a window event to all windows
   * @param {string} eventType - The type of event
   * @param {number} windowId - The ID of the window that triggered the event
   * @param {Object} data - Additional event data
   */
  broadcastWindowEvent(eventType, windowId, data = {}) {
    // Create a notification message
    const message = createNotificationMessage(
      'window:event',
      {
        eventType,
        windowId,
        data
      },
      'main',
      'renderer'
    );

    // Send to all windows
    const windows = windowManager.getAllWindows();

    windows.forEach(window => {
      if (window && !window.isDestroyed()) {
        window.webContents.send('window:event', message);
      }
    });
  }

  /**
   * Clean up event handlers
   */
  cleanup() {
    log.info('Cleaning up window event handlers');

    // Unregister display event handlers
    screen.removeListener('display-added', this.boundHandleDisplayChange);
    screen.removeListener('display-removed', this.boundHandleDisplayChange);
    screen.removeListener('display-metrics-changed', this.boundHandleDisplayChange);

    // Clear custom handlers
    this.customHandlers.clear();

    this.initialized = false;
    log.info('Window event handlers cleaned up');
  }

  /**
   * Shutdown the window event handler
   */
  shutdown() {
    log.info('Shutting down window event handler');
    this.cleanup();
    log.info('Window event handler shut down');
  }
}

export default new WindowEventHandler();
