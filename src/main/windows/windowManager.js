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
import logger from '../../utils/logger/index.js';
import { createNotificationMessage } from '../../shared/ipc/message.js';
import MainWindow from './MainWindow.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a logger for the window manager
const log = logger.createLogger('WindowManager');

// Get the preload script path - use the CommonJS version
const preloadPath = path.join(path.dirname(path.dirname(__dirname)), 'preload.cjs');

// Store references to all windows
const windows = new Map();
// Store instance of main window
const mainWindow = new MainWindow();

// Window types
const WINDOW_TYPES = {
  MAIN: 'main',
  FACE_PANEL: 'face-panel',
  SETTINGS: 'settings'
};

/**
 * Create a window with the specified type and options
 * @param {string} type - The type of window to create
 * @param {Object} options - Additional options for the window
 * @returns {Promise<BrowserWindow>} The created window
 */
export async function createWindow(type, options = {}) {
  log.info(`Creating window of type: ${type}`);

  switch (type) {
    case WINDOW_TYPES.MAIN:
      return createMainWindow(options);
    case WINDOW_TYPES.FACE_PANEL:
      return createFacePanelWindow(options);
    case WINDOW_TYPES.SETTINGS:
      return createSettingsWindow(options);
    default:
      log.error(`Unknown window type: ${type}`);
      throw new Error(`Unknown window type: ${type}`);
  }
}

/**
 * Create the main application window
 * @param {Object} options - Additional options for the window
 * @returns {BrowserWindow} The created window
 */
export function createMainWindow(options = {}) {
  // Use the MainWindow class to create or retrieve the main window
  const window = mainWindow.create();

  // Store the window reference
  windows.set(WINDOW_TYPES.MAIN, window);

  // Set up window ID for tracking
  window.windowId = WINDOW_TYPES.MAIN;

  log.info('Main window created and registered');

  return window;
}

/**
 * Create a face panel window
 * @param {Object} options - Additional options for the window
 * @returns {BrowserWindow} The created window
 */
export function createFacePanelWindow(options = {}) {
  const id = options.id || Date.now();
  log.info(`Creating face panel window with ID: ${id}`);

  // Get the primary display dimensions
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Create a smaller window for the face panel
  const facePanelWindow = new BrowserWindow({
    width: options.width || 300,
    height: options.height || 300,
    x: options.x || (width - 350), // Position near the right edge
    y: options.y || (50 + (id % 3) * 350), // Stack panels vertically
    title: options.title || `Face Panel ${id}`,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      enableRemoteModule: false,
    },
    // Make it a child of the main window if main window exists
    parent: windows.get(WINDOW_TYPES.MAIN) || null,
    // Don't show in taskbar
    skipTaskbar: true,
    // No menu bar
    autoHideMenuBar: true,
  });

  // Load the face panel content
  if (isDev) {
    // In development, load from Vite dev server with query param
    facePanelWindow.loadURL(`http://localhost:5173/face-panel?id=${id}`);
    log.info(`Loaded face panel window from dev server with ID: ${id}`);
  } else {
    // In production, load the built HTML file with hash param
    facePanelWindow.loadFile(
      path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'dist/index.html'),
      { hash: `face-panel?id=${id}` }
    );
    log.info(`Loaded face panel window from production build with ID: ${id}`);
  }

  // Handle window close
  facePanelWindow.on('closed', () => {
    log.info(`Face panel window closed with ID: ${id}`);
    windows.delete(`${WINDOW_TYPES.FACE_PANEL}-${id}`);

    // Notify any listeners that the face panel window was closed
    broadcastWindowEvent('window:closed', {
      type: WINDOW_TYPES.FACE_PANEL,
      id: facePanelWindow.id,
      panelId: id
    });
  });

  // Store the window reference with its ID
  windows.set(`${WINDOW_TYPES.FACE_PANEL}-${id}`, facePanelWindow);

  // Notify any listeners that the face panel window was created
  broadcastWindowEvent('window:created', {
    type: WINDOW_TYPES.FACE_PANEL,
    id: facePanelWindow.id,
    panelId: id
  });

  log.info(`Face panel window created with ID: ${facePanelWindow.id}, panel ID: ${id}`);
  return facePanelWindow;
}

/**
 * Create a settings window
 * @param {Object} options - Additional options for the window
 * @returns {BrowserWindow} The created window
 */
export function createSettingsWindow(options = {}) {
  // Don't create a new window if one already exists
  if (windows.has(WINDOW_TYPES.SETTINGS)) {
    const settingsWindow = windows.get(WINDOW_TYPES.SETTINGS);
    if (!settingsWindow.isDestroyed()) {
      settingsWindow.focus();
      return settingsWindow;
    }
  }

  log.info('Creating settings window');

  // Create the browser window
  const settingsWindow = new BrowserWindow({
    width: options.width || 600,
    height: options.height || 500,
    title: options.title || 'Settings',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      enableRemoteModule: false,
    },
    // Make it a child of the main window if main window exists
    parent: windows.get(WINDOW_TYPES.MAIN) || null,
    // Modal dialog
    modal: options.modal !== undefined ? options.modal : true,
  });

  // Load the settings content
  if (isDev) {
    // In development, load from Vite dev server
    settingsWindow.loadURL('http://localhost:5173/settings');
    log.info('Loaded settings window from dev server');
  } else {
    // In production, load the built HTML file with hash param
    settingsWindow.loadFile(
      path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'dist/index.html'),
      { hash: 'settings' }
    );
    log.info('Loaded settings window from production build');
  }

  // Handle window close
  settingsWindow.on('closed', () => {
    log.info('Settings window closed');
    windows.delete(WINDOW_TYPES.SETTINGS);

    // Notify any listeners that the settings window was closed
    broadcastWindowEvent('window:closed', {
      type: WINDOW_TYPES.SETTINGS,
      id: settingsWindow.id
    });
  });

  // Store the window reference
  windows.set(WINDOW_TYPES.SETTINGS, settingsWindow);

  // Notify any listeners that the settings window was created
  broadcastWindowEvent('window:created', {
    type: WINDOW_TYPES.SETTINGS,
    id: settingsWindow.id
  });

  log.info(`Settings window created with ID: ${settingsWindow.id}`);
  return settingsWindow;
}

/**
 * Get a window by ID
 * @param {number} id - The window ID
 * @returns {BrowserWindow|null} The window or null if not found
 */
export function getWindowById(id) {
  for (const window of windows.values()) {
    if (window.id === id) {
      return window;
    }
  }
  return null;
}

/**
 * Close a window by ID
 * @param {number} id - The window ID
 * @returns {boolean} Whether the window was closed
 */
export function closeWindow(id) {
  const window = getWindowById(id);
  if (window && !window.isDestroyed()) {
    window.close();
    return true;
  }
  return false;
}

/**
 * Get the main window
 * @returns {BrowserWindow|null} The main window or null if it doesn't exist
 */
export function getMainWindow() {
  return windows.get(WINDOW_TYPES.MAIN) || null;
}

/**
 * Get all face panel windows
 * @returns {BrowserWindow[]} Array of face panel windows
 */
export function getFacePanelWindows() {
  const facePanels = [];
  for (const [key, window] of windows.entries()) {
    if (key.startsWith(WINDOW_TYPES.FACE_PANEL)) {
      facePanels.push(window);
    }
  }
  return facePanels;
}

/**
 * Get all application windows
 * @returns {BrowserWindow[]} Array of all application windows
 */
export function getAllWindows() {
  return Array.from(windows.values());
}

/**
 * Close all windows and clean up
 */
export function closeAllWindows() {
  log.info('Closing all windows');

  // Close each window
  for (const [key, window] of windows.entries()) {
    if (window && !window.isDestroyed()) {
      window.close();
      log.info(`Closed window: ${key}`);
    }
  }

  // Clear the map
  windows.clear();

  log.info('All windows closed');
}

/**
 * Broadcast a window event to all windows
 * @param {string} channel - The channel to broadcast on
 * @param {Object} data - The data to broadcast
 */
function broadcastWindowEvent(channel, data) {
  // Skip if no windows
  if (windows.size === 0) {
    return;
  }

  // Create a notification message
  const message = createNotificationMessage(
    channel,
    data,
    'main',
    'renderer'
  );

  // Send to all windows
  for (const window of windows.values()) {
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, message);
    }
  }
}

export default {
  createWindow,
  createMainWindow,
  createFacePanelWindow,
  createSettingsWindow,
  getWindowById,
  closeWindow,
  getMainWindow,
  getFacePanelWindows,
  getAllWindows,
  closeAllWindows,
  WINDOW_TYPES
};
