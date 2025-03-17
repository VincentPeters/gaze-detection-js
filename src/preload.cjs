/**
 * Preload Script (CommonJS Version)
 *
 * This script runs in the renderer process before the web content begins loading.
 * It provides a secure bridge between the renderer process and the main process.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Define the valid channels directly in this file to avoid import issues
const PUBLIC_CHANNELS = [
  'app:ready',
  'app:error',
  'camera:list',
  'detection:face:found',
  'detection:eye-contact:detected',
  'config:get',
  'log:message',
  // Add basic communication channels
  'fromMain',
  'toMain'
];

const PROTECTED_CHANNELS = [
  'window:create',
  'window:close',
  'camera:start',
  'camera:stop',
  'camera:frame',
  'detection:start',
  'detection:stop',
  'config:update',
  'media:capture-screenshot',
  'media:start-recording',
  'media:stop-recording'
];

// Define which processes can send/receive on which channels
const SENDERS = {
  'renderer': [
    'window:create',
    'window:close',
    'camera:list',
    'config:get',
    'log:message',
    'toMain' // Add toMain to allowed sender channels
  ],
  'all': [
    'window:close',
    'camera:list',
    'config:get',
    'log:message',
    'toMain' // Add toMain to allowed sender channels
  ]
};

const RECEIVERS = {
  'renderer': [
    'app:ready',
    'app:error',
    'camera:frame',
    'detection:face:found',
    'detection:eye-contact:detected',
    'fromMain' // Add fromMain to allowed receiver channels
  ],
  'all': [
    'app:ready',
    'app:error',
    'detection:face:found',
    'detection:eye-contact:detected',
    'fromMain' // Add fromMain to allowed receiver channels
  ]
};

/**
 * Check if a channel can be sent on from a given sender
 * @param {string} channel - The channel name
 * @param {string} sender - The sender identifier
 * @returns {boolean} - Whether the sender can send on this channel
 */
function canSend(channel, sender) {
  if (sender === 'main') return true; // Main process can send on any channel
  return SENDERS[sender] && SENDERS[sender].includes(channel);
}

/**
 * Check if a channel can be received by a given receiver
 * @param {string} channel - The channel name
 * @param {string} receiver - The receiver identifier
 * @returns {boolean} - Whether the receiver can receive on this channel
 */
function canReceive(channel, receiver) {
  if (receiver === 'main') return true; // Main process can receive on any channel
  return RECEIVERS[receiver] && RECEIVERS[receiver].includes(channel);
}

// Get all channels that the renderer can use
const validSendChannels = [
  ...PUBLIC_CHANNELS,
  ...PROTECTED_CHANNELS
].filter(channel => canSend(channel, 'renderer'));

// Get all channels that the renderer can receive on
const validReceiveChannels = [
  ...PUBLIC_CHANNELS,
  ...PROTECTED_CHANNELS
].filter(channel => canReceive(channel, 'renderer'));

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('api', {
  /**
   * Send a message to the main process
   * @param {string} channel - The IPC channel to use
   * @param {any} data - The data to send
   */
  send: (channel, data) => {
    // Only allow sending to whitelisted channels
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.error(`Attempted to send on non-whitelisted channel: ${channel}`);
    }
  },

  /**
   * Receive a message from the main process
   * @param {string} channel - The IPC channel to listen on
   * @param {Function} func - The callback function
   */
  receive: (channel, func) => {
    // Only allow receiving from whitelisted channels
    if (validReceiveChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    } else {
      console.error(`Attempted to receive on non-whitelisted channel: ${channel}`);
    }
  },

  /**
   * Invoke a method in the main process and receive a response
   * @param {string} channel - The IPC channel to use
   * @param {any} data - The data to send
   * @returns {Promise<any>} - The response from the main process
   */
  invoke: async (channel, data) => {
    // Only allow invoking on whitelisted channels
    if (validSendChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    } else {
      console.error(`Attempted to invoke on non-whitelisted channel: ${channel}`);
      return Promise.reject(new Error(`Unauthorized channel: ${channel}`));
    }
  },

  /**
   * Remove a listener for a specific channel
   * @param {string} channel - The IPC channel
   * @param {Function} func - The callback function to remove
   */
  removeListener: (channel, func) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    } else {
      console.error(`Attempted to remove listener from non-whitelisted channel: ${channel}`);
    }
  },

  /**
   * Get all valid send channels
   * @returns {string[]} - Array of valid send channel names
   */
  getValidSendChannels: () => [...validSendChannels],

  /**
   * Get all valid receive channels
   * @returns {string[]} - Array of valid receive channel names
   */
  getValidReceiveChannels: () => [...validReceiveChannels],

  /**
   * Check if a channel is valid for sending
   * @param {string} channel - The channel name to check
   * @returns {boolean} - Whether the channel is valid for sending
   */
  isValidSendChannel: (channel) => validSendChannels.includes(channel),

  /**
   * Check if a channel is valid for receiving
   * @param {string} channel - The channel name to check
   * @returns {boolean} - Whether the channel is valid for receiving
   */
  isValidReceiveChannel: (channel) => validReceiveChannels.includes(channel)
});
