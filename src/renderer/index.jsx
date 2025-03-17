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

/**
 * Initialize the renderer process
 */
function initializeRenderer() {
  // Create the root element for React
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  // Create a React root
  const root = ReactDOM.createRoot(rootElement);

  // Render the App component
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Set up error handling for the renderer process
  window.addEventListener('error', (event) => {
    console.error('Uncaught error in renderer process:', event.error);
    // In a production app, you might want to display an error UI
    // and/or report the error to the main process
  });

  // Log that the renderer has initialized
  console.log('Renderer process initialized');
}

// Initialize the renderer process
initializeRenderer();
