/**
 * Detection State Hook
 *
 * This hook provides access to detection state from the main process.
 * It handles fetching state, subscribing to updates, and making changes.
 */

import { useCallback } from 'react';
import { useMainProcessState } from './useAppState.js';
import ipcClient from '../ipc/ipcClient.js';

/**
 * Hook for accessing detection state
 * @returns {Object} - Detection state and methods
 */
export function useDetectionState() {
  const [isActive, setIsActive] = useMainProcessState('detection', 'isActive');
  const [faceDetection, setFaceDetection] = useMainProcessState('detection', 'faceDetection');
  const [eyeContact, setEyeContact] = useMainProcessState('detection', 'eyeContact');
  const [results, setResults] = useMainProcessState('detection', 'results');

  // Method to start detection
  const startDetection = useCallback(async () => {
    try {
      await ipcClient.sendRequest('detection:start', {});
      setIsActive(true);
      return true;
    } catch (error) {
      console.error('Failed to start detection:', error);
      return false;
    }
  }, [setIsActive]);

  // Method to stop detection
  const stopDetection = useCallback(async () => {
    try {
      await ipcClient.sendRequest('detection:stop', {});
      setIsActive(false);
      return true;
    } catch (error) {
      console.error('Failed to stop detection:', error);
      return false;
    }
  }, [setIsActive]);

  // Method to update face detection settings
  const updateFaceDetectionSettings = useCallback(async (settings) => {
    try {
      const updatedSettings = {
        ...faceDetection,
        settings: {
          ...faceDetection.settings,
          ...settings
        }
      };

      await ipcClient.sendRequest('detection:settings', {
        type: 'face',
        settings: updatedSettings.settings
      });

      setFaceDetection(updatedSettings);
      return true;
    } catch (error) {
      console.error('Failed to update face detection settings:', error);
      return false;
    }
  }, [faceDetection, setFaceDetection]);

  // Method to update eye contact detection settings
  const updateEyeContactSettings = useCallback(async (settings) => {
    try {
      const updatedSettings = {
        ...eyeContact,
        settings: {
          ...eyeContact.settings,
          ...settings
        }
      };

      await ipcClient.sendRequest('detection:settings', {
        type: 'eyeContact',
        settings: updatedSettings.settings
      });

      setEyeContact(updatedSettings);
      return true;
    } catch (error) {
      console.error('Failed to update eye contact settings:', error);
      return false;
    }
  }, [eyeContact, setEyeContact]);

  // Method to toggle face detection
  const toggleFaceDetection = useCallback(async () => {
    try {
      const newIsActive = !faceDetection.isActive;

      await ipcClient.sendRequest('detection:toggle', {
        type: 'face',
        isActive: newIsActive
      });

      setFaceDetection({
        ...faceDetection,
        isActive: newIsActive
      });

      return true;
    } catch (error) {
      console.error('Failed to toggle face detection:', error);
      return false;
    }
  }, [faceDetection, setFaceDetection]);

  // Method to toggle eye contact detection
  const toggleEyeContactDetection = useCallback(async () => {
    try {
      const newIsActive = !eyeContact.isActive;

      await ipcClient.sendRequest('detection:toggle', {
        type: 'eyeContact',
        isActive: newIsActive
      });

      setEyeContact({
        ...eyeContact,
        isActive: newIsActive
      });

      return true;
    } catch (error) {
      console.error('Failed to toggle eye contact detection:', error);
      return false;
    }
  }, [eyeContact, setEyeContact]);

  return {
    isActive,
    faceDetection,
    eyeContact,
    results,
    startDetection,
    stopDetection,
    updateFaceDetectionSettings,
    updateEyeContactSettings,
    toggleFaceDetection,
    toggleEyeContactDetection
  };
}

export default useDetectionState;
