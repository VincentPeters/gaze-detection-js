/**
 * Window Manager
 *
 * This file contains functions for creating and managing application windows.
 * It follows the architecture defined in the process-architecture.md document.
 */

import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store references to all windows
const windows = {
  main: null,
  facePanels: []
};

/**
 * Create the main application window
 * @returns {BrowserWindow} The created window
 */
export function createMainWindow() {
  // Don't create a new window if one already exists
  if (windows.main && !windows.main.isDestroyed()) {
    windows.main.focus();
    return windows.main;
  }

  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Gaze Detection',
    webPreferences: {
      // Path to the preload script
      preload: path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'preload.js'),
      // Security settings
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      // Disable remote module
      enableRemoteModule: false,
    },
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built HTML file
    mainWindow.loadFile(path.join(path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))), 'dist/index.html'));
  }

  // Handle window close
  mainWindow.on('closed', () => {
    windows.main = null;
  });

  // Store the window reference
  windows.main = mainWindow;

  return mainWindow;
}

/**
 * Create a face panel window
 * @param {number} id - Unique identifier for the face panel
 * @returns {BrowserWindow} The created window
 */
export function createFacePanelWindow(id) {
  // Get the primary display dimensions
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Create a smaller window for the face panel
  const facePanelWindow = new BrowserWindow({
    width: 300,
    height: 300,
    x: width - 350, // Position near the right edge
    y: 50 + (id * 350), // Stack panels vertically
    title: `Face Panel ${id}`,
    webPreferences: {
      preload: path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      enableRemoteModule: false,
    },
    // Make it a child of the main window
    parent: windows.main,
    // Don't show in taskbar
    skipTaskbar: true,
    // No menu bar
    autoHideMenuBar: true,
  });

  // Load the face panel content
  if (isDev) {
    // In development, load from Vite dev server with query param
    facePanelWindow.loadURL(`http://localhost:5173/face-panel?id=${id}`);
  } else {
    // In production, load the built HTML file with hash param
    facePanelWindow.loadFile(
      path.join(path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))), 'dist/index.html'),
      { hash: `face-panel?id=${id}` }
    );
  }

  // Handle window close
  facePanelWindow.on('closed', () => {
    // Remove from the array of face panels
    windows.facePanels = windows.facePanels.filter(panel => panel.id !== id);
  });

  // Store the window reference with its ID
  const panelInfo = { window: facePanelWindow, id };
  windows.facePanels.push(panelInfo);

  return facePanelWindow;
}

/**
 * Get the main window
 * @returns {BrowserWindow|null} The main window or null if it doesn't exist
 */
export function getMainWindow() {
  return windows.main;
}

/**
 * Get all face panel windows
 * @returns {Array<{window: BrowserWindow, id: number}>} Array of face panel windows with their IDs
 */
export function getFacePanelWindows() {
  return windows.facePanels;
}

/**
 * Get all application windows
 * @returns {BrowserWindow[]} Array of all application windows
 */
export function getAllWindows() {
  const allWindows = [windows.main];
  windows.facePanels.forEach(panel => allWindows.push(panel.window));
  return allWindows.filter(Boolean); // Filter out null values
}

/**
 * Close all windows and clean up
 */
export function closeAllWindows() {
  // Close face panels first
  windows.facePanels.forEach(panel => {
    if (panel.window && !panel.window.isDestroyed()) {
      panel.window.close();
    }
  });

  // Then close main window
  if (windows.main && !windows.main.isDestroyed()) {
    windows.main.close();
  }

  // Clear references
  windows.facePanels = [];
  windows.main = null;
}
