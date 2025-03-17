import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'path';
import { fileURLToPath } from 'url';
import { mergeWithPlatformConfig } from './build-config/index.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base configuration for all platforms
const baseConfig = {
  packagerConfig: {
    asar: true,
    icon: path.resolve(__dirname, 'assets/icons/icon'),
    appBundleId: 'com.gazedetection.app',
    appCategoryType: 'public.app-category.utilities',
    osxSign: {
      identity: process.env.APPLE_IDENTITY,
      hardenedRuntime: true,
      entitlements: 'entitlements.plist',
      'entitlements-inherit': 'entitlements.plist',
      'signature-flags': 'library',
    },
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
    extraResource: [
      'assets'
    ],
    // Ensure all required files are included
    extraFiles: [
      {
        from: 'node_modules/electron/dist/resources/electron.asar',
        to: 'resources/electron.asar'
      }
    ],
    // Ensure the main process files are included
    ignore: [
      /node_modules/,
      /\.git/,
      /\.vscode/,
      /\.webpack/,
      /\.husky/,
      /out/,
      // Don't ignore these critical files
      "!src/index.js",
      "!src/preload.js",
      "!package.json",
      "!dist/index.html",
      "!dist/assets"
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'GazeDetection',
        authors: 'Gaze Detection Team',
        exe: 'GazeDetection.exe',
        iconUrl: 'https://raw.githubusercontent.com/yourusername/gaze-detection/main/assets/icons/icon.ico',
        setupIcon: path.resolve(__dirname, 'assets/icons/icon.ico'),
        loadingGif: path.resolve(__dirname, 'assets/icons/loading.gif'),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Gaze Detection Team',
          homepage: 'https://github.com/yourusername/gaze-detection',
          icon: path.resolve(__dirname, 'assets/icons/icon.png'),
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'Gaze Detection Team',
          homepage: 'https://github.com/yourusername/gaze-detection',
          icon: path.resolve(__dirname, 'assets/icons/icon.png'),
        },
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        name: 'GazeDetection',
        icon: path.resolve(__dirname, 'assets/icons/icon.icns'),
        background: path.resolve(__dirname, 'assets/icons/dmg-background.png'),
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
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      // Custom logic to run after copying files to the build directory
      console.log(`Packaging for ${platform} ${arch}`);
    },
    packageAfterPrune: async (config, buildPath, electronVersion, platform, arch) => {
      // Custom logic to run after pruning node_modules
      console.log(`Pruned node_modules for ${platform} ${arch}`);
    },
    postPackage: async (config, packageResult) => {
      // Custom logic to run after packaging
      console.log(`Package created at: ${packageResult.outputPaths[0]}`);
    },
  },
};

// Get the target platform (default to current platform if not specified)
const targetPlatform = process.env.TARGET_PLATFORM || process.platform;

// Export the merged configuration
export default mergeWithPlatformConfig(baseConfig, targetPlatform);
