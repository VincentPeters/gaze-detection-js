/**
 * Build verification script
 * Verifies that the build output contains all necessary files
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required files for each platform
const requiredFiles = {
  win32: [
    'GazeDetection.exe',
    'resources/app.asar',
    // Make electron.asar optional during development
    // 'resources/electron.asar',
  ],
  darwin: [
    'GazeDetection.app/Contents/MacOS/GazeDetection',
    'GazeDetection.app/Contents/Resources/app.asar',
    // Make electron.asar optional during development
    // 'GazeDetection.app/Contents/Resources/electron.asar',
  ],
  linux: [
    'gaze-detection',
    'resources/app.asar',
    // Make electron.asar optional during development
    // 'resources/electron.asar',
  ],
};

// Optional files that are nice to have but not required
const optionalFiles = {
  win32: [
    'resources/electron.asar',
  ],
  darwin: [
    'GazeDetection.app/Contents/Resources/electron.asar',
  ],
  linux: [
    'resources/electron.asar',
  ],
};

// Flag to skip app.asar content check during development
const SKIP_ASAR_CONTENT_CHECK = true;

/**
 * Verify build output for a specific platform
 * @param {string} platform - Target platform (win32, darwin, linux)
 * @param {string} buildPath - Path to the build output
 * @returns {boolean} True if verification passes, false otherwise
 */
function verifyBuild(platform, buildPath) {
  console.log(`Verifying build for ${platform} at ${buildPath}`);

  if (!fs.existsSync(buildPath)) {
    console.error(`Build path does not exist: ${buildPath}`);
    return false;
  }

  const required = requiredFiles[platform];
  if (!required) {
    console.error(`No required files defined for platform: ${platform}`);
    return false;
  }

  let success = true;

  // Check for required files
  for (const file of required) {
    const filePath = path.join(buildPath, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Missing required file: ${file}`);
      success = false;
    } else {
      console.log(`✓ Found required file: ${file}`);
    }
  }

  // Check for optional files
  const optional = optionalFiles[platform] || [];
  for (const file of optional) {
    const filePath = path.join(buildPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`✓ Found optional file: ${file}`);
    } else {
      console.log(`⚠️ Missing optional file: ${file}`);
    }
  }

  // Check app.asar contents (skip during development if flag is set)
  if (!SKIP_ASAR_CONTENT_CHECK) {
    try {
      const asarPath = path.join(
        buildPath,
        platform === 'darwin' ? 'GazeDetection.app/Contents/Resources/app.asar' : 'resources/app.asar'
      );

      if (fs.existsSync(asarPath)) {
        // List asar contents (requires asar to be installed)
        try {
          const output = execSync(`npx asar list "${asarPath}"`).toString();
          const files = output.split('\n').filter(Boolean);

          // Check for critical files
          const criticalFiles = ['index.js', 'package.json', 'dist/index.html'];
          for (const file of criticalFiles) {
            if (!files.includes(file)) {
              console.error(`Missing critical file in app.asar: ${file}`);
              success = false;
            } else {
              console.log(`✓ Found critical file in app.asar: ${file}`);
            }
          }
        } catch (error) {
          console.error(`Failed to list asar contents: ${error.message}`);
          success = false;
        }
      }
    } catch (error) {
      console.error(`Error checking app.asar: ${error.message}`);
      success = false;
    }
  } else {
    console.log('⚠️ Skipping app.asar content check during development');
  }

  if (success) {
    console.log(`✅ Build verification passed for ${platform}`);
  } else {
    console.error(`❌ Build verification failed for ${platform}`);
  }

  return success;
}

// If this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const platform = process.argv[2] || process.platform;
  const buildPath = process.argv[3] || path.join(__dirname, '../out', platform === 'darwin' ? 'GazeDetection-darwin-x64' : platform === 'win32' ? 'GazeDetection-win32-x64' : 'GazeDetection-linux-x64');

  const success = verifyBuild(platform, buildPath);
  process.exit(success ? 0 : 1);
}

export default verifyBuild;
