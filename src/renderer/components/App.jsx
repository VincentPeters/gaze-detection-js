/**
 * Main Application Component
 *
 * This is the root component for the React application in the renderer process.
 * It handles the main UI layout and communication with the main process.
 */

import React, { useState, useEffect } from 'react';

/**
 * App component
 * @returns {JSX.Element} The rendered component
 */
function App() {
  // State for storing messages from the main process
  const [message, setMessage] = useState('Initializing...');
  // State for tracking connection status
  const [connected, setConnected] = useState(false);

  // Effect for setting up IPC communication
  useEffect(() => {
    // Check if we're running in Electron with IPC available
    if (window.api) {
      // Set up listener for messages from the main process
      const handleMessage = (data) => {
        setMessage(data);
        setConnected(true);
      };

      // Register the listener
      window.api.receive('fromMain', handleMessage);

      // Send a message to the main process to establish connection
      window.api.send('toMain', 'Hello from renderer process');

      // Clean up the listener when the component unmounts
      return () => {
        // If we had a removeListener method in our API
        if (window.api.removeListener) {
          window.api.removeListener('fromMain', handleMessage);
        }
      };
    } else {
      // We're not in Electron or IPC is not available
      setMessage('Welcome to Gaze Detection (IPC not available)');
      setConnected(false);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Eye Contact Detection</h1>
        <p className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Connected to main process' : 'Not connected to main process'}
        </p>
      </header>

      <main className="app-content">
        <p>Welcome to the eye contact detection application.</p>
        <p>This application will use your webcam to detect eye contact.</p>
        <p className="message">{message}</p>
      </main>

      <footer className="app-footer">
        <p>Gaze Detection Application</p>
      </footer>
    </div>
  );
}

export default App;
