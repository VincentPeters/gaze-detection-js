/**
 * Main Application Component
 *
 * This is the root component for the React application in the renderer process.
 * It handles the main UI layout and communication with the main process.
 */

import React, { useEffect } from 'react';
import { useAppStateContext } from '../state/StateProvider';

/**
 * App component
 * @returns {JSX.Element} The rendered component
 */
function App() {
  // Get app state from context
  const { isReady, theme, errors, addError } = useAppStateContext();

  // Effect for handling errors
  useEffect(() => {
    // Set up global error handler
    const handleError = (error) => {
      addError({
        message: error.message,
        timestamp: new Date().toISOString(),
        stack: error.stack
      });
    };

    // Add error event listener
    window.addEventListener('error', handleError);

    // Clean up
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [addError]);

  return (
    <div className={`app ${theme}`}>
      <header className="app-header">
        <h1>Eye Contact Detection</h1>
        <p className={`connection-status ${isReady ? 'connected' : 'disconnected'}`}>
          {isReady ? 'Application Ready' : 'Initializing...'}
        </p>
      </header>

      <main className="app-content">
        <p>Welcome to the eye contact detection application.</p>
        <p>This application will use your webcam to detect eye contact.</p>

        {/* Display errors if any */}
        {errors && errors.length > 0 && (
          <div className="error-container">
            <h3>Errors:</h3>
            <ul>
              {errors.map((error, index) => (
                <li key={index} className="error-message">
                  {error.message} - {error.timestamp}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Gaze Detection Application</p>
      </footer>
    </div>
  );
}

export default App;
