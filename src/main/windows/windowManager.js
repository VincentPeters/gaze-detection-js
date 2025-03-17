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
import windowStateManager from './WindowStateManager.js';
import windowCommunicationManager from './WindowCommunicationManager.js';
import windowEventHandler from './WindowEventHandler.js';

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
 * Initialize the window manager
 */
export function initialize() {
  log.info('Initializing window manager');

  // Initialize the window state manager
  windowStateManager.initialize();

  // Initialize the window event handler
  windowEventHandler.initialize();

  log.info('Window manager initialized');
}

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

  // Set window ID and type for tracking
  window.windowId = WINDOW_TYPES.MAIN;
  window.windowType = WINDOW_TYPES.MAIN;

  // Register window events
  windowEventHandler.registerWindowEvents(window, WINDOW_TYPES.MAIN);

  // Track window state with the window state manager
  windowStateManager.trackWindow(window, WINDOW_TYPES.MAIN, WINDOW_TYPES.MAIN);

  // Notify listeners about window creation
  broadcastWindowEvent('window:created', {
    type: WINDOW_TYPES.MAIN,
    id: window.id
  });

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
  const windowId = `${WINDOW_TYPES.FACE_PANEL}-${id}`;
  log.info(`Creating face panel window with ID: ${id}`);

  // Get window state from the window state manager
  const windowState = windowStateManager.getState(windowId, WINDOW_TYPES.FACE_PANEL);

  // Get the primary display dimensions
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Create a smaller window for the face panel
  const facePanelWindow = new BrowserWindow({
    width: options.width || windowState.width,
    height: options.height || windowState.height,
    x: options.x || windowState.x || (width - 350), // Position near the right edge if no saved position
    y: options.y || windowState.y || (50 + (id % 3) * 350), // Stack panels vertically if no saved position
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

  // Set window ID and type for tracking
  facePanelWindow.windowId = windowId;
  facePanelWindow.windowType = WINDOW_TYPES.FACE_PANEL;
  facePanelWindow.panelId = id;

  // Register window events
  windowEventHandler.registerWindowEvents(facePanelWindow, WINDOW_TYPES.FACE_PANEL);

  // Track window state with the window state manager
  windowStateManager.trackWindow(facePanelWindow, windowId, WINDOW_TYPES.FACE_PANEL);

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
    windows.delete(windowId);

    // Untrack the window
    windowStateManager.untrackWindow(windowId);

    // Notify any listeners that the face panel window was closed
    broadcastWindowEvent('window:closed', {
      type: WINDOW_TYPES.FACE_PANEL,
      id: facePanelWindow.id,
      panelId: id
    });
  });

  // Store the window reference with its ID
  windows.set(windowId, facePanelWindow);

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

  // Get window state from the window state manager
  const windowState = windowStateManager.getState(WINDOW_TYPES.SETTINGS, WINDOW_TYPES.SETTINGS);

  // Create the browser window
  const settingsWindow = new BrowserWindow({
    width: options.width || windowState.width,
    height: options.height || windowState.height,
    x: options.x || windowState.x,
    y: options.y || windowState.y,
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

  // Set window ID and type for tracking
  settingsWindow.windowId = WINDOW_TYPES.SETTINGS;
  settingsWindow.windowType = WINDOW_TYPES.SETTINGS;

  // Register window events
  windowEventHandler.registerWindowEvents(settingsWindow, WINDOW_TYPES.SETTINGS);

  // Track window state with the window state manager
  windowStateManager.trackWindow(settingsWindow, WINDOW_TYPES.SETTINGS, WINDOW_TYPES.SETTINGS);

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

    // Untrack the window
    windowStateManager.untrackWindow(WINDOW_TYPES.SETTINGS);

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
 * Shutdown the window manager
 */
export function shutdown() {
  log.info('Shutting down window manager');

  // Close all windows
  closeAllWindows();

  // Shutdown the window state manager
  windowStateManager.shutdown();

  // Shutdown the window event handler
  windowEventHandler.shutdown();

  log.info('Window manager shut down');
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

  // Use the window communication manager instead of direct messaging
  if (windowCommunicationManager.initialized) {
    // Determine the event type from channel
    const eventType = channel.split(':')[1]; // e.g., 'window:created' -> 'created'

    // Use the right event dispatcher based on the channel
    if (channel === 'window:created' || channel === 'window:closed') {
      // For window lifecycle events, use broadcastWindowEvent
      windowCommunicationManager.broadcastWindowEvent(eventType, data.id, data);
    } else {
      // For regular messages, use broadcastMessageToAllExcept
      windowCommunicationManager.broadcastMessageToAllExcept('main', eventType, data);
    }

    return;
  }

  // Fallback to direct messaging if windowCommunicationManager not initialized
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

/**
 * Focus a window by ID
 * @param {number} id - The window ID
 * @returns {boolean} Whether the window was focused
 */
export function focusWindow(id) {
  const window = getWindowById(id);
  if (window && !window.isDestroyed()) {
    if (window.isMinimized()) {
      window.restore();
    }
    window.focus();

    log.info(`Window focused: ${id}`);
    return true;
  }
  log.warn(`Cannot focus window, not found or destroyed: ${id}`);
  return false;
}

/**
 * Minimize a window by ID
 * @param {number} id - The window ID
 * @returns {boolean} Whether the window was minimized
 */
export function minimizeWindow(id) {
  const window = getWindowById(id);
  if (window && !window.isDestroyed()) {
    window.minimize();

    log.info(`Window minimized: ${id}`);
    return true;
  }
  log.warn(`Cannot minimize window, not found or destroyed: ${id}`);
  return false;
}

/**
 * Maximize a window by ID
 * @param {number} id - The window ID
 * @returns {boolean} Whether the window was maximized
 */
export function maximizeWindow(id) {
  const window = getWindowById(id);
  if (window && !window.isDestroyed()) {
    window.maximize();

    log.info(`Window maximized: ${id}`);
    return true;
  }
  log.warn(`Cannot maximize window, not found or destroyed: ${id}`);
  return false;
}

/**
 * Restore a window by ID
 * @param {number} id - The window ID
 * @returns {boolean} Whether the window was restored
 */
export function restoreWindow(id) {
  const window = getWindowById(id);
  if (window && !window.isDestroyed()) {
    window.restore();

    log.info(`Window restored: ${id}`);
    return true;
  }
  log.warn(`Cannot restore window, not found or destroyed: ${id}`);
  return false;
}

/**
 * Set a window's position
 * @param {number} id - The window ID
 * @param {number} x - The x position
 * @param {number} y - The y position
 * @returns {boolean} Whether the window position was set
 */
export function setWindowPosition(id, x, y) {
  const window = getWindowById(id);
  if (window && !window.isDestroyed()) {
    window.setPosition(x, y);

    log.info(`Window position set: ${id}, x: ${x}, y: ${y}`);
    return true;
  }
  log.warn(`Cannot set window position, not found or destroyed: ${id}`);
  return false;
}

/**
 * Set a window's size
 * @param {number} id - The window ID
 * @param {number} width - The window width
 * @param {number} height - The window height
 * @returns {boolean} Whether the window size was set
 */
export function setWindowSize(id, width, height) {
  const window = getWindowById(id);
  if (window && !window.isDestroyed()) {
    window.setSize(width, height);

    log.info(`Window size set: ${id}, width: ${width}, height: ${height}`);
    return true;
  }
  log.warn(`Cannot set window size, not found or destroyed: ${id}`);
  return false;
}

/**
 * Arrange face panel windows in a grid layout
 * @param {Object} options - Layout options
 * @param {number} options.maxPerRow - Maximum windows per row
 * @param {number} options.spacing - Spacing between windows
 * @param {number} options.width - Width of each window
 * @param {number} options.height - Height of each window
 * @returns {boolean} Whether the layout was applied
 */
export function arrangeInGrid(options = {}) {
  const facePanels = getFacePanelWindows();
  if (facePanels.length === 0) {
    log.warn('Cannot arrange grid layout, no face panels found');
    return false;
  }

  // Default options
  const maxPerRow = options.maxPerRow || 3;
  const spacing = options.spacing || 20;
  const width = options.width || 300;
  const height = options.height || 300;

  // Get primary display dimensions
  const { width: displayWidth } = screen.getPrimaryDisplay().workAreaSize;

  // Calculate starting position (right side of screen)
  const startX = displayWidth - (width * Math.min(maxPerRow, facePanels.length)) - spacing;
  const startY = 50; // Start from top with some margin

  // Arrange windows in grid
  facePanels.forEach((window, index) => {
    const row = Math.floor(index / maxPerRow);
    const col = index % maxPerRow;

    const x = startX + (col * (width + spacing));
    const y = startY + (row * (height + spacing));

    window.setBounds({
      x,
      y,
      width,
      height
    });
  });

  log.info(`Arranged ${facePanels.length} face panels in grid layout`);

  // Notify about layout change
  broadcastWindowEvent('window:layout', {
    type: 'grid',
    count: facePanels.length
  });

  return true;
}

/**
 * Arrange face panel windows in a vertical stack
 * @param {Object} options - Layout options
 * @param {number} options.spacing - Spacing between windows
 * @param {number} options.width - Width of each window
 * @param {number} options.height - Height of each window
 * @returns {boolean} Whether the layout was applied
 */
export function arrangeInVerticalStack(options = {}) {
  const facePanels = getFacePanelWindows();
  if (facePanels.length === 0) {
    log.warn('Cannot arrange vertical stack, no face panels found');
    return false;
  }

  // Default options
  const spacing = options.spacing || 20;
  const width = options.width || 300;
  const height = options.height || 300;

  // Get primary display dimensions
  const { width: displayWidth } = screen.getPrimaryDisplay().workAreaSize;

  // Calculate starting position (right side of screen)
  const x = displayWidth - width - spacing;
  const startY = 50; // Start from top with some margin

  // Arrange windows in vertical stack
  facePanels.forEach((window, index) => {
    const y = startY + (index * (height + spacing));

    window.setBounds({
      x,
      y,
      width,
      height
    });
  });

  log.info(`Arranged ${facePanels.length} face panels in vertical stack`);

  // Notify about layout change
  broadcastWindowEvent('window:layout', {
    type: 'vertical-stack',
    count: facePanels.length
  });

  return true;
}

/**
 * Arrange face panel windows in a horizontal row
 * @param {Object} options - Layout options
 * @param {number} options.spacing - Spacing between windows
 * @param {number} options.width - Width of each window
 * @param {number} options.height - Height of each window
 * @returns {boolean} Whether the layout was applied
 */
export function arrangeInHorizontalRow(options = {}) {
  const facePanels = getFacePanelWindows();
  if (facePanels.length === 0) {
    log.warn('Cannot arrange horizontal row, no face panels found');
    return false;
  }

  // Default options
  const spacing = options.spacing || 20;
  const width = options.width || 300;
  const height = options.height || 300;

  // Get primary display dimensions
  const { width: displayWidth } = screen.getPrimaryDisplay().workAreaSize;

  // Calculate total width needed
  const totalWidth = facePanels.length * width + (facePanels.length - 1) * spacing;

  // Calculate starting position (centered)
  const startX = Math.max(0, (displayWidth - totalWidth) / 2);
  const y = 50; // Fixed Y position

  // Arrange windows in horizontal row
  facePanels.forEach((window, index) => {
    const x = startX + (index * (width + spacing));

    window.setBounds({
      x,
      y,
      width,
      height
    });
  });

  log.info(`Arranged ${facePanels.length} face panels in horizontal row`);

  // Notify about layout change
  broadcastWindowEvent('window:layout', {
    type: 'horizontal-row',
    count: facePanels.length
  });

  return true;
}

/**
 * Minimize all windows except the one with the given ID
 * @param {number} exceptId - The ID of the window to keep unminimized
 * @returns {number} The number of windows minimized
 */
export function minimizeAllExcept(exceptId) {
  let count = 0;

  for (const window of windows.values()) {
    if (window && !window.isDestroyed() && window.id !== exceptId && !window.isMinimized()) {
      window.minimize();
      count++;
    }
  }

  log.info(`Minimized ${count} windows, keeping window ${exceptId} active`);
  return count;
}

/**
 * Bring all windows to front
 * @returns {number} The number of windows brought to front
 */
export function bringAllToFront() {
  let count = 0;

  for (const window of windows.values()) {
    if (window && !window.isDestroyed()) {
      window.moveTop();
      count++;
    }
  }

  log.info(`Brought ${count} windows to front`);
  return count;
}

// Replace the setupWindowEventListeners function with a stub that delegates to WindowEventHandler
function setupWindowEventListeners(window) {
  if (!window || window.isDestroyed()) return;

  // Delegate to the window event handler
  windowEventHandler.registerWindowEvents(window, window.windowType || 'unknown');
}

export default {
  initialize,
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
  shutdown,
  WINDOW_TYPES,
  focusWindow,
  minimizeWindow,
  maximizeWindow,
  restoreWindow,
  setWindowPosition,
  setWindowSize,
  arrangeInGrid,
  arrangeInVerticalStack,
  arrangeInHorizontalRow,
  minimizeAllExcept,
  bringAllToFront
};
