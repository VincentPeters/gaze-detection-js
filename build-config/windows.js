/**
 * Windows-specific build configuration
 */
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  // Windows-specific packager options
  packagerConfig: {
    icon: path.resolve(__dirname, '../assets/icons/icon.ico'),
    executableName: 'GazeDetection',
    win32metadata: {
      CompanyName: 'Gaze Detection Team',
      FileDescription: 'Eye Contact Detection Application',
      OriginalFilename: 'GazeDetection.exe',
      ProductName: 'Gaze Detection',
      InternalName: 'GazeDetection',
    },
  },

  // Windows-specific maker options
  makerConfig: {
    name: '@electron-forge/maker-squirrel',
    config: {
      name: 'GazeDetection',
      authors: 'Gaze Detection Team',
      exe: 'GazeDetection.exe',
      noMsi: false,
      setupExe: 'GazeDetectionSetup.exe',
      setupIcon: path.resolve(__dirname, '../assets/icons/icon.ico'),
      iconUrl: 'https://raw.githubusercontent.com/yourusername/gaze-detection/main/assets/icons/icon.ico',
      loadingGif: path.resolve(__dirname, '../assets/icons/loading.gif'),
    },
  },

  // Windows-specific build hooks
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      console.log(`Windows-specific post-copy tasks for ${arch}`);
      // Add any Windows-specific post-copy tasks here
    },
  },
};
