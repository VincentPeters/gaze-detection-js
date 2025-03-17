/**
 * IPC Handlers for the main process
 *
 * This file contains handlers for IPC messages from renderer processes.
 * It follows the architecture defined in the process-architecture.md document.
 */

import { ipcMain } from 'electron';

/**
 * Register a basic message handler
 */
function registerBasicMessageHandler() {
  ipcMain.on('toMain', (event, args) => {
    console.log('Received message from renderer:', args);

    // Validate input from renderer (treat as untrusted)
    const sanitizedArgs = typeof args === 'string' ? args : 'Invalid input';

    // Send a response back to renderer
    event.sender.send('fromMain', `Message received by main process: ${sanitizedArgs}`);
  });
}

/**
 * Register handlers for invoke-style IPC (request-response pattern)
 */
function registerInvokeHandlers() {
  // Example of an invoke handler that returns a Promise
  ipcMain.handle('invoke-example', async (event, args) => {
    // In a real application, this might do something async like file access
    // or database operations, and return the result
    return { success: true, message: 'Invoke handler executed successfully' };
  });
}

/**
 * Register all IPC handlers
 */
export function registerIpcHandlers() {
  // Register basic message handlers
  registerBasicMessageHandler();

  // Register invoke handlers
  registerInvokeHandlers();

  // TODO: Add more handlers for specific features
  // These will be organized by feature as the application grows
}

/**
 * Send a message to all renderer processes
 * @param {string} channel - The channel to send on
 * @param {any} data - The data to send
 */
export function broadcastToAllRenderers(channel, data) {
  // Get all windows and send the message to each one
  const { BrowserWindow } = require('electron');
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send(channel, data);
  });
}

/**
 * Unregister all IPC handlers (useful during shutdown)
 */
export function unregisterIpcHandlers() {
  // Remove all listeners for specific channels
  ipcMain.removeAllListeners('toMain');

  // Remove all handle listeners
  ipcMain.removeHandler('invoke-example');

  // TODO: Remove other handlers as they are added
}
