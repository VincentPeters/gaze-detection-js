/**
 * IPC Client for Renderer Process
 *
 * This file provides a client for IPC communication from the renderer process
 * to the main process. It handles sending requests, receiving responses,
 * and subscribing to notifications.
 */

import {
  createRequestMessage,
  createNotificationMessage,
  isSuccessResponse,
  isErrorResponse,
  getErrorFromResponse
} from '../../shared/ipc/message.js';

// Store active listeners
const listeners = new Map();

// Store pending requests
const pendingRequests = new Map();

// Generate a unique ID for this renderer
const rendererId = `renderer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Initialize the IPC client
 */
export function initialize() {
  // Check if we're running in Electron with IPC available
  if (!window.api) {
    console.error('IPC API not available. Are you running in Electron?');
    return false;
  }

  console.log('Initializing IPC client');

  // Set up error handling
  window.api.receive('app:error', (message) => {
    console.error('Received error from main process:', message);
  });

  console.log('IPC client initialized');
  return true;
}

/**
 * Send a request to the main process and get a response
 * @param {string} channel - The channel to send on
 * @param {any} payload - The payload to send
 * @param {number} [timeout=30000] - Timeout in milliseconds
 * @returns {Promise<any>} The response from the main process
 */
export async function sendRequest(channel, payload, timeout = 30000) {
  // Check if we're running in Electron with IPC available
  if (!window.api) {
    throw new Error('IPC API not available. Are you running in Electron?');
  }

  // Create a request message
  const message = createRequestMessage(
    channel,
    payload,
    rendererId,
    'main'
  );

  try {
    // Send the request and wait for a response
    const response = await Promise.race([
      window.api.invoke(channel, message),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout);
      })
    ]);

    // Check if the response is an error
    if (isErrorResponse(response)) {
      const error = getErrorFromResponse(response);
      throw new Error(error.message);
    }

    // Return the response data
    return response.payload.data;
  } catch (error) {
    console.error(`Error sending request on channel ${channel}:`, error);
    throw error;
  }
}

/**
 * Send a notification to the main process
 * @param {string} channel - The channel to send on
 * @param {any} payload - The payload to send
 */
export function sendNotification(channel, payload) {
  // Check if we're running in Electron with IPC available
  if (!window.api) {
    console.error('IPC API not available. Are you running in Electron?');
    return;
  }

  // Create a notification message
  const message = createNotificationMessage(
    channel,
    payload,
    rendererId,
    'main'
  );

  try {
    // Send the notification
    window.api.send(channel, message);
  } catch (error) {
    console.error(`Error sending notification on channel ${channel}:`, error);
  }
}

/**
 * Subscribe to notifications on a channel
 * @param {string} channel - The channel to subscribe to
 * @param {Function} callback - The callback function
 * @returns {Function} A function to unsubscribe
 */
export function subscribe(channel, callback) {
  // Check if we're running in Electron with IPC available
  if (!window.api) {
    console.error('IPC API not available. Are you running in Electron?');
    return () => {};
  }

  // Create a listener function
  const listener = (message) => {
    try {
      // Call the callback with the payload
      callback(message.payload);
    } catch (error) {
      console.error(`Error in listener for channel ${channel}:`, error);
    }
  };

  // Store the listener
  if (!listeners.has(channel)) {
    listeners.set(channel, new Set());
  }

  listeners.get(channel).add(listener);

  // Register the listener with the IPC API
  window.api.receive(channel, listener);

  // Return a function to unsubscribe
  return () => {
    // Remove the listener
    if (listeners.has(channel)) {
      listeners.get(channel).delete(listener);

      // If there are no more listeners for this channel, remove the channel
      if (listeners.get(channel).size === 0) {
        listeners.delete(channel);
      }
    }

    // Unregister the listener with the IPC API
    if (window.api.removeListener) {
      window.api.removeListener(channel, listener);
    }
  };
}

/**
 * Get the ID of this renderer process
 * @returns {string} The renderer ID
 */
export function getRendererID() {
  return rendererId;
}

/**
 * Check if the IPC client is available
 * @returns {boolean} Whether the IPC client is available
 */
export function isAvailable() {
  return !!window.api;
}

/**
 * Shutdown the IPC client
 */
export function shutdown() {
  console.log('Shutting down IPC client');

  // Unsubscribe from all channels
  listeners.forEach((listenerSet, channel) => {
    listenerSet.forEach(listener => {
      if (window.api && window.api.removeListener) {
        window.api.removeListener(channel, listener);
      }
    });
  });

  // Clear all listeners
  listeners.clear();

  console.log('IPC client shut down');
}

// Export the IPC client
export default {
  initialize,
  sendRequest,
  sendNotification,
  subscribe,
  getRendererID,
  isAvailable,
  shutdown
};
