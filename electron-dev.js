const { spawn } = require('child_process');
const { createServer } = require('vite');
const path = require('path');
const electronPath = require('electron');

async function startDev() {
  // Start Vite dev server
  const vite = await createServer({
    configFile: path.resolve(__dirname, 'vite.config.js'),
  });

  await vite.listen();
  console.log('Vite dev server started at http://localhost:5173');

  // Wait a bit for Vite to initialize
  setTimeout(() => {
    // Start Electron
    const electron = spawn(electronPath, ['.'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        ELECTRON_IS_DEV: '1',
      },
    });

    electron.on('close', () => {
      // Kill Vite when Electron closes
      vite.close();
      process.exit();
    });
  }, 2000);
}

startDev().catch(err => {
  console.error('Error starting development environment:', err);
  process.exit(1);
});