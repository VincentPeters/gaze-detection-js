/**
 * Window State Manager
 *
 * Manages the persistence and restoration of window positions, sizes, and states
 * for all application windows. Ensures window states are preserved between sessions
 * and provides validation for saved states to handle display configuration changes.
 */

import { screen } from 'electron';
import stateStore from '../state/store.js';
import logger from '../../utils/logger/index.js';

// Create a logger for the window state manager
const log = logger.createLogger('WindowStateManager');

// The default window state values
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 768;
const DEFAULT_FACE_PANEL_WIDTH = 300;
const DEFAULT_FACE_PANEL_HEIGHT = 300;
const DEFAULT_SETTINGS_WIDTH = 600;
const DEFAULT_SETTINGS_HEIGHT = 500;

// Key for storing window states in the state store
const STATE_DOMAIN = 'windows';

/**
 * Window State Manager class
 */
class WindowStateManager {
  constructor() {
    this.initialized = false;
    this.stateCache = new Map();
  }

  /**
   * Initialize the window state manager
   */
  initialize() {
    if (this.initialized) return;

    log.info('Initializing window state manager');

    // Attempt to load saved window states
    this.loadAllStates();

    // Register for display change events to validate window positions
    this.registerDisplayHandlers();

    this.initialized = true;
    log.info('Window state manager initialized');
  }

  /**
   * Register handlers for display changes
   */
  registerDisplayHandlers() {
    screen.on('display-added', () => this.validateAllWindowStates());
    screen.on('display-removed', () => this.validateAllWindowStates());
    screen.on('display-metrics-changed', () => this.validateAllWindowStates());
  }

  /**
   * Load all window states from the state store
   */
  loadAllStates() {
    try {
      const states = stateStore.getState(STATE_DOMAIN) || {};

      // Cache the states in memory for faster access
      Object.keys(states).forEach(windowId => {
        this.stateCache.set(windowId, states[windowId]);
      });

      log.info(`Loaded ${this.stateCache.size} window states from store`);
    } catch (error) {
      log.error('Failed to load window states:', error);
    }
  }

  /**
   * Save all window states to the state store
   */
  saveAllStates() {
    try {
      // Collect all states from cache
      const states = {};
      this.stateCache.forEach((state, windowId) => {
        states[windowId] = state;
      });

      // Save to the state store
      stateStore.setState(STATE_DOMAIN, null, states);

      log.info(`Saved ${this.stateCache.size} window states to store`);
    } catch (error) {
      log.error('Failed to save window states:', error);
    }
  }

  /**
   * Get a window state by ID
   * @param {string} windowId - The window ID
   * @param {string} windowType - The window type
   * @returns {Object} The window state
   */
  getState(windowId, windowType) {
    // First check the cache
    if (this.stateCache.has(windowId)) {
      return this.validateWindowState(this.stateCache.get(windowId), windowType);
    }

    // If not in cache, use default state based on window type
    return this.getDefaultState(windowType);
  }

  /**
   * Set a window state by ID
   * @param {string} windowId - The window ID
   * @param {Object} state - The window state
   */
  setState(windowId, state) {
    if (!windowId || !state) {
      log.warn('Invalid window ID or state');
      return;
    }

    // Update cache
    this.stateCache.set(windowId, state);

    // Periodically save to disk
    this.debouncedSave();
  }

  /**
   * Debounced save to avoid excessive disk writes
   */
  debouncedSave = (() => {
    let timeout = null;
    return () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.saveAllStates();
        timeout = null;
      }, 1000); // 1 second debounce
    };
  })();

  /**
   * Validate all window states against current display configuration
   */
  validateAllWindowStates() {
    try {
      let updated = false;

      // Validate each cached state
      this.stateCache.forEach((state, windowId) => {
        const validatedState = this.validateWindowState(state, state.windowType);

        // If validation changed anything, update the cache
        if (JSON.stringify(validatedState) !== JSON.stringify(state)) {
          this.stateCache.set(windowId, validatedState);
          updated = true;
        }
      });

      // Save if any states were updated
      if (updated) {
        log.info('Display configuration changed, updated window states');
        this.saveAllStates();
      }
    } catch (error) {
      log.error('Error validating window states:', error);
    }
  }

  /**
   * Validate a window state against current display configuration
   * @param {Object} state - The window state to validate
   * @param {string} windowType - The window type
   * @returns {Object} The validated window state
   */
  validateWindowState(state, windowType) {
    // Clone the state to avoid modifying the original
    const validatedState = { ...state };

    if (!validatedState) {
      return this.getDefaultState(windowType);
    }

    // Get available displays
    const displays = screen.getAllDisplays();

    // Ensure width and height are valid
    validatedState.width = Math.max(validatedState.width || 0,
                                    this.getMinWidth(windowType));
    validatedState.height = Math.max(validatedState.height || 0,
                                     this.getMinHeight(windowType));

    // Only validate position if x and y are set
    if (validatedState.x !== undefined && validatedState.y !== undefined) {
      let positionIsValid = false;

      // Check if the position is visible on any display
      for (const display of displays) {
        const { bounds } = display;

        // Check if at least part of the window is visible on this display
        if (validatedState.x < bounds.x + bounds.width &&
            validatedState.x + validatedState.width > bounds.x &&
            validatedState.y < bounds.y + bounds.height &&
            validatedState.y + validatedState.height > bounds.y) {
          positionIsValid = true;
          break;
        }
      }

      // If position is not valid, remove it to allow auto-centering
      if (!positionIsValid) {
        log.info(`Window position (${validatedState.x}, ${validatedState.y}) is off-screen, resetting`);
        delete validatedState.x;
        delete validatedState.y;
      }
    }

    return validatedState;
  }

  /**
   * Get the default state for a window type
   * @param {string} windowType - The window type
   * @returns {Object} The default window state
   */
  getDefaultState(windowType) {
    switch (windowType) {
      case 'main':
        return {
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          isMaximized: false,
          windowType: 'main'
        };
      case 'face-panel':
        return {
          width: DEFAULT_FACE_PANEL_WIDTH,
          height: DEFAULT_FACE_PANEL_HEIGHT,
          isMaximized: false,
          windowType: 'face-panel'
        };
      case 'settings':
        return {
          width: DEFAULT_SETTINGS_WIDTH,
          height: DEFAULT_SETTINGS_HEIGHT,
          isMaximized: false,
          windowType: 'settings'
        };
      default:
        log.warn(`Unknown window type: ${windowType}, using generic defaults`);
        return {
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          isMaximized: false,
          windowType: windowType || 'unknown'
        };
    }
  }

  /**
   * Get the minimum width for a window type
   * @param {string} windowType - The window type
   * @returns {number} The minimum width
   */
  getMinWidth(windowType) {
    switch (windowType) {
      case 'main':
        return 800;
      case 'face-panel':
        return 200;
      case 'settings':
        return 400;
      default:
        return 200;
    }
  }

  /**
   * Get the minimum height for a window type
   * @param {string} windowType - The window type
   * @returns {number} The minimum height
   */
  getMinHeight(windowType) {
    switch (windowType) {
      case 'main':
        return 600;
      case 'face-panel':
        return 200;
      case 'settings':
        return 300;
      default:
        return 200;
    }
  }

  /**
   * Track window state changes
   * @param {Electron.BrowserWindow} window - The electron window
   * @param {string} windowId - The window ID
   * @param {string} windowType - The window type
   */
  trackWindow(window, windowId, windowType) {
    if (!window || window.isDestroyed()) {
      log.warn('Cannot track destroyed or null window');
      return;
    }

    log.info(`Tracking window state: ${windowId} (${windowType})`);

    // Initial state, either from cache or default
    const initialState = this.getState(windowId, windowType);

    // Track save events to update state
    const saveState = () => {
      if (window.isDestroyed() || window.isMinimized()) return;

      const isMaximized = window.isMaximized();
      const bounds = window.getBounds();

      const state = {
        width: bounds.width,
        height: bounds.height,
        isMaximized,
        windowType
      };

      // Only save position if window is not maximized
      if (!isMaximized) {
        state.x = bounds.x;
        state.y = bounds.y;
      }

      this.setState(windowId, state);
    };

    // Set up event listeners
    window.on('resize', saveState);
    window.on('move', saveState);
    window.on('close', saveState);

    // Apply the initial state to the window if needed
    this.applyStateToWindow(window, initialState);

    return initialState;
  }

  /**
   * Apply a state to a window
   * @param {Electron.BrowserWindow} window - The electron window
   * @param {Object} state - The window state
   */
  applyStateToWindow(window, state) {
    if (!window || window.isDestroyed() || !state) return;

    try {
      // Apply position and size
      if (state.x !== undefined && state.y !== undefined) {
        window.setBounds({
          x: state.x,
          y: state.y,
          width: state.width,
          height: state.height
        });
      } else {
        // Just set size if no position
        window.setSize(state.width, state.height);
      }

      // Apply maximized state if needed
      if (state.isMaximized) {
        window.maximize();
      }
    } catch (error) {
      log.error('Error applying window state:', error);
    }
  }

  /**
   * Remove a window from tracking
   * @param {string} windowId - The window ID
   */
  untrackWindow(windowId) {
    // Remove from cache
    this.stateCache.delete(windowId);

    // Save changes to storage
    this.debouncedSave();

    log.info(`Untracked window: ${windowId}`);
  }

  /**
   * Shutdown the window state manager
   */
  shutdown() {
    log.info('Shutting down window state manager');

    // Save any pending states
    this.saveAllStates();

    // Clear cache
    this.stateCache.clear();

    this.initialized = false;
    log.info('Window state manager shut down');
  }
}

// Export a singleton instance
export default new WindowStateManager();
