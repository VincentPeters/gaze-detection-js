/**
 * Media Capture State Hook
 *
 * This hook provides access to media capture state from the main process.
 * It handles fetching state, subscribing to updates, and making changes.
 */

import { useCallback } from 'react';
import { useMainProcessState } from './useAppState.js';
import ipcClient from '../ipc/ipcClient.js';

/**
 * Hook for accessing media capture state
 * @returns {Object} - Media capture state and methods
 */
export function useMediaState() {
  const [isRecording, setIsRecording] = useMainProcessState('media', 'isRecording');
  const [captureCount, setCaptureCount] = useMainProcessState('media', 'captureCount');
  const [storage, setStorage] = useMainProcessState('media', 'storage');

  // Method to start recording
  const startRecording = useCallback(async () => {
    try {
      await ipcClient.sendRequest('media:startRecording', {});
      setIsRecording(true);
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }, [setIsRecording]);

  // Method to stop recording
  const stopRecording = useCallback(async () => {
    try {
      const result = await ipcClient.sendRequest('media:stopRecording', {});
      setIsRecording(false);
      return result.filePath;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }, [setIsRecording]);

  // Method to capture a screenshot
  const captureScreenshot = useCallback(async () => {
    try {
      const result = await ipcClient.sendRequest('media:captureScreenshot', {});
      setCaptureCount(prev => (prev || 0) + 1);
      return result.filePath;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return null;
    }
  }, [setCaptureCount]);

  // Method to update storage settings
  const updateStorageSettings = useCallback(async (newSettings) => {
    try {
      const updatedSettings = { ...storage, ...newSettings };
      await ipcClient.sendRequest('media:updateStorage', { settings: updatedSettings });
      setStorage(updatedSettings);
      return true;
    } catch (error) {
      console.error('Failed to update storage settings:', error);
      return false;
    }
  }, [storage, setStorage]);

  // Method to open the storage directory
  const openStorageDirectory = useCallback(async () => {
    try {
      await ipcClient.sendRequest('media:openStorageDirectory', {});
      return true;
    } catch (error) {
      console.error('Failed to open storage directory:', error);
      return false;
    }
  }, []);

  return {
    isRecording,
    captureCount,
    storage,
    startRecording,
    stopRecording,
    captureScreenshot,
    updateStorageSettings,
    openStorageDirectory
  };
}

export default useMediaState;
