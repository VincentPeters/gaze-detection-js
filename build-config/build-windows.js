/**
 * Windows-specific build script
 * Builds and packages the application for Windows
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import verifyBuild from './verify-build.js';
import { createAppAsarForWindowsBuilds } from './create-asar.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build paths
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(rootDir, 'assets');

// Flag to skip installer creation during development
const SKIP_INSTALLER_CREATION = true;

/**
 * Ensure assets directory exists with required files
 */
function ensureAssets() {
  console.log('Ensuring assets directory exists...');

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Create icons directory
  const iconsDir = path.join(assetsDir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Check for Windows icon
  const iconPath = path.join(iconsDir, 'icon.ico');
  if (!fs.existsSync(iconPath)) {
    console.warn('Warning: Windows icon not found at', iconPath);
    console.warn('Using placeholder icon...');

    // Create a placeholder icon file if needed
    // This is just for development purposes
    // In production, you should use a proper icon
    try {
      // Copy a placeholder icon if available
      const placeholderPath = path.join(rootDir, 'public', 'favicon.ico');
      if (fs.existsSync(placeholderPath)) {
        fs.copyFileSync(placeholderPath, iconPath);
        console.log('Copied placeholder icon from', placeholderPath);
      } else {
        console.warn('No placeholder icon available. Build may fail if icon is required.');
      }
    } catch (error) {
      console.error('Error creating placeholder icon:', error.message);
    }
  }
}

/**
 * Clean output directories
 */
function cleanDirectories() {
  console.log('Cleaning output directories...');

  // Clean dist directory
  if (fs.existsSync(distDir)) {
    console.log('Cleaning dist directory...');
    execSync('npm run build -- --clean', { stdio: 'inherit' });
  }

  // Clean out directory
  if (fs.existsSync(outDir)) {
    console.log('Cleaning out directory...');
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

/**
 * Build the application
 */
function buildApp() {
  console.log('Building application...');
  execSync('npm run build', { stdio: 'inherit' });
}

/**
 * Ensure critical files are available for packaging
 */
function ensureCriticalFiles() {
  console.log('Ensuring critical files are available...');

  // Make sure index.js exists
  const indexJsPath = path.join(rootDir, 'src', 'index.js');
  if (!fs.existsSync(indexJsPath)) {
    console.error('Critical file missing:', indexJsPath);
    return false;
  }

  // Make sure package.json exists
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Critical file missing:', packageJsonPath);
    return false;
  }

  // Make sure dist/index.html exists
  const indexHtmlPath = path.join(rootDir, 'dist', 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('Critical file missing:', indexHtmlPath);
    return false;
  }

  // Make sure preload.js exists
  const preloadJsPath = path.join(rootDir, 'src', 'preload.js');
  if (!fs.existsSync(preloadJsPath)) {
    console.error('Critical file missing:', preloadJsPath);
    return false;
  }

  console.log('All critical files are available.');
  return true;
}

/**
 * Package the application for Windows
 */
function packageApp() {
  console.log('Packaging application for Windows...');

  // Set environment variables for Windows build
  process.env.TARGET_PLATFORM = 'win32';

  // Ensure critical files are available
  if (!ensureCriticalFiles()) {
    console.error('Missing critical files. Aborting packaging.');
    process.exit(1);
  }

  // Run the package command
  execSync('npm run package', { stdio: 'inherit' });

  // Create app.asar manually to ensure all required files are included
  console.log('Creating app.asar manually...');
  createAppAsarForWindowsBuilds();
}

/**
 * Create Windows installer
 */
function createInstaller() {
  console.log('Creating Windows installer...');

  // Set environment variables for Windows build
  process.env.TARGET_PLATFORM = 'win32';

  // Run the make command
  execSync('npm run make', { stdio: 'inherit' });
}

/**
 * Verify the build
 */
function verifyWindowsBuild() {
  console.log('Verifying Windows build...');

  // Find the Windows build directory
  const buildDirs = fs.readdirSync(outDir)
    .filter(dir => dir.includes('win32'))
    .map(dir => path.join(outDir, dir));

  if (buildDirs.length === 0) {
    console.error('No Windows build found in', outDir);
    return false;
  }

  // Verify each build
  let success = true;
  for (const buildDir of buildDirs) {
    const result = verifyBuild('win32', buildDir);
    success = success && result;
  }

  return success;
}

/**
 * Run the full build process
 */
async function runBuild() {
  try {
    console.log('Starting Windows build process...');

    // Ensure assets exist
    ensureAssets();

    // Clean directories
    cleanDirectories();

    // Build the application
    buildApp();

    // Package the application
    packageApp();

    // Verify the build
    const verified = verifyWindowsBuild();

    // Create installer if verification passed
    if (verified && !SKIP_INSTALLER_CREATION) {
      createInstaller();
      console.log('Windows build and packaging completed successfully!');
    } else if (verified) {
      console.log('Windows build completed successfully! Skipping installer creation for development.');
    } else {
      console.error('Windows build verification failed. Skipping installer creation.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Build process failed:', error.message);
    process.exit(1);
  }
}

// If this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBuild();
}

export {
  ensureAssets,
  cleanDirectories,
  buildApp,
  packageApp,
  createInstaller,
  verifyWindowsBuild,
  runBuild,
};
