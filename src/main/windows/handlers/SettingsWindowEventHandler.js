/**
 * Settings Window Event Handler
 *
 * Custom event handlers specific to settings windows.
 */

import logger from '../../../utils/logger/index.js';
import windowEventHandler from '../WindowEventHandler.js';
import { WindowEventTypes } from '../WindowEventHandler.js';
import windowManager from '../windowManager.js';

// Create a logger for the settings window event handler
const log = logger.createLogger('SettingsEvents');

/**
 * Settings window specific event handler
 */
const SettingsWindowEventHandler = {
  name: 'SettingsWindowEventHandler',

  /**
   * Register the custom event handlers for the settings window
   * @param {BrowserWindow} window - The settings window instance
   */
  register(window) {
    if (!window) return;

    log.info(`Registering custom event handlers for settings window ID ${window.id}`);

    // Attach save settings handler
    this.attachSaveHandler(window);

    // Attach reset settings handler
    this.attachResetHandler(window);

    // Attach keyboard shortcut handlers
    this.attachKeyboardShortcuts(window);

    // Store references to attached handlers for cleanup
    window._customHandlers = window._customHandlers || {};
    window._customHandlers.settings = true;

    log.info(`Custom event handlers registered for settings window ID ${window.id}`);
  },

  /**
   * Unregister the custom event handlers for the settings window
   * @param {BrowserWindow} window - The settings window instance
   */
  unregister(window) {
    if (!window || !window._customHandlers || !window._customHandlers.settings) return;

    log.info(`Unregistering custom event handlers for settings window ID ${window.id}`);

    // The actual event handlers will be auto-removed when the window is destroyed
    // Just clean up our tracking
    delete window._customHandlers.settings;

    log.info(`Custom event handlers unregistered for settings window ID ${window.id}`);
  },

  /**
   * Attach save settings handler
   * @param {BrowserWindow} window - The settings window
   */
  attachSaveHandler(window) {
    // Handle save settings request from renderer
    window.webContents.on('ipc-message', (event, channel, data) => {
      if (channel === 'settings:save') {
        log.info('Received settings save request', { sections: Object.keys(data) });

        // Notify the main window to save settings
        const mainWindow = windowManager.getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('settings:update', data);
        }

        // Send confirmation back to settings window
        window.webContents.send('settings:save-complete', {
          success: true,
          timestamp: Date.now()
        });
      }
    });

    // Listen for confirmation from main window
    window.on('close', () => {
      // Check for unsaved changes
      window.webContents.send('settings:check-unsaved');
    });
  },

  /**
   * Attach reset settings handler
   * @param {BrowserWindow} window - The settings window
   */
  attachResetHandler(window) {
    // Handle reset settings request from renderer
    window.webContents.on('ipc-message', (event, channel, data) => {
      if (channel === 'settings:reset') {
        const { section } = data || {};
        log.info('Received settings reset request', { section });

        // Notify the main window to reset settings
        const mainWindow = windowManager.getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('settings:reset', { section });
        }

        // Send confirmation back to settings window
        window.webContents.send('settings:reset-complete', {
          success: true,
          section,
          timestamp: Date.now()
        });
      }
    });
  },

  /**
   * Attach keyboard shortcut handlers
   * @param {BrowserWindow} window - The settings window
   */
  attachKeyboardShortcuts(window) {
    // Handle keyboard shortcuts
    window.webContents.on('before-input-event', (event, input) => {
      // Handle Escape key to close settings
      if (input.key === 'Escape' && input.type === 'keyDown') {
        log.debug('Escape key pressed in settings window, closing');

        // Check for unsaved changes before closing
        window.webContents.send('settings:check-unsaved');
        event.preventDefault();
      }

      // Handle Ctrl+S to save settings
      if (input.key === 's' && input.control && !input.alt && !input.meta && input.type === 'keyDown') {
        log.debug('Ctrl+S pressed in settings window, saving settings');
        window.webContents.send('settings:save-shortcut');
        event.preventDefault();
      }

      // Handle Ctrl+Z to undo changes
      if (input.key === 'z' && input.control && !input.alt && !input.meta && input.type === 'keyDown') {
        log.debug('Ctrl+Z pressed in settings window, undoing changes');
        window.webContents.send('settings:undo');
        event.preventDefault();
      }
    });

    // Listen for unsaved changes response
    window.webContents.on('ipc-message', (event, channel, data) => {
      if (channel === 'settings:unsaved-response') {
        const { hasUnsavedChanges } = data;

        if (hasUnsavedChanges) {
          // Show confirmation dialog
          log.debug('Unsaved settings changes detected, showing confirmation dialog');
          window.webContents.send('settings:show-close-confirmation');
        } else {
          // No unsaved changes, close window
          log.debug('No unsaved settings changes, closing window');
          window.destroy();
        }
      } else if (channel === 'settings:confirm-close') {
        const { confirmed, saveFirst } = data;

        if (confirmed) {
          if (saveFirst) {
            // Save settings first
            log.debug('Saving settings before closing');
            window.webContents.send('settings:save-and-close');
          } else {
            // Discard changes and close
            log.debug('Discarding settings changes and closing');
            window.destroy();
          }
        }
      }
    });
  }
};

// Register the settings window event handler with the WindowEventHandler
windowEventHandler.addCustomHandler('settings', SettingsWindowEventHandler);

export default SettingsWindowEventHandler;
