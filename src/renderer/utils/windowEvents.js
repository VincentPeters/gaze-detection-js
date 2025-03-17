/**
 * Window Events Utility for Renderer Process
 *
 * Provides utilities for renderer processes to handle window events
 * and respond appropriately.
 */

import { windowCommunication } from './windowCommunication.js';

// Store event listeners
const eventListeners = new Map();

/**
 * Initialize window events handling
 * @returns {Object} Window events API
 */
export function initWindowEvents() {
  // Set up the communication first if not already set up
  const communication = typeof windowCommunication.initWindowCommunication === 'function'
    ? windowCommunication.initWindowCommunication()
    : windowCommunication;

  // Register listeners for window events
  communication.addWindowEventListener('*', handleWindowEvent);

  // Register for specific window lifecycle events
  setupLifecycleEvents(communication);

  // Register for window focus/blur events
  setupFocusEvents(communication);

  // Register for size and position events
  setupPositionEvents(communication);

  // Register for fullscreen events
  setupFullscreenEvents(communication);

  // Register for display change events
  setupDisplayEvents(communication);

  return {
    // Add a listener for a specific window event
    addEventListener,
    // Remove a listener for a specific window event
    removeEventListener,
    // Emit a window event (for local testing/simulation)
    emitEvent,
    // Get window information
    getWindowInfo
  };
}

/**
 * Handle a window event
 * @param {number} windowId - The ID of the window that triggered the event
 * @param {Object} data - Event data
 * @param {string} eventType - The event type
 */
function handleWindowEvent(windowId, data, eventType) {
  // Get listeners for this event type
  const listeners = eventListeners.get(eventType) || [];

  // Call each listener
  listeners.forEach(listener => {
    try {
      listener(windowId, data, eventType);
    } catch (error) {
      console.error(`Error in window event listener for ${eventType}:`, error);
    }
  });
}

/**
 * Set up lifecycle event handling
 * @param {Object} communication - The window communication API
 */
function setupLifecycleEvents(communication) {
  // Handle window creation
  communication.addWindowEventListener('created', (windowId, data) => {
    console.log(`Window created: ${windowId}`, data);
    emitEvent('window-created', windowId, data);
  });

  // Handle window closure
  communication.addWindowEventListener('closed', (windowId, data) => {
    console.log(`Window closed: ${windowId}`, data);
    emitEvent('window-closed', windowId, data);
  });

  // Handle window ready
  communication.addWindowEventListener('ready', (windowId) => {
    console.log(`Window ready: ${windowId}`);
    emitEvent('window-ready', windowId, {});
  });

  // Handle title changes
  communication.addWindowEventListener('title-change', (windowId, data) => {
    console.log(`Window title changed: ${windowId}`, data);
    emitEvent('title-change', windowId, data);
  });

  // Handle DOM ready events
  communication.addWindowEventListener('dom-ready', (windowId) => {
    console.log(`Window DOM ready: ${windowId}`);
    emitEvent('dom-ready', windowId, {});
  });

  // Handle page load events
  communication.addWindowEventListener('loaded', (windowId) => {
    console.log(`Window loaded: ${windowId}`);
    emitEvent('window-loaded', windowId, {});
  });
}

/**
 * Set up focus event handling
 * @param {Object} communication - The window communication API
 */
function setupFocusEvents(communication) {
  // Handle focus events
  communication.addWindowEventListener('focus', (windowId) => {
    console.log(`Window focused: ${windowId}`);
    emitEvent('window-focus', windowId, {});

    // Update the document class to show focused state
    document.body.classList.add('window-focused');
    document.body.classList.remove('window-blurred');
  });

  // Handle blur events
  communication.addWindowEventListener('blur', (windowId) => {
    console.log(`Window blurred: ${windowId}`);
    emitEvent('window-blur', windowId, {});

    // Update the document class to show blurred state
    document.body.classList.add('window-blurred');
    document.body.classList.remove('window-focused');
  });
}

/**
 * Set up position and size event handling
 * @param {Object} communication - The window communication API
 */
function setupPositionEvents(communication) {
  // Handle resize events
  communication.addWindowEventListener('resize', (windowId, data) => {
    console.log(`Window resized: ${windowId}`, data);
    emitEvent('window-resize', windowId, data);

    // Update CSS variables with window dimensions
    document.documentElement.style.setProperty('--window-width', `${data.width}px`);
    document.documentElement.style.setProperty('--window-height', `${data.height}px`);
  });

  // Handle move events
  communication.addWindowEventListener('move', (windowId, data) => {
    console.log(`Window moved: ${windowId}`, data);
    emitEvent('window-move', windowId, data);
  });

  // Handle maximize events
  communication.addWindowEventListener('maximize', (windowId) => {
    console.log(`Window maximized: ${windowId}`);
    emitEvent('window-maximize', windowId, {});

    // Update the document class to show maximized state
    document.body.classList.add('window-maximized');
    document.body.classList.remove('window-unmaximized');
  });

  // Handle unmaximize events
  communication.addWindowEventListener('unmaximize', (windowId) => {
    console.log(`Window unmaximized: ${windowId}`);
    emitEvent('window-unmaximize', windowId, {});

    // Update the document class to show unmaximized state
    document.body.classList.add('window-unmaximized');
    document.body.classList.remove('window-maximized');
  });

  // Handle minimize events
  communication.addWindowEventListener('minimize', (windowId) => {
    console.log(`Window minimized: ${windowId}`);
    emitEvent('window-minimize', windowId, {});

    // Update the document class to show minimized state
    document.body.classList.add('window-minimized');
  });

  // Handle restore events
  communication.addWindowEventListener('restore', (windowId) => {
    console.log(`Window restored: ${windowId}`);
    emitEvent('window-restore', windowId, {});

    // Update the document class to show restored state
    document.body.classList.remove('window-minimized');
  });
}

/**
 * Set up fullscreen event handling
 * @param {Object} communication - The window communication API
 */
function setupFullscreenEvents(communication) {
  // Handle enter fullscreen
  communication.addWindowEventListener('enter-fullscreen', (windowId) => {
    console.log(`Window entered fullscreen: ${windowId}`);
    emitEvent('enter-fullscreen', windowId, {});

    // Update the document class to show fullscreen state
    document.body.classList.add('fullscreen');
  });

  // Handle leave fullscreen
  communication.addWindowEventListener('leave-fullscreen', (windowId) => {
    console.log(`Window left fullscreen: ${windowId}`);
    emitEvent('leave-fullscreen', windowId, {});

    // Update the document class to show non-fullscreen state
    document.body.classList.remove('fullscreen');
  });

  // Handle enter HTML fullscreen
  communication.addWindowEventListener('enter-html-fullscreen', (windowId) => {
    console.log(`Window entered HTML fullscreen: ${windowId}`);
    emitEvent('enter-html-fullscreen', windowId, {});

    // Update the document class to show HTML fullscreen state
    document.body.classList.add('html-fullscreen');
  });

  // Handle leave HTML fullscreen
  communication.addWindowEventListener('leave-html-fullscreen', (windowId) => {
    console.log(`Window left HTML fullscreen: ${windowId}`);
    emitEvent('leave-html-fullscreen', windowId, {});

    // Update the document class to show non-HTML-fullscreen state
    document.body.classList.remove('html-fullscreen');
  });
}

/**
 * Set up display change event handling
 * @param {Object} communication - The window communication API
 */
function setupDisplayEvents(communication) {
  // Handle display change events
  communication.addWindowEventListener('display-change', (windowId, data) => {
    console.log(`Display change: ${data.changeType}`, data.display);
    emitEvent('display-change', windowId, data);
  });
}

/**
 * Add an event listener for a window event
 * @param {string} eventType - The event type to listen for
 * @param {Function} listener - The listener function
 * @returns {Function} A function to remove the listener
 */
export function addEventListener(eventType, listener) {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, []);
  }

  eventListeners.get(eventType).push(listener);

  return () => removeEventListener(eventType, listener);
}

/**
 * Remove an event listener
 * @param {string} eventType - The event type
 * @param {Function} listener - The listener function to remove
 */
export function removeEventListener(eventType, listener) {
  if (!eventListeners.has(eventType)) return;

  const listeners = eventListeners.get(eventType);
  const index = listeners.indexOf(listener);

  if (index !== -1) {
    listeners.splice(index, 1);
  }

  if (listeners.length === 0) {
    eventListeners.delete(eventType);
  }
}

/**
 * Emit a window event (for local testing/simulation)
 * @param {string} eventType - The event type
 * @param {number} windowId - The window ID
 * @param {Object} data - Event data
 */
export function emitEvent(eventType, windowId, data) {
  const listeners = eventListeners.get(eventType) || [];

  listeners.forEach(listener => {
    try {
      listener(windowId, data, eventType);
    } catch (error) {
      console.error(`Error in window event listener for ${eventType}:`, error);
    }
  });
}

/**
 * Get information about the current window
 * @returns {Object} Window information
 */
export function getWindowInfo() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMaximized: document.body.classList.contains('window-maximized'),
    isMinimized: document.body.classList.contains('window-minimized'),
    isFullscreen: document.body.classList.contains('fullscreen') || document.body.classList.contains('html-fullscreen'),
    isFocused: document.body.classList.contains('window-focused')
  };
}

// Create and export the default instance
const windowEvents = {
  initWindowEvents,
  addEventListener,
  removeEventListener,
  emitEvent,
  getWindowInfo
};

export default windowEvents;
