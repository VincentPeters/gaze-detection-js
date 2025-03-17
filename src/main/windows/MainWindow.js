/**
 * Main Application Window
 *
 * This class manages the creation and behavior of the main application window.
 * It handles window configuration, state persistence, and lifecycle events.
 */

import { BrowserWindow, app, shell, Menu, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
import logger from '../../utils/logger/index.js';
import stateStore from '../state/store.js';
import keyboardShortcutManager from './KeyboardShortcutManager.js';
import { URL } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a logger for the main window
const log = logger.createLogger('MainWindow');

class MainWindow {
  constructor() {
    this.window = null;
    this.windowState = this.loadWindowState();
  }

  /**
   * Load saved window state from state store
   * @returns {Object} Window state (position, size)
   */
  loadWindowState() {
    try {
      const savedState = stateStore.getState('mainWindow') || {};
      return {
        width: savedState.width || 1024,
        height: savedState.height || 768,
        x: savedState.x,
        y: savedState.y,
        isMaximized: savedState.isMaximized || false
      };
    } catch (error) {
      log.error('Failed to load window state:', error);
      return {
        width: 1024,
        height: 768,
        isMaximized: false
      };
    }
  }

  /**
   * Save the current window state to state store
   */
  saveWindowState() {
    if (!this.window || this.window.isDestroyed()) return;

    try {
      // Don't overwrite position when window is minimized
      if (this.window.isMinimized()) return;

      const isMaximized = this.window.isMaximized();
      const bounds = this.window.getBounds();

      stateStore.setState('mainWindow', 'width', bounds.width);
      stateStore.setState('mainWindow', 'height', bounds.height);
      stateStore.setState('mainWindow', 'isMaximized', isMaximized);

      // Only save position if window is not maximized
      if (!isMaximized) {
        stateStore.setState('mainWindow', 'x', bounds.x);
        stateStore.setState('mainWindow', 'y', bounds.y);
      }

      log.debug('Saved window state');
    } catch (error) {
      log.error('Failed to save window state:', error);
    }
  }

  /**
   * Create the main application window
   * @returns {BrowserWindow} The created window
   */
  create() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.focus();
      return this.window;
    }

    log.info('Creating main window');

    // Get the preload script path - use the CommonJS version
    const preloadPath = path.join(path.dirname(path.dirname(__dirname)), 'preload.cjs');
    log.info(`Using preload script at: ${preloadPath}`);

    // Configure window options
    const windowOptions = {
      width: this.windowState.width,
      height: this.windowState.height,
      minWidth: 800,
      minHeight: 600,
      show: false, // We'll show it once it's ready
      title: app.getName(),
      backgroundColor: '#2e2c29', // Prevents white flash during startup
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        enableRemoteModule: false,
        spellcheck: false,
        // Additional security options
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
      // Set icon based on platform
      icon: process.platform === 'linux'
        ? path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'assets/icons/png/512x512.png')
        : undefined
    };

    // Set initial position if saved
    if (this.windowState.x !== undefined && this.windowState.y !== undefined) {
      windowOptions.x = this.windowState.x;
      windowOptions.y = this.windowState.y;
    } else {
      // Center window if no saved position
      windowOptions.center = true;
    }

    // Create the browser window
    this.window = new BrowserWindow(windowOptions);

    // Add event listeners
    this.setupEventListeners();

    // Set up application menu
    this.setupApplicationMenu();

    // Register keyboard shortcuts
    this.registerKeyboardShortcuts();

    // Load the application
    this.loadApp();

    // If window should be maximized (from saved state)
    if (this.windowState.isMaximized) {
      this.window.maximize();
    }

    // Show the window when ready
    this.window.once('ready-to-show', () => {
      this.window.show();
      this.window.focus();
    });

    return this.window;
  }

  /**
   * Set up event listeners for the window
   */
  setupEventListeners() {
    if (!this.window) return;

    // Save window state when it's resized or moved
    this.window.on('resize', () => this.saveWindowState());
    this.window.on('move', () => this.saveWindowState());

    // Handle window close event
    this.window.on('close', (event) => {
      // Save window state before closing
      this.saveWindowState();

      // Example: You could intercept the close event if needed
      // if (needsConfirmation) {
      //   event.preventDefault();
      //   // Show confirmation dialog
      // }
    });

    // Handle window closed event
    this.window.on('closed', () => {
      this.window = null;
    });

    // Open external links in default browser
    this.window.webContents.setWindowOpenHandler(({ url }) => {
      // Only allow specific protocol links to be opened externally
      if (url.startsWith('https:') || url.startsWith('http:')) {
        shell.openExternal(url);
      }
      // Prevent creating new windows from within the app
      return { action: 'deny' };
    });

    // Prevent navigation to unknown protocols or origins
    this.window.webContents.on('will-navigate', (event, url) => {
      const parsedUrl = new URL(url);
      // Only allow navigation within our app or to known domains
      if (isDev) {
        if (!parsedUrl.host.includes('localhost')) {
          event.preventDefault();
        }
      } else {
        // In production, prevent all navigation
        event.preventDefault();
      }
    });
  }

  /**
   * Set up the application menu
   */
  setupApplicationMenu() {
    // Create a basic menu with common functionality
    const menuTemplate = [
      // App menu (macOS only)
      ...(process.platform === 'darwin' ? [{
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }] : []),
      // File menu
      {
        label: 'File',
        submenu: [
          {
            label: 'Settings',
            click: () => {
              // Emit event to show settings
              if (this.window && !this.window.isDestroyed()) {
                this.window.webContents.send('menu:open-settings');
              }
            }
          },
          { type: 'separator' },
          process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
        ]
      },
      // Edit menu
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          ...(process.platform === 'darwin' ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
          ] : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
        ]
      },
      // View menu
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          ...(isDev ? [{ role: 'toggleDevTools' }] : []),
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      // Window menu
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(process.platform === 'darwin' ? [
            { type: 'separator' },
            { role: 'front' },
          ] : [
            { role: 'close' }
          ])
        ]
      },
      // Help menu
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: () => {
              if (this.window && !this.window.isDestroyed()) {
                this.window.webContents.send('menu:about');
              }
            }
          },
          ...(isDev ? [{ type: 'separator' },
          {
            label: 'Developer Tools',
            click: () => {
              if (this.window && !this.window.isDestroyed()) {
                this.window.webContents.toggleDevTools();
              }
            }
          }] : [])
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
  }

  /**
   * Register keyboard shortcuts
   */
  registerKeyboardShortcuts() {
    if (!this.window) return;

    // Register application-wide shortcuts
    keyboardShortcutManager.registerShortcuts(this.window);
  }

  /**
   * Load the application in the window
   */
  loadApp() {
    if (!this.window || this.window.isDestroyed()) return;

    if (isDev) {
      // In development, load from Vite dev server
      this.window.loadURL('http://localhost:5173');
      // Open DevTools in development
      if (isDev) {
        this.window.webContents.openDevTools();
      }
      log.info('Loaded main window from dev server');
    } else {
      // In production, load the built HTML file
      const distPath = path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'dist/index.html');
      this.window.loadFile(distPath);
      log.info('Loaded main window from production build');
    }
  }

  /**
   * Get the BrowserWindow instance
   * @returns {BrowserWindow|null} The window instance or null if not created
   */
  getWindow() {
    return this.window;
  }

  /**
   * Close the window
   */
  close() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
  }
}

export default MainWindow;
