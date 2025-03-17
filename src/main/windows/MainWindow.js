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
import windowStateManager from './WindowStateManager.js';
import { URL } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a logger for the main window
const log = logger.createLogger('MainWindow');

class MainWindow {
  constructor() {
    this.window = null;
    // Note: actual window state will be managed by WindowStateManager
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

    // Get window state from WindowStateManager
    const windowState = windowStateManager.getState('main', 'main');

    // Get the preload script path - use the CommonJS version
    const preloadPath = path.join(path.dirname(path.dirname(__dirname)), 'preload.cjs');
    log.info(`Using preload script at: ${preloadPath}`);

    // Configure window options
    const windowOptions = {
      width: windowState.width,
      height: windowState.height,
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
    if (windowState.x !== undefined && windowState.y !== undefined) {
      windowOptions.x = windowState.x;
      windowOptions.y = windowState.y;
    } else {
      // Center window if no saved position
      windowOptions.center = true;
    }

    // Create the browser window
    this.window = new BrowserWindow(windowOptions);

    // Let WindowStateManager track this window
    // Note: window manager will also do this, but we want to ensure it's tracked here too
    windowStateManager.trackWindow(this.window, 'main', 'main');

    // Add event listeners
    this.setupEventListeners();

    // Set up application menu
    this.setupApplicationMenu();

    // Register keyboard shortcuts
    this.registerKeyboardShortcuts();

    // Load the application
    this.loadApp();

    // If window should be maximized (from saved state)
    if (windowState.isMaximized) {
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

    // Handle window close event
    this.window.on('close', (event) => {
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
          { role: 'paste' }
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
            { type: 'separator' },
            { role: 'window' }
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
              // Emit event to show about dialog
              if (this.window && !this.window.isDestroyed()) {
                this.window.webContents.send('menu:open-about');
              }
            }
          },
          ...(isDev ? [
            { type: 'separator' },
            {
              label: 'Toggle Developer Tools',
              accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
              click: () => {
                if (this.window && !this.window.isDestroyed()) {
                  this.window.webContents.toggleDevTools();
                }
              }
            }
          ] : [])
        ]
      }
    ];

    // Build the menu and apply it
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
  }

  /**
   * Register keyboard shortcuts
   */
  registerKeyboardShortcuts() {
    // Use the correct method name from KeyboardShortcutManager
    keyboardShortcutManager.registerShortcuts(this.window);
  }

  /**
   * Load the application content
   */
  loadApp() {
    // Load the app from the appropriate location
    if (isDev) {
      // In development, load from Vite dev server
      this.window.loadURL('http://localhost:5173');
      // Open developer tools
      this.window.webContents.openDevTools();
      log.info('Loaded main window from dev server');
    } else {
      // In production, load the built HTML file
      this.window.loadFile(
        path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'dist/index.html')
      );
      log.info('Loaded main window from production build');
    }
  }

  /**
   * Get the window
   * @returns {BrowserWindow|null} The window or null if it doesn't exist
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
