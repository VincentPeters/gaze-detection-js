/**
 * Renderer Process Entry Point
 *
 * This is the entry point for the Electron renderer process.
 * It initializes the React application and sets up IPC communication.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import './assets/styles/index.css';
import { StateProvider } from './state/StateProvider';
import ipcClient from './ipc/ipcClient';

/**
 * Initialize the renderer process
 */
function initializeRenderer() {
  // Initialize the IPC client
  if (!ipcClient.initialize()) {
    console.error('Failed to initialize IPC client');
    // Display an error message to the user
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; text-align: center;">
        <h1>Error</h1>
        <p>Failed to initialize IPC client. The application may not function correctly.</p>
      </div>
    `;
    return;
  }

  // Create the root element for React
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  // Create a React root
  const root = ReactDOM.createRoot(rootElement);

  // Render the App component wrapped in the StateProvider
  root.render(
    <React.StrictMode>
      <StateProvider>
        <App />
      </StateProvider>
    </React.StrictMode>
  );

  // Set up error handling for the renderer process
  window.addEventListener('error', (event) => {
    console.error('Uncaught error in renderer process:', event.error);
    // In a production app, you might want to display an error UI
    // and/or report the error to the main process
    if (ipcClient.isAvailable()) {
      ipcClient.sendNotification('log:message', {
        level: 'error',
        text: 'Uncaught error in renderer process',
        meta: {
          message: event.error.message,
          stack: event.error.stack
        }
      });
    }
  });

  // Clean up when the window is closed
  window.addEventListener('beforeunload', () => {
    // Shutdown the IPC client
    ipcClient.shutdown();
    console.log('Renderer process shutting down');
  });

  // Log that the renderer has initialized
  console.log('Renderer process initialized');
}

// Initialize the renderer process
initializeRenderer();
