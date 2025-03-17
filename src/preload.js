/**
 * Preload Script
 *
 * This script runs in the renderer process before the web content begins loading.
 * It provides a secure bridge between the renderer process and the main process.
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * List of valid IPC channels for sending messages to the main process
 */
const validSendChannels = [
  'toMain',
  // Add more channels as needed for specific features
];

/**
 * List of valid IPC channels for receiving messages from the main process
 */
const validReceiveChannels = [
  'fromMain',
  // Add more channels as needed for specific features
];

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
  }
});
