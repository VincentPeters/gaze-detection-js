/**
 * Application State Hook
 *
 * This hook provides access to application state from the main process.
 * It handles fetching state, subscribing to updates, and making changes.
 */

import { useState, useEffect, useCallback } from 'react';
import ipcClient from '../ipc/ipcClient.js';

/**
 * Hook for accessing main process state
 * @param {string} domain - The state domain
 * @param {string} [key] - The state key (optional)
 * @returns {[any, Function, boolean, Error]} - [state value, update function, loading state, error]
 */
export function useMainProcessState(domain, key) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to update state in the main process
  const updateState = useCallback(async (newValue) => {
    try {
      setLoading(true);
      await ipcClient.sendRequest('state:set', { domain, key, value: newValue });
      setValue(newValue);
      setError(null);
      return true;
    } catch (err) {
      console.error(`Failed to update state ${domain}.${key}:`, err);
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [domain, key]);

  // Fetch initial state and subscribe to updates
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;

    const fetchState = async () => {
      try {
        setLoading(true);
        const result = await ipcClient.sendRequest('state:get', { domain, key });
        if (isMounted) {
          setValue(result);
          setError(null);
        }
      } catch (err) {
        console.error(`Failed to get state ${domain}.${key}:`, err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Subscribe to state updates
    unsubscribe = ipcClient.subscribe('state:update', (payload) => {
      if (payload.domain === domain && payload.key === key) {
        if (isMounted) {
          setValue(payload.value);
          setLoading(false);
          setError(null);
        }
      }
    });

    // Fetch initial state
    fetchState();

    // Cleanup
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [domain, key]);

  return [value, updateState, loading, error];
}

/**
 * Hook for accessing application state
 * @returns {Object} - Application state and methods
 */
export function useAppState() {
  const [isReady, setIsReady] = useMainProcessState('app', 'isReady');
  const [theme, setTheme] = useMainProcessState('app', 'theme');
  const [errors, setErrors] = useMainProcessState('app', 'errors');

  // Derived state and methods
  const addError = useCallback((error) => {
    if (errors) {
      setErrors([...errors, error]);
    }
  }, [errors, setErrors]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, [setErrors]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return {
    isReady,
    theme,
    errors,
    setIsReady,
    setTheme,
    toggleTheme,
    addError,
    clearErrors
  };
}

export default useAppState;
