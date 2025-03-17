/**
 * Keyboard Shortcut Manager
 *
 * This class manages global keyboard shortcuts for the application.
 * It provides a central place to register and handle shortcuts.
 */

import { app, globalShortcut } from 'electron';
import logger from '../../utils/logger/index.js';

// Create a logger for the keyboard shortcut manager
const log = logger.createLogger('KeyboardShortcuts');

class KeyboardShortcutManager {
  constructor() {
    this.shortcuts = new Map();
    this.isRegistered = false;
  }

  /**
   * Register all keyboard shortcuts
   * @param {BrowserWindow} mainWindow - The main application window
   */
  registerShortcuts(mainWindow) {
    if (this.isRegistered) {
      log.warn('Shortcuts already registered, unregistering first');
      this.unregisterShortcuts();
    }

    log.info('Registering global keyboard shortcuts');

    // Dev tools shortcut (only in development)
    if (process.env.NODE_ENV === 'development') {
      this.registerShortcut('CommandOrControl+Shift+I', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.toggleDevTools();
        }
      }, 'Toggle DevTools');
    }

    // Reload application shortcut (F5 or CommandOrControl+R)
    this.registerShortcut('F5', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.reload();
      }
    }, 'Reload Application');

    this.registerShortcut('CommandOrControl+R', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.reload();
      }
    }, 'Reload Application');

    // Quit application shortcut (CommandOrControl+Q)
    this.registerShortcut('CommandOrControl+Q', () => {
      app.quit();
    }, 'Quit Application');

    // Settings shortcut (CommandOrControl+,)
    this.registerShortcut('CommandOrControl+,', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('menu:open-settings');
      }
    }, 'Open Settings');

    this.isRegistered = true;
    log.info(`Registered ${this.shortcuts.size} keyboard shortcuts`);
  }

  /**
   * Register a single keyboard shortcut
   * @param {string} accelerator - Shortcut key combination (e.g., 'CommandOrControl+Q')
   * @param {Function} callback - Function to call when shortcut is triggered
   * @param {string} description - Description of the shortcut
   * @returns {boolean} Whether the shortcut was registered successfully
   */
  registerShortcut(accelerator, callback, description) {
    try {
      const success = globalShortcut.register(accelerator, () => {
        log.debug(`Keyboard shortcut triggered: ${accelerator} (${description})`);
        callback();
      });

      if (success) {
        this.shortcuts.set(accelerator, { callback, description });
        log.debug(`Registered keyboard shortcut: ${accelerator} (${description})`);
        return true;
      } else {
        log.error(`Failed to register keyboard shortcut: ${accelerator} (${description})`);
        return false;
      }
    } catch (error) {
      log.error(`Error registering keyboard shortcut ${accelerator}:`, error);
      return false;
    }
  }

  /**
   * Unregister all keyboard shortcuts
   */
  unregisterShortcuts() {
    log.info('Unregistering all keyboard shortcuts');
    globalShortcut.unregisterAll();
    this.shortcuts.clear();
    this.isRegistered = false;
  }

  /**
   * Get all registered shortcuts
   * @returns {Map} Map of all registered shortcuts
   */
  getShortcuts() {
    return this.shortcuts;
  }
}

export default new KeyboardShortcutManager();
