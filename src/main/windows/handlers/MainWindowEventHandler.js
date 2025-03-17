/**
 * Main Window Event Handler
 *
 * Custom event handlers specific to the main application window.
 */

import { app } from 'electron';
import logger from '../../../utils/logger/index.js';
import windowEventHandler from '../WindowEventHandler.js';
import { WindowEventTypes } from '../WindowEventHandler.js';

// Create a logger for the main window event handler
const log = logger.createLogger('MainWindowEvents');

/**
 * Main window specific event handler
 */
const MainWindowEventHandler = {
  name: 'MainWindowEventHandler',

  /**
   * Register the custom event handlers for the main window
   * @param {BrowserWindow} window - The main window instance
   */
  register(window) {
    if (!window) return;

    log.info(`Registering custom event handlers for main window ID ${window.id}`);

    // Attach close confirmation handler to prevent accidental closing
    this.attachCloseConfirmation(window);

    // Attach window reload handler
    this.attachReloadHandler(window);

    // Attach window state transition handlers
    this.attachStateTransitionHandlers(window);

    // Store references to attached handlers for cleanup
    window._customHandlers = window._customHandlers || {};
    window._customHandlers.mainWindow = true;

    log.info(`Custom event handlers registered for main window ID ${window.id}`);
  },

  /**
   * Unregister the custom event handlers for the main window
   * @param {BrowserWindow} window - The main window instance
   */
  unregister(window) {
    if (!window || !window._customHandlers || !window._customHandlers.mainWindow) return;

    log.info(`Unregistering custom event handlers for main window ID ${window.id}`);

    // The actual event handlers will be auto-removed when the window is destroyed
    // Just clean up our tracking
    delete window._customHandlers.mainWindow;

    log.info(`Custom event handlers unregistered for main window ID ${window.id}`);
  },

  /**
   * Attach a handler to confirm before closing the main window
   * @param {BrowserWindow} window - The main window
   */
  attachCloseConfirmation(window) {
    // Only apply for non-macOS platforms (macOS handles app quit differently)
    if (process.platform !== 'darwin') {
      // Intercept window close events
      window.on('close', (event) => {
        // If app is in quitting state, allow the window to close
        if (app.isQuitting === true) {
          log.debug('Application is quitting, allowing main window to close');
          return;
        }

        // For regular close attempts, prevent default close and check for unsaved changes
        event.preventDefault();

        // Ask renderer if there are unsaved changes
        window.webContents.send('app:check-unsaved-changes', {
          windowId: window.id,
          action: 'close'
        });

        log.debug('Prevented main window close, checking for unsaved changes');
      });

      // Listen for confirmation from renderer
      window.webContents.on('ipc-message', (event, channel, message) => {
        if (channel === 'app:unsaved-changes-response') {
          const { hasUnsavedChanges, action } = message;

          if (action === 'close') {
            if (hasUnsavedChanges) {
              // Show confirmation dialog
              log.debug('Unsaved changes detected, showing confirmation dialog');
              window.webContents.send('app:show-close-confirmation');
            } else {
              // No unsaved changes, minimize window
              log.debug('No unsaved changes, minimizing main window');
              window.minimize();
            }
          }
        } else if (channel === 'app:confirm-close') {
          // User confirmed closing with unsaved changes
          const { confirmed, saveFirst } = message;

          if (confirmed) {
            if (saveFirst) {
              // Save changes first
              log.debug('Saving changes before minimizing');
              window.webContents.send('app:save-and-minimize');
            } else {
              // Discard changes and minimize
              log.debug('Discarding changes and minimizing');
              window.minimize();
            }
          }
        } else if (channel === 'app:force-close') {
          // Force close the window bypassing confirmation
          log.debug('Force closing main window');
          app.isQuitting = true;
          window.close();
        }
      });
    }
  },

  /**
   * Attach a handler for window reload events
   * @param {BrowserWindow} window - The main window
   */
  attachReloadHandler(window) {
    // Handle reload and refresh
    window.webContents.on('before-input-event', (event, input) => {
      // Detect F5 or Ctrl+R
      if (
        (input.key === 'F5' || (input.control && input.key === 'r')) &&
        !input.meta && !input.alt && input.type === 'keyDown'
      ) {
        // Prevent normal reload
        event.preventDefault();

        // Check for unsaved changes before reload
        window.webContents.send('app:check-unsaved-changes', {
          windowId: window.id,
          action: 'reload'
        });

        log.debug('Intercepted reload command, checking for unsaved changes');
      }
    });

    // Listen for reload confirmation
    window.webContents.on('ipc-message', (event, channel, message) => {
      if (channel === 'app:confirm-reload') {
        const { confirmed, saveFirst } = message;

        if (confirmed) {
          if (saveFirst) {
            // Save changes first then reload
            log.debug('Saving changes before reload');
            window.webContents.send('app:save-and-reload');
          } else {
            // Discard changes and reload
            log.debug('Discarding changes and reloading');
            window.webContents.reload();
          }
        }
      }
    });
  },

  /**
   * Attach handlers for window state transitions
   * @param {BrowserWindow} window - The main window
   */
  attachStateTransitionHandlers(window) {
    // When window regains focus after being blurred
    let wasMinimized = false;

    window.on('minimize', () => {
      wasMinimized = true;
    });

    window.on('restore', () => {
      wasMinimized = false;
    });

    window.on('focus', () => {
      if (wasMinimized) {
        // Window was restored from minimized state
        log.debug('Main window restored from minimized state');

        // Refresh application state if needed
        window.webContents.send('app:refresh-state');

        wasMinimized = false;
      }
    });
  }
};

// Register the main window event handler with the WindowEventHandler
windowEventHandler.addCustomHandler('main', MainWindowEventHandler);

export default MainWindowEventHandler;
