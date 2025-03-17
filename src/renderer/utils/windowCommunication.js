/**
 * Window Communication Utilities for Renderer Process
 *
 * Provides utilities for renderer processes to communicate with each other
 * via the main process. Handles message sending, receiving, and state synchronization.
 */

// Event listeners for different message types
const messageListeners = new Map();
// Event listeners for state changes
const stateChangeListeners = new Map();
// Event listeners for window events
const windowEventListeners = new Map();
// Pending request promises
const pendingRequests = new Map();

// Generate a unique ID for requests
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initialize window communication
 * @returns {Object} Communication API
 */
export function initWindowCommunication() {
  // Set up listeners for incoming messages
  window.api.receive('window:message', handleWindowMessage);
  window.api.receive('window:state-sync', handleStateSync);
  window.api.receive('window:event', handleWindowEvent);

  // Request initial state sync
  requestStateSync(['app', 'camera', 'detection', 'media']);

  return {
    // Send a message to a specific window
    sendMessage,
    // Send a message to all windows
    broadcastMessage,
    // Synchronize state with other windows
    syncState,
    // Request state sync from the main process
    requestStateSync,
    // Add a listener for messages
    addMessageListener,
    // Remove a message listener
    removeMessageListener,
    // Add a listener for state changes
    addStateChangeListener,
    // Remove a state change listener
    removeStateChangeListener,
    // Add a listener for window events
    addWindowEventListener,
    // Remove a window event listener
    removeWindowEventListener
  };
}

/**
 * Handle incoming window messages
 * @param {Object} message - The IPC message
 */
function handleWindowMessage(message) {
  const { messageType, data, sourceId } = message.payload;

  // Check if this is a response to a pending request
  if (messageType === 'sync-response' && data.requestId) {
    const { requestId, stateData } = data;
    const resolver = pendingRequests.get(requestId);

    if (resolver) {
      resolver(stateData);
      pendingRequests.delete(requestId);
    }
    return;
  }

  // Notify all listeners for this message type
  const listeners = messageListeners.get(messageType) || [];
  listeners.forEach(listener => {
    try {
      listener(data, sourceId);
    } catch (error) {
      console.error(`Error in message listener for ${messageType}:`, error);
    }
  });
}

/**
 * Handle state synchronization messages
 * @param {Object} message - The IPC message
 */
function handleStateSync(message) {
  const { domain, key, value, source } = message.payload;

  // Notify all listeners for this domain and key
  const domainListeners = stateChangeListeners.get(domain) || new Map();

  // Call listeners for specific key
  const keyListeners = domainListeners.get(key) || [];
  keyListeners.forEach(listener => {
    try {
      listener(value, domain, key, source);
    } catch (error) {
      console.error(`Error in state change listener for ${domain}.${key}:`, error);
    }
  });

  // Call listeners for entire domain
  const allKeyListeners = domainListeners.get('*') || [];
  allKeyListeners.forEach(listener => {
    try {
      listener(value, domain, key, source);
    } catch (error) {
      console.error(`Error in state change listener for ${domain}.*:`, error);
    }
  });
}

/**
 * Handle window event messages
 * @param {Object} message - The IPC message
 */
function handleWindowEvent(message) {
  const { eventType, windowId, data } = message.payload;

  // Notify all listeners for this event type
  const listeners = windowEventListeners.get(eventType) || [];
  listeners.forEach(listener => {
    try {
      listener(windowId, data, eventType);
    } catch (error) {
      console.error(`Error in window event listener for ${eventType}:`, error);
    }
  });

  // Also notify wildcard listeners
  const wildcardListeners = windowEventListeners.get('*') || [];
  wildcardListeners.forEach(listener => {
    try {
      listener(windowId, data, eventType);
    } catch (error) {
      console.error(`Error in wildcard window event listener:`, error);
    }
  });
}

/**
 * Send a message to a specific window
 * @param {string|number} targetWindowId - The target window ID
 * @param {string} messageType - The message type
 * @param {any} data - The message data
 * @returns {Promise<boolean>} Whether the message was sent successfully
 */
export async function sendMessage(targetWindowId, messageType, data) {
  try {
    const response = await window.api.invoke('window:message', {
      targetWindowId,
      messageType,
      data
    });

    return response.success;
  } catch (error) {
    console.error(`Error sending message to window ${targetWindowId}:`, error);
    return false;
  }
}

/**
 * Broadcast a message to all windows
 * @param {string} messageType - The message type
 * @param {any} data - The message data
 * @returns {Promise<boolean>} Whether the message was sent successfully
 */
export async function broadcastMessage(messageType, data) {
  return sendMessage('all', messageType, data);
}

/**
 * Synchronize state with other windows
 * @param {string} domain - The state domain
 * @param {string} key - The state key
 * @param {any} value - The state value
 * @returns {Promise<boolean>} Whether the state was synchronized successfully
 */
export async function syncState(domain, key, value) {
  try {
    const response = await window.api.invoke('window:state-sync', {
      domain,
      key,
      value
    });

    return response.success;
  } catch (error) {
    console.error(`Error synchronizing state ${domain}.${key}:`, error);
    return false;
  }
}

/**
 * Request state sync from main process
 * @param {Array<string>} domains - The domains to sync
 * @returns {Promise<Object>} The synced state data
 */
export async function requestStateSync(domains) {
  try {
    const requestId = generateRequestId();

    // Create a promise that will be resolved when the response is received
    const responsePromise = new Promise((resolve, reject) => {
      // Set a timeout to reject the promise if no response is received
      const timeout = setTimeout(() => {
        pendingRequests.delete(requestId);
        reject(new Error('State sync request timed out'));
      }, 5000);

      // Store the resolver with timeout cleanup
      pendingRequests.set(requestId, (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    // Send the request
    await window.api.invoke('window:request-sync', {
      domains,
      requestId
    });

    // Wait for the response
    return await responsePromise;
  } catch (error) {
    console.error(`Error requesting state sync:`, error);
    return null;
  }
}

/**
 * Add a listener for window messages
 * @param {string} messageType - The message type to listen for
 * @param {Function} listener - The listener function (data, sourceId) => void
 * @returns {Function} A function to remove the listener
 */
export function addMessageListener(messageType, listener) {
  if (!messageListeners.has(messageType)) {
    messageListeners.set(messageType, []);
  }

  messageListeners.get(messageType).push(listener);

  return () => removeMessageListener(messageType, listener);
}

/**
 * Remove a message listener
 * @param {string} messageType - The message type
 * @param {Function} listener - The listener function to remove
 */
export function removeMessageListener(messageType, listener) {
  if (!messageListeners.has(messageType)) return;

  const listeners = messageListeners.get(messageType);
  const index = listeners.indexOf(listener);

  if (index !== -1) {
    listeners.splice(index, 1);
  }

  if (listeners.length === 0) {
    messageListeners.delete(messageType);
  }
}

/**
 * Add a listener for state changes
 * @param {string} domain - The state domain to listen for
 * @param {string} key - The state key to listen for (use '*' for all keys)
 * @param {Function} listener - The listener function (value, domain, key, source) => void
 * @returns {Function} A function to remove the listener
 */
export function addStateChangeListener(domain, key, listener) {
  if (!stateChangeListeners.has(domain)) {
    stateChangeListeners.set(domain, new Map());
  }

  const domainListeners = stateChangeListeners.get(domain);

  if (!domainListeners.has(key)) {
    domainListeners.set(key, []);
  }

  domainListeners.get(key).push(listener);

  return () => removeStateChangeListener(domain, key, listener);
}

/**
 * Remove a state change listener
 * @param {string} domain - The state domain
 * @param {string} key - The state key
 * @param {Function} listener - The listener function to remove
 */
export function removeStateChangeListener(domain, key, listener) {
  if (!stateChangeListeners.has(domain)) return;

  const domainListeners = stateChangeListeners.get(domain);
  if (!domainListeners.has(key)) return;

  const listeners = domainListeners.get(key);
  const index = listeners.indexOf(listener);

  if (index !== -1) {
    listeners.splice(index, 1);
  }

  if (listeners.length === 0) {
    domainListeners.delete(key);
  }

  if (domainListeners.size === 0) {
    stateChangeListeners.delete(domain);
  }
}

/**
 * Add a listener for window events
 * @param {string} eventType - The event type to listen for (use '*' for all events)
 * @param {Function} listener - The listener function (windowId, data, eventType) => void
 * @returns {Function} A function to remove the listener
 */
export function addWindowEventListener(eventType, listener) {
  if (!windowEventListeners.has(eventType)) {
    windowEventListeners.set(eventType, []);
  }

  windowEventListeners.get(eventType).push(listener);

  return () => removeWindowEventListener(eventType, listener);
}

/**
 * Remove a window event listener
 * @param {string} eventType - The event type
 * @param {Function} listener - The listener function to remove
 */
export function removeWindowEventListener(eventType, listener) {
  if (!windowEventListeners.has(eventType)) return;

  const listeners = windowEventListeners.get(eventType);
  const index = listeners.indexOf(listener);

  if (index !== -1) {
    listeners.splice(index, 1);
  }

  if (listeners.length === 0) {
    windowEventListeners.delete(eventType);
  }
}

export default {
  initWindowCommunication,
  sendMessage,
  broadcastMessage,
  syncState,
  requestStateSync,
  addMessageListener,
  removeMessageListener,
  addStateChangeListener,
  removeStateChangeListener,
  addWindowEventListener,
  removeWindowEventListener
};
