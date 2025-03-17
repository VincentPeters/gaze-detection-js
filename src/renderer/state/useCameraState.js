/**
 * Camera State Hook
 *
 * This hook provides access to camera state from the main process.
 * It handles fetching state, subscribing to updates, and making changes.
 */

import { useCallback } from 'react';
import { useMainProcessState } from './useAppState.js';
import ipcClient from '../ipc/ipcClient.js';

/**
 * Hook for accessing camera state
 * @returns {Object} - Camera state and methods
 */
export function useCameraState() {
  const [devices, setDevices] = useMainProcessState('camera', 'devices');
  const [selectedDevice, setSelectedDevice] = useMainProcessState('camera', 'selectedDevice');
  const [status, setStatus] = useMainProcessState('camera', 'status');
  const [settings, setSettings] = useMainProcessState('camera', 'settings');

  // Method to list available cameras
  const listCameras = useCallback(async () => {
    try {
      const result = await ipcClient.sendRequest('camera:list', {});
      if (result && result.cameras) {
        setDevices(result.cameras);
      }
      return result.cameras || [];
    } catch (error) {
      console.error('Failed to list cameras:', error);
      return [];
    }
  }, [setDevices]);

  // Method to select a camera
  const selectCamera = useCallback(async (deviceId) => {
    try {
      setStatus('changing');
      await ipcClient.sendRequest('camera:select', { deviceId });
      setSelectedDevice(deviceId);
      setStatus('active');
      return true;
    } catch (error) {
      console.error('Failed to select camera:', error);
      setStatus('error');
      return false;
    }
  }, [setSelectedDevice, setStatus]);

  // Method to start the camera
  const startCamera = useCallback(async () => {
    if (!selectedDevice) {
      console.error('No camera selected');
      return false;
    }

    try {
      setStatus('starting');
      await ipcClient.sendRequest('camera:start', { deviceId: selectedDevice });
      setStatus('active');
      return true;
    } catch (error) {
      console.error('Failed to start camera:', error);
      setStatus('error');
      return false;
    }
  }, [selectedDevice, setStatus]);

  // Method to stop the camera
  const stopCamera = useCallback(async () => {
    try {
      setStatus('stopping');
      await ipcClient.sendRequest('camera:stop', {});
      setStatus('idle');
      return true;
    } catch (error) {
      console.error('Failed to stop camera:', error);
      setStatus('error');
      return false;
    }
  }, [setStatus]);

  // Method to update camera settings
  const updateSettings = useCallback(async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await ipcClient.sendRequest('camera:settings', { settings: updatedSettings });
      setSettings(updatedSettings);
      return true;
    } catch (error) {
      console.error('Failed to update camera settings:', error);
      return false;
    }
  }, [settings, setSettings]);

  return {
    devices,
    selectedDevice,
    status,
    settings,
    listCameras,
    selectCamera,
    startCamera,
    stopCamera,
    updateSettings
  };
}

export default useCameraState;
