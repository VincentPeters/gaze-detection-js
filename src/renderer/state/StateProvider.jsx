/**
 * State Provider Component
 *
 * This component provides application state to all child components
 * through React Context.
 */

import React, { createContext, useContext } from 'react';
import useAppState from './useAppState.js';
import useCameraState from './useCameraState.js';
import useDetectionState from './useDetectionState.js';
import useMediaState from './useMediaState.js';

// Create contexts for each state domain
const AppStateContext = createContext(null);
const CameraStateContext = createContext(null);
const DetectionStateContext = createContext(null);
const MediaStateContext = createContext(null);

/**
 * State Provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} - The component
 */
export function StateProvider({ children }) {
  // Initialize state hooks
  const appState = useAppState();
  const cameraState = useCameraState();
  const detectionState = useDetectionState();
  const mediaState = useMediaState();

  return (
    <AppStateContext.Provider value={appState}>
      <CameraStateContext.Provider value={cameraState}>
        <DetectionStateContext.Provider value={detectionState}>
          <MediaStateContext.Provider value={mediaState}>
            {children}
          </MediaStateContext.Provider>
        </DetectionStateContext.Provider>
      </CameraStateContext.Provider>
    </AppStateContext.Provider>
  );
}

/**
 * Hook to use app state
 * @returns {Object} - App state and methods
 */
export function useAppStateContext() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppStateContext must be used within a StateProvider');
  }
  return context;
}

/**
 * Hook to use camera state
 * @returns {Object} - Camera state and methods
 */
export function useCameraStateContext() {
  const context = useContext(CameraStateContext);
  if (!context) {
    throw new Error('useCameraStateContext must be used within a StateProvider');
  }
  return context;
}

/**
 * Hook to use detection state
 * @returns {Object} - Detection state and methods
 */
export function useDetectionStateContext() {
  const context = useContext(DetectionStateContext);
  if (!context) {
    throw new Error('useDetectionStateContext must be used within a StateProvider');
  }
  return context;
}

/**
 * Hook to use media state
 * @returns {Object} - Media state and methods
 */
export function useMediaStateContext() {
  const context = useContext(MediaStateContext);
  if (!context) {
    throw new Error('useMediaStateContext must be used within a StateProvider');
  }
  return context;
}

export default StateProvider;
