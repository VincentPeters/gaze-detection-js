/**
 * Main Process Entry Point
 *
 * This is the entry point for the Electron main process.
 * It handles application lifecycle, window creation, and IPC setup.
 */

import { app, BrowserWindow } from 'electron';
import pkg from 'electron-squirrel-startup';
const { electronSquirrelStartup } = pkg;
import windowManager from './main/windows/windowManager.js';
import ipcManager from './main/ipc/ipcManager.js';
import logger from './utils/logger/index.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (electronSquirrelStartup) {
  app.quit();
}

// Create a logger for the main process
const log = logger.createLogger('Main');

/**
 * Initialize the application
 */
function initializeApp() {
  log.info('Initializing application');

  // Initialize the IPC manager
  ipcManager.initialize();

  // Create the main application window
  windowManager.createMainWindow();

  log.info('Application initialized');
}

/**
 * Clean up resources before quitting
 */
function cleanupApp() {
  log.info('Cleaning up application resources');

  // Shutdown the IPC manager
  ipcManager.shutdown();

  log.info('Application cleanup complete');
}

/**
 * Handle application lifecycle events
 */
function setupAppLifecycle() {
  // This method will be called when Electron has finished initialization
  app.whenReady().then(() => {
    log.info('Electron app ready');
    initializeApp();

    // On macOS it's common to re-create a window when the dock icon is clicked
    app.on('activate', () => {
      log.info('App activated');
      if (BrowserWindow.getAllWindows().length === 0) {
        windowManager.createMainWindow();
      }
    });
  });

  // Quit when all windows are closed, except on macOS
  app.on('window-all-closed', () => {
    log.info('All windows closed');
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Clean up before quitting
  app.on('before-quit', () => {
    log.info('Application quitting');
    cleanupApp();
  });

  // Handle any uncaught exceptions in the main process
  process.on('uncaughtException', (error) => {
    log.error('Uncaught exception in main process:', error);
    // In a production app, you might want to log this to a file
    // and potentially restart the application
  });
}

// Set up the application lifecycle
setupAppLifecycle();

// Log startup information
log.info(`Starting application ${app.getName()} v${app.getVersion()}`);
log.info(`Electron v${process.versions.electron}, Node.js ${process.versions.node}, Chrome v${process.versions.chrome}`);
log.info(`Platform: ${process.platform}, Arch: ${process.arch}`);
