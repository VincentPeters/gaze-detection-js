/**
 * Script to manually create app.asar file with all required files
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build paths
const rootDir = path.resolve(__dirname, '..');
const tempDir = path.join(rootDir, 'temp-asar');
const outDir = path.join(rootDir, 'out');

/**
 * Create a temporary directory with all files needed for the app.asar
 */
function createTempDir() {
  console.log('Creating temporary directory for app.asar...');

  // Remove existing temp directory if it exists
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // Create temp directory
  fs.mkdirSync(tempDir, { recursive: true });

  // Copy package.json
  fs.copyFileSync(
    path.join(rootDir, 'package.json'),
    path.join(tempDir, 'package.json')
  );

  // Copy src directory
  copyDirectory(
    path.join(rootDir, 'src'),
    path.join(tempDir, 'src')
  );

  // Copy dist directory
  copyDirectory(
    path.join(rootDir, 'dist'),
    path.join(tempDir, 'dist')
  );

  // Copy index.js to root of temp directory
  fs.copyFileSync(
    path.join(rootDir, 'src', 'index.js'),
    path.join(tempDir, 'index.js')
  );

  console.log('Temporary directory created successfully.');
}

/**
 * Copy a directory recursively
 * @param {string} source - Source directory
 * @param {string} destination - Destination directory
 */
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files and directories in source
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // Copy each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy directory
      copyDirectory(sourcePath, destinationPath);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

/**
 * Create app.asar from temporary directory
 * @param {string} outputPath - Path to output app.asar
 */
function createAsar(outputPath) {
  console.log(`Creating app.asar at ${outputPath}...`);

  // Create parent directory if it doesn't exist
  const parentDir = path.dirname(outputPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Create app.asar using asar CLI
  execSync(`npx asar pack "${tempDir}" "${outputPath}"`, { stdio: 'inherit' });

  console.log('app.asar created successfully.');
}

/**
 * Clean up temporary directory
 */
function cleanup() {
  console.log('Cleaning up temporary directory...');

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('Cleanup completed.');
}

/**
 * Create app.asar for a specific build
 * @param {string} buildDir - Path to build directory
 */
function createAppAsarForBuild(buildDir) {
  console.log(`Creating app.asar for build at ${buildDir}...`);

  // Path to app.asar in build directory
  const asarPath = path.join(buildDir, 'resources', 'app.asar');

  // Create temporary directory with required files
  createTempDir();

  // Create app.asar
  createAsar(asarPath);

  // Clean up
  cleanup();

  console.log(`app.asar created for build at ${buildDir}.`);
}

/**
 * Create app.asar for all Windows builds
 */
function createAppAsarForWindowsBuilds() {
  console.log('Creating app.asar for Windows builds...');

  // Find all Windows build directories
  const buildDirs = fs.readdirSync(outDir)
    .filter(dir => dir.includes('win32'))
    .map(dir => path.join(outDir, dir));

  if (buildDirs.length === 0) {
    console.error('No Windows builds found in', outDir);
    return false;
  }

  // Create app.asar for each build
  for (const buildDir of buildDirs) {
    createAppAsarForBuild(buildDir);
  }

  return true;
}

// If this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    createAppAsarForWindowsBuilds();
  } catch (error) {
    console.error('Error creating app.asar:', error.message);
    process.exit(1);
  }
}

export {
  createTempDir,
  createAsar,
  cleanup,
  createAppAsarForBuild,
  createAppAsarForWindowsBuilds,
};
