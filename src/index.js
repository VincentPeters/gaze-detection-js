/**
 * Main Process Entry Point
 *
 * This is the entry point for the Electron main process.
 * It handles application lifecycle, window creation, and IPC setup.
 */

import { app, BrowserWindow } from 'electron';
import { electronSquirrelStartup } from 'electron-squirrel-startup';
import { createMainWindow } from './main/windows/windowManager.js';
import { registerIpcHandlers } from './main/ipc/handlers.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (electronSquirrelStartup) {
  app.quit();
}

/**
 * Initialize the application
 */
function initializeApp() {
  // Register all IPC handlers
  registerIpcHandlers();

  // Create the main application window
  createMainWindow();
}

/**
 * Handle application lifecycle events
 */
function setupAppLifecycle() {
  // This method will be called when Electron has finished initialization
  app.whenReady().then(() => {
    initializeApp();

    // On macOS it's common to re-create a window when the dock icon is clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  // Quit when all windows are closed, except on macOS
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Handle any uncaught exceptions in the main process
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception in main process:', error);
    // In a production app, you might want to log this to a file
    // and potentially restart the application
  });
}

// Set up the application lifecycle
setupAppLifecycle();
