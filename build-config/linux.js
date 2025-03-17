/**
 * Linux-specific build configuration
 */
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  // Linux-specific packager options
  packagerConfig: {
    icon: path.resolve(__dirname, '../assets/icons/icon.png'),
    executableName: 'gaze-detection',
  },

  // Linux-specific maker options
  makerConfigs: [
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Gaze Detection Team',
          homepage: 'https://github.com/yourusername/gaze-detection',
          icon: path.resolve(__dirname, '../assets/icons/icon.png'),
          categories: ['Utility', 'Video'],
          section: 'utils',
          depends: ['libgtk-3-0', 'libnotify4', 'libnss3', 'libxss1', 'libxtst6', 'xdg-utils'],
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'Gaze Detection Team',
          homepage: 'https://github.com/yourusername/gaze-detection',
          icon: path.resolve(__dirname, '../assets/icons/icon.png'),
          categories: ['Utility', 'Video'],
          requires: ['libXScrnSaver', 'libnotify', 'nss'],
        },
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['linux'],
    },
  ],

  // Linux-specific build hooks
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      console.log(`Linux-specific post-copy tasks for ${arch}`);
      // Add any Linux-specific post-copy tasks here
    },
  },
};
