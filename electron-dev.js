import { spawn } from 'child_process';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import electron from 'electron';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const electronProcess = spawn(electron, ['.'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        ELECTRON_IS_DEV: '1',
      },
    });

    electronProcess.on('close', () => {
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
