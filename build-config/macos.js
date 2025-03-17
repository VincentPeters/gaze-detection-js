/**
 * macOS-specific build configuration
 */
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  // macOS-specific packager options
  packagerConfig: {
    icon: path.resolve(__dirname, '../assets/icons/icon.icns'),
    appBundleId: 'com.gazedetection.app',
    appCategoryType: 'public.app-category.utilities',
    darwinDarkModeSupport: true,
    osxSign: {
      identity: process.env.APPLE_IDENTITY,
      hardenedRuntime: true,
      entitlements: path.resolve(__dirname, '../entitlements.plist'),
      'entitlements-inherit': path.resolve(__dirname, '../entitlements.plist'),
      'signature-flags': 'library',
    },
    osxNotarize: process.env.APPLE_ID && {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
  },

  // macOS-specific maker options
  makerConfig: {
    name: '@electron-forge/maker-dmg',
    config: {
      format: 'ULFO',
      name: 'GazeDetection',
      icon: path.resolve(__dirname, '../assets/icons/icon.icns'),
      background: path.resolve(__dirname, '../assets/icons/dmg-background.png'),
      contents: [
        {
          x: 410,
          y: 150,
          type: 'link',
          path: '/Applications',
        },
        {
          x: 130,
          y: 150,
          type: 'file',
        },
      ],
      window: {
        size: {
          width: 540,
          height: 380,
        },
      },
    },
  },

  // macOS-specific build hooks
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      console.log(`macOS-specific post-copy tasks for ${arch}`);
      // Add any macOS-specific post-copy tasks here
    },
  },
};
