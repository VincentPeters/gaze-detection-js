import React, { useState, useEffect } from 'react';

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    // Example of IPC communication with Electron main process
    if (window.api) {
      window.api.receive('fromMain', data => {
        setMessage(data);
      });

      window.api.send('toMain', 'Hello from React!');
    } else {
      // For testing or non-Electron environments
      setMessage('Welcome to Gaze Detection');
    }
  }, []);

  return (
    <div className="app">
      <h1>Eye Contact Detection</h1>
      <p>Welcome to the eye contact detection application.</p>
      <p>This application will use your webcam to detect eye contact.</p>
      <p>{message}</p>
    </div>
  );
}

export default App;
